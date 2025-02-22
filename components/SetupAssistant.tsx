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
} from '@chakra-ui/react';
import TransactionTypeBlock, {
  transactionTypeMap,
} from './TransactionTypeBlock';
import { AbiCoder, BrowserProvider } from 'ethers';
import {
  customDecodeAddresses,
  customEncodeAddresses,
  generateMappingKey,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import { ExecutiveAssistant } from '@/constants/CustomTypes';
import { useProfile } from '@/contexts/ProfileProvider';

/**
 * Fetches configuration data from the on-chain UP contract for a given Assistant.
 * Returns the “type config addresses”, the “selected config types”, a boolean
 * indicating if the Assistant is subscribed, and the field values for the
 * Assistant’s configuration.
 */
interface IFullAssistantConfig {
  typeConfigAddresses: Record<string, string[]>;
  selectedConfigTypes: string[];
  isUPSubscribedToAssistant: boolean;
  fieldValues?: Record<string, string>;
}

async function fetchAssistantConfig({
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
  signer: any; // e.g. ethers.Signer
}): Promise<IFullAssistantConfig> {
  const upContract = ERC725__factory.connect(upAddress, signer);

  // Build the keys for each supported transaction type.
  const assistantTypesConfigKeys = supportedTransactionTypes.map(id =>
    generateMappingKey('UAPTypeConfig', id)
  );

  // Assistant's config key
  const assistantConfigKey = generateMappingKey(
    'UAPExecutiveConfig',
    assistantAddress
  );

  const configData = await upContract.getDataBatch([
    ...assistantTypesConfigKeys,
    assistantConfigKey,
  ]);

  // The first N items in configData will be for type configurations
  const typeConfigValues = configData.slice(
    0,
    supportedTransactionTypes.length
  );
  // The last item is the assistant’s own configuration
  const assistantConfigValue = configData[supportedTransactionTypes.length];

  const abiCoder = new AbiCoder();
  const previouslySelectedTypes: string[] = [];
  const previouslySavedTypeConfigAddresses: Record<string, string[]> = {};

  // Decode each transaction type’s addresses
  typeConfigValues.forEach((encodedValue, index) => {
    const typeId = supportedTransactionTypes[index];
    if (!encodedValue || encodedValue === '0x') {
      previouslySavedTypeConfigAddresses[typeId] = [];
      return;
    }
    const storedAssistantAddresses = customDecodeAddresses(encodedValue);
    previouslySavedTypeConfigAddresses[typeId] = storedAssistantAddresses;

    // If the assistant is in that array, mark this type as selected
    if (
      storedAssistantAddresses
        .map(addr => addr.toLowerCase())
        .includes(assistantAddress.toLowerCase())
    ) {
      previouslySelectedTypes.push(typeId);
    }
  });

  // Determine if the assistant is subscribed to at least one type
  const isUPSubscribedToAssistant = previouslySelectedTypes.length > 0;

  // Decode the assistant’s own config for the custom fields
  let fetchedFieldValues: Record<string, string> | undefined = undefined;
  if (assistantConfigValue !== '0x') {
    fetchedFieldValues = {};
    const types = configParams.map(param => param.type);
    const decoded = abiCoder.decode(types, assistantConfigValue);
    configParams.forEach((param, index) => {
      fetchedFieldValues![param.name] = decoded[index].toString();
    });
  }

  return {
    typeConfigAddresses: previouslySavedTypeConfigAddresses,
    selectedConfigTypes: previouslySelectedTypes,
    isUPSubscribedToAssistant,
    fieldValues: fetchedFieldValues,
  };
}

const SetupAssistant: React.FC<{
  config: ExecutiveAssistant;
}> = ({
  config: {
    address: assistantAddress,
    supportedTransactionTypes: assistantSupportedTransactionTypes,
    configParams,
  },
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    configParams.forEach(param => {
      initial[param.name] = param.defaultValue ? param.defaultValue : '';
    });
    return initial;
  });
  const [selectedConfigTypes, setSelectedConfigTypes] = useState<string[]>([]);
  const [isProcessingTransaction, setIsProcessingTransaction] =
    useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isUPSubscribedToAssistant, setIsUPSubscribedToAssistant] =
    useState<boolean>(false);

  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, isConnected } = useProfile();
  const address = profileDetailsData?.upWallet;

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
  // On Page Load: fetch existing configuration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;

    const loadExistingConfig = async () => {
      try {
        setIsProcessingTransaction(true);
        const signer = await getSigner();

        const { selectedConfigTypes, isUPSubscribedToAssistant, fieldValues } =
          await fetchAssistantConfig({
            upAddress: address,
            assistantAddress,
            supportedTransactionTypes: assistantSupportedTransactionTypes,
            configParams,
            signer,
          });

        setSelectedConfigTypes(selectedConfigTypes);
        setIsUPSubscribedToAssistant(isUPSubscribedToAssistant);
        if (fieldValues) {
          setFieldValues(fieldValues);
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
  ]);

  // --------------------------------------------------------------------------
  // Save configuration
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
      const upContract = ERC725__factory.connect(address, signer);

      const { typeConfigAddresses: fetchedTypeConfigAddresses } =
        await fetchAssistantConfig({
          upAddress: address,
          assistantAddress,
          supportedTransactionTypes: assistantSupportedTransactionTypes,
          configParams,
          signer,
        });

      const updatedTypeConfigAddresses = { ...fetchedTypeConfigAddresses };

      const dataKeys: string[] = [];
      const dataValues: string[] = [];
      const abiCoder = new AbiCoder();

      // ==== TYPES ====
      assistantSupportedTransactionTypes.forEach(typeId => {
        let currentTypeAddresses = [
          ...(updatedTypeConfigAddresses[typeId] || []),
        ];
        const currentAssistantIndex = currentTypeAddresses.findIndex(
          a => a.toLowerCase() === assistantAddress.toLowerCase()
        );
        if (selectedConfigTypes.includes(typeId)) {
          if (currentAssistantIndex === -1) {
            currentTypeAddresses.push(assistantAddress);
          }
        } else {
          if (currentAssistantIndex !== -1) {
            currentTypeAddresses.splice(currentAssistantIndex, 1);
          }
        }

        updatedTypeConfigAddresses[typeId] = currentTypeAddresses;

        const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
        if (currentTypeAddresses.length === 0) {
          dataKeys.push(typeConfigKey);
          dataValues.push('0x');
        } else {
          dataKeys.push(typeConfigKey);
          dataValues.push(customEncodeAddresses(currentTypeAddresses));
        }
      });

      const assistantConfigKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const types = configParams.map(param => param.type);
      const values = configParams.map(param => fieldValues[param.name]);
      const assistantConfigValue = abiCoder.encode(types, values);
      dataKeys.push(assistantConfigKey);
      dataValues.push(assistantConfigValue);

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();
      setIsUPSubscribedToAssistant(true);

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
      const upContract = ERC725__factory.connect(address, signer);

      const { typeConfigAddresses: fetchedTypeConfigAddresses } =
        await fetchAssistantConfig({
          upAddress: address,
          assistantAddress,
          supportedTransactionTypes: assistantSupportedTransactionTypes,
          configParams,
          signer,
        });

      const updatedTypeConfigAddresses = { ...fetchedTypeConfigAddresses };

      const dataKeys: string[] = [];
      const dataValues: string[] = [];

      Object.entries(updatedTypeConfigAddresses).forEach(
        ([typeId, addresses]) => {
          const currentAssistantIndex = addresses.findIndex(
            a => a.toLowerCase() === assistantAddress.toLowerCase()
          );
          if (currentAssistantIndex !== -1) {
            addresses.splice(currentAssistantIndex, 1);
          }

          const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
          if (addresses.length === 0) {
            dataKeys.push(typeConfigKey);
            dataValues.push('0x');
          } else {
            dataKeys.push(typeConfigKey);
            dataValues.push(customEncodeAddresses(addresses));
          }
        }
      );

      const assistantConfigKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      dataKeys.push(assistantConfigKey);
      dataValues.push('0x');

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();
      setSelectedConfigTypes([]);
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
            Select the transaction types that you will activate this assistant
            for:
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
                    <TransactionTypeBlock
                      label={label}
                      typeName={typeName}
                      icon={icon}
                      iconPath={iconPath}
                    />
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
    </Flex>
  );
};

export default SetupAssistant;
