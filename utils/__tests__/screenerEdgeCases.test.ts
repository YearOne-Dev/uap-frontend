import { describe, it, expect } from 'vitest'
import {
  inspectScreenerPayload,
  decodeScreenerConfig,
  validatePayloadConsistency
} from '../screenerDebugUtils'
import {
  createMockLuksoEnvironment,
  validateSaveLoadCycle,
  type MockScreenerState
} from './mockLuksoProvider'

describe('Screener Edge Cases', () => {
  it('should handle maximum screeners and invalid inputs', () => {
    const selectedScreeners = Array.from({ length: 5 }, (_, i) => 
      `0x31c7ab87662132f5901f190032d49e0abe9fabec_${i}_test`
    )
    const screenerConfigs = Object.fromEntries(
      selectedScreeners.map(id => [id, { returnValueWhenInList: true, addresses: ['0x1111111111111111111111111111111111111111'] }])
    )
    const mockNetworks = { 42: { screeners: { '0x31c7ab87662132f5901f190032d49e0abe9fabec': { name: 'Address List Screener' } } } }

    const debugInfo = inspectScreenerPayload('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 1, selectedScreeners, screenerConfigs, true, 42, mockNetworks)
    
    expect(debugInfo.screenerDetails).toHaveLength(5)
    expect(debugInfo.screenerDetails.every(detail => detail.isValid)).toBe(true)
  })

  it('should handle corrupted blockchain data', () => {
    const corruptedValues = ['0x123', '', '0xinvalidhex']
    corruptedValues.forEach(value => {
      const decoded = decodeScreenerConfig(value)
      expect(decoded.isValidFormat).toBe(false)
      expect(decoded.decodingErrors.length).toBeGreaterThan(0)
    })
  })

  it('should validate save/load cycle consistency', async () => {
    const mockEnv = createMockLuksoEnvironment(42)
    const state: MockScreenerState = {
      selectedScreeners: ['0x31c7ab87662132f5901f190032d49e0abe9fabec_1_test'],
      screenerConfigs: {
        '0x31c7ab87662132f5901f190032d49e0abe9fabec_1_test': {
          returnValueWhenInList: true,
          addresses: ['0x1111111111111111111111111111111111111111']
        }
      },
      useANDLogic: true
    }

    const validation = await validateSaveLoadCycle(mockEnv, state)
    expect(validation.success).toBe(true)
  })

  it('should detect payload inconsistencies', () => {
    const payload = {
      description: 'Test',
      keys: ['key1'],
      values: ['value1', 'extra'], // Mismatch
      keyValuePairs: {},
      screenerDetails: [],
      useANDLogic: true,
      warnings: []
    }

    const validation = validatePayloadConsistency(payload)
    expect(validation.isConsistent).toBe(false)
    expect(validation.discrepancies[0]).toContain('Key-value mismatch')
  })
})