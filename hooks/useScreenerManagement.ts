import { useState, useCallback } from 'react'
import { BrowserProvider, AbiCoder } from 'ethers'
import { 
  createUAPERC725Instance, 
  fetchScreenerAssistantConfig,
  getAddressList
} from '@/utils/configDataKeyValueStore'
import { LSP0ERC725Account__factory } from '@/types'
import { supportedNetworks } from '@/constants/supportedNetworks'

interface ScreenerState {
  enableScreeners: boolean
  selectedScreeners: string[]
  screenerConfigs: { [screenerId: string]: any }
  useANDLogic: boolean
}

interface UseScreenerManagementReturn {
  screenerStateByType: { [typeId: string]: ScreenerState }
  originalScreenerStateByType: { [typeId: string]: ScreenerState }
  setScreenerStateByType: (state: { [typeId: string]: ScreenerState }) => void
  setOriginalScreenerStateByType: (state: { [typeId: string]: ScreenerState }) => void
  updateScreenerForType: (typeId: string, updates: Partial<ScreenerState>) => void
  resetScreenerForType: (typeId: string) => void
  hasScreenerChanges: (typeId: string) => boolean
  getScreenerState: (typeId: string) => ScreenerState
  loadScreenerConfiguration: (assistantAddress: string, executionOrders: { [typeId: string]: number }, upAddress: string, networkId: number) => Promise<void>
}

const defaultScreenerState: ScreenerState = {
  enableScreeners: false,
  selectedScreeners: [],
  screenerConfigs: {},
  useANDLogic: true,
}

export const useScreenerManagement = (): UseScreenerManagementReturn => {
  const [screenerStateByType, setScreenerStateByType] = useState<{ [typeId: string]: ScreenerState }>({})
  const [originalScreenerStateByType, setOriginalScreenerStateByType] = useState<{ [typeId: string]: ScreenerState }>({})

  const updateScreenerForType = useCallback((typeId: string, updates: Partial<ScreenerState>) => {
    setScreenerStateByType(prev => ({
      ...prev,
      [typeId]: {
        ...prev[typeId] || defaultScreenerState,
        ...updates
      }
    }))
  }, [])

  const resetScreenerForType = useCallback((typeId: string) => {
    const original = originalScreenerStateByType[typeId] || defaultScreenerState
    setScreenerStateByType(prev => ({
      ...prev,
      [typeId]: { ...original }
    }))
  }, [originalScreenerStateByType])

  const hasScreenerChanges = useCallback((typeId: string) => {
    const current = screenerStateByType[typeId] || defaultScreenerState
    const original = originalScreenerStateByType[typeId] || defaultScreenerState
    
    // If enableScreeners is false for both, no meaningful change
    if (!current.enableScreeners && !original.enableScreeners) {
      return false
    }
    
    // If enableScreeners changed but current has no selected screeners, not a meaningful change
    if (current.enableScreeners !== original.enableScreeners) {
      // Only consider it a change if screeners is enabled AND there are selected screeners
      if (current.enableScreeners && current.selectedScreeners.length === 0) {
        return false
      }
    }
    
    return JSON.stringify(current) !== JSON.stringify(original)
  }, [screenerStateByType, originalScreenerStateByType])

  const getScreenerState = useCallback((typeId: string): ScreenerState => {
    return screenerStateByType[typeId] || defaultScreenerState
  }, [screenerStateByType])

  const loadScreenerConfiguration = useCallback(async (
    assistantAddress: string, 
    executionOrders: { [typeId: string]: number }, 
    upAddress: string, 
    networkId: number
  ) => {
    if (!upAddress || !window.lukso) return

    try {
      const provider = new BrowserProvider(window.lukso)
      const signer = await provider.getSigner(upAddress)
      const upContract = LSP0ERC725Account__factory.connect(upAddress, signer)
      const erc725UAP = createUAPERC725Instance(upAddress, signer.provider)

      const screenerStateByType: { [typeId: string]: ScreenerState } = {}


      // Load screener configuration for each configured transaction type
      for (const [typeId, executionOrder] of Object.entries(executionOrders)) {
        try {
          const screenerConfig = await fetchScreenerAssistantConfig(
            erc725UAP,
            upContract,
            assistantAddress,
            typeId,
            executionOrder
          )

          if (screenerConfig.screenerAddresses.length > 0) {
            // Process screener configurations
            const selectedScreeners: string[] = []
            const screenerConfigs: { [screenerId: string]: any } = {}

            for (let i = 0; i < screenerConfig.screenerAddresses.length; i++) {
              const screenerAddress = screenerConfig.screenerAddresses[i]
              const screenerConfigData = screenerConfig.screenerConfigData[i]
              const addressListName = screenerConfig.addressListNames[i]
              
              
              // Generate unique instance ID (use consistent format for reloading)
              const instanceId = `${screenerAddress}_loaded_${i}`
              selectedScreeners.push(instanceId)

              // Decode screener configuration
              const screenerDef = supportedNetworks[networkId]?.screeners[screenerAddress.toLowerCase()]
              
              if (screenerDef?.configParams && screenerDef.configParams.length > 0 && screenerConfigData !== '0x') {
                try {
                  const abiCoder = new AbiCoder()
                  const types = screenerDef.configParams.map((p: any) => p.type)
                  const decoded = abiCoder.decode(types, screenerConfigData)
                  
                  const config: any = {}
                  screenerDef.configParams.forEach((param: any, index: number) => {
                    config[param.name] = decoded[index].toString()
                  })
                  
                  // For Address List Screener, also load the addresses from the address list
                  if (screenerDef?.name === 'Address List Screener' && addressListName) {
                    try {
                      const addresses = await getAddressList(erc725UAP, upContract, addressListName)
                      config.addresses = addresses
                    } catch (addressError) {
                      console.warn(`Error loading address list ${addressListName}:`, addressError)
                      config.addresses = []
                    }
                  }
                  screenerConfigs[instanceId] = config
                } catch (decodeError) {
                  console.warn(`Error decoding screener config for ${screenerAddress}:`, decodeError)
                  screenerConfigs[instanceId] = {}
                }
              } else {
                const config: any = {}
                
                // Still check for Address List Screener even without configParams
                if (screenerDef?.name === 'Address List Screener' && addressListName) {
                  try {
                    const addresses = await getAddressList(erc725UAP, upContract, addressListName)
                    config.addresses = addresses
                  } catch (addressError) {
                    console.warn(`Error loading address list ${addressListName}:`, addressError)
                    config.addresses = []
                  }
                }
                
                screenerConfigs[instanceId] = config
              }
            }

            screenerStateByType[typeId] = {
              enableScreeners: true,
              selectedScreeners,
              screenerConfigs,
              useANDLogic: screenerConfig.useANDLogic
            }
          } else {
            screenerStateByType[typeId] = { ...defaultScreenerState }
          }
        } catch (error) {
          console.warn(`Error loading screener config for type ${typeId}:`, error)
          screenerStateByType[typeId] = { ...defaultScreenerState }
        }
      }

      // Update both current and original state
      setScreenerStateByType(screenerStateByType)
      setOriginalScreenerStateByType({ ...screenerStateByType })

    } catch (error) {
      console.error('Error loading screener configuration:', error)
    }
  }, [])

  return {
    screenerStateByType,
    originalScreenerStateByType,
    setScreenerStateByType,
    setOriginalScreenerStateByType,
    updateScreenerForType,
    resetScreenerForType,
    hasScreenerChanges,
    getScreenerState,
    loadScreenerConfiguration,
  }
}