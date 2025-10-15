import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockLuksoProvider,
  createMockLuksoEnvironment,
  validateSaveLoadCycle,
  type MockScreenerState
} from './mockLuksoProvider'

describe('Mock LUKSO Provider', () => {
  let provider: MockLuksoProvider

  beforeEach(() => {
    provider = new MockLuksoProvider(42)
  })

  describe('Basic Mock Functionality', () => {
    it('should create mock contract with working getData/setDataBatch', async () => {
      const upAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const mockContract = provider.createMockContract(upAddress)

      // Initially empty
      expect(await mockContract.getData('test_key')).toBe('0x')

      // Set data
      await mockContract.setDataBatch(['test_key'], ['test_value'])
      expect(await mockContract.getData('test_key')).toBe('test_value')

      // Verify transaction history
      const history = provider.getTransactionHistory()
      expect(history).toHaveLength(1)
      expect(history[0].keys).toEqual(['test_key'])
      expect(history[0].values).toEqual(['test_value'])
    })

    it('should create mock ERC725 with real encoding/decoding', () => {
      const upAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const mockERC725 = provider.createMockERC725(upAddress)

      // Test real encoding
      const addressArray = ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222']
      const encoded = mockERC725.encodeValueType('address[]', addressArray)
      expect(encoded).toMatch(/^0x[0-9a-fA-F]+$/)

      // Test real decoding
      const decoded = mockERC725.decodeValueType('address[]', encoded)
      expect(decoded).toEqual(addressArray.map(addr => addr))
    })

    it('should clear mock data correctly', async () => {
      provider.setContractData({ 'key1': 'value1', 'key2': 'value2' })
      expect(provider.getTransactionHistory()).toHaveLength(1) // Now tracks transactions

      provider.clear()
      
      const mockContract = provider.createMockContract('0x1234567890123456789012345678901234567890')
      expect(await mockContract.getData('key1')).toBe('0x')
    })
  })

  describe('Screener Configuration Setup', () => {
    it('should set up single Address List Screener configuration', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 1

      const screenerState: MockScreenerState = {
        selectedScreeners: ['0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def'],
        screenerConfigs: {
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def': {
            returnValueWhenInList: true,
            addresses: ['0x1111111111111111111111111111111111111111']
          }
        },
        useANDLogic: true
      }

      provider.setupScreenerConfiguration(executiveAddress, typeId, executionOrder, screenerState)

      const mockContract = provider.createMockContract(executiveAddress)
      const mockERC725 = provider.createMockERC725(executiveAddress)

      // Verify screener addresses key exists
      const screenersKey = mockERC725.encodeKeyName('UAPExecutiveScreeners:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
      await expect(mockContract.getData(screenersKey)).resolves.not.toBe('0x')

      // Verify AND logic key
      const logicKey = mockERC725.encodeKeyName('UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
      await expect(mockContract.getData(logicKey)).resolves.toBe('0x01')

      // Verify screener config key
      const screenerOrder = executionOrder * 1000 + 0
      const configKey = mockERC725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [typeId, screenerOrder.toString()])
      await expect(mockContract.getData(configKey)).resolves.not.toBe('0x')
    })

    it('should set up Curated List screener configuration', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 2

      const screenerState: MockScreenerState = {
        selectedScreeners: ['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567890_abc123def'],
        screenerConfigs: {
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567890_abc123def': {
            curatedListAddress: '0x3333333333333333333333333333333333333333',
            returnValueWhenCurated: false,
            useBlocklist: true,
            blocklistAddresses: ['0x4444444444444444444444444444444444444444']
          }
        },
        useANDLogic: false
      }

      provider.setupScreenerConfiguration(executiveAddress, typeId, executionOrder, screenerState)

      const mockContract = provider.createMockContract(executiveAddress)
      const mockERC725 = provider.createMockERC725(executiveAddress)

      // Verify OR logic
      const logicKey = mockERC725.encodeKeyName('UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
      await expect(mockContract.getData(logicKey)).resolves.toBe('0x00')

      // Verify blocklist was set up
      const blocklistLengthKey = mockERC725.encodeKeyName('UAPBlockList[]')
      await expect(mockContract.getData(blocklistLengthKey)).resolves.not.toBe('0x')
    })

    it('should set up complex mixed screener configuration', async () => {
      const executiveAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const executionOrder = 1

      const screenerState: MockScreenerState = {
        selectedScreeners: [
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def',
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567891_xyz789ghi'
        ],
        screenerConfigs: {
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def': {
            returnValueWhenInList: true,
            addresses: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222']
          },
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567891_xyz789ghi': {
            curatedListAddress: '0x3333333333333333333333333333333333333333',
            returnValueWhenCurated: false,
            useBlocklist: false
          }
        },
        useANDLogic: true
      }

      provider.setupScreenerConfiguration(executiveAddress, typeId, executionOrder, screenerState)

      const mockContract = provider.createMockContract(executiveAddress)
      const mockERC725 = provider.createMockERC725(executiveAddress)

      // Verify both screener configs exist
      const configKey0 = mockERC725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [typeId, '1000'])
      const configKey1 = mockERC725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [typeId, '1001'])
      
      await expect(mockContract.getData(configKey0)).resolves.not.toBe('0x')
      await expect(mockContract.getData(configKey1)).resolves.not.toBe('0x')

      // Verify address list was created
      const addressListLengthKey = mockERC725.encodeKeyName('UAPAddressList[]')
      await expect(mockContract.getData(addressListLengthKey)).resolves.not.toBe('0x')
    })
  })

  describe('Address List Setup', () => {
    it('should set up address list with correct LSP5 format', async () => {
      const addresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333'
      ]

      provider.setupAddressList('TestList', addresses)

      const mockContract = provider.createMockContract('0x0000000000000000000000000000000000000000')
      const mockERC725 = provider.createMockERC725('0x0000000000000000000000000000000000000000')

      // Verify list length
      const listLengthKey = mockERC725.encodeKeyName('TestList[]')
      await expect(mockContract.getData(listLengthKey)).resolves.not.toBe('0x')

      // Verify individual items exist
      for (let i = 0; i < addresses.length; i++) {
        const baseArrayKey = mockERC725.encodeKeyName('TestList[]')
        const keyPrefix = baseArrayKey.slice(0, 34)
        const indexBytes16 = i.toString(16).padStart(32, '0')
        const itemKey = keyPrefix + indexBytes16

        await expect(mockContract.getData(itemKey)).resolves.not.toBe('0x')

        // Verify map key exists
        const mapKey = mockERC725.encodeKeyName('TestListMap:<address>', [addresses[i]])
        await expect(mockContract.getData(mapKey)).resolves.not.toBe('0x')
      }
    })

    it('should handle empty address list', async () => {
      provider.setupAddressList('EmptyList', [])

      const mockContract = provider.createMockContract('0x0000000000000000000000000000000000000000')
      const mockERC725 = provider.createMockERC725('0x0000000000000000000000000000000000000000')

      const listLengthKey = mockERC725.encodeKeyName('EmptyList[]')
      const lengthData = mockContract.getData(listLengthKey)
      
      // Should have length key set to 0
      await expect(lengthData).resolves.not.toBe('0x')
    })
  })

  describe('Test Scenarios', () => {
    it('should provide realistic test scenarios', () => {
      const scenarios = MockLuksoProvider.createTestScenarios()

      expect(scenarios.singleAddressListScreener.selectedScreeners).toHaveLength(1)
      expect(scenarios.singleCommunityGateScreener.useANDLogic).toBe(false)
      expect(scenarios.mixedScreeners.selectedScreeners).toHaveLength(3)
      expect(scenarios.maximumScreeners.selectedScreeners).toHaveLength(5)

      // Verify each scenario has valid structure
      for (const [name, scenario] of Object.entries(scenarios)) {
        expect(scenario.selectedScreeners).toBeDefined()
        expect(scenario.screenerConfigs).toBeDefined()
        expect(typeof scenario.useANDLogic).toBe('boolean')

        // Verify all selected screeners have configs
        for (const instanceId of scenario.selectedScreeners) {
          expect(scenario.screenerConfigs[instanceId]).toBeDefined()
        }
      }
    })
  })

  describe('Integration Testing Utilities', () => {
    it('should create complete mock environment', () => {
      const mockEnv = createMockLuksoEnvironment(42)

      expect(mockEnv.provider).toBeInstanceOf(MockLuksoProvider)
      expect(mockEnv.mockContract).toBeDefined()
      expect(mockEnv.mockERC725).toBeDefined()
      expect(mockEnv.upAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(mockEnv.networkId).toBe(42)
    })

    it('should validate save/load cycle for single screener', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      const scenario = MockLuksoProvider.createTestScenarios().singleAddressListScreener

      const validation = await validateSaveLoadCycle(mockEnv, scenario)

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate save/load cycle for complex configuration', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      const scenario = MockLuksoProvider.createTestScenarios().mixedScreeners

      const validation = await validateSaveLoadCycle(mockEnv, scenario)

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate save/load cycle for maximum screeners', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      const scenario = MockLuksoProvider.createTestScenarios().maximumScreeners

      const validation = await validateSaveLoadCycle(mockEnv, scenario)

      expect(validation.success).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect validation errors for incomplete configuration', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      
      // Create invalid scenario with missing screener configs
      const invalidScenario: MockScreenerState = {
        selectedScreeners: ['0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def'],
        screenerConfigs: {}, // Missing config
        useANDLogic: true
      }

      // Don't set up the configuration to simulate missing data
      const validation = await validateSaveLoadCycle(mockEnv, invalidScenario)

      expect(validation.success).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Realistic Blockchain Behavior', () => {
    it('should simulate real contract interactions with transaction history', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      
      // Perform multiple transactions
      await mockEnv.mockContract.setDataBatch(['key1'], ['value1'])
      await mockEnv.mockContract.setDataBatch(['key2', 'key3'], ['value2', 'value3'])

      const history = mockEnv.provider.getTransactionHistory()
      
      expect(history).toHaveLength(2)
      expect(history[0]).toEqual({ keys: ['key1'], values: ['value1'] })
      expect(history[1]).toEqual({ keys: ['key2', 'key3'], values: ['value2', 'value3'] })

      // Verify data persistence
      expect(await mockEnv.mockContract.getData('key1')).toBe('value1')
      expect(await mockEnv.mockContract.getData('key2')).toBe('value2')
      expect(await mockEnv.mockContract.getData('key3')).toBe('value3')
    })

    it('should handle batch operations correctly', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      
      const keys = ['key1', 'key2', 'key3']
      const values = ['value1', 'value2', 'value3']
      
      await mockEnv.mockContract.setDataBatch(keys, values)
      
      const retrievedValues = await mockEnv.mockContract.getDataBatch(keys)
      expect(retrievedValues).toEqual(values)
    })

    it('should maintain state consistency across multiple operations', async () => {
      const mockEnv = createMockLuksoEnvironment(42)
      
      // Set up initial state
      const scenario1 = MockLuksoProvider.createTestScenarios().singleAddressListScreener
      mockEnv.provider.setupScreenerConfiguration(
        mockEnv.upAddress,
        '0x1111111111111111111111111111111111111111111111111111111111111111',
        1,
        scenario1
      )

      // Set up different state for different type
      const scenario2 = MockLuksoProvider.createTestScenarios().singleCommunityGateScreener
      mockEnv.provider.setupScreenerConfiguration(
        mockEnv.upAddress,
        '0x2222222222222222222222222222222222222222222222222222222222222222',
        2,
        scenario2
      )

      // Verify both configurations exist independently
      const validation1 = await validateSaveLoadCycle(mockEnv, scenario1)
      expect(validation1.success).toBe(true)

      const validation2 = await validateSaveLoadCycle(mockEnv, scenario2)
      expect(validation2.success).toBe(true)

      // Verify transaction history shows all operations
      const history = mockEnv.provider.getTransactionHistory()
      expect(history.length).toBeGreaterThan(0)
    })
  })
})