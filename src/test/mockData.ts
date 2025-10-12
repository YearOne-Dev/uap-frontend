import { vi } from 'vitest'
import { ExecutiveAssistant } from '@/constants/CustomTypes'

// Mock blockchain transaction response
export const mockTxResponse = {
  hash: '0xabcdef1234567890',
  wait: vi.fn().mockResolvedValue({
    status: 1,
    blockNumber: 123456,
    gasUsed: BigInt('21000')
  })
}

// Mock UP contract with blockchain data
export const createMockUPContract = (mockData: any = {}) => ({
  setDataBatch: vi.fn().mockResolvedValue(mockTxResponse),
  getData: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve(mockData[key] || '0x')
  }),
  getDataBatch: vi.fn().mockImplementation((keys: string[]) => {
    return Promise.resolve(keys.map(key => mockData[key] || '0x'))
  }),
})

// Mock ERC725 instance
export const createMockERC725 = (mockData: any = {}) => ({
  encodeValueType: vi.fn((type: string, value: any) => {
    if (type === 'address[]') return '0x' + value.map((addr: string) => addr.slice(2)).join('')
    if (type === 'string') return '0x' + Buffer.from(value).toString('hex')
    return '0x1234'
  }),
  decodeValueType: vi.fn((type: string, value: string) => {
    if (type === 'address[]') return ['0x1111111111111111111111111111111111111111']
    if (type === 'string') return 'test'
    return value
  }),
  getData: vi.fn().mockImplementation((key: string) => {
    return Promise.resolve(mockData[key] || '0x')
  }),
})

// Mock browser provider and signer
export const createMockProvider = () => ({
  getSigner: vi.fn().mockResolvedValue({
    getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    provider: {}
  })
})

// Sample Executive Assistant configuration
export const mockExecutiveAssistant: ExecutiveAssistant = {
  address: '0xAssistant1111111111111111111111111111111',
  name: 'Mock Executive Assistant',
  description: 'A mock executive assistant for testing',
  iconPath: '/icons/mock-assistant.svg',
  links: [
    { name: 'Documentation', url: 'https://example.com/docs' }
  ],
  creatorAddress: '0xCreator1111111111111111111111111111111111',
  assistantType: 'Executive',
  chainId: 42,
  supportedTransactionTypes: [
    '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7',
    '0x9c1c644b16f2e1c1b6e5a8cbf3e4c9c6e8a28a5a15b8f0cb0a11a91d4e3b9c3b'
  ],
  configParams: [
    {
      name: 'recipient',
      type: 'address',
      description: 'Recipient address',
      validate: (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value)
    },
    {
      name: 'amount',
      type: 'uint256',
      description: 'Amount in wei',
    }
  ]
}

// Mock blockchain state scenarios
export const mockBlockchainStates = {
  // Fresh profile with no assistants
  freshProfile: {},

  // Profile with one configured executive assistant
  singleExecutive: {
    // Type config key -> encoded assistant addresses
    'UAPTypeConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 
      '0x000000000000000000000000assistant1111111111111111111111111111111',
    
    // Executive config key -> encoded (address, bytes) tuple
    'UAPExecutiveConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x000000000000000000000000assistant1111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000064'
  },

  // Profile with executive + screeners configured  
  withScreeners: {
    // Type config
    'UAPTypeConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 
      '0x000000000000000000000000assistant1111111111111111111111111111111',
    
    // Executive config
    'UAPExecutiveConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x000000000000000000000000assistant1111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000064',
      
    // Executive screeners
    'UAPExecutiveScreeners:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x000000000000000000000000screener111111111111111111111111111111',
      
    // Executive screeners AND logic
    'UAPExecutiveScreenersANDLogic:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      
    // Screener config
    'UAPScreenerConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0xassistant1111111111111111111111111111111screener111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000064'
  },

  // Profile with address list screener
  withAddressListScreener: {
    // Type config
    'UAPTypeConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 
      '0x000000000000000000000000assistant1111111111111111111111111111111',
    
    // Executive config  
    'UAPExecutiveConfig:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x000000000000000000000000assistant1111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000064',
      
    // Executive screeners (Address List Screener)
    'UAPExecutiveScreeners:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x000000000000000000000000addresslistscreeneraddress1111111111111',
      
    // Executive screeners AND logic
    'UAPExecutiveScreenersANDLogic:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      
    // Address list name
    'UAPAddressListName:0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7:0':
      '0x' + Buffer.from('TestAddressList').toString('hex'),
      
    // LSP5 ReceivedAssetsMap entry for address list
    'LSP5ReceivedAssetsMap:TestAddressList':
      '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000035b00',
      
    // LSP5 ReceivedAssets array  
    'LSP5ReceivedAssets[]':
      '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d54657374416464726573734c69737400000000000000000000000000000000',
      
    // Address list data (LSP5 format)
    'LSP5ReceivedAssets[0]': '0x' + Buffer.from('TestAddressList').toString('hex'),
    'TestAddressListMap:0x1111111111111111111111111111111111111111': '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000035b00',
    'TestAddressListMap:0x2222222222222222222222222222222222222222': '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000035b01',
    'TestAddressList[]': '0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000141111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000001422222222222222222222222222222222222222220000000000000000000000000'
  }
}

// Mock supported networks configuration
export const mockSupportedNetworks = {
  42: {
    chainId: 42,
    name: 'LUKSO Mainnet',
    urlName: 'lukso',
    rpcUrl: 'https://rpc.mainnet.lukso.network',
    executiveAssistants: {
      '0xassistant1111111111111111111111111111111': mockExecutiveAssistant
    },
    screeners: {
      '0xscreener111111111111111111111111111111': {
        name: 'Basic Screener',
        description: 'Basic screening functionality',
        configParams: [
          {
            name: 'threshold',
            type: 'uint256',
            description: 'Minimum threshold'
          }
        ]
      },
      '0xaddresslistscreeneraddress1111111111111': {
        name: 'Address List Screener', 
        description: 'Screen based on address list',
        configParams: []
      }
    }
  }
}

// Mock functions for blockchain interactions
export const mockBlockchainFunctions = {
  createUAPERC725Instance: vi.fn(),
  fetchExecutiveAssistantConfig: vi.fn(),
  fetchScreenerAssistantConfig: vi.fn(), 
  getAddressList: vi.fn(),
  setAddressList: vi.fn(),
  configureExecutiveAssistantWithUnifiedSystem: vi.fn(),
  removeExecutiveAssistantConfig: vi.fn()
}

// Helper to set up mock returns based on blockchain state
export const setupMockBlockchainState = (state: keyof typeof mockBlockchainStates) => {
  const stateData = mockBlockchainStates[state]
  
  const mockERC725 = createMockERC725(stateData)
  const mockContract = createMockUPContract(stateData)
  
  // Configure mock returns based on state
  mockBlockchainFunctions.createUAPERC725Instance.mockReturnValue(mockERC725)
  
  if (state === 'freshProfile') {
    mockBlockchainFunctions.fetchExecutiveAssistantConfig.mockResolvedValue({
      configData: {},
      executionOrders: {},
      allAssistantsForTypes: {},
      isUPSubscribedToAssistant: false,
      predictedExecutionOrders: {}
    })
    mockBlockchainFunctions.fetchScreenerAssistantConfig.mockResolvedValue({
      screenerAddresses: [],
      screenerConfigData: [],
      useANDLogic: true,
      addressListNames: []
    })
  } else if (state === 'singleExecutive') {
    mockBlockchainFunctions.fetchExecutiveAssistantConfig.mockResolvedValue({
      configData: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': '0x000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000064'
      },
      executionOrders: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 0
      },
      allAssistantsForTypes: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': [
          { address: mockExecutiveAssistant.address, executionOrder: 0 }
        ]
      },
      isUPSubscribedToAssistant: true,
      predictedExecutionOrders: {}
    })
    mockBlockchainFunctions.fetchScreenerAssistantConfig.mockResolvedValue({
      screenerAddresses: [],
      screenerConfigData: [], 
      useANDLogic: true,
      addressListNames: []
    })
  } else if (state === 'withAddressListScreener') {
    mockBlockchainFunctions.fetchExecutiveAssistantConfig.mockResolvedValue({
      configData: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': '0x000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000064'
      },
      executionOrders: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 0
      },
      allAssistantsForTypes: {
        '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': [
          { address: mockExecutiveAssistant.address, executionOrder: 0 }
        ]
      },
      isUPSubscribedToAssistant: true,
      predictedExecutionOrders: {}
    })
    mockBlockchainFunctions.fetchScreenerAssistantConfig.mockResolvedValue({
      screenerAddresses: ['0xaddresslistscreeneraddress1111111111111'],
      screenerConfigData: ['0x'],
      useANDLogic: true,
      addressListNames: ['TestAddressList']
    })
    mockBlockchainFunctions.getAddressList.mockResolvedValue([
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222'
    ])
  }
  
  // Mock successful save operations
  mockBlockchainFunctions.configureExecutiveAssistantWithUnifiedSystem.mockResolvedValue({
    keys: ['mockKey1', 'mockKey2'],
    values: ['mockValue1', 'mockValue2']
  })
  
  return { mockERC725, mockContract }
}