import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERC725 } from '@erc725/erc725.js'
import { setExecutiveAssistantConfigWithScreenerMigration } from '../configDataKeyValueStore'

/**
 * Integration tests for assistant configuration workflows
 * Tests real-world scenarios to catch bugs like duplicate key operations
 */

describe('Assistant Configuration Integration Tests', () => {
  let mockErc725: any
  let mockUpContract: any
  
  const mockAssistantAddress = '0x1111111111111111111111111111111111111111'
  const mockConfigData = '0xdeadbeef'
  
  // Transaction type IDs
  const LSP0_TYPE = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d' // LSP0ValueReceived
  const LSP7_TYPE = '0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895' // LSP7Tokens_RecipientNotification  
  const LSP8_TYPE = '0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4689016b50dd877fb70a068' // LSP8Tokens_RecipientNotification

  beforeEach(() => {
    mockErc725 = {
      decodeValueType: vi.fn(),
      encodeValueType: vi.fn(),
      encodeKeyName: vi.fn(),
      options: { schemas: [] }
    } as unknown as ERC725

    mockUpContract = {
      getData: vi.fn(),
    }

    // Setup mock key generation
    mockErc725.encodeKeyName.mockImplementation((keyName: string, params: string[]) => {
      if (keyName.includes('UAPTypeConfig')) {
        return `UAPTypeConfig:${params[0]}`
      }
      if (keyName.includes('UAPExecutiveConfig')) {
        return `UAPExecutiveConfig:${params[0]}:${params[1]}`
      }
      return `${keyName}:${params.join(':')}`
    })

    mockErc725.encodeValueType.mockReturnValue('0xencoded')
  })

  describe('Adding New Transaction Types', () => {
    it('should only create keys for newly added types (not existing ones)', async () => {
      // Scenario: Assistant already configured for LSP0, now adding LSP7
      
      // Mock existing LSP0 configuration
      mockUpContract.getData
        .mockResolvedValueOnce('0xexisting_lsp0_config') // LSP0 type config exists
        .mockResolvedValueOnce('0xexisting_executive_config') // LSP0 executive config exists
        .mockResolvedValue('0x') // All other getData calls return empty

      mockErc725.decodeValueType
        .mockReturnValueOnce([mockAssistantAddress]) // LSP0 type config has our assistant
        .mockReturnValue([]) // Other decodes return empty arrays

      // Configure LSP7 (new type)
      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP7_TYPE,
        mockConfigData,
        true // update type config
      )

      // Should only have keys for LSP7 (not LSP0)
      expect(result.keys.length).toBeGreaterThan(0)
      
      // Verify no LSP0 keys are generated (since it's already configured)
      const lsp0Keys = result.keys.filter(key => key.includes(LSP0_TYPE))
      expect(lsp0Keys).toHaveLength(0)
      
      // Verify LSP7 keys are generated
      const lsp7Keys = result.keys.filter(key => key.includes(LSP7_TYPE))
      expect(lsp7Keys.length).toBeGreaterThan(0)

      console.log('✅ Only new type (LSP7) keys generated, existing LSP0 untouched')
    })

    it('should handle first-time assistant configuration correctly', async () => {
      // Scenario: Assistant not configured for any types yet
      
      mockUpContract.getData.mockResolvedValue('0x') // No existing configs
      mockErc725.decodeValueType.mockReturnValue([]) // No existing assistants

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP0_TYPE,
        mockConfigData,
        true
      )

      // Should have executive config + type config
      expect(result.keys.length).toBeGreaterThanOrEqual(2)
      expect(result.values.length).toBe(result.keys.length)

      // Should have correct execution order (0 for first assistant)
      expect(result.executionOrder).toBe(0)

      console.log('✅ First-time configuration creates expected keys')
    })

    it('should not duplicate keys when assistant already exists for the type', async () => {
      // Scenario: Assistant already configured for LSP0, try to configure LSP0 again
      
      // Mock existing configuration
      mockUpContract.getData
        .mockResolvedValueOnce('0xexisting_config') // Type config exists
        .mockResolvedValueOnce('0xexisting_executive') // Executive config exists
        .mockResolvedValue('0x')

      mockErc725.decodeValueType
        .mockReturnValueOnce([mockAssistantAddress]) // Assistant already in type config
        .mockReturnValue([]) // Default return for other calls

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP0_TYPE,
        mockConfigData,
        true
      )

      // Should update existing config, not create duplicates
      expect(result.keys.length).toBeGreaterThan(0)
      
      // No key should appear twice
      const keySet = new Set(result.keys)
      expect(keySet.size).toBe(result.keys.length)

      console.log('✅ No duplicate keys when reconfiguring existing type')
    })
  })

  describe('Multi-Type Assistant Scenarios', () => {
    it('should handle assistant configured for multiple types without cross-contamination', async () => {
      // This is the core bug scenario you found
      // Assistant configured for LSP0 and LSP8, now adding LSP7
      
      console.log('🧪 Testing the exact bug scenario: Adding LSP7 to assistant with LSP0+LSP8')
      
      // Mock: Assistant exists in LSP0 type config at position 1
      mockUpContract.getData
        .mockImplementation(async (key: string) => {
          if (key.includes(LSP0_TYPE)) {
            return '0xexisting_lsp0'
          }
          if (key.includes(LSP8_TYPE)) {
            return '0xexisting_lsp8'
          }
          return '0x' // LSP7 doesn't exist yet
        })

      mockErc725.decodeValueType
        .mockImplementation((type: string, value: string) => {
          if (value === '0xexisting_lsp0') {
            return ['0x2222222222222222222222222222222222222222', mockAssistantAddress] // Our assistant at index 1
          }
          if (value === '0xexisting_lsp8') {
            return [mockAssistantAddress] // Our assistant at index 0
          }
          return []
        })

      // Configure LSP7 (should only affect LSP7)
      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP7_TYPE,
        mockConfigData,
        true
      )

      // Critical assertions that would have caught your bug:
      expect(result.keys.length).toBe(2) // Only LSP7 executive config + LSP7 type config

      // Verify ONLY LSP7 keys are present
      const lsp7Keys = result.keys.filter(key => key.includes(LSP7_TYPE))
      expect(lsp7Keys.length).toBe(2) // Executive + Type config

      // Verify NO LSP0 or LSP8 keys (the bug was creating these)
      const lsp0Keys = result.keys.filter(key => key.includes(LSP0_TYPE))
      const lsp8Keys = result.keys.filter(key => key.includes(LSP8_TYPE))
      expect(lsp0Keys).toHaveLength(0)
      expect(lsp8Keys).toHaveLength(0)

      console.log(`✅ Bug test passed: Only ${result.keys.length} LSP7 keys, no LSP0/LSP8 contamination`)
    })

    it('should correctly assign execution orders for multi-type assistants', async () => {
      // Test execution order logic across different types
      
      // LSP0: [otherAssistant, ourAssistant] -> our execution order = 1
      mockUpContract.getData
        .mockImplementation(async (key: string) => {
          if (key.includes(LSP0_TYPE)) return '0xlsp0_config'
          if (key.includes(LSP7_TYPE)) return '0x' // Empty for LSP7
          return '0x'
        })

      mockErc725.decodeValueType
        .mockImplementation((type: string, value: string) => {
          if (value === '0xlsp0_config') {
            return ['0x9999999999999999999999999999999999999999', mockAssistantAddress]
          }
          return []
        })

      const resultLSP7 = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP7_TYPE,
        mockConfigData,
        true
      )

      // LSP7 should get execution order 0 (first assistant for this type)
      expect(resultLSP7.executionOrder).toBe(0)

      console.log('✅ Execution orders correctly isolated per transaction type')
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      mockUpContract.getData.mockRejectedValue(new Error('Network error'))

      await expect(
        setExecutiveAssistantConfigWithScreenerMigration(
          mockErc725,
          mockUpContract,
          mockAssistantAddress,
          LSP0_TYPE,
          mockConfigData,
          true
        )
      ).rejects.toThrow('Network error')
    })

    it('should handle empty blockchain responses', async () => {
      // Test with completely empty responses
      mockUpContract.getData.mockResolvedValue('0x')
      mockErc725.decodeValueType.mockReturnValue([])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP0_TYPE,
        mockConfigData,
        true
      )

      expect(result.keys.length).toBeGreaterThan(0)
      console.log('✅ Handles empty blockchain responses')
    })

    it('should validate payload structure', async () => {
      mockUpContract.getData.mockResolvedValue('0x')
      mockErc725.decodeValueType.mockReturnValue([])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP0_TYPE,
        mockConfigData,
        true
      )

      // Payload validation
      expect(result.keys).toBeInstanceOf(Array)
      expect(result.values).toBeInstanceOf(Array)
      expect(result.keys.length).toBe(result.values.length)
      expect(typeof result.executionOrder).toBe('number')
      
      // No empty or null keys/values
      result.keys.forEach(key => {
        expect(key).toBeTruthy()
        expect(typeof key).toBe('string')
        expect(key.startsWith('0x') || key.includes('UAP')).toBe(true)
      })

      result.values.forEach(value => {
        expect(value).toBeTruthy()
        expect(typeof value).toBe('string')
      })

      console.log('✅ Payload structure validation passed')
    })
  })

  describe('Payload Analysis and Debugging', () => {
    it('should provide clear payload analysis for debugging', async () => {
      mockUpContract.getData.mockResolvedValue('0x')
      mockErc725.decodeValueType.mockReturnValue([])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockErc725,
        mockUpContract,
        mockAssistantAddress,
        LSP0_TYPE,
        mockConfigData,
        true
      )

      // Analyze payload structure
      console.log('\n=== PAYLOAD ANALYSIS ===')
      console.log(`Total operations: ${result.keys.length}`)
      
      const keyAnalysis = result.keys.reduce((acc: Record<string, number>, key: string) => {
        if (key.includes('UAPTypeConfig')) acc.typeConfig = (acc.typeConfig || 0) + 1
        else if (key.includes('UAPExecutiveConfig')) acc.executiveConfig = (acc.executiveConfig || 0) + 1
        else if (key.includes('UAPScreener')) acc.screenerConfig = (acc.screenerConfig || 0) + 1
        else acc.other = (acc.other || 0) + 1
        return acc
      }, {})

      console.log('Key breakdown:', keyAnalysis)
      
      result.keys.forEach((key, i) => {
        console.log(`  ${i + 1}. ${key} -> ${result.values[i]}`)
      })

      // This analysis would have immediately shown the duplicate keys in your bug
      expect(Object.keys(keyAnalysis).length).toBeGreaterThan(0)
    })
  })
})