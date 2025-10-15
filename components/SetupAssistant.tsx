'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Badge,
  Button,
  Flex,
  Text,
  useToast,
  VStack,
  HStack,
  useDisclosure,
  Box,
  Divider,
} from '@chakra-ui/react';
import TransactionTypeBlock, {
  transactionTypeMap,
} from './TransactionTypeBlock';
import TransactionTypeSelector from './TransactionTypeSelector';
import UnifiedTransactionTypePanel from './UnifiedTransactionTypePanel';
import { AbiCoder, BrowserProvider } from 'ethers';
import {
  createUAPERC725Instance,
  setExecutiveAssistantConfigWithScreenerMigration,
  fetchExecutiveAssistantConfig,
  removeExecutiveAssistantConfig,
  setScreenerAssistantConfig,
  fetchScreenerAssistantConfig,
  removeScreenerAssistantConfig,
  setAddressList,
  configureExecutiveAssistantWithUnifiedSystem,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { ExecutiveAssistant } from '@/constants/CustomTypes';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import AssistantReorderModal from './AssistantReorderModal';
import TransactionScreeningSection from './TransactionScreeningSection';
import AssistantConfigurationSection from './AssistantConfigurationSection';

// Import the new refactored components
import { useAssistantConfiguration } from '@/hooks/useAssistantConfiguration';
import { useScreenerManagement } from '@/hooks/useScreenerManagement';
import AssistantFormFields from './AssistantFormFields';
import ExecutionOrderDisplay from './ExecutionOrderDisplay';
import SaveActionsPanel from './SaveActionsPanel';

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
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData } = useProfile();
  const address = profileDetailsData?.upWallet;
  const currentNetworkId = networkId || (profileDetailsData as any)?.networkId;

  // Processing state
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reorder modal state
  const [selectedTypeForReorder, setSelectedTypeForReorder] = useState<{
    typeId: string;
    typeName: string;
  } | null>(null);
  const { isOpen: isReorderOpen, onOpen: onReorderOpen, onClose: onReorderClose } = useDisclosure();

  // Use the new custom hooks
  const assistantConfig = useAssistantConfiguration({
    assistantAddress,
    supportedTransactionTypes: assistantSupportedTransactionTypes,
    configParams,
    upAddress: address,
    currentNetworkId,
  });

  const screenerManagement = useScreenerManagement();

  // Debounced field update to fix performance issues (disabled in test environment)
  const debouncedFieldUpdate = useMemo(() => {
    const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof global !== 'undefined' && global.process?.env?.VITEST;
    
    if (isTestEnvironment) {
      // During tests, update immediately without debouncing
      return (fieldName: string, value: string) => {
        assistantConfig.setFieldValues({
          ...assistantConfig.fieldValues,
          [fieldName]: value,
        });
      };
    }
    
    // Production debouncing
    let timeoutId: NodeJS.Timeout;
    return (fieldName: string, value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        assistantConfig.setFieldValues({
          ...assistantConfig.fieldValues,
          [fieldName]: value,
        });
      }, 150); // 150ms debounce
    };
  }, [assistantConfig.setFieldValues, assistantConfig.fieldValues]);

  // Helper functions
  const setErrorWithToast = useCallback((message: string) => {
    setError(message);
    toast({
      title: 'Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // Combined pending changes check (assistant changes + screener changes)
  const hasPendingChanges = useCallback(() => {
    // Check assistant configuration changes
    const hasAssistantChanges = assistantConfig.hasPendingChanges();
    if (hasAssistantChanges) return true;

    // Check screener changes for all selected types
    const hasScreenerChanges = assistantConfig.selectedConfigTypes.some(typeId => 
      screenerManagement.hasScreenerChanges(typeId)
    );
    
    return hasScreenerChanges;
  }, [assistantConfig, screenerManagement, assistantConfig.selectedConfigTypes]);

  const getSigner = useCallback(async () => {
    if (!window.lukso || !address) {
      throw new Error('No wallet/address found!');
    }
    const provider = new BrowserProvider(window.lukso);
    return provider.getSigner(address);
  }, [address]);

  // Load configuration on mount and when dependencies change
  useEffect(() => {
    if (address) {
      assistantConfig.loadConfiguration();
    }
  }, [address, assistantAddress, assistantConfig.loadConfiguration]);

  // Load screener configuration when execution orders change
  useEffect(() => {
    if (address && Object.keys(assistantConfig.executionOrders).length > 0) {
      screenerManagement.loadScreenerConfiguration(
        assistantAddress,
        assistantConfig.executionOrders,
        address,
        currentNetworkId || 42
      );
    }
  }, [address, assistantAddress, assistantConfig.executionOrders, currentNetworkId, screenerManagement.loadScreenerConfiguration]);

  // Save configuration handler
  const handleSaveAssistantConfig = useCallback(async () => {
    setError('');
    if (!address) {
      setErrorWithToast('Please connect your wallet first.');
      return;
    }

    if (assistantConfig.selectedConfigTypes.length === 0) {
      setErrorWithToast('Please select at least one transaction type.');
      return;
    }

    // Validate fields
    for (const param of configParams) {
      const value = assistantConfig.fieldValues[param.name];
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
          `Invalid ${param.name}. ${param.description} must be valid.`
        );
        return;
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
      const values = configParams.map(param => {
        const value = assistantConfig.fieldValues[param.name];
        return param.type.startsWith('uint') ? BigInt(value) : value;
      });
      const assistantConfigData = abiCoder.encode(types, values);

      const allKeys: string[] = [];
      const allValues: string[] = [];

      // Handle type additions/updates using the unified system
      for (const typeId of assistantConfig.selectedConfigTypes) {
        const typeState = screenerManagement.getScreenerState(typeId);
        
        const configResult = await configureExecutiveAssistantWithUnifiedSystem(
          erc725UAP,
          upContract,
          typeId,
          assistantAddress,
          assistantConfigData,
          {
            enableScreeners: typeState.enableScreeners,
            selectedScreeners: typeState.selectedScreeners,
            screenerConfigs: typeState.screenerConfigs,
            useANDLogic: typeState.useANDLogic
          },
          currentNetworkId || 42,
          supportedNetworks
        );
        
        if (!configResult) {
          console.error(`configureExecutiveAssistantWithUnifiedSystem returned undefined for type ${typeId}`);
          continue; // Skip this type and continue with others
        }
        
        const { keys, values } = configResult;
        
        allKeys.push(...keys);
        allValues.push(...values);
      }

      // Remove from types that are no longer selected
      const currentlyConfiguredTypes = Object.keys(assistantConfig.executionOrders);
      const typesToRemove = currentlyConfiguredTypes.filter(
        typeId => !assistantConfig.selectedConfigTypes.includes(typeId)
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

      // Execute the transaction
      if (allKeys.length > 0) {
        const tx = await upContract.setDataBatch(allKeys, allValues);
        await tx.wait();
      }

      // Success - update state and reload configuration
      toast({
        title: 'Success',
        description: 'Assistant configuration saved successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reload the assistant configuration first
      const updatedExecutionOrders = await assistantConfig.loadConfiguration(true);
      
      // Then reload screener configuration using the returned execution orders
      if (updatedExecutionOrders) {
        await screenerManagement.loadScreenerConfiguration(
          assistantAddress,
          updatedExecutionOrders,
          address,
          currentNetworkId || 42
        );
      }

    } catch (err: any) {
      console.error('Error saving assistant configuration:', err);
      if (!err.message.includes('user rejected action')) {
        setErrorWithToast(`Error saving configuration: ${err.message}`);
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  }, [address, assistantConfig, screenerManagement, configParams, currentNetworkId, getSigner, setErrorWithToast, toast, assistantAddress]);

  // Handle reorder completion
  const handleReorderComplete = useCallback(async () => {
    const updatedExecutionOrders = await assistantConfig.loadConfiguration(true);
    // Reload screener configuration if we have execution orders
    if (address && updatedExecutionOrders && Object.keys(updatedExecutionOrders).length > 0) {
      await screenerManagement.loadScreenerConfiguration(
        assistantAddress,
        updatedExecutionOrders,
        address,
        currentNetworkId || 42
      );
    }
  }, [assistantConfig.loadConfiguration, address, assistantAddress, currentNetworkId, screenerManagement.loadScreenerConfiguration]);

  // Handle adding/removing transaction types
  const handleAddTransactionType = useCallback((typeId: string) => {
    if (!assistantConfig.selectedConfigTypes.includes(typeId)) {
      assistantConfig.setSelectedConfigTypes([...assistantConfig.selectedConfigTypes, typeId]);
    }
  }, [assistantConfig]);

  const handleRemoveTransactionType = useCallback((typeId: string) => {
    assistantConfig.setSelectedConfigTypes(
      assistantConfig.selectedConfigTypes.filter(id => id !== typeId)
    );
  }, [assistantConfig]);

  // Handle deactivate assistant
  const handleDeactivateAssistant = useCallback(async () => {
    if (!address) {
      setErrorWithToast('Please connect your wallet first.');
      return;
    }

    try {
      setIsProcessingTransaction(true);
      const signer = await getSigner();
      const upContract = LSP0ERC725Account__factory.connect(address, signer);
      const erc725UAP = createUAPERC725Instance(address, signer.provider);

      const typesToRemove = Object.keys(assistantConfig.executionOrders);
      const removeResult = await removeExecutiveAssistantConfig(
        erc725UAP,
        upContract,
        assistantAddress,
        typesToRemove
      );
      
      if (!removeResult) {
        console.error('removeExecutiveAssistantConfig returned undefined');
        throw new Error('Failed to generate removal configuration');
      }
      
      const { keys, values } = removeResult;

      if (keys.length > 0) {
        const tx = await upContract.setDataBatch(keys, values);
        await tx.wait();
      }

      toast({
        title: 'Success',
        description: 'Assistant deactivated successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      const updatedExecutionOrders = await assistantConfig.loadConfiguration(true);
      // Clear screener state since assistant is deactivated
      if (!updatedExecutionOrders || Object.keys(updatedExecutionOrders).length === 0) {
        screenerManagement.setScreenerStateByType({});
        screenerManagement.setOriginalScreenerStateByType({});
      }

    } catch (err: any) {
      console.error('Error deactivating assistant:', err);
      if (!err.message.includes('user rejected action')) {
        setErrorWithToast(`Error deactivating assistant: ${err.message}`);
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  }, [address, assistantConfig, getSigner, setErrorWithToast, toast, assistantAddress]);

  // Render main component (matching exact original structure)
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Flex alignItems="center" gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          Assistant Instructions
        </Text>
        {(() => {
          const hasChanges = hasPendingChanges();
          const wasEverSaved = Object.keys(assistantConfig.executionOrders).length > 0;
          
          if (assistantConfig.isUPSubscribedToAssistant) {
            if (hasChanges) {
              return <Badge colorScheme="orange">UNSAVED CHANGES</Badge>;
            } else {
              return <Badge colorScheme="green">ASSISTANT IS ACTIVE</Badge>;
            }
          } else {
            if (hasChanges) {
              if (wasEverSaved) {
                return <Badge colorScheme="orange">UNSAVED CHANGES</Badge>;
              } else {
                return <Badge colorScheme="orange">PENDING ACTIVATION</Badge>;
              }
            } else {
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
        {/* Transaction Type Selector */}
        <TransactionTypeSelector
          supportedTransactionTypes={assistantSupportedTransactionTypes}
          selectedConfigTypes={assistantConfig.selectedConfigTypes}
          onAddType={handleAddTransactionType}
          onRemoveType={handleRemoveTransactionType}
        />

        {/* Transaction Type Groups (Type + Screeners) */}
        {assistantConfig.selectedConfigTypes.length > 0 && (
          <VStack align="stretch" spacing={4} position="relative" overflow="visible">
            <Text fontSize="md" fontWeight="bold" color="orange.800">
              Active Transaction Types
            </Text>
            {assistantConfig.selectedConfigTypes.map((typeId) => {
              const typeState = screenerManagement.getScreenerState(typeId);
              const originalTypeState = screenerManagement.originalScreenerStateByType[typeId];
              
              return (
                <UnifiedTransactionTypePanel
                  key={typeId}
                  typeId={typeId}
                  onRemove={handleRemoveTransactionType}
                  onReorder={(typeId, typeName) => {
                    setSelectedTypeForReorder({ typeId, typeName });
                    onReorderOpen();
                  }}
                  executionOrder={assistantConfig.executionOrders[typeId]}
                  predictedExecutionOrder={assistantConfig.predictedExecutionOrders[typeId]}
                  allAssistantsCount={assistantConfig.allAssistantsForTypes[typeId]?.length}
                  isConfigured={assistantConfig.executionOrders[typeId] !== undefined}
                  isActive={assistantConfig.isUPSubscribedToAssistant && assistantConfig.executionOrders[typeId] !== undefined}
                  
                  // Screener props
                  enableScreeners={typeState.enableScreeners}
                  selectedScreeners={typeState.selectedScreeners}
                  screenerConfigs={typeState.screenerConfigs}
                  originalScreenerConfigs={originalTypeState?.screenerConfigs}
                  useANDLogic={typeState.useANDLogic}
                  currentNetworkId={currentNetworkId || 42}
                  onEnableScreenersChange={(enabled) => {
                    screenerManagement.updateScreenerForType(typeId, { 
                      enableScreeners: enabled,
                      ...(enabled ? {} : { selectedScreeners: [], screenerConfigs: {} })
                    });
                  }}
                  onAddScreener={(instanceId, screener) => {
                    const defaultConfig: any = {};
                    screener.configParams.forEach((param: any) => {
                      if (param.defaultValue) {
                        defaultConfig[param.name] = param.defaultValue === 'true' ? true : param.defaultValue === 'false' ? false : param.defaultValue;
                      }
                    });
                    
                    screenerManagement.updateScreenerForType(typeId, {
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
                    
                    screenerManagement.updateScreenerForType(typeId, {
                      selectedScreeners: typeState.selectedScreeners.filter(id => id !== instanceId),
                      screenerConfigs: newConfigs
                    });
                  }}
                  onScreenerConfigChange={(instanceId, config) => {
                    screenerManagement.updateScreenerForType(typeId, {
                      screenerConfigs: {
                        ...typeState.screenerConfigs,
                        [instanceId]: config
                      }
                    });
                  }}
                  onLogicChange={(useAND) => {
                    screenerManagement.updateScreenerForType(typeId, { useANDLogic: useAND });
                  }}
                />
              );
            })}
          </VStack>
        )}

        <AssistantConfigurationSection
          selectedConfigTypes={assistantConfig.selectedConfigTypes}
          configParams={configParams}
          fieldValues={assistantConfig.fieldValues}
          assistantAddress={assistantAddress}
          currentNetworkId={currentNetworkId}
          onFieldChange={debouncedFieldUpdate}
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
            isDisabled={isProcessingTransaction || !assistantConfig.isUPSubscribedToAssistant}
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
      
      {selectedTypeForReorder && assistantConfig.allAssistantsForTypes[selectedTypeForReorder.typeId] && (
        <AssistantReorderModal
          isOpen={isReorderOpen}
          onClose={() => {
            onReorderClose();
            setSelectedTypeForReorder(null);
          }}
          typeId={selectedTypeForReorder.typeId}
          typeName={selectedTypeForReorder.typeName}
          assistants={assistantConfig.allAssistantsForTypes[selectedTypeForReorder.typeId]}
          networkId={currentNetworkId}
          onReorderComplete={handleReorderComplete}
        />
      )}
    </Flex>
  );
};

export default SetupAssistant;