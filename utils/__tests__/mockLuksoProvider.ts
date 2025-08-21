/**
 * Mock LUKSO provider and contract responses for integration testing
 * This module provides utilities to mock blockchain interactions for testing screener configurations
 */

import { vi } from 'vitest'
import ERC725 from '@erc725/erc725.js'
import uapSchema from '@/schemas/UAP.json'

// Types for mock data
interface MockContractData {
  [key: string]: string
}

interface MockScreenerState {
  selectedScreeners: string[]
  screenerConfigs: { [instanceId: string]: any }
  useANDLogic: boolean
}

interface MockERC725Response {
  getData: (key: string) => Promise<string>
  getDataBatch: (keys: string[]) => Promise<string[]>
  setDataBatch: (keys: string[], values: string[]) => Promise<{ wait: () => Promise<void> }>
  encodeKeyName: (keyName: string, dynamicKeyParts?: any[]) => string
  encodeValueType: (valueType: string, value: any) => string
  decodeValueType: (valueType: string, value: string) => any
}

/**
 * Mock LUKSO provider with configurable responses
 */
export class MockLuksoProvider {
  private contractData: MockContractData = {}
  private transactionHistory: Array<{ keys: string[]; values: string[] }> = []
  private networkId: number = 42

  constructor(networkId: number = 42) {
    this.networkId = networkId
  }

  /**
   * Set mock contract data
   */
  setContractData(data: MockContractData): void {
    this.contractData = { ...this.contractData, ...data }
    // Record as a transaction for history tracking
    const keys = Object.keys(data)
    const values = Object.values(data)
    if (keys.length > 0) {
      this.transactionHistory.push({ keys, values })
    }
  }

  /**
   * Get transaction history for debugging
   */
  getTransactionHistory(): Array<{ keys: string[]; values: string[] }> {
    return [...this.transactionHistory]
  }

  /**
   * Clear all mock data
   */
  clear(): void {
    this.contractData = {}
    this.transactionHistory = []
  }

  /**
   * Create mock UP contract with configurable responses
   */
  createMockContract(address: string) {
    return {
      getData: vi.fn().mockImplementation((key: string) => {
        const value = this.contractData[key] || '0x'
        return Promise.resolve(value)
      }),
      
      getDataBatch: vi.fn().mockImplementation((keys: string[]) => {
        const values = keys.map(key => this.contractData[key] || '0x')
        return Promise.resolve(values)
      }),
      
      setDataBatch: vi.fn().mockImplementation((keys: string[], values: string[]) => {
        // Record transaction for history
        this.transactionHistory.push({ keys: [...keys], values: [...values] })
        
        // Update contract data
        keys.forEach((key, index) => {
          this.contractData[key] = values[index]
        })
        
        return Promise.resolve({
          wait: vi.fn().mockResolvedValue(undefined)
        })
      })
    }
  }

  /**
   * Create mock ERC725 instance with realistic behavior
   */
  createMockERC725(address: string): MockERC725Response {
    // Use real ERC725 for encoding/decoding to ensure compatibility
    const realERC725 = new ERC725(uapSchema as any, address, undefined)
    
    return {
      getData: vi.fn().mockImplementation((key: string) => {
        const value = this.contractData[key] || '0x'
        return Promise.resolve(value)
      }),
      
      getDataBatch: vi.fn().mockImplementation((keys: string[]) => {
        const values = keys.map(key => this.contractData[key] || '0x')
        return Promise.resolve(values)
      }),
      
      setDataBatch: vi.fn().mockImplementation((keys: string[], values: string[]) => {
        this.transactionHistory.push({ keys: [...keys], values: [...values] })
        keys.forEach((key, index) => {
          this.contractData[key] = values[index]
        })
        return Promise.resolve({
          wait: vi.fn().mockResolvedValue(undefined)
        })
      }),
      
      encodeKeyName: vi.fn().mockImplementation((keyName: string, dynamicKeyParts?: any[]) => {
        return realERC725.encodeKeyName(keyName, dynamicKeyParts)
      }),
      
      encodeValueType: vi.fn().mockImplementation((valueType: string, value: any) => {
        return realERC725.encodeValueType(valueType, value)
      }),
      
      decodeValueType: vi.fn().mockImplementation((valueType: string, value: string) => {
        return realERC725.decodeValueType(valueType, value)
      })
    }
  }

  /**
   * Set up realistic screener configuration state in mock contract
   */
  setupScreenerConfiguration(
    executiveAddress: string,
    typeId: string,
    executionOrder: number,
    screenerState: MockScreenerState
  ): void {
    const erc725 = new ERC725(uapSchema as any, executiveAddress, undefined)

    // Extract screener addresses and prepare config data
    const screenerAddresses: string[] = []
    const screenerConfigData: string[] = []
    const addressListNames: string[] = []

    for (const instanceId of screenerState.selectedScreeners) {
      const screenerAddress = instanceId.split('_')[0]
      const config = screenerState.screenerConfigs[instanceId]
      
      screenerAddresses.push(screenerAddress)

      // Mock encoding based on screener type
      if (config.returnValueWhenInList !== undefined) {
        // Address List Screener
        const configData = config.returnValueWhenInList ? 
          '0x0000000000000000000000000000000000000000000000000000000000000001' :
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        screenerConfigData.push(configData)
        addressListNames.push('UAPAddressList')

        // Set up address list data
        if (config.addresses && config.addresses.length > 0) {
          this.setupAddressList('UAPAddressList', config.addresses)
        }
      } else if (config.curatedListAddress) {
        // Community Gate Screener
        const paddedAddress = config.curatedListAddress.toLowerCase().replace('0x', '').padStart(64, '0')
        const returnValue = config.returnValueWhenCurated ? '01' : '00'
        const configData = '0x' + paddedAddress + returnValue.padStart(64, '0')
        screenerConfigData.push(configData)
        addressListNames.push(config.useBlocklist ? 'UAPBlockList' : '')

        // Set up blocklist if enabled
        if (config.useBlocklist && config.blocklistAddresses) {
          this.setupAddressList('UAPBlockList', config.blocklistAddresses)
        }
      }
    }

    // Set up executive screeners key
    const screenersKey = erc725.encodeKeyName('UAPExecutiveScreeners:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
    const encodedScreeners = erc725.encodeValueType('address[]', screenerAddresses)
    this.setContractData({ [screenersKey]: encodedScreeners })

    // Set up AND/OR logic key
    const logicKey = erc725.encodeKeyName('UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
    const encodedLogic = screenerState.useANDLogic ? '0x01' : '0x00'
    this.setContractData({ [logicKey]: encodedLogic })

    // Set up individual screener configurations
    for (let i = 0; i < screenerAddresses.length; i++) {
      const screenerOrder = executionOrder * 1000 + i
      
      // Screener config key with manual byte packing
      const configKey = erc725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [typeId, screenerOrder.toString()])
      const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
      const screenerBytes = screenerAddresses[i].toLowerCase().replace('0x', '')
      const configBytes = screenerConfigData[i].replace('0x', '')
      const manualBytePackedValue = '0x' + executiveBytes + screenerBytes + configBytes
      this.setContractData({ [configKey]: manualBytePackedValue })

      // Address list name key
      if (addressListNames[i]) {
        const listNameKey = erc725.encodeKeyName('UAPAddressListName:<bytes32>:<uint256>', [typeId, screenerOrder.toString()])
        const encodedListName = erc725.encodeValueType('string', addressListNames[i])
        this.setContractData({ [listNameKey]: encodedListName })
      }
    }
  }

  /**
   * Set up address list data using LSP5 format
   */
  setupAddressList(listName: string, addresses: string[]): void {
    const erc725 = new ERC725(uapSchema as any, '0x0000000000000000000000000000000000000000', undefined)

    // List length key
    const listLengthKey = erc725.encodeKeyName(`${listName}[]`)
    const encodedLength = erc725.encodeValueType('uint256', addresses.length)
    this.setContractData({ [listLengthKey]: encodedLength })

    // Individual address keys
    for (let i = 0; i < addresses.length; i++) {
      // Generate LSP5 item key
      const baseArrayKey = erc725.encodeKeyName(`${listName}[]`)
      const keyPrefix = baseArrayKey.slice(0, 34)
      const indexBytes16 = i.toString(16).padStart(32, '0')
      const itemKey = keyPrefix + indexBytes16

      const encodedAddress = erc725.encodeValueType('address', addresses[i])
      this.setContractData({ [itemKey]: encodedAddress })

      // Map key for fast lookups
      const mapKey = erc725.encodeKeyName(`${listName}Map:<address>`, [addresses[i]])
      const mapValue = '0x00000000' + i.toString(16).padStart(64, '0') // type + position
      this.setContractData({ [mapKey]: mapValue })
    }
  }

  /**
   * Create realistic test scenarios
   */
  static createTestScenarios() {
    return {
      // Scenario 1: Single Address List Screener
      singleAddressListScreener: {
        selectedScreeners: ['0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def'],
        screenerConfigs: {
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def': {
            returnValueWhenInList: true,
            addresses: [
              '0x1111111111111111111111111111111111111111',
              '0x2222222222222222222222222222222222222222'
            ]
          }
        },
        useANDLogic: true
      },

      // Scenario 2: Single Community Gate Screener
      singleCommunityGateScreener: {
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
      },

      // Scenario 3: Multiple mixed screeners
      mixedScreeners: {
        selectedScreeners: [
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def',
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567891_xyz789ghi',
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567892_def456abc'
        ],
        screenerConfigs: {
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def': {
            returnValueWhenInList: true,
            addresses: ['0x1111111111111111111111111111111111111111']
          },
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567891_xyz789ghi': {
            curatedListAddress: '0x3333333333333333333333333333333333333333',
            returnValueWhenCurated: true,
            useBlocklist: false
          },
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567892_def456abc': {
            returnValueWhenInList: false,
            addresses: [
              '0x5555555555555555555555555555555555555555',
              '0x6666666666666666666666666666666666666666'
            ]
          }
        },
        useANDLogic: true
      },

      // Scenario 4: Maximum screeners (5)
      maximumScreeners: {
        selectedScreeners: [
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def',
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567891_xyz789ghi',
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567892_def456abc',
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567893_ghi789def',
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567894_jkl012mno'
        ],
        screenerConfigs: {
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567890_abc123def': {
            returnValueWhenInList: true,
            addresses: ['0x1111111111111111111111111111111111111111']
          },
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567891_xyz789ghi': {
            returnValueWhenInList: false,
            addresses: ['0x2222222222222222222222222222222222222222']
          },
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567892_def456abc': {
            curatedListAddress: '0x3333333333333333333333333333333333333333',
            returnValueWhenCurated: true,
            useBlocklist: false
          },
          '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1_1234567893_ghi789def': {
            curatedListAddress: '0x4444444444444444444444444444444444444444',
            returnValueWhenCurated: false,
            useBlocklist: true,
            blocklistAddresses: ['0x5555555555555555555555555555555555555555']
          },
          '0x31c7ab87662132f5901f190032d49e0abe9fabec_1234567894_jkl012mno': {
            returnValueWhenInList: true,
            addresses: [
              '0x6666666666666666666666666666666666666666',
              '0x7777777777777777777777777777777777777777',
              '0x8888888888888888888888888888888888888888'
            ]
          }
        },
        useANDLogic: false
      }
    }
  }
}

/**
 * Helper function to create a complete mock environment
 */
export const createMockLuksoEnvironment = (networkId: number = 42) => {
  const provider = new MockLuksoProvider(networkId)
  const upAddress = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
  
  const mockContract = provider.createMockContract(upAddress)
  const mockERC725 = provider.createMockERC725(upAddress)
  
  return {
    provider,
    mockContract,
    mockERC725,
    upAddress,
    networkId
  }
}

/**
 * Utility to validate that save/load cycle preserves data integrity
 */
export const validateSaveLoadCycle = async (
  mockEnv: ReturnType<typeof createMockLuksoEnvironment>,
  originalState: MockScreenerState
): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = []
  
  try {
    // Set up initial state
    mockEnv.provider.setupScreenerConfiguration(
      mockEnv.upAddress,
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      1,
      originalState
    )

    // Simulate loading the data back
    const erc725 = new ERC725(uapSchema as any, mockEnv.upAddress, undefined)
    const typeId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const executionOrder = 1

    // Check screener addresses
    const screenersKey = erc725.encodeKeyName('UAPExecutiveScreeners:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
    const screenersData = await mockEnv.mockContract.getData(screenersKey)
    
    if (screenersData === '0x' && originalState.selectedScreeners.length > 0) {
      errors.push('Screener addresses not saved properly')
    }

    // Check AND/OR logic
    const logicKey = erc725.encodeKeyName('UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>', [typeId, executionOrder.toString()])
    const logicData = await mockEnv.mockContract.getData(logicKey)
    const expectedLogic = originalState.useANDLogic ? '0x01' : '0x00'
    
    if (logicData !== expectedLogic) {
      errors.push(`AND/OR logic mismatch: expected ${expectedLogic}, got ${logicData}`)
    }

    // Check individual screener configs
    for (let i = 0; i < originalState.selectedScreeners.length; i++) {
      const screenerOrder = executionOrder * 1000 + i
      const configKey = erc725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [typeId, screenerOrder.toString()])
      const configData = await mockEnv.mockContract.getData(configKey)
      
      if (configData === '0x') {
        errors.push(`Screener config ${i} not saved`)
      } else if (configData.length < 82) {
        errors.push(`Screener config ${i} has invalid format`)
      }
    }

  } catch (error) {
    errors.push(`Validation error: ${error}`)
  }

  return {
    success: errors.length === 0,
    errors
  }
}

export type { MockScreenerState, MockContractData }