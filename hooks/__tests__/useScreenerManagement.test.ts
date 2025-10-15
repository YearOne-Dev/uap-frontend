import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock all dependencies first before imports
vi.mock('@/utils/configDataKeyValueStore', () => ({
  createUAPERC725Instance: vi.fn(),
  fetchScreenerAssistantConfig: vi.fn(),
  getAddressList: vi.fn()
}))

vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      chainId: 42,
      name: 'LUKSO Mainnet',
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

vi.mock('ethers', () => ({
  BrowserProvider: vi.fn(() => ({
    getSigner: vi.fn().mockResolvedValue({
      getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      provider: {}
    })
  })),
  AbiCoder: vi.fn(() => ({
    decode: vi.fn().mockReturnValue(['100'])
  }))
}))

vi.mock('@/types', () => ({
  LSP0ERC725Account__factory: {
    connect: vi.fn(() => ({
      getData: vi.fn().mockResolvedValue('0x'),
      getDataBatch: vi.fn().mockResolvedValue(['0x'])
    }))
  }
}))

import { useScreenerManagement } from '../useScreenerManagement'

describe('useScreenerManagement Hook', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup mock returns
    const { createUAPERC725Instance, fetchScreenerAssistantConfig, getAddressList } = 
      await vi.importMock('@/utils/configDataKeyValueStore')
      
    createUAPERC725Instance.mockReturnValue({
      encodeValueType: vi.fn().mockReturnValue('0xmocked'),
      decodeValueType: vi.fn().mockReturnValue([])
    })
    
    fetchScreenerAssistantConfig.mockResolvedValue({
      screenerAddresses: [],
      screenerConfigData: [],
      useANDLogic: true,
      addressListNames: []
    })
    
    getAddressList.mockResolvedValue([])
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    expect(result.current.screenerStateByType).toEqual({})
    expect(result.current.originalScreenerStateByType).toEqual({})
  })

  it('updates screener state for specific type', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    act(() => {
      result.current.updateScreenerForType('0xtype1', {
        enableScreeners: true,
        selectedScreeners: ['screener1'],
        screenerConfigs: { screener1: { threshold: '100' } },
        useANDLogic: false
      })
    })

    expect(result.current.screenerStateByType['0xtype1']).toEqual({
      enableScreeners: true,
      selectedScreeners: ['screener1'],
      screenerConfigs: { screener1: { threshold: '100' } },
      useANDLogic: false
    })
  })

  it('detects changes correctly', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    // Set original state
    act(() => {
      result.current.setOriginalScreenerStateByType({
        '0xtype1': {
          enableScreeners: false,
          selectedScreeners: [],
          screenerConfigs: {},
          useANDLogic: true
        }
      })
    })

    // No changes initially
    expect(result.current.hasScreenerChanges('0xtype1')).toBe(false)

    // Make a change
    act(() => {
      result.current.updateScreenerForType('0xtype1', {
        enableScreeners: true,
        selectedScreeners: ['screener1']
      })
    })

    // Should detect changes
    expect(result.current.hasScreenerChanges('0xtype1')).toBe(true)
  })

  it('ignores meaningless changes (enable without screeners)', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    // Set original state
    act(() => {
      result.current.setOriginalScreenerStateByType({
        '0xtype1': {
          enableScreeners: false,
          selectedScreeners: [],
          screenerConfigs: {},
          useANDLogic: true
        }
      })
    })

    // Enable screeners but don't add any
    act(() => {
      result.current.updateScreenerForType('0xtype1', {
        enableScreeners: true,
        selectedScreeners: []
      })
    })

    // Should not consider this a meaningful change
    expect(result.current.hasScreenerChanges('0xtype1')).toBe(false)
  })

  it('resets screener state to original', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    const originalState = {
      enableScreeners: true,
      selectedScreeners: ['screener1'],
      screenerConfigs: { screener1: { threshold: '100' } },
      useANDLogic: false
    }

    // Set original state
    act(() => {
      result.current.setOriginalScreenerStateByType({
        '0xtype1': originalState
      })
    })

    // Make changes
    act(() => {
      result.current.updateScreenerForType('0xtype1', {
        enableScreeners: false,
        selectedScreeners: []
      })
    })

    // Reset to original
    act(() => {
      result.current.resetScreenerForType('0xtype1')
    })

    expect(result.current.screenerStateByType['0xtype1']).toEqual(originalState)
  })

  it('loads screener configuration from blockchain', async () => {
    const { fetchScreenerAssistantConfig, getAddressList } = 
      await vi.importMock('@/utils/configDataKeyValueStore')
    
    // Mock address list screener data
    fetchScreenerAssistantConfig.mockResolvedValue({
      screenerAddresses: ['0xaddresslistscreeneraddress1111111111111'],
      screenerConfigData: ['0x'],
      useANDLogic: true,
      addressListNames: ['TestAddressList']
    })
    
    getAddressList.mockResolvedValue([
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222'
    ])
    
    const { result } = renderHook(() => useScreenerManagement())
    
    await act(async () => {
      await result.current.loadScreenerConfiguration(
        '0xAssistant1111111111111111111111111111111',
        { '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 0 },
        '0x1234567890123456789012345678901234567890',
        42
      )
    })

    // Should have loaded the screener configuration
    const typeId = '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7'
    expect(result.current.screenerStateByType[typeId]).toBeDefined()
    expect(result.current.screenerStateByType[typeId].enableScreeners).toBe(true)
    expect(result.current.screenerStateByType[typeId].selectedScreeners).toHaveLength(1)
    expect(result.current.screenerStateByType[typeId].selectedScreeners[0]).toMatch(
      /addresslistscreeneraddress.*_loaded_0/
    )
    
    // Should have loaded address list data
    const screenerInstanceId = result.current.screenerStateByType[typeId].selectedScreeners[0]
    expect(result.current.screenerStateByType[typeId].screenerConfigs[screenerInstanceId]).toEqual({
      addresses: [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
      ]
    })

    // Should also set original state
    expect(result.current.originalScreenerStateByType[typeId]).toEqual(
      result.current.screenerStateByType[typeId]
    )
  })

  it('handles empty screener configuration correctly', async () => {
    // Default mock already returns empty config
    
    const { result } = renderHook(() => useScreenerManagement())
    
    await act(async () => {
      await result.current.loadScreenerConfiguration(
        '0xAssistant1111111111111111111111111111111',
        { '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7': 0 },
        '0x1234567890123456789012345678901234567890',
        42
      )
    })

    // Should have default screener state (no screeners)
    const typeId = '0x7c69f09937fb1c2bbe7c5e86e8a28a5a15b8f0cb0a11a91d4e3b9c3bf0a2c8e7'
    expect(result.current.screenerStateByType[typeId]).toEqual({
      enableScreeners: false,
      selectedScreeners: [],
      screenerConfigs: {},
      useANDLogic: true
    })
  })

  it('returns correct default state for non-configured types', () => {
    const { result } = renderHook(() => useScreenerManagement())
    
    const state = result.current.getScreenerState('0xnonexistent')
    
    expect(state).toEqual({
      enableScreeners: false,
      selectedScreeners: [],
      screenerConfigs: {},
      useANDLogic: true
    })
  })
})