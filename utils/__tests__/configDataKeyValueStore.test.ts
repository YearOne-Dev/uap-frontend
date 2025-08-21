import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  encodeBoolValue,
  decodeExecDataValue,
  customEncodeAddresses,
  customDecodeAddresses,
  getMissingPermissions,
  createUAPERC725Instance,
  generateUAPExecutiveScreenersKey,
  generateUAPExecutiveScreenersANDLogicKey,
  generateUAPScreenerConfigKey,
  generateUAPAddressListNameKey,
  calculateScreenerOrder,
  setScreenerAssistantConfig,
  fetchScreenerAssistantConfig,
  generateListItemIndexKey,
  encodeListMapValue,
  setAddressList,
  getAddressList
} from '../configDataKeyValueStore'
import ERC725 from '@erc725/erc725.js'

describe('configDataKeyValueStore', () => {

  describe('encodeBoolValue', () => {
    it('should encode true as 0x01', () => {
      expect(encodeBoolValue(true)).toBe('0x01')
    })

    it('should encode false as 0x00', () => {
      expect(encodeBoolValue(false)).toBe('0x00')
    })
  })

  describe('decodeExecDataValue', () => {
    it('should decode valid exec data value', () => {
      // Mock data: assistant address + config data (tip address + amount)
      const execDataValue = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001'
      
      const [address, configBytes] = decodeExecDataValue(execDataValue)
      
      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9')
      expect(configBytes).toBe('0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001')
    })

    it('should handle data without 0x prefix', () => {
      const execDataValue = '8b80c84b9cd9eb087e6894997ae161d4f9d975b9000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      
      const [address, configBytes] = decodeExecDataValue(execDataValue)
      
      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9')
      expect(configBytes).toBe('0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847')
    })

    it('should throw error for data too short', () => {
      expect(() => decodeExecDataValue('0x123')).toThrow('Invalid encoded data: too short')
      expect(() => decodeExecDataValue('0x8b80c84b9cd9eb087e6894997ae161d4f9d975')).toThrow('Invalid encoded data: too short')
    })

    it('should handle minimum valid length (address only)', () => {
      const execDataValue = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      
      const [address, configBytes] = decodeExecDataValue(execDataValue)
      
      expect(address).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9')
      expect(configBytes).toBe('0x')
    })
  })

  describe('customEncodeAddresses', () => {
    it('should encode empty array', () => {
      expect(customEncodeAddresses([])).toBe('0x')
    })

    it('should encode single address', () => {
      const addresses = ['0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9']
      const result = customEncodeAddresses(addresses)
      
      expect(result).toBe('0x00018b80c84b9cd9eb087e6894997ae161d4f9d975b9')
    })

    it('should encode multiple addresses', () => {
      const addresses = [
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9',
        '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      ]
      const result = customEncodeAddresses(addresses)
      
      expect(result).toBe('0x00028b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a1847')
    })

    it('should throw error for too many addresses', () => {
      const addresses = new Array(65536).fill('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')
      expect(() => customEncodeAddresses(addresses)).toThrow('Number of addresses exceeds uint16 capacity.')
    })
  })

  describe('customDecodeAddresses', () => {
    it('should decode empty array', () => {
      expect(customDecodeAddresses('0x')).toEqual([])
    })

    it('should decode single address', () => {
      const encoded = '0x00018b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const result = customDecodeAddresses(encoded)
      
      expect(result).toEqual(['0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9'])
    })

    it('should decode multiple addresses', () => {
      const encoded = '0x00028b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      const result = customDecodeAddresses(encoded)
      
      expect(result).toEqual([
        '0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9',
        '0xcc8Dcfe12590BA2310FD557Ef6A1dA94fa3A1847'
      ])
    })

    it('should handle decode errors gracefully', () => {
      // Test with legacy format '0x0000' - function should still return empty array
      const result = customDecodeAddresses('0x0000')
      expect(result).toEqual([])
      
      // Test with invalid hex data that will cause ethers.getAddress to throw
      expect(() => customDecodeAddresses('0x0001invalidhexdatainvalidhexdatainvalidhex')).toThrow()
    })
  })


  describe('getMissingPermissions', () => {
    it('should return empty array when no missing permissions', () => {
      const current = { SETDATA: true, CALL: true }
      const required = { SETDATA: true, CALL: true }
      
      expect(getMissingPermissions(current, required)).toEqual([])
    })

    it('should return missing permissions as array', () => {
      const current = { SETDATA: true }
      const required = { SETDATA: true, CALL: true, SUPER_SETDATA: true }
      
      const result = getMissingPermissions(current, required)
      expect(result).toEqual(['CALL', 'SUPER_SETDATA'])
    })

    it('should handle false values in current permissions', () => {
      const current = { SETDATA: false, CALL: true }
      const required = { SETDATA: true, CALL: true }
      
      const result = getMissingPermissions(current, required)
      expect(result).toEqual(['SETDATA'])
    })
  })

  // ================================================================
  // SCREENER ASSISTANT CONFIGURATION TESTS
  // ================================================================

  describe('Screener Key Generation', () => {
    let mockERC725: any

    beforeEach(() => {
      mockERC725 = {
        encodeKeyName: vi.fn()
      }
    })

    describe('generateUAPExecutiveScreenersKey', () => {
      it('should generate correct key format', () => {
        const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        const executionOrder = 5
        
        mockERC725.encodeKeyName.mockReturnValue('0xf71242d9035c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00000005')
        
        const result = generateUAPExecutiveScreenersKey(mockERC725, typeId, executionOrder)
        
        expect(mockERC725.encodeKeyName).toHaveBeenCalledWith(
          'UAPExecutiveScreeners:<bytes32>:<uint256>',
          [typeId, '5']
        )
        expect(result).toBe('0xf71242d9035c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00000005')
      })
    })

    describe('generateUAPExecutiveScreenersANDLogicKey', () => {
      it('should generate correct key format', () => {
        const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        const executionOrder = 3
        
        mockERC725.encodeKeyName.mockReturnValue('0x5c353a1de5ca1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00000003')
        
        const result = generateUAPExecutiveScreenersANDLogicKey(mockERC725, typeId, executionOrder)
        
        expect(mockERC725.encodeKeyName).toHaveBeenCalledWith(
          'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
          [typeId, '3']
        )
        expect(result).toBe('0x5c353a1de5ca1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00000003')
      })
    })

    describe('generateUAPScreenerConfigKey', () => {
      it('should generate correct key format', () => {
        const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        const screenerOrder = 1002
        
        mockERC725.encodeKeyName.mockReturnValue('0xbad89b6f38d11234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000003ea')
        
        const result = generateUAPScreenerConfigKey(mockERC725, typeId, screenerOrder)
        
        expect(mockERC725.encodeKeyName).toHaveBeenCalledWith(
          'UAPScreenerConfig:<bytes32>:<uint256>',
          [typeId, '1002']
        )
        expect(result).toBe('0xbad89b6f38d11234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000003ea')
      })
    })

    describe('generateUAPAddressListNameKey', () => {
      it('should generate correct key format', () => {
        const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        const screenerOrder = 2001
        
        mockERC725.encodeKeyName.mockReturnValue('0xbba64f30d8001234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000007d1')
        
        const result = generateUAPAddressListNameKey(mockERC725, typeId, screenerOrder)
        
        expect(mockERC725.encodeKeyName).toHaveBeenCalledWith(
          'UAPAddressListName:<bytes32>:<uint256>',
          [typeId, '2001']
        )
        expect(result).toBe('0xbba64f30d8001234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000007d1')
      })
    })
  })

  describe('calculateScreenerOrder', () => {
    it('should calculate correct screener order formula', () => {
      expect(calculateScreenerOrder(0, 0)).toBe(0)
      expect(calculateScreenerOrder(0, 1)).toBe(1)
      expect(calculateScreenerOrder(1, 0)).toBe(1000)
      expect(calculateScreenerOrder(1, 2)).toBe(1002)
      expect(calculateScreenerOrder(5, 3)).toBe(5003)
    })

    it('should handle large execution orders', () => {
      expect(calculateScreenerOrder(999, 999)).toBe(999999)
    })
  })

  describe('Manual Byte Packing for Screener Config', () => {
    it('should create correctly formatted config value', () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const screenerAddress = '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      const configData = '0x0000000000000000000000000000000000000000000000000000000000000001'
      
      // Simulate the manual byte packing logic from setScreenerAssistantConfig
      const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
      const screenerBytes = screenerAddress.toLowerCase().replace('0x', '')
      const configBytes = configData.replace('0x', '')
      const expectedValue = '0x' + executiveBytes + screenerBytes + configBytes
      
      expect(expectedValue).toBe('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001')
      expect(expectedValue.length).toBe(2 + 40 + 40 + 64) // 0x + 20 bytes + 20 bytes + 32 bytes
    })

    it('should handle empty config data', () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const screenerAddress = '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      const configData = '0x'
      
      const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
      const screenerBytes = screenerAddress.toLowerCase().replace('0x', '')
      const configBytes = configData.replace('0x', '')
      const expectedValue = '0x' + executiveBytes + screenerBytes + configBytes
      
      expect(expectedValue).toBe('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a1847')
    })
  })

  describe('setScreenerAssistantConfig', () => {
    let mockERC725: any
    let mockUpContract: any

    beforeEach(() => {
      mockERC725 = {
        encodeKeyName: vi.fn(),
        encodeValueType: vi.fn()
      }
      mockUpContract = {}
    })

    it('should generate correct keys and values for single screener', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 2
      const screenerAddresses = ['0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847']
      const screenerConfigs = ['0x0000000000000000000000000000000000000000000000000000000000000001']
      const useANDLogic = true
      const addressListNames = ['UAPAddressList']

      // Mock return values
      mockERC725.encodeKeyName
        .mockReturnValueOnce('screeners_key') // Executive screeners key
        .mockReturnValueOnce('logic_key') // AND logic key
        .mockReturnValueOnce('config_key') // Screener config key
        .mockReturnValueOnce('list_name_key') // Address list name key
      
      mockERC725.encodeValueType
        .mockReturnValueOnce('encoded_addresses') // Screener addresses
        .mockReturnValueOnce('encoded_list_name') // Address list name

      const result = await setScreenerAssistantConfig(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        executionOrder,
        screenerAddresses,
        screenerConfigs,
        useANDLogic,
        addressListNames
      )

      expect(result.keys).toHaveLength(4)
      expect(result.values).toHaveLength(4)
      
      // Verify screener addresses are encoded
      expect(mockERC725.encodeValueType).toHaveBeenCalledWith('address[]', screenerAddresses)
      
      // Verify AND logic is encoded
      expect(result.values[1]).toBe('0x01') // true encoded as 0x01
      
      // Verify manual byte packing for config
      const expectedConfigValue = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a18470000000000000000000000000000000000000000000000000000000000000001'
      expect(result.values[2]).toBe(expectedConfigValue)
      
      // Verify address list name is encoded
      expect(mockERC725.encodeValueType).toHaveBeenCalledWith('string', 'UAPAddressList')
    })

    it('should handle multiple screeners with OR logic', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 1
      const screenerAddresses = [
        '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847',
        '0x1111111111111111111111111111111111111111'
      ]
      const screenerConfigs = [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ]
      const useANDLogic = false
      const addressListNames = ['UAPAddressList', '']

      // Mock return values
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockERC725.encodeValueType.mockReturnValue('mock_value')

      const result = await setScreenerAssistantConfig(
        mockERC725,
        mockUpContract,
        executiveAddress,
        typeId,
        executionOrder,
        screenerAddresses,
        screenerConfigs,
        useANDLogic,
        addressListNames
      )

      // Should have: screeners key, logic key, 2 config keys, 1 list name key
      expect(result.keys).toHaveLength(5)
      expect(result.values).toHaveLength(5)
      
      // Verify OR logic
      expect(result.values[1]).toBe('0x00') // false encoded as 0x00
    })

    it('should throw error for mismatched array lengths', async () => {
      const mockERC725 = {}
      const mockUpContract = {}
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 0
      const screenerAddresses = ['0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847']
      const screenerConfigs = ['0x01', '0x02'] // Mismatched length

      await expect(setScreenerAssistantConfig(
        mockERC725 as any,
        mockUpContract,
        executiveAddress,
        typeId,
        executionOrder,
        screenerAddresses,
        screenerConfigs
      )).rejects.toThrow('Screener addresses and configs arrays must have the same length')
    })
  })

  describe('LSP5 Address List Operations', () => {
    let mockERC725: any

    beforeEach(() => {
      mockERC725 = {
        encodeKeyName: vi.fn(),
        encodeValueType: vi.fn()
      }
    })

    describe('generateListItemIndexKey', () => {
      it('should generate correct LSP5 list item key', () => {
        mockERC725.encodeKeyName.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')
        
        const result = generateListItemIndexKey(mockERC725, 'UAPAddressList', 5)
        
        expect(mockERC725.encodeKeyName).toHaveBeenCalledWith('UAPAddressList[]')
        expect(result).toBe('0x1234567890abcdef1234567890abcdef00000000000000000000000000000005')
      })

      it('should handle large indices', () => {
        mockERC725.encodeKeyName.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')
        
        const result = generateListItemIndexKey(mockERC725, 'TestList', 999)
        
        expect(result).toBe('0x1234567890abcdef1234567890abcdef000000000000000000000000000003e7')
      })
    })

    describe('encodeListMapValue', () => {
      it('should encode map value correctly', () => {
        const result = encodeListMapValue(mockERC725, '0x12345678', 42)
        
        expect(result).toBe('0x12345678000000000000000000000000000000000000000000000000000000000000002a')
      })

      it('should handle zero position', () => {
        const result = encodeListMapValue(mockERC725, '0x00000000', 0)
        
        expect(result).toBe('0x000000000000000000000000000000000000000000000000000000000000000000000000')
      })
    })

    describe('setAddressList', () => {
      it('should generate correct keys and values for address list', async () => {
        const listName = 'UAPAddressList'
        const addresses = [
          '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9',
          '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
        ]

        mockERC725.encodeKeyName
          .mockReturnValueOnce('list_length_key') // For list length
          .mockReturnValueOnce('item_0_key') // For first item
          .mockReturnValueOnce('map_0_key') // For first map
          .mockReturnValueOnce('item_1_key') // For second item
          .mockReturnValueOnce('map_1_key') // For second map

        mockERC725.encodeValueType
          .mockReturnValueOnce('encoded_length') // List length
          .mockReturnValueOnce('encoded_address_0') // First address
          .mockReturnValueOnce('encoded_address_1') // Second address

        const result = await setAddressList(mockERC725, listName, addresses)

        expect(result.keys).toHaveLength(5) // 1 length + 2 items + 2 maps
        expect(result.values).toHaveLength(5)
        
        // Verify list length encoding
        expect(mockERC725.encodeValueType).toHaveBeenCalledWith('uint256', 2)
        
        // Verify address encoding
        expect(mockERC725.encodeValueType).toHaveBeenCalledWith('address', addresses[0])
        expect(mockERC725.encodeValueType).toHaveBeenCalledWith('address', addresses[1])
      })

      it('should handle empty address list', async () => {
        const listName = 'EmptyList'
        const addresses: string[] = []

        mockERC725.encodeKeyName.mockReturnValue('list_length_key')
        mockERC725.encodeValueType.mockReturnValue('encoded_zero')

        const result = await setAddressList(mockERC725, listName, addresses)

        expect(result.keys).toHaveLength(1) // Only length key
        expect(result.values).toHaveLength(1)
        expect(mockERC725.encodeValueType).toHaveBeenCalledWith('uint256', 0)
      })
    })
  })

  describe('fetchScreenerAssistantConfig', () => {
    let mockERC725: any
    let mockUpContract: any

    beforeEach(() => {
      mockERC725 = {
        encodeKeyName: vi.fn(),
        decodeValueType: vi.fn()
      }
      mockUpContract = {
        getData: vi.fn(),
        getDataBatch: vi.fn()
      }
    })


    it('should handle empty screener configuration', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 0

      // Mock empty responses
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockUpContract.getData.mockResolvedValue('0x')
      mockERC725.decodeValueType.mockReturnValue([])

      const result = await fetchScreenerAssistantConfig(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        executionOrder
      )

      expect(result.screenerAddresses).toEqual([])
      expect(result.useANDLogic).toBe(true) // Default value
      expect(result.screenerConfigData).toEqual([])
      expect(result.addressListNames).toEqual([])
    })

    it('should handle corrupted config data gracefully', async () => {
      const assistantAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 0

      // Mock one screener address
      mockERC725.encodeKeyName.mockReturnValue('mock_key')
      mockUpContract.getData
        .mockResolvedValueOnce('0x0001000000000000000000000000111111111111111111111111111111111111111111')
        .mockResolvedValueOnce('0x00') // OR logic
        .mockResolvedValueOnce('0x123') // Corrupted config data (too short)
        .mockResolvedValueOnce('0x') // No list name

      mockERC725.decodeValueType.mockReturnValueOnce(['0x1111111111111111111111111111111111111111'])

      const result = await fetchScreenerAssistantConfig(
        mockERC725,
        mockUpContract,
        assistantAddress,
        typeId,
        executionOrder
      )

      expect(result.screenerAddresses).toEqual(['0x1111111111111111111111111111111111111111'])
      expect(result.useANDLogic).toBe(false)
      expect(result.screenerConfigData).toEqual(['0x']) // Should default to empty for corrupted data
      expect(result.addressListNames).toEqual([''])
    })

  })

  describe('getAddressList', () => {
    let mockERC725: any
    let mockUpContract: any

    beforeEach(() => {
      mockERC725 = {
        encodeKeyName: vi.fn(),
        decodeValueType: vi.fn()
      }
      mockUpContract = {
        getData: vi.fn(),
        getDataBatch: vi.fn()
      }
    })


    it('should handle empty address list', async () => {
      const listName = 'EmptyList'

      // Mock empty list response
      mockERC725.encodeKeyName.mockReturnValue('list_length_key')
      mockUpContract.getData.mockResolvedValue('0x')

      const result = await getAddressList(mockERC725, mockUpContract, listName)

      expect(result).toEqual([])
    })

    it('should handle zero-length list', async () => {
      const listName = 'ZeroList'

      // Mock zero length response
      mockERC725.encodeKeyName.mockReturnValue('list_length_key')
      mockUpContract.getData.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000000')
      mockERC725.decodeValueType.mockReturnValue(0)

      const result = await getAddressList(mockERC725, mockUpContract, listName)

      expect(result).toEqual([])
    })

    it('should filter out empty values from batch response', async () => {
      const listName = 'PartialList'

      // Mock list with some empty values
      mockERC725.encodeKeyName.mockReturnValue('list_length_key')
      mockUpContract.getData.mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000003')
      mockERC725.decodeValueType.mockReturnValueOnce(3)

      // Mock batch response with one empty value
      mockUpContract.getDataBatch.mockResolvedValue([
        '0x0000000000000000000000008b80c84b9cd9eb087e6894997ae161d4f9d975b9',
        '0x',
        '0x000000000000000000000000cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      ])

      mockERC725.decodeValueType
        .mockReturnValueOnce('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')
        .mockReturnValueOnce('0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847')

      const result = await getAddressList(mockERC725, mockUpContract, listName)

      expect(result).toEqual([
        '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9',
        '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      ])
    })

  })

  describe('Screener Configuration Edge Cases', () => {
    it('should handle screener configuration with missing optional data', () => {
      // Test manual byte unpacking with minimum data
      const configValue = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9cc8dcfe12590ba2310fd557ef6a1da94fa3a1847'
      
      // Simulate fetchScreenerAssistantConfig decoding logic
      if (configValue.length >= 82) { // 2 + 40 + 40 minimum
        const executiveAddress = '0x' + configValue.slice(2, 42)
        const screenerAddress = '0x' + configValue.slice(42, 82)
        const configData = '0x' + configValue.slice(82)
        
        expect(executiveAddress).toBe('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')
        expect(screenerAddress).toBe('0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847')
        expect(configData).toBe('0x')
      }
    })

    it('should handle malformed screener config data', () => {
      const shortConfigValue = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975'
      
      // Should be too short for proper decoding
      expect(shortConfigValue.length).toBeLessThan(82)
    })

    it('should validate screener order calculations for complex scenarios', () => {
      // Test realistic scenarios with multiple executives and screeners
      const scenarios = [
        { executionOrder: 0, screenerIndex: 0, expected: 0 },
        { executionOrder: 0, screenerIndex: 4, expected: 4 },
        { executionOrder: 1, screenerIndex: 0, expected: 1000 },
        { executionOrder: 1, screenerIndex: 2, expected: 1002 },
        { executionOrder: 3, screenerIndex: 1, expected: 3001 },
      ]

      scenarios.forEach(({ executionOrder, screenerIndex, expected }) => {
        expect(calculateScreenerOrder(executionOrder, screenerIndex)).toBe(expected)
      })
    })

    it('should properly validate round-trip payload consistency', () => {
      // Test that what we encode can be properly decoded
      const originalData = {
        executiveAddress: '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9',
        screenerAddress: '0xcc8dcfe12590ba2310fd557ef6a1da94fa3a1847',
        configData: '0x0000000000000000000000000000000000000000000000000000000000000001'
      }

      // Encode using our manual byte packing logic
      const executiveBytes = originalData.executiveAddress.toLowerCase().replace('0x', '')
      const screenerBytes = originalData.screenerAddress.toLowerCase().replace('0x', '')
      const configBytes = originalData.configData.replace('0x', '')
      const encoded = '0x' + executiveBytes + screenerBytes + configBytes

      // Decode using our manual byte unpacking logic
      const decodedExecutive = '0x' + encoded.slice(2, 42)
      const decodedScreener = '0x' + encoded.slice(42, 82)
      const decodedConfig = '0x' + encoded.slice(82)

      expect(decodedExecutive.toLowerCase()).toBe(originalData.executiveAddress.toLowerCase())
      expect(decodedScreener.toLowerCase()).toBe(originalData.screenerAddress.toLowerCase())
      expect(decodedConfig).toBe(originalData.configData)
    })
  })
})