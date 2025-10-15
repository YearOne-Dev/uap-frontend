import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, AbiCoder } from 'ethers'
import {
  createUAPERC725Instance,
  fetchExecutiveAssistantConfig,
  generateUAPTypeConfigKey,
} from '@/utils/configDataKeyValueStore'
import { LSP0ERC725Account__factory } from '@/types'
import { supportedNetworks } from '@/constants/supportedNetworks'

interface UseAssistantConfigurationProps {
  assistantAddress: string
  supportedTransactionTypes: string[]
  configParams: { name: string; type: string; defaultValue?: string }[]
  upAddress?: string
  currentNetworkId?: number
}

interface AssistantConfigurationState {
  fieldValues: Record<string, string>
  originalFieldValues: Record<string, string>
  selectedConfigTypes: string[]
  isUPSubscribedToAssistant: boolean
  executionOrders: { [typeId: string]: number }
  allAssistantsForTypes: {
    [typeId: string]: { address: string; name: string; currentOrder: number; configData: string }[]
  }
  predictedExecutionOrders: { [typeId: string]: number }
}

interface UseAssistantConfigurationReturn extends AssistantConfigurationState {
  setFieldValues: (values: Record<string, string>) => void
  setOriginalFieldValues: (values: Record<string, string>) => void
  setSelectedConfigTypes: (types: string[]) => void
  setIsUPSubscribedToAssistant: (subscribed: boolean) => void
  setExecutionOrders: (orders: { [typeId: string]: number }) => void
  setAllAssistantsForTypes: (assistants: any) => void
  setPredictedExecutionOrders: (orders: { [typeId: string]: number }) => void
  loadConfiguration: (forceReload?: boolean) => Promise<{ [typeId: string]: number } | undefined>
  hasPendingChanges: () => boolean
  resetToOriginalValues: () => void
}

export const useAssistantConfiguration = ({
  assistantAddress,
  supportedTransactionTypes,
  configParams,
  upAddress,
  currentNetworkId = 42,
}: UseAssistantConfigurationProps): UseAssistantConfigurationReturn => {
  // Initialize field values with defaults
  const initializeFieldValues = useCallback(() => {
    const initial: Record<string, string> = {}
    configParams.forEach(param => {
      initial[param.name] = param.defaultValue || ''
    })
    return initial
  }, [configParams])

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initializeFieldValues)
  const [originalFieldValues, setOriginalFieldValues] = useState<Record<string, string>>(initializeFieldValues)
  const [selectedConfigTypes, setSelectedConfigTypes] = useState<string[]>([])
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] = useState<boolean>(false)
  const [executionOrders, setExecutionOrders] = useState<{ [typeId: string]: number }>({})
  const [allAssistantsForTypes, setAllAssistantsForTypes] = useState<{
    [typeId: string]: { address: string; name: string; currentOrder: number; configData: string }[]
  }>({})
  const [predictedExecutionOrders, setPredictedExecutionOrders] = useState<{ [typeId: string]: number }>({})

  // Fetch all assistants for the configured types (for reordering)
  const fetchAllAssistantsForTypes = useCallback(async (typesToFetch: string[]) => {
    if (!upAddress || typesToFetch.length === 0) return

    try {
      const provider = new BrowserProvider(window.lukso!)
      const signer = await provider.getSigner(upAddress)
      const upContract = LSP0ERC725Account__factory.connect(upAddress, signer)
      const erc725UAP = createUAPERC725Instance(upAddress, signer.provider)
      
      const assistantsForTypes: { [typeId: string]: { address: string; name: string; currentOrder: number; configData: string }[] } = {}

      for (const typeId of typesToFetch) {
        // Initialize empty array for each type
        assistantsForTypes[typeId] = []
        
        const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId)
        const encodedResult = await upContract.getData(typeConfigKey)
        
        if (encodedResult && encodedResult !== '0x') {
          const assistantAddresses = erc725UAP.decodeValueType('address[]', encodedResult) as string[]
          
          if (assistantAddresses && assistantAddresses.length > 0) {
            const assistantInfos = []
            
            for (let i = 0; i < assistantAddresses.length; i++) {
              const assistantAddr = assistantAddresses[i]
              const assistantInfo = supportedNetworks[currentNetworkId]?.assistants[assistantAddr.toLowerCase()]
              const assistantName = assistantInfo?.name || 'Unknown Assistant'
              
              // Fetch the config data for this assistant
              try {
                const { configData } = await fetchExecutiveAssistantConfig(
                  erc725UAP,
                  upContract,
                  assistantAddr,
                  [typeId]
                )
                
                assistantInfos.push({
                  address: assistantAddr,
                  name: assistantName,
                  currentOrder: i,
                  configData: configData[typeId] || '0x'
                })
              } catch (configError) {
                console.warn(`Error fetching config for assistant ${assistantAddr}:`, configError)
                assistantInfos.push({
                  address: assistantAddr,
                  name: assistantName,
                  currentOrder: i,
                  configData: '0x'
                })
              }
            }
            
            assistantsForTypes[typeId] = assistantInfos
          }
        }
      }

      setAllAssistantsForTypes(assistantsForTypes)
    } catch (err) {
      console.error('Error fetching all assistants for types:', err)
    }
  }, [upAddress, currentNetworkId, assistantAddress])

  const loadConfiguration = useCallback(async (forceReload = false) => {
    if (!upAddress || !window.lukso) return

    try {
      const provider = new BrowserProvider(window.lukso)
      const signer = await provider.getSigner(upAddress)
      const upContract = LSP0ERC725Account__factory.connect(upAddress, signer)
      const erc725UAP = createUAPERC725Instance(upAddress, signer.provider)

      const configResult = await fetchExecutiveAssistantConfig(
        erc725UAP,
        upContract,
        assistantAddress,
        supportedTransactionTypes
      )

      // Defensive handling for undefined or malformed responses
      if (!configResult) {
        console.warn('fetchExecutiveAssistantConfig returned undefined - network or RPC error')
        return {}
      }

      const { 
        configuredTypes = [], 
        executionOrders: fetchedOrders = {}, 
        configData = {} 
      } = configResult

      // Only update selectedConfigTypes if this is a forced reload (like after saving)
      // or if we don't have any user changes pending
      const safeConfiguredTypes = Array.isArray(configuredTypes) ? configuredTypes : []
      const safeSelectedConfigTypes = Array.isArray(selectedConfigTypes) ? selectedConfigTypes : []
      
      if (forceReload || safeSelectedConfigTypes.length === 0 || 
          JSON.stringify(safeSelectedConfigTypes.sort()) === JSON.stringify(Object.keys(fetchedOrders).sort())) {
        setSelectedConfigTypes(safeConfiguredTypes)
      }
      setExecutionOrders(fetchedOrders)
      setIsUPSubscribedToAssistant(safeConfiguredTypes.length > 0)

      // Decode field values from configuration data if available
      if (safeConfiguredTypes.length > 0 && configData[safeConfiguredTypes[0]] && configData[safeConfiguredTypes[0]] !== '0x') {
        const decodedValues: Record<string, string> = {}
        try {
          const abiCoder = new AbiCoder()
          const types = configParams.map(param => param.type)
          const decoded = abiCoder.decode(types, configData[safeConfiguredTypes[0]])
          configParams.forEach((param, index) => {
            decodedValues[param.name] = decoded[index].toString()
          })
          setFieldValues(decodedValues)
          setOriginalFieldValues(decodedValues)
        } catch (decodeError) {
          console.warn('Error decoding config data:', decodeError)
          // Fallback to default values
          configParams.forEach(param => {
            decodedValues[param.name] = param.defaultValue || ''
          })
          setFieldValues(decodedValues)
          setOriginalFieldValues(decodedValues)
        }
      }

      // Fetch all assistants for ALL supported types (not just configured ones)
      // This ensures we have complete data for execution order calculation
      await fetchAllAssistantsForTypes(supportedTransactionTypes)
      
      // Return the execution orders for immediate use by caller
      return fetchedOrders
    } catch (error) {
      console.error('Error loading assistant configuration:', error)
      return {}
    }
  }, [upAddress, assistantAddress, supportedTransactionTypes, configParams, fetchAllAssistantsForTypes])

  const hasPendingChanges = useCallback(() => {
    // Defensive handling for corrupted state
    if (!fieldValues || !originalFieldValues || !selectedConfigTypes || !executionOrders) {
      return false
    }

    // Check if field values have changed
    for (const [key, value] of Object.entries(fieldValues)) {
      if (originalFieldValues[key] !== value) {
        return true
      }
    }

    // Check if transaction types have changed
    const currentlySavedTypes = Object.keys(executionOrders)
    const safeSelectedConfigTypes = Array.isArray(selectedConfigTypes) ? selectedConfigTypes : []
    const hasTypeChanges = safeSelectedConfigTypes.length !== currentlySavedTypes.length ||
        safeSelectedConfigTypes.some(type => !currentlySavedTypes.includes(type)) ||
        currentlySavedTypes.some(type => !safeSelectedConfigTypes.includes(type))
    
    if (hasTypeChanges) {
      return true // Any type change is a pending change, whether adding, removing, or changing selection
    }

    return false
  }, [fieldValues, originalFieldValues, selectedConfigTypes, executionOrders])

  const resetToOriginalValues = useCallback(() => {
    setFieldValues({ ...originalFieldValues })
  }, [originalFieldValues])

  // Refresh assistants data when selected types change
  useEffect(() => {
    if (upAddress && selectedConfigTypes.length > 0) {
      // Make sure we have fresh data for ALL supported types, not just selected ones
      // This is needed for the reorder modal which needs to see all configured assistants
      fetchAllAssistantsForTypes(supportedTransactionTypes);
    }
  }, [selectedConfigTypes, upAddress, fetchAllAssistantsForTypes, supportedTransactionTypes]);

  // Calculate predicted execution orders for newly selected transaction types
  useEffect(() => {
    const newPredictedOrders: { [typeId: string]: number } = {}
    
    selectedConfigTypes.forEach(typeId => {
      // If assistant is already configured for this type, don't predict
      if (executionOrders[typeId] !== undefined) {
        return
      }
      
      // Calculate what the execution order would be for this assistant
      const currentAssistants = allAssistantsForTypes[typeId] || []
      const assistantAlreadyInList = currentAssistants.some(
        assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
      )
      
      if (!assistantAlreadyInList) {
        // New assistant would be added at the end
        newPredictedOrders[typeId] = currentAssistants.length
      } else {
        // Assistant exists, find its current position
        const existingIndex = currentAssistants.findIndex(
          assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
        )
        newPredictedOrders[typeId] = existingIndex
      }
    })
    
    setPredictedExecutionOrders(newPredictedOrders)
  }, [selectedConfigTypes, allAssistantsForTypes, executionOrders, assistantAddress])

  return {
    fieldValues,
    originalFieldValues,
    selectedConfigTypes,
    isUPSubscribedToAssistant,
    executionOrders,
    allAssistantsForTypes,
    predictedExecutionOrders,
    setFieldValues,
    setOriginalFieldValues,
    setSelectedConfigTypes,
    setIsUPSubscribedToAssistant,
    setExecutionOrders,
    setAllAssistantsForTypes,
    setPredictedExecutionOrders,
    loadConfiguration,
    hasPendingChanges,
    resetToOriginalValues,
  }
}