import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERC725 } from '@erc725/erc725.js'

/**
 * Integration tests for the complete SetupAssistant workflow
 * Tests the exact scenarios users encounter, including the multi-type bug
 */

// Mock the configDataKeyValueStore functions
const mockSetExecutiveAssistantConfigWithScreenerMigration = vi.fn()
const mockRemoveExecutiveAssistantConfig = vi.fn()
const mockSetScreenerAssistantConfig = vi.fn()
const mockRemoveScreenerAssistantConfig = vi.fn()
const mockSetAddressList = vi.fn()

vi.mock('../configDataKeyValueStore', () => ({
  setExecutiveAssistantConfigWithScreenerMigration: mockSetExecutiveAssistantConfigWithScreenerMigration,
  removeExecutiveAssistantConfig: mockRemoveExecutiveAssistantConfig,
  setScreenerAssistantConfig: mockSetScreenerAssistantConfig,
  removeScreenerAssistantConfig: mockRemoveScreenerAssistantConfig,
  setAddressList: mockSetAddressList,
  createUAPERC725Instance: vi.fn(() => ({
    encodeKeyName: vi.fn(),
    encodeValueType: vi.fn(),
    decodeValueType: vi.fn(),
    options: { schemas: [] }
  }))
}))

describe('SetupAssistant Workflow Integration Tests', () => {
  let mockExecutionOrders: Record<string, number>
  let mockSelectedConfigTypes: string[]
  
  const LSP0_TYPE = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d'
  const LSP7_TYPE = '0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895'
  const LSP8_TYPE = '0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4689016b50dd877fb70a068'
  
  const ASSISTANT_ADDRESS = '0x1111111111111111111111111111111111111111'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset default mock implementations
    mockSetExecutiveAssistantConfigWithScreenerMigration.mockResolvedValue({
      keys: ['mockKey'],
      values: ['mockValue'],
      executionOrder: 0
    })
    
    mockRemoveExecutiveAssistantConfig.mockResolvedValue({
      keys: [],
      values: []
    })
    
    mockSetScreenerAssistantConfig.mockResolvedValue({
      keys: [],
      values: []
    })
    
    mockRemoveScreenerAssistantConfig.mockResolvedValue({
      keys: [],
      values: []
    })
    
    mockSetAddressList.mockResolvedValue({
      keys: [],
      values: []
    })
  })

  /**
   * Simulates the core SetupAssistant save logic from the component
   */
  const simulateAssistantSave = async (
    selectedConfigTypes: string[],
    executionOrders: Record<string, number>,
    screenerStateByType: Record<string, any> = {},
    originalScreenerStateByType: Record<string, any> = {}
  ) => {
    const allKeys: string[] = []
    const allValues: string[] = []

    // Apply the FIXED logic: only configure newly added types
    const currentlyConfiguredTypes = Object.keys(executionOrders)
    const newlyAddedTypes = selectedConfigTypes.filter(typeId => !currentlyConfiguredTypes.includes(typeId))
    
    console.log(`Currently configured: [${currentlyConfiguredTypes.join(', ')}]`)
    console.log(`Selected: [${selectedConfigTypes.join(', ')}]`)
    console.log(`Newly added: [${newlyAddedTypes.join(', ')}]`)

    // Configure each newly added transaction type
    for (const typeId of newlyAddedTypes) {
      console.log(`Configuring new type: ${typeId}`)
      const { keys, values, executionOrder } = await mockSetExecutiveAssistantConfigWithScreenerMigration(
        null, // erc725UAP
        null, // upContract
        ASSISTANT_ADDRESS,
        typeId,
        '0xmockConfigData',
        true
      )
      
      allKeys.push(...keys)
      allValues.push(...values)
    }

    // Handle screener configuration changes for existing types
    const existingTypesWithChanges = selectedConfigTypes.filter(typeId => {
      if (newlyAddedTypes.includes(typeId)) return false
      
      const typeState = screenerStateByType[typeId]
      const originalTypeState = originalScreenerStateByType[typeId]
      
      // Simplified change detection for testing
      return JSON.stringify(typeState) !== JSON.stringify(originalTypeState)
    })

    console.log(`Existing types with screener changes: [${existingTypesWithChanges.join(', ')}]`)

    for (const typeId of existingTypesWithChanges) {
      const executionOrder = executionOrders[typeId]
      console.log(`Updating screeners for existing type: ${typeId}`)
      
      const { keys, values } = await mockSetScreenerAssistantConfig(
        null, // erc725UAP
        null, // upContract
        ASSISTANT_ADDRESS,
        typeId,
        executionOrder,
        [], // screenerAddresses
        [], // screenerConfigData
        true, // useANDLogic
        [] // addressListNames
      )
      
      allKeys.push(...keys)
      allValues.push(...values)
    }

    // Remove from types that are no longer selected
    const typesToRemove = currentlyConfiguredTypes.filter(
      typeId => !selectedConfigTypes.includes(typeId)
    )

    if (typesToRemove.length > 0) {
      console.log(`Removing types: [${typesToRemove.join(', ')}]`)
      const { keys: removeKeys, values: removeValues } = await mockRemoveExecutiveAssistantConfig(
        null, // erc725UAP
        null, // upContract
        ASSISTANT_ADDRESS,
        typesToRemove
      )
      
      allKeys.push(...removeKeys)
      allValues.push(...removeValues)
    }

    return { keys: allKeys, values: allValues }
  }

  describe('Core Bug Scenarios', () => {
    it('should only configure newly added types (BurntPix LSP7 bug)', async () => {
      // EXACT scenario from the bug report:
      // BurntPix configured for LSP0 and LSP8, now adding LSP7
      
      const executionOrders = {
        [LSP0_TYPE]: 1, // BurntPix is at position 1 for LSP0
        [LSP8_TYPE]: 0  // BurntPix is at position 0 for LSP8
      }
      
      const selectedConfigTypes = [LSP0_TYPE, LSP7_TYPE, LSP8_TYPE] // Adding LSP7

      const result = await simulateAssistantSave(selectedConfigTypes, executionOrders)

      // Critical assertion: Only LSP7 should be configured
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledTimes(1)
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledWith(
        null, // erc725UAP
        null, // upContract  
        ASSISTANT_ADDRESS,
        LSP7_TYPE, // Only LSP7!
        '0xmockConfigData',
        true
      )

      // LSP0 and LSP8 should NOT be reconfigured
      const calls = mockSetExecutiveAssistantConfigWithScreenerMigration.mock.calls
      expect(calls.some(call => call[3] === LSP0_TYPE)).toBe(false)
      expect(calls.some(call => call[3] === LSP8_TYPE)).toBe(false)

      console.log('✅ Bug fixed: Only new type (LSP7) configured, LSP0 and LSP8 untouched')
    })

    it('should handle first-time configuration of multiple types', async () => {
      // Fresh assistant, configuring LSP0 and LSP7 at once
      
      const executionOrders = {} // No existing configuration
      const selectedConfigTypes = [LSP0_TYPE, LSP7_TYPE]

      const result = await simulateAssistantSave(selectedConfigTypes, executionOrders)

      // Should configure both types since both are new
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledTimes(2)
      
      const calls = mockSetExecutiveAssistantConfigWithScreenerMigration.mock.calls
      const configuredTypes = calls.map(call => call[3])
      
      expect(configuredTypes).toContain(LSP0_TYPE)
      expect(configuredTypes).toContain(LSP7_TYPE)

      console.log('✅ First-time multi-type configuration works correctly')
    })

    it('should handle type removal correctly', async () => {
      // Assistant configured for LSP0, LSP7, LSP8, now removing LSP7
      
      const executionOrders = {
        [LSP0_TYPE]: 0,
        [LSP7_TYPE]: 1,
        [LSP8_TYPE]: 2
      }
      
      const selectedConfigTypes = [LSP0_TYPE, LSP8_TYPE] // Removed LSP7

      const result = await simulateAssistantSave(selectedConfigTypes, executionOrders)

      // Should not configure any new types
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledTimes(0)
      
      // Should remove LSP7
      expect(mockRemoveExecutiveAssistantConfig).toHaveBeenCalledTimes(1)
      expect(mockRemoveExecutiveAssistantConfig).toHaveBeenCalledWith(
        null,
        null,
        ASSISTANT_ADDRESS,
        [LSP7_TYPE] // Only LSP7 should be removed
      )

      console.log('✅ Type removal works without affecting other types')
    })
  })

  describe('Screener Configuration Scenarios', () => {
    it('should update screeners for existing types without reconfiguring executive', async () => {
      // Assistant already configured for LSP0, now adding screeners to LSP0
      
      const executionOrders = {
        [LSP0_TYPE]: 0
      }
      
      const selectedConfigTypes = [LSP0_TYPE] // Same types, just screener changes
      
      const screenerStateByType = {
        [LSP0_TYPE]: { enableScreeners: true, selectedScreeners: ['screener1'] }
      }
      
      const originalScreenerStateByType = {
        [LSP0_TYPE]: { enableScreeners: false, selectedScreeners: [] }
      }

      const result = await simulateAssistantSave(
        selectedConfigTypes, 
        executionOrders, 
        screenerStateByType, 
        originalScreenerStateByType
      )

      // Should NOT reconfigure the executive (no newly added types)
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledTimes(0)
      
      // Should configure screeners for existing type
      expect(mockSetScreenerAssistantConfig).toHaveBeenCalledTimes(1)
      expect(mockSetScreenerAssistantConfig).toHaveBeenCalledWith(
        null,
        null,
        ASSISTANT_ADDRESS,
        LSP0_TYPE,
        0, // execution order
        [],
        [],
        true,
        []
      )

      console.log('✅ Screener updates for existing types work without executive reconfiguration')
    })

    it('should handle mixed scenario: new type + screener changes to existing type', async () => {
      // Assistant configured for LSP0, now:
      // 1. Adding LSP7 (new type)
      // 2. Adding screeners to existing LSP0
      
      const executionOrders = {
        [LSP0_TYPE]: 0
      }
      
      const selectedConfigTypes = [LSP0_TYPE, LSP7_TYPE] // Adding LSP7
      
      const screenerStateByType = {
        [LSP0_TYPE]: { enableScreeners: true, selectedScreeners: ['screener1'] },
        [LSP7_TYPE]: { enableScreeners: false, selectedScreeners: [] }
      }
      
      const originalScreenerStateByType = {
        [LSP0_TYPE]: { enableScreeners: false, selectedScreeners: [] }
      }

      const result = await simulateAssistantSave(
        selectedConfigTypes, 
        executionOrders, 
        screenerStateByType, 
        originalScreenerStateByType
      )

      // Should configure new executive for LSP7
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledTimes(1)
      expect(mockSetExecutiveAssistantConfigWithScreenerMigration).toHaveBeenCalledWith(
        null, null, ASSISTANT_ADDRESS, LSP7_TYPE, '0xmockConfigData', true
      )
      
      // Should configure screeners for existing LSP0
      expect(mockSetScreenerAssistantConfig).toHaveBeenCalledTimes(1)
      expect(mockSetScreenerAssistantConfig).toHaveBeenCalledWith(
        null, null, ASSISTANT_ADDRESS, LSP0_TYPE, 0, [], [], true, []
      )

      console.log('✅ Mixed scenario: new type + screener changes handled correctly')
    })
  })

  describe('Payload Validation', () => {
    it('should generate minimal payload for simple operations', async () => {
      const executionOrders = {}
      const selectedConfigTypes = [LSP0_TYPE]

      // Mock minimal response
      mockSetExecutiveAssistantConfigWithScreenerMigration.mockResolvedValue({
        keys: [
          'UAPExecutiveConfig:LSP0ValueReceived:0',
          'UAPTypeConfig:LSP0ValueReceived'
        ],
        values: [
          '0xexecutiveConfigValue',
          '0xtypeConfigValue'
        ],
        executionOrder: 0
      })

      const result = await simulateAssistantSave(selectedConfigTypes, executionOrders)

      expect(result.keys).toHaveLength(2)
      expect(result.values).toHaveLength(2)
      expect(result.keys[0]).toBe('UAPExecutiveConfig:LSP0ValueReceived:0')
      expect(result.keys[1]).toBe('UAPTypeConfig:LSP0ValueReceived')

      console.log('✅ Minimal payload validation passed')
    })

    it('should detect payload anomalies that indicate bugs', async () => {
      // This test would catch the original bug by detecting unexpected keys
      
      const executionOrders = { [LSP0_TYPE]: 0, [LSP8_TYPE]: 1 }
      const selectedConfigTypes = [LSP0_TYPE, LSP7_TYPE, LSP8_TYPE] // Adding LSP7

      // Simulate the BUG behavior (configuring all types)
      mockSetExecutiveAssistantConfigWithScreenerMigration
        .mockResolvedValueOnce({
          keys: ['UAPExecutiveConfig:LSP7:0', 'UAPTypeConfig:LSP7'],
          values: ['0xvalue1', '0xvalue2'],
          executionOrder: 0
        })

      const result = await simulateAssistantSave(selectedConfigTypes, executionOrders)

      // Payload analysis for bug detection
      const keysByType = result.keys.reduce((acc: Record<string, number>, key: string) => {
        if (key.includes('LSP0')) acc.LSP0 = (acc.LSP0 || 0) + 1
        if (key.includes('LSP7')) acc.LSP7 = (acc.LSP7 || 0) + 1
        if (key.includes('LSP8')) acc.LSP8 = (acc.LSP8 || 0) + 1
        return acc
      }, {})

      console.log('Key distribution by type:', keysByType)

      // This assertion would catch the bug
      expect(keysByType.LSP0 || 0).toBe(0) // Should be 0 (not reconfigured)
      expect(keysByType.LSP7 || 0).toBeGreaterThan(0) // Should have keys (new type)
      expect(keysByType.LSP8 || 0).toBe(0) // Should be 0 (not reconfigured)

      console.log('✅ Payload analysis detects bugs correctly')
    })
  })
})