import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  migrateExecutiveOrderWithScreeners,
  setExecutiveAssistantConfigWithScreenerMigration,
  fetchScreenerAssistantConfig,
  setScreenerAssistantConfig,
  setExecutiveAssistantConfig
} from '../configDataKeyValueStore'

describe('Executive Order Migration with Screeners', () => {
  let mockERC725: any
  let mockUpContract: any

  beforeEach(() => {
    mockERC725 = {
      encodeKeyName: vi.fn(),
      decodeValueType: vi.fn(),
      encodeValueType: vi.fn()
    }

    mockUpContract = {
      getData: vi.fn(),
      getDataBatch: vi.fn(),
      setDataBatch: vi.fn()
    }
  })

  describe('migrateExecutiveOrderWithScreeners', () => {
    it('should migrate screener data from old to new execution order', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const oldExecutionOrder = 1
      const newExecutionOrder = 3

      // Mock existing screener configuration
      mockERC725.encodeKeyName
        .mockReturnValueOnce('old_screeners_key')  // UAPExecutiveScreeners old
        .mockReturnValueOnce('old_logic_key')      // UAPExecutiveScreenersANDLogic old
        .mockReturnValueOnce('old_config_key_0')   // UAPScreenerConfig old
        .mockReturnValueOnce('old_list_name_key_0') // UAPAddressListName old
        .mockReturnValueOnce('new_screeners_key')  // UAPExecutiveScreeners new
        .mockReturnValueOnce('new_logic_key')      // UAPExecutiveScreenersANDLogic new
        .mockReturnValueOnce('new_config_key_0')   // UAPScreenerConfig new
        .mockReturnValueOnce('new_list_name_key_0') // UAPAddressListName new

      // Mock fetch existing config
      mockUpContract.getData
        .mockResolvedValueOnce('encoded_screener_addresses') // screeners
        .mockResolvedValueOnce('0x01') // AND logic
        .mockResolvedValueOnce('encoded_config_data') // config
        .mockResolvedValueOnce('encoded_list_name') // list name

      mockERC725.decodeValueType
        .mockReturnValueOnce(['0x31c7ab87662132f5901f190032d49e0abe9fabec']) // screener addresses
        .mockReturnValueOnce('UAPAddressList') // list name

      // Mock new screener config generation
      mockERC725.encodeValueType
        .mockReturnValueOnce('new_encoded_screeners') // new screener addresses
        .mockReturnValueOnce('new_encoded_list_name') // new list name

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        oldExecutionOrder,
        newExecutionOrder
      )

      // Should have keys for deletion (old) and creation (new)
      expect(result.keys).toHaveLength(8) // 4 deletions + 4 new keys
      expect(result.values).toHaveLength(8)

      // First 4 values should be '0x' (deletions)
      expect(result.values.slice(0, 4)).toEqual(['0x', '0x', '0x', '0x'])
      
      // Last 4 values should be new data
      expect(result.values.slice(4)).toEqual([
        'new_encoded_screeners',
        '0x01', // AND logic preserved
        expect.any(String), // new config data
        'new_encoded_list_name'
      ])
    })

    it('should handle empty screener configuration gracefully', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      // Mock empty screener config
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockUpContract.getData
        .mockResolvedValueOnce('0x') // no screeners
        .mockResolvedValueOnce('0x01') // default logic
      
      mockERC725.decodeValueType.mockReturnValueOnce([]) // empty screener array

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        1, // old order
        3  // new order
      )

      // Should return empty batch for empty screener config
      expect(result.keys).toHaveLength(0)
      expect(result.values).toHaveLength(0)
    })

    it('should handle migration errors gracefully', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      // Mock error during fetch
      mockERC725.encodeKeyName.mockReturnValue('error_key')
      mockUpContract.getData.mockRejectedValue(new Error('Network error'))

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        1,
        3
      )

      // Should return empty batch on error to avoid data corruption
      expect(result.keys).toHaveLength(0)
      expect(result.values).toHaveLength(0)
    })
  })

  describe('setExecutiveAssistantConfigWithScreenerMigration', () => {
    it('should detect order change and trigger migration', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const configData = '0xabcd'

      // Mock current assistants (assistant exists at index 1)
      mockERC725.encodeKeyName.mockReturnValue('type_config_key')
      mockUpContract.getData.mockResolvedValueOnce('encoded_current_assistants')
      mockERC725.decodeValueType.mockReturnValueOnce([
        '0x1111111111111111111111111111111111111111',
        assistantAddress.toLowerCase(), // assistant at index 1
        '0x3333333333333333333333333333333333333333'
      ])

      // Mock migration (moving from order 1 to order 3)
      mockERC725.encodeKeyName
        .mockReturnValueOnce('old_screeners_key') // migration keys
        .mockReturnValueOnce('old_logic_key')
        .mockReturnValueOnce('executive_config_key') // executive config
        .mockReturnValueOnce('updated_type_config_key')

      // Mock screener fetch for migration
      mockUpContract.getData
        .mockResolvedValueOnce('encoded_screeners') // existing screeners
        .mockResolvedValueOnce('0x01') // existing logic

      mockERC725.decodeValueType.mockReturnValueOnce(['0x31c7ab87662132f5901f190032d49e0abe9fabec'])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        configData,
        true,
        3 // new execution order (different from current index 1)
      )

      expect(result.executionOrder).toBe(3)
      expect(result.keys.length).toBeGreaterThan(2) // Should include migration keys + executive config
      expect(result.values.length).toBe(result.keys.length)
    })

    it('should not trigger migration when order stays the same', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const configData = '0xabcd'

      // Mock current assistants (assistant exists at index 2)
      mockERC725.encodeKeyName.mockReturnValue('type_config_key')
      mockUpContract.getData.mockResolvedValueOnce('encoded_current_assistants')
      mockERC725.decodeValueType.mockReturnValueOnce([
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        assistantAddress.toLowerCase() // assistant at index 2
      ])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        configData,
        true,
        2 // same as existing order
      )

      expect(result.executionOrder).toBe(2)
      // Should only have regular executive config keys (no migration)
      expect(result.keys.length).toBeLessThanOrEqual(2) // Just executive + type config
    })

    it('should handle new assistant addition correctly', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const configData = '0xabcd'

      // Mock current assistants (assistant doesn't exist)
      mockERC725.encodeKeyName.mockReturnValue('type_config_key')
      mockUpContract.getData.mockResolvedValueOnce('encoded_current_assistants')
      mockERC725.decodeValueType.mockReturnValueOnce([
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
      ])

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        configData,
        true
        // No execution order provided for new assistant
      )

      expect(result.executionOrder).toBe(2) // Should be added at end (length of current array)
      // Should have regular executive config (no migration needed)
      expect(result.keys.length).toBeGreaterThan(0)
    })
  })

  describe('Complex Migration Scenarios', () => {
    it('should handle multiple screeners with different types during migration', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      // Mock complex screener configuration
      mockERC725.encodeKeyName
        .mockReturnValue('mock_key') // Default for any key generation

      mockUpContract.getData
        .mockResolvedValueOnce('encoded_multiple_screeners') // screeners array
        .mockResolvedValueOnce('0x00') // OR logic
        .mockResolvedValueOnce('config_data_1') // first screener config
        .mockResolvedValueOnce('list_name_1') // first list name
        .mockResolvedValueOnce('config_data_2') // second screener config
        .mockResolvedValueOnce('list_name_2') // second list name

      mockERC725.decodeValueType
        .mockReturnValueOnce([ // multiple screeners
          '0x31c7ab87662132f5901f190032d49e0abe9fabec',
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1'
        ])
        .mockReturnValueOnce('UAPAddressList') // first list name
        .mockReturnValueOnce('UAPBlockList') // second list name

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        1, // old order
        4  // new order
      )

      // Should handle multiple screeners (2 screeners = 6 keys total)
      // 2 main keys (screeners + logic) + 4 screener-specific keys (2 per screener)
      expect(result.keys.length).toBeGreaterThan(6) // 6 deletions + 6 new keys
      
      // First half should be deletions ('0x')
      const deletionCount = result.values.filter(v => v === '0x').length
      expect(deletionCount).toBe(6) // All old keys should be deleted
    })

    it('should maintain data integrity during complex reordering', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      // Mock existing configuration with screeners
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockUpContract.getData
        .mockResolvedValueOnce('encoded_assistants') // current assistants
        .mockResolvedValueOnce('encoded_screeners') // existing screeners for migration
        .mockResolvedValueOnce('0x01') // existing logic

      mockERC725.decodeValueType
        .mockReturnValueOnce([ // current assistants (moving from index 0 to 2)
          assistantAddress.toLowerCase(),
          '0x2222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333'
        ])
        .mockReturnValueOnce(['0x31c7ab87662132f5901f190032d49e0abe9fabec']) // screeners

      const result = await setExecutiveAssistantConfigWithScreenerMigration(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        '0xnewconfig',
        true,
        2 // move from 0 to 2
      )

      expect(result.executionOrder).toBe(2)
      expect(result.keys.length).toBeGreaterThan(0)
      expect(result.values.length).toBe(result.keys.length)
      
      // Should have both migration and executive config data
      expect(result.values.some(v => v === '0x')).toBe(true) // Has deletions
      expect(result.values.some(v => v !== '0x')).toBe(true) // Has new data
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle same order gracefully (no migration needed)', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        2, // same order
        2  // same order
      )

      // Should return empty batch since no migration is actually needed
      expect(result.keys).toHaveLength(0)
      expect(result.values).toHaveLength(0)
    })

    it('should validate migration data consistency', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

      // Mock screener config with proper return values
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockUpContract.getData
        .mockResolvedValueOnce('encoded_screeners')
        .mockResolvedValueOnce('0x01')
        .mockResolvedValueOnce('config_data') // screener config data
        .mockResolvedValueOnce('list_name_data') // list name data

      mockERC725.decodeValueType
        .mockReturnValueOnce(['0x31c7ab87662132f5901f190032d49e0abe9fabec'])
        .mockReturnValueOnce('UAPAddressList') // list name decode

      // Mock encoding values for the new screener configuration
      mockERC725.encodeValueType
        .mockReturnValueOnce('encoded_new_screeners') // new screener addresses
        .mockReturnValueOnce('encoded_new_list_name') // new list name

      const result = await migrateExecutiveOrderWithScreeners(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        1,
        3
      )

      // Validate that keys and values arrays are consistent
      expect(result.keys.length).toBe(result.values.length)
      expect(result.keys.every(key => typeof key === 'string')).toBe(true)
      expect(result.values.every(value => typeof value === 'string')).toBe(true)
    })
  })
})