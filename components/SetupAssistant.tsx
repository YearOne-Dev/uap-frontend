import React, { useEffect, useState } from 'react';
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
import { AbiCoder, BrowserProvider, Eip1193Provider } from 'ethers';
import {
  customDecodeAddresses,
  customEncodeAddresses,
  generateMappingKey,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { useNetwork } from '@/contexts/NetworkContext';
import { ExecutiveAssistant } from '@/constants/CustomTypes';

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
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  const [typeConfigAddresses, setTypeConfigAddresses] = useState<
    Record<string, string[]>
  >({});

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const getSigner = async () => {
    if (!walletProvider || !address)
      throw new Error('No wallet/address found!');
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    return provider.getSigner(address);
  };

  // --------------------------------------------------------------------------
  // On Page Load: fetch existing configuration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;
    const loadExistingConfig = async () => {
      try {
        setIsProcessingTransaction(true);
        const signer = await getSigner();
        const upContract = ERC725__factory.connect(address, signer);

        // Build the keys for each supported transaction type.
        const assistantTypesConfigKeys = assistantSupportedTransactionTypes.map(
          id => generateMappingKey('UAPTypeConfig', id)
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
        const typeConfigValues = configData.slice(
          0,
          assistantSupportedTransactionTypes.length
        );
        const assistantConfigValue =
          configData[assistantSupportedTransactionTypes.length];

        const abiCoder = new AbiCoder();
        const previouslySelectedTypes: string[] = [];
        const previouslySavedTypeConfigAddresses: Record<string, string[]> = {};

        // Decode each transaction type's addresses
        typeConfigValues.forEach((encodedValue, index) => {
          const typeId = assistantSupportedTransactionTypes[index];
          if (!encodedValue || encodedValue === '0x') {
            previouslySavedTypeConfigAddresses[typeId] = [];
            return;
          }
          const storedAssistantAddresses = customDecodeAddresses(encodedValue);
          previouslySavedTypeConfigAddresses[typeId] = storedAssistantAddresses;

          // If the assistant is in the array, mark this type as selected
          if (
            storedAssistantAddresses
              .map(addr => addr.toLowerCase())
              .includes(assistantAddress.toLowerCase())
          ) {
            previouslySelectedTypes.push(typeId);
          }
        });

        setTypeConfigAddresses(previouslySavedTypeConfigAddresses);
        setSelectedConfigTypes(previouslySelectedTypes);
        if (previouslySelectedTypes.length > 0) {
          setIsUPSubscribedToAssistant(true);
        }
        // find if the assistant is already configured
        if (assistantConfigValue !== '0x') {
          const types = configParams.map(param => param.type);
          const decoded = abiCoder.decode(types, assistantConfigValue);
          const previouslySavedFieldValues: Record<string, string> = {};
          configParams.forEach((param, index) => {
            previouslySavedFieldValues[param.name] = decoded[index].toString();
          });
          setFieldValues(previouslySavedFieldValues);
        }
      } catch (err) {
        console.error('Failed to load existing config:', err);
      } finally {
        setIsProcessingTransaction(false);
      }
    };

    loadExistingConfig();
  }, [address, assistantAddress, configParams]);

  // --------------------------------------------------------------------------
  // Save configuration
  // --------------------------------------------------------------------------
  const handleSaveAssistantConfig = async () => {
    setError('');
    if (!address) {
      setError('Please connect your wallet first.');
      return;
    }

    // Validate fields
    for (const param of configParams) {
      const value = fieldValues[param.name];
      if (!value) {
        setError(`Please fill in ${param.name}.`);
        return;
      }
      if (param.type === 'bytes32' && !/^0x[0-9A-Fa-f]{64}$/.test(value)) {
        setError(
          `Invalid ${param.name}. Must be 32-byte hex (0x + 64 characters).`
        );
        return;
      }
      if (param.type.startsWith('uint') && isNaN(Number(value))) {
        setError(`Invalid ${param.name}. Bot a valid number.`);
        return;
      }
      // Custom validation: If a validate function is provided, use it.
      if (param.validate && !param.validate(value)) {
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

      const dataKeys: string[] = [];
      const dataValues: string[] = [];
      const abiCoder = new AbiCoder();

      // TODO: refetch type config addresses to ensure we have the latest
      const updatedTypeConfigAddresses = { ...typeConfigAddresses };

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
        // Encode or clear
        const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
        // todo: only write new values if configuration has changed
        if (currentTypeAddresses.length === 0) {
          dataKeys.push(typeConfigKey);
          dataValues.push('0x');
        } else {
          dataKeys.push(typeConfigKey);
          dataValues.push(customEncodeAddresses(currentTypeAddresses));
        }
      });

      // ==== FIELDS ====
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

      setTypeConfigAddresses(updatedTypeConfigAddresses);
      setIsUPSubscribedToAssistant(true);

      toast({
        title: 'Success',
        description: 'Assistant settings saved successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsProcessingTransaction(false);
    } catch (err: any) {
      setIsProcessingTransaction(false);
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

      const dataKeys: string[] = [];
      const dataValues: string[] = [];
      const updatedTypeConfigAddresses = { ...typeConfigAddresses };

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
            // If empty, set value to '0x'
            dataKeys.push(typeConfigKey);
            dataValues.push('0x');
          } else {
            dataKeys.push(typeConfigKey);
            dataValues.push(customEncodeAddresses(addresses));
          }
        }
      );

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      setTypeConfigAddresses(updatedTypeConfigAddresses);
      setSelectedConfigTypes([]);
      setIsProcessingTransaction(false);

      toast({
        title: 'Success',
        description: 'Successfully removed this Assistant from all types!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      setIsProcessingTransaction(false);
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
    }
  };

  // --------------------------------------------------------------------------
  // Determine whether the assistant is considered "active"
  // (Has settings + at least one transaction type subscription)
  // --------------------------------------------------------------------------
  const isAssistantActive =
    isUPSubscribedToAssistant && selectedConfigTypes.length > 0;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Flex alignItems="center" gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          Assistant Instructions
        </Text>
        {isAssistantActive ? (
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
        {/* Transaction Type Selection */}
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
        {/* Dynamically render each configuration field */}
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
