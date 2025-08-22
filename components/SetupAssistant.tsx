'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Input,
  Text,
  useToast,
  VStack,
  HStack,
  useDisclosure,
  Box,
  Collapse,
  Switch,
  FormControl,
  FormLabel,
  Divider,
} from '@chakra-ui/react';
import TransactionTypeBlock, {
  transactionTypeMap,
} from './TransactionTypeBlock';
import { AbiCoder, BrowserProvider } from 'ethers';
import {
  createUAPERC725Instance,
  setExecutiveAssistantConfig,
  setExecutiveAssistantConfigWithScreenerMigration,
  fetchExecutiveAssistantConfig,
  removeExecutiveAssistantConfig,
  generateUAPTypeConfigKey,
  setScreenerAssistantConfig,
  fetchScreenerAssistantConfig,
  removeScreenerAssistantConfig,
  setAddressList,
  getAddressList,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import AssistantReorderModal from './AssistantReorderModal';
import TransactionScreeningSection from './TransactionScreeningSection';
import AssistantConfigurationSection from './AssistantConfigurationSection';

/**
 * Updated interface for assistant configuration using the new UAP format
 */
interface IFullAssistantConfig {
  configuredTypes: string[];
  executionOrders: { [typeId: string]: number };
  configData: { [typeId: string]: string };
  isUPSubscribedToAssistant: boolean;
  fieldValues?: Record<string, string>;
}

/**
 * Fetch assistant configuration using the new UAP format
 */
async function fetchAssistantConfigNew({
  upAddress,
  assistantAddress,
  supportedTransactionTypes,
  configParams,
  signer,
}: {
  upAddress: string;
  assistantAddress: string;
  supportedTransactionTypes: string[];
  configParams: { name: string; type: string }[];
  signer: any;
}): Promise<IFullAssistantConfig> {
  const upContract = LSP0ERC725Account__factory.connect(upAddress, signer);
  const erc725UAP = createUAPERC725Instance(upAddress, signer.provider);

  // Fetch configuration using new UAP format
  const { configuredTypes, executionOrders, configData } = await fetchExecutiveAssistantConfig(
    erc725UAP,
    upContract,
    assistantAddress,
    supportedTransactionTypes
  );

  const isUPSubscribedToAssistant = configuredTypes.length > 0;

  // Decode field values from the first configured type (all types should have same config)
  let fieldValues: Record<string, string> | undefined = undefined;
  if (configuredTypes.length > 0 && configData[configuredTypes[0]] && configData[configuredTypes[0]] !== '0x') {
    fieldValues = {};
    const abiCoder = new AbiCoder();
    const types = configParams.map(param => param.type);
    const decoded = abiCoder.decode(types, configData[configuredTypes[0]]);
    configParams.forEach((param, index) => {
      fieldValues![param.name] = decoded[index].toString();
    });
  }

  return {
    configuredTypes,
    executionOrders,
    configData,
    isUPSubscribedToAssistant,
    fieldValues,
  };
}

const SetupAssistant: React.FC<{
  config: ExecutiveAssistant;
  networkId?: number;
}> = ({
  config: {
    address: assistantAddress,
    supportedTransactionTypes: assistantSupportedTransactionTypes,
    configParams,
  },
  networkId,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    configParams.forEach(param => {
      initial[param.name] = param.defaultValue ? param.defaultValue : '';
    });
    return initial;
  });
  const [selectedConfigTypes, setSelectedConfigTypes] = useState<string[]>([]);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] = useState<boolean>(false);
  const [executionOrders, setExecutionOrders] = useState<{ [typeId: string]: number }>({});
  const [allAssistantsForTypes, setAllAssistantsForTypes] = useState<{
    [typeId: string]: { address: string; name: string; currentOrder: number; configData: string }[];
  }>({});
  const [predictedExecutionOrders, setPredictedExecutionOrders] = useState<{ [typeId: string]: number }>({});
  const [selectedTypeForReorder, setSelectedTypeForReorder] = useState<{
    typeId: string;
    typeName: string;
  } | null>(null);
  const { isOpen: isReorderOpen, onOpen: onReorderOpen, onClose: onReorderClose } = useDisclosure();

  // Screener-related state - now per transaction type
  const [screenerStateByType, setScreenerStateByType] = useState<{
    [typeId: string]: {
      enableScreeners: boolean;
      selectedScreeners: string[];
      screenerConfigs: { [screenerId: string]: any };
      useANDLogic: boolean;
    }
  }>({});

  // Track original loaded screener state for change detection
  const [originalScreenerStateByType, setOriginalScreenerStateByType] = useState<{
    [typeId: string]: {
      enableScreeners: boolean;
      selectedScreeners: string[];
      screenerConfigs: { [screenerId: string]: any };
      useANDLogic: boolean;
    }
  }>({});

  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, chainId } = useProfile();
  const address = profileDetailsData?.upWallet;
  const currentNetworkId = networkId || chainId || 42; // Fallback to mainnet

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const getSigner = useCallback(async () => {
    if (!window.lukso || !address) {
      throw new Error('No wallet/address found!');
    }
    const provider = new BrowserProvider(window.lukso);
    return provider.getSigner(address);
  }, [address]);

  // Helper to get or initialize screener state for a transaction type
  const getScreenerStateForType = useCallback((typeId: string) => {
    return screenerStateByType[typeId] || {
      enableScreeners: false,
      selectedScreeners: [],
      screenerConfigs: {},
      useANDLogic: true
    };
  }, [screenerStateByType]);

  // Helper to update screener state for a specific type
  const updateScreenerStateForType = useCallback((typeId: string, updates: Partial<{
    enableScreeners: boolean;
    selectedScreeners: string[];
    screenerConfigs: { [screenerId: string]: any };
    useANDLogic: boolean;
  }>) => {
    setScreenerStateByType(prev => ({
      ...prev,
      [typeId]: {
        ...getScreenerStateForType(typeId),
        ...updates
      }
    }));
  }, [getScreenerStateForType]);

  // Helper to set error and show red toast
  const setErrorWithToast = useCallback((errorMessage: string) => {
    setError(errorMessage);
    toast({
      title: 'Configuration Error',
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // Helper to check if there are pending changes that haven't been saved
  const hasPendingChanges = useCallback(() => {
    // Check if transaction types have changed from what's saved
    const currentlySavedTypes = Object.keys(executionOrders);
    const hasTypeChanges = 
      selectedConfigTypes.length !== currentlySavedTypes.length ||
      selectedConfigTypes.some(type => !currentlySavedTypes.includes(type)) ||
      currentlySavedTypes.some(type => !selectedConfigTypes.includes(type));
    
    if (hasTypeChanges && selectedConfigTypes.length > 0) {
      return true;
    }

    // Check if there are any screener changes per transaction type
    for (const typeId of selectedConfigTypes) {
      const currentTypeState = getScreenerStateForType(typeId);
      const originalTypeState = originalScreenerStateByType[typeId];
      
      // If no original state, then any current state is a new change
      if (!originalTypeState) {
        if (currentTypeState.enableScreeners && currentTypeState.selectedScreeners.length > 0) {
          // Check if any screeners are configured
          const hasConfiguredScreeners = currentTypeState.selectedScreeners.some(instanceId => {
            const config = currentTypeState.screenerConfigs[instanceId];
            if (!config) return false;
            
            if (config.addresses && config.addresses.length > 0) return true;
            if (config.curatedListAddress && config.curatedListAddress.trim() !== '') return true;
            
            return false;
          });
          
          if (hasConfiguredScreeners) {
            return true;
          }
        }
        continue;
      }

      // Compare current state with original loaded state
      
      // Check if enable/disable state changed
      if (currentTypeState.enableScreeners !== originalTypeState.enableScreeners) {
        return true;
      }
      
      // Check if AND/OR logic changed
      if (currentTypeState.useANDLogic !== originalTypeState.useANDLogic) {
        return true;
      }
      
      // Check if number of screeners changed
      if (currentTypeState.selectedScreeners.length !== originalTypeState.selectedScreeners.length) {
        return true;
      }
      
      // Check if screener configurations changed
      for (const instanceId of currentTypeState.selectedScreeners) {
        const currentConfig = currentTypeState.screenerConfigs[instanceId];
        const originalConfig = originalTypeState.screenerConfigs[instanceId];
        
        // If instanceId doesn't exist in original (new screener)
        if (!originalConfig) {
          // Check if this new screener is configured
          if (currentConfig && (
            (currentConfig.addresses && currentConfig.addresses.length > 0) ||
            (currentConfig.curatedListAddress && currentConfig.curatedListAddress.trim() !== '')
          )) {
            return true;
          }
          continue;
        }
        
        // Compare configurations for existing screeners
        if (JSON.stringify(currentConfig) !== JSON.stringify(originalConfig)) {
          return true;
        }
      }
      
      // Check if any original screeners were removed
      for (const originalInstanceId of originalTypeState.selectedScreeners) {
        if (!currentTypeState.selectedScreeners.includes(originalInstanceId)) {
          return true;
        }
      }
    }

    // Check if required field values are filled (indicating user intent to save)
    const hasRequiredFieldsFilled = configParams.every(param => {
      const value = fieldValues[param.name];
      return value && value.trim() !== '';
    });

    // Only show pending if we have selected types, filled fields, but not yet subscribed
    return hasRequiredFieldsFilled && selectedConfigTypes.length > 0 && !isUPSubscribedToAssistant;
  }, [selectedConfigTypes, getScreenerStateForType, originalScreenerStateByType, executionOrders, configParams, fieldValues, isUPSubscribedToAssistant]);

  // --------------------------------------------------------------------------  
  // Fetch all assistants for the configured types (for reordering)
  // --------------------------------------------------------------------------
  const fetchAllAssistantsForTypes = useCallback(async (configuredTypes: string[]) => {
    if (!address || configuredTypes.length === 0) return;

    try {
      const signer = await getSigner();
      const upContract = LSP0ERC725Account__factory.connect(address, signer);
      const erc725UAP = createUAPERC725Instance(address, signer.provider);
      
      const assistantsForTypes: { [typeId: string]: { address: string; name: string; currentOrder: number; configData: string }[] } = {};

      for (const typeId of configuredTypes) {
        const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId);
        const encodedResult = await upContract.getData(typeConfigKey);
        
        if (encodedResult && encodedResult !== '0x') {
          const assistantAddresses = erc725UAP.decodeValueType('address[]', encodedResult) as string[];
          
          if (assistantAddresses && assistantAddresses.length > 0) {
            const assistantInfos = [];
            
            for (let i = 0; i < assistantAddresses.length; i++) {
              const assistantAddr = assistantAddresses[i];
              const assistantName = supportedNetworks[currentNetworkId]?.assistants[assistantAddr.toLowerCase()]?.name || 'Unknown';
              
              // Fetch the config data for this assistant
              try {
                const { configData } = await fetchExecutiveAssistantConfig(
                  erc725UAP,
                  upContract,
                  assistantAddr,
                  [typeId]
                );
                
                assistantInfos.push({
                  address: assistantAddr,
                  name: assistantName,
                  currentOrder: i,
                  configData: configData[typeId] || '0x'
                });
              } catch (configError) {
                console.warn(`Error fetching config for assistant ${assistantAddr}:`, configError);
                assistantInfos.push({
                  address: assistantAddr,
                  name: assistantName,
                  currentOrder: i,
                  configData: '0x'
                });
              }
            }
            
            assistantsForTypes[typeId] = assistantInfos;
          }
        }
      }

      setAllAssistantsForTypes(assistantsForTypes);
    } catch (err) {
      console.error('Error fetching all assistants for types:', err);
    }
  }, [address, getSigner, currentNetworkId]);

  // --------------------------------------------------------------------------
  // Load screener configurations per transaction type
  // --------------------------------------------------------------------------
  const loadScreenerConfigurations = useCallback(async (configuredTypes: string[], signer: any, executionOrdersMap: { [typeId: string]: number }) => {
    try {
      const upContract = LSP0ERC725Account__factory.connect(address!, signer);
      const erc725UAP = createUAPERC725Instance(address!, signer.provider);

      const newScreenerStateByType: { [typeId: string]: any } = {};

      // Check each configured type for screener configurations
      for (const typeId of configuredTypes) {
        try {
          const executionOrder = executionOrdersMap[typeId] || 0;
          
          const screenerConfig = await fetchScreenerAssistantConfig(
            erc725UAP,
            upContract,
            assistantAddress,
            typeId,
            executionOrder
          );

          const typeScreenerState = {
            enableScreeners: screenerConfig.screenerAddresses.length > 0,
            selectedScreeners: [] as string[],
            screenerConfigs: {} as { [instanceId: string]: any },
            useANDLogic: screenerConfig.useANDLogic
          };

          if (screenerConfig.screenerAddresses.length > 0) {
            // Process each screener and create instance IDs
            for (let i = 0; i < screenerConfig.screenerAddresses.length; i++) {
              const screenerAddress = screenerConfig.screenerAddresses[i];
              const screenerData = screenerConfig.screenerConfigData[i];
              const addressListName = screenerConfig.addressListNames[i];
              
              // Generate unique instance ID for this loaded screener
              const instanceId = `${screenerAddress}_loaded_${typeId}_${i}_${Date.now()}`;
              typeScreenerState.selectedScreeners.push(instanceId);
              
              const screener = supportedNetworks[currentNetworkId]?.screeners[screenerAddress.toLowerCase()];
              if (screener && screenerData && screenerData !== '0x') {
                // Decode screener configuration based on type
                if (screener.name === 'Address List Screener') {
                  try {
                    const abiCoder = new AbiCoder();
                    const decoded = abiCoder.decode(['bool'], screenerData);
                    
                    // Load address list from ERC725Y storage using the list name
                    let addresses: string[] = [];
                    if (addressListName) {
                      try {
                        // Try type-specific name first, fallback to original name for backwards compatibility
                        const typeSpecificName = `UAPAddressList_${typeId}`;
                        try {
                          addresses = await getAddressList(erc725UAP, upContract, typeSpecificName);
                        } catch {
                          // Fallback to original name for backwards compatibility
                          addresses = await getAddressList(erc725UAP, upContract, addressListName);
                        }
                      } catch (err) {
                        console.warn(`Error loading address list ${addressListName}:`, err);
                      }
                    }
                    
                    typeScreenerState.screenerConfigs[instanceId] = {
                      returnValueWhenInList: decoded[0],
                      addresses
                    };
                  } catch (err) {
                    console.warn('Error decoding Address List Screener config:', err);
                  }
                } else if (screener.name === 'Community Gate') {
                  try {
                    const abiCoder = new AbiCoder();
                    const decoded = abiCoder.decode(['address', 'bool'], screenerData);
                    
                    // Load blocklist addresses if blocklist is enabled
                    let blocklistAddresses: string[] = [];
                    if (addressListName && addressListName.includes('UAPBlockList')) {
                      try {
                        // Try type-specific name first, fallback to original name for backwards compatibility
                        const typeSpecificName = `UAPBlockList_${typeId}`;
                        try {
                          blocklistAddresses = await getAddressList(erc725UAP, upContract, typeSpecificName);
                        } catch {
                          // Fallback to original name for backwards compatibility
                          blocklistAddresses = await getAddressList(erc725UAP, upContract, 'UAPBlockList');
                        }
                      } catch (err) {
                        console.warn('Error loading blocklist addresses:', err);
                      }
                    }
                    
                    typeScreenerState.screenerConfigs[instanceId] = {
                      curatedListAddress: decoded[0],
                      returnValueWhenCurated: decoded[1],
                      useBlocklist: !!addressListName,
                      blocklistAddresses
                    };
                  } catch (err) {
                    console.warn('Error decoding Community Gate config:', err);
                  }
                }
              }
            }
          }

          newScreenerStateByType[typeId] = typeScreenerState;
        } catch (err) {
          console.warn(`Error loading screener config for type ${typeId}:`, err);
          // Initialize with default state for this type
          newScreenerStateByType[typeId] = {
            enableScreeners: false,
            selectedScreeners: [],
            screenerConfigs: {},
            useANDLogic: true
          };
        }
      }

      // Update state with loaded screener configurations per type
      setScreenerStateByType(prev => ({
        ...prev,
        ...newScreenerStateByType
      }));

      // Also save the original state for change detection
      setOriginalScreenerStateByType(prev => ({
        ...prev,
        ...newScreenerStateByType
      }));
    } catch (err) {
      console.error('Error loading screener configurations:', err);
    }
  }, [address, assistantAddress, currentNetworkId]);

  // --------------------------------------------------------------------------
  // On Page Load: fetch existing configuration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;

    const loadExistingConfig = async () => {
      try {
        setIsProcessingTransaction(true);
        const signer = await getSigner();

        const { configuredTypes, executionOrders, isUPSubscribedToAssistant, fieldValues } =
          await fetchAssistantConfigNew({
            upAddress: address,
            assistantAddress,
            supportedTransactionTypes: assistantSupportedTransactionTypes,
            configParams,
            signer,
          });

        setSelectedConfigTypes(configuredTypes);
        setExecutionOrders(executionOrders);
        setIsUPSubscribedToAssistant(isUPSubscribedToAssistant);
        if (fieldValues) {
          setFieldValues(fieldValues);
        }
        
        // Fetch all assistants for the configured types (for reordering)
        await fetchAllAssistantsForTypes(configuredTypes);
        
        // Fetch screener configurations for each configured type
        if (configuredTypes.length > 0) {
          await loadScreenerConfigurations(configuredTypes, signer, executionOrders);
        }
      } catch (err) {
        console.error('Failed to load existing config:', err);
      } finally {
        setIsProcessingTransaction(false);
      }
    };

    loadExistingConfig();
  }, [
    address,
    assistantAddress,
    assistantSupportedTransactionTypes,
    configParams,
    getSigner,
    fetchAllAssistantsForTypes,
    loadScreenerConfigurations,
  ]);

  // --------------------------------------------------------------------------
  // Calculate predicted execution orders for newly selected transaction types
  // --------------------------------------------------------------------------
  useEffect(() => {
    const newPredictedOrders: { [typeId: string]: number } = {};
    
    selectedConfigTypes.forEach(typeId => {
      // If assistant is already configured for this type, don't predict
      if (executionOrders[typeId] !== undefined) {
        return;
      }
      
      // Calculate what the execution order would be for this assistant
      const currentAssistants = allAssistantsForTypes[typeId] || [];
      const assistantAlreadyInList = currentAssistants.some(
        assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
      );
      
      if (!assistantAlreadyInList) {
        // New assistant would be added at the end
        newPredictedOrders[typeId] = currentAssistants.length;
      } else {
        // Assistant exists, find its current position
        const existingIndex = currentAssistants.findIndex(
          assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
        );
        newPredictedOrders[typeId] = existingIndex;
      }
    });
    
    setPredictedExecutionOrders(newPredictedOrders);
  }, [selectedConfigTypes, allAssistantsForTypes, executionOrders, assistantAddress]);

  // --------------------------------------------------------------------------
  // Handle reorder functionality
  // --------------------------------------------------------------------------
  const handleReorderClick = (typeId: string) => {
    const typeObj = Object.values(transactionTypeMap).find(t => t.id === typeId);
    if (typeObj) {
      setSelectedTypeForReorder({
        typeId,
        typeName: `${typeObj.label} ${typeObj.typeName}`
      });
      onReorderOpen();
    }
  };

  const handleReorderComplete = async () => {
    try {
      // Refetch all assistants for the configured types
      if (selectedConfigTypes.length > 0) {
        await fetchAllAssistantsForTypes(selectedConfigTypes);
      }

      // Refetch this assistant's own configuration to update execution orders
      const signer = await getSigner();
      const { configuredTypes, executionOrders: newExecutionOrders, isUPSubscribedToAssistant: newSubscriptionStatus, fieldValues } =
        await fetchAssistantConfigNew({
          upAddress: address!,
          assistantAddress,
          supportedTransactionTypes: assistantSupportedTransactionTypes,
          configParams,
          signer,
        });

      // Update the execution orders state
      setExecutionOrders(newExecutionOrders);
      setSelectedConfigTypes(configuredTypes);
      setIsUPSubscribedToAssistant(newSubscriptionStatus);
      if (fieldValues) {
        setFieldValues(fieldValues);
      }
    } catch (err) {
      console.error('Error refetching config after reorder:', err);
    }
  };

  // --------------------------------------------------------------------------
  // Save configuration using new UAP format
  // --------------------------------------------------------------------------
  const handleSaveAssistantConfig = async () => {
    setError(''); // Clear existing error
    if (!address) {
      setErrorWithToast('Please connect your wallet first.');
      return;
    }

    if (selectedConfigTypes.length === 0) {
      setErrorWithToast('Please select at least one transaction type.');
      return;
    }

    // Validate fields
    for (const param of configParams) {
      const value = fieldValues[param.name];
      if (!value) {
        setErrorWithToast(`Please fill in ${param.description}.`);
        return;
      }
      if (param.type === 'bytes32' && !/^0x[0-9A-Fa-f]{64}$/.test(value)) {
        setErrorWithToast(
          `Invalid ${param.name}. Must be 32-byte hex (0x + 64 characters).`
        );
        return;
      }
      if (param.type.startsWith('uint') && isNaN(Number(value))) {
        setErrorWithToast(`Invalid ${param.name}. Not a valid number.`);
        return;
      }
      if (param.validate && !param.validate(value, address)) {
        setErrorWithToast(
          `Invalid ${param.name} for "${param.description}". ${param.validationMessage ? param.validationMessage : ''}`
        );
        return;
      }
    }

    // Validate screener configurations per transaction type
    for (const typeId of selectedConfigTypes) {
      const typeState = getScreenerStateForType(typeId);
      if (typeState.enableScreeners && typeState.selectedScreeners.length > 0) {
        for (const instanceId of typeState.selectedScreeners) {
          // Extract screener address from instanceId (format: address_timestamp_random)
          const screenerAddress = instanceId.split('_')[0];
          const screener = supportedNetworks[currentNetworkId]?.screeners[screenerAddress.toLowerCase()];
          const config = typeState.screenerConfigs[instanceId];
          
          if (!screener || !config) {
            setErrorWithToast(`Screener configuration is missing for ${screener?.name || 'unknown screener'} in transaction type ${typeId}`);
            return;
          }

          // Validate Address List Screener
          if (screener.name === 'Address List Screener') {
            if (!config.addresses || config.addresses.length === 0) {
              setErrorWithToast(`Please add at least one address to the ${screener.name} screener for transaction type ${typeId}`);
              return;
            }
          }

          // Validate Community Gate
          if (screener.name === 'Community Gate') {
            if (!config.curatedListAddress) {
              setErrorWithToast(`Please enter a curated list contract address for the ${screener.name} screener for transaction type ${typeId}`);
              return;
            }
          }
        }
      }
    }

    try {
      setIsProcessingTransaction(true);
      const signer = await getSigner();
      const upContract = LSP0ERC725Account__factory.connect(address, signer);
      const erc725UAP = createUAPERC725Instance(address, signer.provider);

      // Encode configuration data
      const abiCoder = new AbiCoder();
      const types = configParams.map(param => param.type);
      const values = configParams.map(param => fieldValues[param.name]);
      const assistantConfigData = abiCoder.encode(types, values);

      const allKeys: string[] = [];
      const allValues: string[] = [];

      // Configure each selected transaction type
      for (let i = 0; i < selectedConfigTypes.length; i++) {
        const typeId = selectedConfigTypes[i];
        
        const { keys, values, executionOrder } = await setExecutiveAssistantConfigWithScreenerMigration(
          erc725UAP,
          upContract,
          assistantAddress,
          typeId,
          assistantConfigData,
          true // Update type config to include this assistant
        );
        
        allKeys.push(...keys);
        allValues.push(...values);

        // Configure or remove screeners for this type
        const typeState = getScreenerStateForType(typeId);
        const originalTypeState = originalScreenerStateByType[typeId];
        
        if (typeState.enableScreeners && typeState.selectedScreeners.length > 0) {
          const screenerAddresses: string[] = [];
          const screenerConfigData: string[] = [];
          const addressListNames: string[] = [];

          for (const instanceId of typeState.selectedScreeners) {
            // Extract screener address from instanceId (format: address_timestamp_random)
            const screenerAddress = instanceId.split('_')[0];
            const screener = supportedNetworks[currentNetworkId]?.screeners[screenerAddress.toLowerCase()];
            const config = typeState.screenerConfigs[instanceId];
            
            if (screener && config) {
              screenerAddresses.push(screener.address);
              
              // Encode screener configuration based on type
              if (screener.name === 'Address List Screener') {
                const abiCoder = new AbiCoder();
                const configData = abiCoder.encode(
                  ['bool'],
                  [config.returnValueWhenInList]
                );
                screenerConfigData.push(configData);
                
                // Use type-specific address list name to avoid conflicts
                const listName = `UAPAddressList_${typeId}`;
                addressListNames.push(listName);
                
                // Add address list storage keys/values
                if (config.addresses && config.addresses.length > 0) {
                  const { keys: listKeys, values: listValues } = await setAddressList(
                    erc725UAP,
                    listName,
                    config.addresses
                  );
                  allKeys.push(...listKeys);
                  allValues.push(...listValues);
                }
              } else if (screener.name === 'Community Gate') {
                const abiCoder = new AbiCoder();
                const configData = abiCoder.encode(
                  ['address', 'bool'],
                  [config.curatedListAddress, config.returnValueWhenCurated]
                );
                screenerConfigData.push(configData);
                
                // Use type-specific blocklist name to avoid conflicts
                const blocklistName = config.useBlocklist ? `UAPBlockList_${typeId}` : '';
                addressListNames.push(blocklistName);
                
                // Store blocklist addresses if enabled
                if (config.useBlocklist && config.blocklistAddresses && config.blocklistAddresses.length > 0) {
                  const { keys: blocklistKeys, values: blocklistValues } = await setAddressList(
                    erc725UAP,
                    blocklistName,
                    config.blocklistAddresses
                  );
                  allKeys.push(...blocklistKeys);
                  allValues.push(...blocklistValues);
                }
              }
            }
          }

          if (screenerAddresses.length > 0) {
            const { keys: screenerKeys, values: screenerValues } = await setScreenerAssistantConfig(
              erc725UAP,
              upContract,
              assistantAddress,
              typeId,
              executionOrder,
              screenerAddresses,
              screenerConfigData,
              typeState.useANDLogic,
              addressListNames
            );
            
            allKeys.push(...screenerKeys);
            allValues.push(...screenerValues);
          }
        } else if (originalTypeState && originalTypeState.enableScreeners && originalTypeState.selectedScreeners.length > 0) {
          // Screeners were previously enabled but now disabled - remove them
          const { keys: removeScreenerKeys, values: removeScreenerValues } = await removeScreenerAssistantConfig(
            erc725UAP,
            upContract,
            assistantAddress,
            typeId,
            executionOrder
          );
          
          allKeys.push(...removeScreenerKeys);
          allValues.push(...removeScreenerValues);
        }
      }

      // Remove from types that are no longer selected
      const previouslyConfiguredTypes = Object.keys(executionOrders);
      const typesToRemove = previouslyConfiguredTypes.filter(
        typeId => !selectedConfigTypes.includes(typeId)
      );

      if (typesToRemove.length > 0) {
        const { keys: removeKeys, values: removeValues } = await removeExecutiveAssistantConfig(
          erc725UAP,
          upContract,
          assistantAddress,
          typesToRemove
        );
        
        allKeys.push(...removeKeys);
        allValues.push(...removeValues);
      }

      // Execute all updates in a single batch transaction
      if (allKeys.length > 0) {
        const tx = await upContract.setDataBatch(allKeys, allValues);
        await tx.wait();
      }

      setIsUPSubscribedToAssistant(selectedConfigTypes.length > 0);

      // Refetch all assistants after saving
      await fetchAllAssistantsForTypes(selectedConfigTypes);

      // Reload screener configurations to update status from "Pending" to "Active"
      // We need to reload for all types that were previously configured, not just currently selected
      const allTypesToReload = Array.from(new Set([...selectedConfigTypes, ...Object.keys(executionOrders)]));
      const { executionOrders: newExecutionOrders } = await fetchAssistantConfigNew({
        upAddress: address!,
        assistantAddress,
        supportedTransactionTypes: assistantSupportedTransactionTypes,
        configParams,
        signer,
      });
      
      if (allTypesToReload.length > 0) {
        await loadScreenerConfigurations(allTypesToReload, signer, newExecutionOrders);
      }
      
      // Clear screener state for types that are no longer configured
      const typesToClear = Object.keys(screenerStateByType).filter(
        typeId => !selectedConfigTypes.includes(typeId)
      );
      
      if (typesToClear.length > 0) {
        setScreenerStateByType(prev => {
          const updated = { ...prev };
          typesToClear.forEach(typeId => {
            delete updated[typeId];
          });
          return updated;
        });
        
        setOriginalScreenerStateByType(prev => {
          const updated = { ...prev };
          typesToClear.forEach(typeId => {
            delete updated[typeId];
          });
          return updated;
        });
      }
      
      setExecutionOrders(newExecutionOrders);

      toast({
        title: 'Success',
        description: 'Assistant settings saved successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error setting configuration', err);
      if (!err.message.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error setting configuration: ${err.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // --------------------------------------------------------------------------
  // Deactivate assistant using new UAP format
  // --------------------------------------------------------------------------
  const handleDeactivateAssistant = async () => {
    if (!address) {
      toast({
        title: 'Not connected',
        description: 'Please connect your wallet first.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsProcessingTransaction(true);
      const signer = await getSigner();
      const upContract = LSP0ERC725Account__factory.connect(address, signer);
      const erc725UAP = createUAPERC725Instance(address, signer.provider);

      // Remove assistant from all configured types
      const typesToRemove = Object.keys(executionOrders);
      const { keys, values } = await removeExecutiveAssistantConfig(
        erc725UAP,
        upContract,
        assistantAddress,
        typesToRemove
      );

      if (keys.length > 0) {
        const tx = await upContract.setDataBatch(keys, values);
        await tx.wait();
      }

      setSelectedConfigTypes([]);
      setExecutionOrders({});
      setIsUPSubscribedToAssistant(false);

      toast({
        title: 'Success',
        description: 'Successfully removed this Assistant from all types!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error unsubscribing this assistant', err);
      if (!err.message.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error unsubscribing assistant: ${err.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Flex alignItems="center" gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          Assistant Instructions
        </Text>
        {(() => {
          const hasChanges = hasPendingChanges();
          const wasEverSaved = Object.keys(executionOrders).length > 0; // Assistant was previously configured
          
          if (isUPSubscribedToAssistant) {
            // Assistant is currently active
            if (hasChanges) {
              return <Badge colorScheme="orange">UNSAVED CHANGES</Badge>;
            } else {
              return <Badge colorScheme="green">ASSISTANT IS ACTIVE</Badge>;
            }
          } else {
            // Assistant is not currently active
            if (hasChanges) {
              // Has changes - could be new assistant or modifications to deactivated one
              if (wasEverSaved) {
                return <Badge colorScheme="orange">UNSAVED CHANGES</Badge>;
              } else {
                return <Badge colorScheme="orange">PENDING ACTIVATION</Badge>;
              }
            } else {
              // No changes
              if (wasEverSaved) {
                return <Badge colorScheme="gray">DEACTIVATED</Badge>;
              } else {
                return <Badge colorScheme="yellow">NOT CONFIGURED</Badge>;
              }
            }
          }
        })()}
      </Flex>
      {error && (
        <Text color="red" fontSize="sm">
          {error}
        </Text>
      )}
      <Flex gap={4} flexDirection="column">
        <Flex flexDirection="row" gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            Select the transaction types that you will activate this assistant for:
          </Text>
          <CheckboxGroup
            colorScheme="orange"
            value={selectedConfigTypes}
            onChange={(values: string[]) => setSelectedConfigTypes(values)}
          >
            <VStack
              align="stretch"
              border="1px solid var(--chakra-colors-uap-grey)"
              borderRadius="xl"
              py={2}
              px={7}
            >
              {Object.entries(transactionTypeMap)
                .filter(([_, { id }]) =>
                  assistantSupportedTransactionTypes.includes(id)
                )
                .map(([key, { id, label, typeName, icon, iconPath }]) => (
                  <Checkbox key={key} value={id}>
                    <VStack align="start" spacing={1}>
                      <TransactionTypeBlock
                        label={label}
                        typeName={typeName}
                        icon={icon}
                        iconPath={iconPath}
                      />
                      <HStack spacing={2}>
                        {(executionOrders[id] !== undefined || predictedExecutionOrders[id] !== undefined) && (
                          <Text fontSize="xs" color="orange.500" fontWeight="semibold">
                            Execution Order: {
                              executionOrders[id] !== undefined 
                                ? executionOrders[id] + 1 
                                : predictedExecutionOrders[id] + 1
                            }
                            {executionOrders[id] === undefined && predictedExecutionOrders[id] !== undefined && (
                              <Text as="span" fontSize="xs" color="orange.500" ml={1}>
                                (pending activation)
                              </Text>
                            )}
                          </Text>
                        )}
                        {allAssistantsForTypes[id] && allAssistantsForTypes[id].length > 1 && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="orange"
                            onClick={() => handleReorderClick(id)}
                            fontSize="xs"
                            px={2}
                            minW="auto"
                          >
                            Reorder ({allAssistantsForTypes[id].length})
                          </Button>
                        )}
                      </HStack>
                    </VStack>
                  </Checkbox>
                ))}
            </VStack>
          </CheckboxGroup>
        </Flex>

        {/* Transaction Screening Sections - One per selected transaction type */}
        {selectedConfigTypes.map((typeId) => {
          const typeState = getScreenerStateForType(typeId);
          const originalTypeState = originalScreenerStateByType[typeId];
          
          return (
            <TransactionScreeningSection
              key={typeId}
              selectedConfigTypes={[typeId]} // Pass only this single type
              enableScreeners={typeState.enableScreeners}
              selectedScreeners={typeState.selectedScreeners}
              screenerConfigs={typeState.screenerConfigs}
              originalScreenerConfigs={originalTypeState?.screenerConfigs}
              useANDLogic={typeState.useANDLogic}
              currentNetworkId={currentNetworkId}
              onEnableScreenersChange={(enabled) => {
                updateScreenerStateForType(typeId, { 
                  enableScreeners: enabled,
                  ...(enabled ? {} : { selectedScreeners: [], screenerConfigs: {} })
                });
              }}
              onAddScreener={(instanceId, screener) => {
                // Initialize default config for the screener instance
                const defaultConfig: any = {};
                screener.configParams.forEach((param: any) => {
                  if (param.defaultValue) {
                    defaultConfig[param.name] = param.defaultValue === 'true' ? true : param.defaultValue === 'false' ? false : param.defaultValue;
                  }
                });
                
                updateScreenerStateForType(typeId, {
                  selectedScreeners: [...typeState.selectedScreeners, instanceId],
                  screenerConfigs: {
                    ...typeState.screenerConfigs,
                    [instanceId]: defaultConfig
                  }
                });
              }}
              onRemoveScreener={(instanceId) => {
                const newConfigs = { ...typeState.screenerConfigs };
                delete newConfigs[instanceId];
                
                updateScreenerStateForType(typeId, {
                  selectedScreeners: typeState.selectedScreeners.filter(id => id !== instanceId),
                  screenerConfigs: newConfigs
                });
              }}
              onScreenerConfigChange={(instanceId, config) => {
                updateScreenerStateForType(typeId, {
                  screenerConfigs: {
                    ...typeState.screenerConfigs,
                    [instanceId]: config
                  }
                });
              }}
              onLogicChange={(useAND) => {
                updateScreenerStateForType(typeId, { useANDLogic: useAND });
              }}
            />
          );
        })}

        <AssistantConfigurationSection
          selectedConfigTypes={selectedConfigTypes}
          configParams={configParams}
          fieldValues={fieldValues}
          assistantAddress={assistantAddress}
          currentNetworkId={currentNetworkId}
          onFieldChange={(fieldName, value) => {
            setFieldValues({
              ...fieldValues,
              [fieldName]: value,
            });
          }}
        />

        {/* Error message right above save buttons */}
        {error && (
          <Box
            p={4}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            mb={4}
          >
            <Text color="red.600" fontSize="sm" fontWeight="medium">
              {error}
            </Text>
          </Box>
        )}

      <Flex gap={2}>
        <Button
          size="sm"
          variant="outline"
          colorScheme="orange"
          onClick={handleDeactivateAssistant}
          isLoading={isProcessingTransaction}
          isDisabled={isProcessingTransaction || !isUPSubscribedToAssistant}
        >
          Deactivate Assistant
        </Button>
        <Button
          size="sm"
          bg="orange.500"
          color="white"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          onClick={handleSaveAssistantConfig}
          isLoading={isProcessingTransaction}
          isDisabled={isProcessingTransaction || !hasPendingChanges()}
        >
          Save & Activate Assistant
        </Button>
      </Flex>
      </Flex>
      
      {selectedTypeForReorder && allAssistantsForTypes[selectedTypeForReorder.typeId] && (
        <AssistantReorderModal
          isOpen={isReorderOpen}
          onClose={() => {
            onReorderClose();
            setSelectedTypeForReorder(null);
          }}
          typeId={selectedTypeForReorder.typeId}
          typeName={selectedTypeForReorder.typeName}
          assistants={allAssistantsForTypes[selectedTypeForReorder.typeId]}
          networkId={currentNetworkId}
          onReorderComplete={handleReorderComplete}
        />
      )}
    </Flex>
  );
};

export default SetupAssistant;