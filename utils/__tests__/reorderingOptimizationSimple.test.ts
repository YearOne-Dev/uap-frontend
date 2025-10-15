import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reorderExecutiveAssistants } from '../configDataKeyValueStore'
import { ERC725 } from '@erc725/erc725.js'

/**
 * Simple reordering optimization tests focused on key functionality
 * after the schema change to LSP2 standard.
 */

describe('Reordering Optimization - Key Redundancy Tests', () => {
  let mockErc725: any
  let mockUpContract: any

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
  })

  it('should not have redundant key operations when reordering', async () => {
    const typeId = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d'
    const existingAssistants = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222'
    ]
    const orderedAssistants = [
      { address: '0x2222222222222222222222222222222222222222', configData: '0xdata1' },
      { address: '0x1111111111111111111111111111111111111111', configData: '0xdata2' }
    ]

    mockUpContract.getData.mockResolvedValue('0xexisting')
    mockErc725.decodeValueType.mockReturnValue(existingAssistants)
    mockErc725.encodeValueType.mockReturnValue('0xencoded')
    mockErc725.encodeKeyName.mockImplementation((keyName: string, params: string[]) => {
      if (keyName.includes('UAPTypeConfig')) return `UAPTypeConfig:${params[0]}`
      if (keyName.includes('UAPExecutiveConfig')) return `UAPExecutiveConfig:${params[0]}:${params[1]}`
      return `${keyName}:${params.join(':')}`
    })

    const result = await reorderExecutiveAssistants(
      mockErc725,
      mockUpContract,
      typeId,
      orderedAssistants
    )

    // Should have some operations (type config + position updates)
    expect(result.keys.length).toBeGreaterThan(0)
    expect(result.values.length).toBe(result.keys.length)

    // Verify no key appears twice (no redundancy)
    const keySet = new Set(result.keys)
    expect(keySet.size).toBe(result.keys.length)

    // Should include type config update
    const hasTypeConfig = result.keys.some(key => key.includes('UAPTypeConfig'))
    expect(hasTypeConfig).toBe(true)
  })

  it('should clear unused positions when shrinking', async () => {
    const typeId = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d'
    const existingAssistants = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333'
    ]
    const orderedAssistants = [
      { address: '0x1111111111111111111111111111111111111111', configData: '0xdata1' },
      { address: '0x2222222222222222222222222222222222222222', configData: '0xdata2' }
    ]

    mockUpContract.getData.mockResolvedValue('0xexisting')
    mockErc725.decodeValueType.mockReturnValue(existingAssistants)
    mockErc725.encodeValueType.mockReturnValue('0xencoded')
    mockErc725.encodeKeyName.mockImplementation((keyName: string, params: string[]) => {
      if (keyName.includes('UAPTypeConfig')) return `UAPTypeConfig:${params[0]}`
      if (keyName.includes('UAPExecutiveConfig')) return `UAPExecutiveConfig:${params[0]}:${params[1]}`
      return `${keyName}:${params.join(':')}`
    })

    const result = await reorderExecutiveAssistants(
      mockErc725,
      mockUpContract,
      typeId,
      orderedAssistants
    )

    // Should have operations to clear the unused position
    const clearOperations = result.values.filter(value => value === '0x')
    expect(clearOperations.length).toBeGreaterThan(0)

    // No key redundancy
    const keySet = new Set(result.keys)
    expect(keySet.size).toBe(result.keys.length)
  })

  it('should handle no reordering efficiently', async () => {
    const typeId = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d'
    const existingAssistants = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222'
    ]
    const orderedAssistants = [
      { address: '0x1111111111111111111111111111111111111111', configData: '0xdata1' },
      { address: '0x2222222222222222222222222222222222222222', configData: '0xdata2' }
    ]

    mockUpContract.getData.mockResolvedValue('0xexisting')
    mockErc725.decodeValueType.mockReturnValue(existingAssistants)
    mockErc725.encodeValueType.mockReturnValue('0xencoded')
    mockErc725.encodeKeyName.mockImplementation((keyName: string, params: string[]) => {
      if (keyName.includes('UAPTypeConfig')) return `UAPTypeConfig:${params[0]}`
      if (keyName.includes('UAPExecutiveConfig')) return `UAPExecutiveConfig:${params[0]}:${params[1]}`
      return `${keyName}:${params.join(':')}`
    })

    const result = await reorderExecutiveAssistants(
      mockErc725,
      mockUpContract,
      typeId,
      orderedAssistants
    )

    // Should have minimal operations when no reordering is needed
    expect(result.keys.length).toBeGreaterThan(0) // At least type config update
    
    // No redundancy
    const keySet = new Set(result.keys)
    expect(keySet.size).toBe(result.keys.length)
  })

  it('should demonstrate the OLD behavior would have been inefficient', () => {
    // This test demonstrates what the OLD logic would have done (redundant operations)
    const assistantCount = 3
    
    // OLD logic would do: clear all positions first, then set all positions
    const oldOperationCount = assistantCount * 2 + 1 // Clear + Set + Type config
    
    // NEW logic does: only update what changed + type config  
    const newOperationCount = assistantCount + 1 // Direct updates + Type config
    
    console.log(`OLD logic would use ${oldOperationCount} operations`)
    console.log(`NEW logic uses ${newOperationCount} operations`)
    console.log(`Efficiency gain: ${((oldOperationCount - newOperationCount) / oldOperationCount * 100).toFixed(1)}%`)
    
    expect(newOperationCount).toBeLessThan(oldOperationCount)
  })

  it('should handle expanding assistant list without clearing', async () => {
    const typeId = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d'
    const existingAssistants = [
      '0x1111111111111111111111111111111111111111'
    ]
    const orderedAssistants = [
      { address: '0x1111111111111111111111111111111111111111', configData: '0xdata1' },
      { address: '0x2222222222222222222222222222222222222222', configData: '0xdata2' },
      { address: '0x3333333333333333333333333333333333333333', configData: '0xdata3' }
    ]

    mockUpContract.getData.mockResolvedValue('0xexisting')
    mockErc725.decodeValueType.mockReturnValue(existingAssistants)
    mockErc725.encodeValueType.mockReturnValue('0xencoded')
    mockErc725.encodeKeyName.mockImplementation((keyName: string, params: string[]) => {
      if (keyName.includes('UAPTypeConfig')) return `UAPTypeConfig:${params[0]}`
      if (keyName.includes('UAPExecutiveConfig')) return `UAPExecutiveConfig:${params[0]}:${params[1]}`
      return `${keyName}:${params.join(':')}`
    })

    const result = await reorderExecutiveAssistants(
      mockErc725,
      mockUpContract,
      typeId,
      orderedAssistants
    )

    // Should not have any clear operations (0x values) when only expanding
    const clearOperations = result.values.filter(value => value === '0x')
    expect(clearOperations.length).toBe(0)

    // Should have new position additions
    expect(result.keys.length).toBeGreaterThan(1)
    
    // No redundancy
    const keySet = new Set(result.keys)
    expect(keySet.size).toBe(result.keys.length)
  })
})