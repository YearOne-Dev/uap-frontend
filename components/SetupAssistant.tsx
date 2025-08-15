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
} from '@chakra-ui/react';
import TransactionTypeBlock, {
  transactionTypeMap,
} from './TransactionTypeBlock';
import { AbiCoder, BrowserProvider } from 'ethers';
import {
  createUAPERC725Instance,
  setExecutiveAssistantConfig,
  fetchExecutiveAssistantConfig,
  removeExecutiveAssistantConfig,
  generateUAPTypeConfigKey,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { ExecutiveAssistant } from '@/constants/CustomTypes';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import AssistantReorderModal from './AssistantReorderModal';

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
  const [selectedTypeForReorder, setSelectedTypeForReorder] = useState<{
    typeId: string;
    typeName: string;
  } | null>(null);
  const { isOpen: isReorderOpen, onOpen: onReorderOpen, onClose: onReorderClose } = useDisclosure();

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
  ]);

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
    setError('');
    if (!address) {
      setError('Please connect your wallet first.');
      return;
    }

    if (selectedConfigTypes.length === 0) {
      setError('Please select at least one transaction type.');
      return;
    }

    // Validate fields
    for (const param of configParams) {
      const value = fieldValues[param.name];
      if (!value) {
        setError(`Please fill in ${param.description}.`);
        return;
      }
      if (param.type === 'bytes32' && !/^0x[0-9A-Fa-f]{64}$/.test(value)) {
        setError(
          `Invalid ${param.name}. Must be 32-byte hex (0x + 64 characters).`
        );
        return;
      }
      if (param.type.startsWith('uint') && isNaN(Number(value))) {
        setError(`Invalid ${param.name}. Not a valid number.`);
        return;
      }
      if (param.validate && !param.validate(value, address)) {
        setError(
          `Invalid ${param.name} for "${param.description}". ${param.validationMessage ? param.validationMessage : ''}`
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
      const values = configParams.map(param => fieldValues[param.name]);
      const assistantConfigData = abiCoder.encode(types, values);

      const allKeys: string[] = [];
      const allValues: string[] = [];

      // Configure each selected transaction type
      for (let i = 0; i < selectedConfigTypes.length; i++) {
        const typeId = selectedConfigTypes[i];
        
        const { keys, values, executionOrder } = await setExecutiveAssistantConfig(
          erc725UAP,
          upContract,
          assistantAddress,
          typeId,
          assistantConfigData,
          true // Update type config to include this assistant
        );
        
        allKeys.push(...keys);
        allValues.push(...values);
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
        {isUPSubscribedToAssistant ? (
          <Badge colorScheme="green">ASSISTANT IS ACTIVE</Badge>
        ) : (
          <Badge colorScheme="yellow">ASSISTANT IS NOT ACTIVE</Badge>
        )}
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
                        {executionOrders[id] !== undefined && (
                          <Text fontSize="xs" color="orange.500" fontWeight="semibold">
                            Execution Order: {executionOrders[id] + 1}
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
        {configParams.map(param => (
          <Flex
            key={param.name}
            flexDirection="row"
            gap={4}
            maxWidth="550px"
            display={param.hidden ? 'none' : undefined}
          >
            <Text fontWeight="bold" fontSize="sm" w="70%">
              {param.description}
            </Text>
            <Input
              hidden={param.hidden}
              placeholder={param.placeholder}
              value={fieldValues[param.name] || ''}
              onChange={e =>
                setFieldValues({
                  ...fieldValues,
                  [param.name]: e.target.value,
                })
              }
              w="70%"
            />
          </Flex>
        ))}
      </Flex>

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
          isDisabled={isProcessingTransaction}
        >
          Save & Activate Assistant
        </Button>
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