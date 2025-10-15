import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockProfileData } from '@/src/test/testUtils'
import { 
  mockExecutiveAssistant, 
  setupMockBlockchainState, 
  mockBlockchainFunctions,
  mockSupportedNetworks,
  mockTxResponse 
} from '@/src/test/mockData'
import SetupAssistant from '../SetupAssistant'

// Mock ProfileProvider
vi.mock('@/contexts/ProfileProvider', () => ({
  useProfile: vi.fn(() => ({
    profileDetailsData: {
      upWallet: '0x1234567890123456789012345678901234567890',
      networkId: 42
    },
    isProfileLoading: false,
    profileError: null,
    refreshProfile: vi.fn()
  }))
}))

// Mock other components that might cause issues
vi.mock('../TransactionTypeSelector', () => ({
  default: ({ onAddType }: any) => (
    <div>
      <button onClick={() => onAddType('0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7')}>
        Add Transaction Types
      </button>
      <select role="combobox">
        <option value="">Select type</option>
        <option value="0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7">
          Value Reception
        </option>
      </select>
    </div>
  )
}))

vi.mock('../UnifiedTransactionTypePanel', () => ({
  default: ({ typeId, onRemove, enableScreeners, onEnableScreenersChange, onAddScreener }: any) => (
    <div data-testid={`transaction-type-panel-${typeId}`}>
      <button onClick={() => onRemove(typeId)}>Remove Type</button>
      <div>Value Reception</div>
      <div>Execution Order: 1</div>
      <label>
        <input 
          type="checkbox" 
          role="switch"
          aria-label="Enable transaction screening"
          checked={enableScreeners}
          onChange={(e) => onEnableScreenersChange(e.target.checked)}
        />
        Enable transaction screening
      </label>
      {enableScreeners && (
        <div>
          <button onClick={() => onAddScreener('addresslist_1', { name: 'Address List Screener' })}>
            Add Screener
          </button>
          <div>Address List Screener</div>
          <input placeholder="Enter ethereum address" />
          <button>Add Address</button>
        </div>
      )}
    </div>
  )
}))

vi.mock('../AssistantConfigurationSection', () => ({
  default: ({ configParams, fieldValues, onFieldChange }: any) => (
    <div>
      {configParams.map((param: any) => (
        <label key={param.name}>
          {param.description}
          <input 
            value={fieldValues[param.name] || ''}
            onChange={(e) => onFieldChange(param.name, e.target.value)}
            aria-label={param.description}
          />
        </label>
      ))}
    </div>
  )
}))

// Mock custom hooks
vi.mock('@/hooks/useAssistantConfiguration', () => ({
  useAssistantConfiguration: vi.fn(() => ({
    selectedConfigTypes: [],
    setSelectedConfigTypes: vi.fn(),
    fieldValues: {},
    setFieldValues: vi.fn(),
    executionOrders: {},
    allAssistantsForTypes: {},
    predictedExecutionOrders: {},
    isUPSubscribedToAssistant: false,
    loadConfiguration: vi.fn().mockResolvedValue({}),
    hasPendingChanges: vi.fn(() => false)
  }))
}))

vi.mock('@/hooks/useScreenerManagement', () => ({
  useScreenerManagement: vi.fn(() => ({
    screenerStateByType: {},
    originalScreenerStateByType: {},
    getScreenerState: vi.fn(() => ({
      enableScreeners: false,
      selectedScreeners: [],
      screenerConfigs: {},
      useANDLogic: true
    })),
    updateScreenerForType: vi.fn(),
    hasScreenerChanges: vi.fn(() => false),
    loadScreenerConfiguration: vi.fn(),
    setScreenerStateByType: vi.fn(),
    setOriginalScreenerStateByType: vi.fn()
  }))
}))

// Mock all blockchain utilities
vi.mock('@/utils/configDataKeyValueStore', () => ({
  createUAPERC725Instance: vi.fn(),
  fetchExecutiveAssistantConfig: vi.fn(),
  fetchScreenerAssistantConfig: vi.fn(), 
  getAddressList: vi.fn(),
  setAddressList: vi.fn(),
  configureExecutiveAssistantWithUnifiedSystem: vi.fn(),
  removeExecutiveAssistantConfig: vi.fn()
}))

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      chainId: 42,
      name: 'LUKSO Mainnet',
      urlName: 'lukso',
      rpcUrl: 'https://rpc.mainnet.lukso.network',
      executiveAssistants: {
        '0xassistant1111111111111111111111111111111': {
          address: '0xAssistant1111111111111111111111111111111',
          supportedTransactionTypes: [
            '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7'
          ],
          configParams: [
            {
              name: 'recipient',
              type: 'address',
              description: 'Recipient address'
            },
            {
              name: 'amount', 
              type: 'uint256',
              description: 'Amount in wei'
            }
          ]
        }
      },
      screeners: {
        '0xaddresslistscreeneraddress1111111111111': {
          name: 'Address List Screener', 
          description: 'Screen based on address list',
          configParams: []
        }
      }
    }
  }
}))

// Mock utils that depend on supportedNetworks
vi.mock('@/utils/utils', () => ({
  getNetwork: vi.fn(() => ({
    chainId: 42,
    name: 'LUKSO Mainnet'
  }))
}))

// Mock transaction type mappings  
vi.mock('@/components/TransactionTypeBlock', () => ({
  default: vi.fn(() => null),
  transactionTypeMap: {
    '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': {
      name: 'Value Reception',
      description: 'Receive value transfers'
    }
  }
}))
vi.mock('ethers', () => ({
  BrowserProvider: vi.fn(() => ({
    getSigner: vi.fn().mockResolvedValue({
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      provider: {}
    })
  })),
  AbiCoder: vi.fn(() => ({
    encode: vi.fn().mockReturnValue('0xencoded_config_data')
  }))
}))
vi.mock('@/types', () => ({
  LSP0ERC725Account__factory: {
    connect: vi.fn(() => setupMockBlockchainState('freshProfile').mockContract)
  }
}))

describe('SetupAssistant Integration Tests', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock functions to default success behavior
    mockBlockchainFunctions.configureExecutiveAssistantWithUnifiedSystem.mockResolvedValue({
      keys: ['mockKey1', 'mockKey2'],
      values: ['mockValue1', 'mockValue2']
    })
    mockBlockchainFunctions.createUAPERC725Instance.mockReturnValue({
      encodeValueType: vi.fn().mockReturnValue('0xmocked'),
      decodeValueType: vi.fn().mockReturnValue([])
    })
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
    mockBlockchainFunctions.removeExecutiveAssistantConfig.mockResolvedValue({
      keys: ['removeKey1'],
      values: ['0x']
    })
  })
  
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders basic component structure', async () => {
      render(<SetupAssistant config={mockExecutiveAssistant} networkId={42} />)

      // Should show assistant configuration header
      expect(screen.getByText('Assistant Instructions')).toBeInTheDocument()
      
      // Should show save button (initially disabled)
      const saveButton = screen.getByRole('button', { name: /save & activate assistant/i })
      expect(saveButton).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
    })

    it('shows deactivate button when appropriate', async () => {
      // Mock that assistant is already configured
      const { useAssistantConfiguration } = await vi.importMock('@/hooks/useAssistantConfiguration')
      useAssistantConfiguration.mockReturnValue({
        selectedConfigTypes: ['0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7'],
        setSelectedConfigTypes: vi.fn(),
        fieldValues: { recipient: '0x1234567890123456789012345678901234567890', amount: '100' },
        setFieldValues: vi.fn(),
        executionOrders: { '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 0 },
        allAssistantsForTypes: {},
        predictedExecutionOrders: {},
        isUPSubscribedToAssistant: true,
        loadConfiguration: vi.fn().mockResolvedValue({}),
        hasPendingChanges: vi.fn(() => false)
      })

      render(<SetupAssistant config={mockExecutiveAssistant} networkId={42} />)

      // Should show deactivate button when assistant is active
      const deactivateButton = screen.getByRole('button', { name: /deactivate assistant/i })
      expect(deactivateButton).toBeInTheDocument()
      expect(deactivateButton).toBeEnabled()
    })
  })

  describe('Hook Integration', () => {
    it('calls blockchain functions when saving configuration', async () => {
      // Mock the blockchain function at the module level
      const { configureExecutiveAssistantWithUnifiedSystem } = 
        await vi.importMock('@/utils/configDataKeyValueStore')
      
      configureExecutiveAssistantWithUnifiedSystem.mockResolvedValue({
        keys: ['mockKey1', 'mockKey2'],
        values: ['mockValue1', 'mockValue2']
      })

      // Mock that user has made changes  
      const mockSetSelectedConfigTypes = vi.fn()
      const mockHasPendingChanges = vi.fn(() => true)
      
      const { useAssistantConfiguration } = await vi.importMock('@/hooks/useAssistantConfiguration')
      useAssistantConfiguration.mockReturnValue({
        selectedConfigTypes: ['0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7'],
        setSelectedConfigTypes: mockSetSelectedConfigTypes,
        fieldValues: { recipient: '0x1234567890123456789012345678901234567890', amount: '100' },
        setFieldValues: vi.fn(),
        executionOrders: {},
        allAssistantsForTypes: {},
        predictedExecutionOrders: {},
        isUPSubscribedToAssistant: false,
        loadConfiguration: vi.fn().mockResolvedValue({}),
        hasPendingChanges: mockHasPendingChanges
      })

      render(<SetupAssistant config={mockExecutiveAssistant} networkId={42} />)

      // Save button should be enabled due to pending changes
      const saveButton = screen.getByRole('button', { name: /save & activate assistant/i })
      expect(saveButton).toBeEnabled()
      
      await user.click(saveButton)

      // Should call the configuration function
      await waitFor(() => {
        expect(configureExecutiveAssistantWithUnifiedSystem).toHaveBeenCalledTimes(1)
      })
      
      // Verify it was called with the right core parameters
      const callArgs = configureExecutiveAssistantWithUnifiedSystem.mock.calls[0]
      expect(callArgs[2]).toBe('0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7') // typeId
      expect(callArgs[3]).toBe('0xAssistant1111111111111111111111111111111') // assistant address  
      expect(callArgs[4]).toBe('0xencoded_config_data') // encoded config
      expect(callArgs[6]).toBe(42) // network ID
      
      // Verify screener config structure
      expect(callArgs[5]).toEqual({
        enableScreeners: false,
        selectedScreeners: [],
        screenerConfigs: {},
        useANDLogic: true
      })
    })
  })
})