import React, { useEffect, useState } from 'react';
import {
  Box,
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
  toggleUniveralAssistantsSubscribe,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { useNetwork } from '@/contexts/NetworkContext';
import { ExecutiveAssistant } from '@/constants/CustomTypes';

const SetupAssistant: React.FC<ExecutiveAssistant> = ({
  address: assistantAddress,
  configParams,
  supportedTransactionTypes,
}) => {
  // Instead of separate state variables, we hold all configurable fields in one object.
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    configParams.forEach(param => {
      initial[param.name] = param.defaultValue ? param.defaultValue : '';
    });
    return initial;
  });
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [isUpSubscribedToAssistant, setIsUpSubscribedToAssistant] =
    useState<boolean>(false);
  const [isLoadingTrans, setIsLoadingTrans] = useState<boolean>(true);

  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  // Helper: Convert an Ethereum address (42-character hex) to a padded 32-byte hex string.
  const convertAddressToBytes32 = (addr: string): string => {
    // "0x" + 40 hex characters becomes padded to 66 characters (0x + 64 hex)
    return '0x' + '0'.repeat(24) + addr.slice(2);
  };

  // Ethers helper: get the signer.
  const getSigner = async () => {
    if (!walletProvider || !address)
      throw new Error('No wallet/address found!');
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    return provider.getSigner(address);
  };

  // --------------------------------------------------------------------------
  // On Page Load, fetch existing configuration.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;

    const loadExistingConfig = async () => {
      try {
        const signer = await getSigner();
        const upContract = ERC725__factory.connect(address, signer);

        // Build the keys for each transaction type.
        const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
        const allTypeConfigKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );

        // Build the key for the assistant config.
        const assistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          assistantAddress
        );

        // Fetch all keys in one call.
        const allData = await upContract.getDataBatch([
          ...allTypeConfigKeys,
          assistantConfigKey,
        ]);
        const typeConfigValues = allData.slice(0, allTypeIds.length);
        const assistantConfigValue = allData[allTypeIds.length];

        const abiCoder = new AbiCoder();
        const newlySelectedTx: string[] = [];

        // For each transaction type, decode the stored address (using your custom decoder).
        typeConfigValues.forEach((encodedValue, index) => {
          if (!encodedValue || encodedValue === '0x') return;
          const storedAddresses = customDecodeAddresses(encodedValue);
          // (For now we assume there is only one address stored.)
          const storedAddress = storedAddresses[0];
          if (storedAddress.toLowerCase() === assistantAddress.toLowerCase()) {
            newlySelectedTx.push(allTypeIds[index]);
          }
        });

        // If the assistant config exists, decode it using the provided config types.
        if (assistantConfigValue && assistantConfigValue !== '0x') {
          const types = configParams.map(param => param.type);
          const decoded = abiCoder.decode(types, assistantConfigValue);
          const newFieldValues: Record<string, string> = {};
          configParams.forEach((param, index) => {
            // Convert the decoded value to a string (e.g. for BigNumbers).
            newFieldValues[param.name] = decoded[index].toString();
          });
          setFieldValues(newFieldValues);
          setIsUpSubscribedToAssistant(true);
        } else {
          setIsUpSubscribedToAssistant(false);
        }

        setSelectedTransactions(newlySelectedTx);
        setIsLoadingTrans(false);
      } catch (err) {
        setIsLoadingTrans(false);
        console.error('Failed to load existing config:', err);
      }
    };

    loadExistingConfig();
  }, [address, assistantAddress, configParams]);

  // --------------------------------------------------------------------------
  // Save configuration
  // --------------------------------------------------------------------------
  const handleSubmitConfig = async () => {
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

    // Validate that all fields are provided and meet basic type requirements.
    for (const param of configParams) {
      const value = fieldValues[param.name];
      if (!value) {
        toast({
          title: 'Incomplete data',
          description: `Please fill in ${param.name}.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (param.type === 'bytes32' && !/^0x[0-9A-Fa-f]{64}$/.test(value)) {
        toast({
          title: `Invalid ${param.name}`,
          description: 'Must be 32-byte hex (0x + 64 characters).',
          status: 'error',
          duration: null,
          isClosable: true,
        });
        return;
      }
      if (param.type.startsWith('uint') && isNaN(Number(value))) {
        toast({
          title: `Invalid ${param.name}`,
          description: 'Please enter a valid number.',
          status: 'error',
          duration: null,
          isClosable: true,
        });
        return;
      }
    }

    try {
      setIsLoadingTrans(true);
      const signer = await getSigner();
      const upContract = ERC725__factory.connect(address, signer);

      const dataKeys: string[] = [];
      const dataValues: string[] = [];
      const abiCoder = new AbiCoder();

      // For each selected transaction type, store the assistant’s address.
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);
        dataValues.push(customEncodeAddresses([assistantAddress]));
      });

      // Build the assistant settings using the generic config.
      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const types = configParams.map(param => param.type);
      const values = configParams.map(param => {
        return fieldValues[param.name];
      });
      const settingsValue = abiCoder.encode(types, values);
      dataKeys.push(assistantSettingsKey);
      dataValues.push(settingsValue);

      // Write all configuration keys in one transaction.
      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Assistant settings saved successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsLoadingTrans(false);
      setIsUpSubscribedToAssistant(true);
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error setting configuration', err);
      toast({
        title: 'Error',
        description: `Error setting configuration: ${err.message}`,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  // --------------------------------------------------------------------------
  // Unsubscribe only this Assistant
  // --------------------------------------------------------------------------
  const handleUnsubscribeAssistant = async () => {
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
      setIsLoadingTrans(true);
      const signer = await getSigner();
      const upContract = ERC725__factory.connect(address, signer);

      const dataKeys: string[] = [];
      const dataValues: string[] = [];

      // Clear each transaction type subscription.
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);
        dataValues.push('0x');
      });

      // Clear the assistant config.
      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      dataKeys.push(assistantSettingsKey);
      dataValues.push('0x');

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Unsubscribed from Assistant!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear the local UI state.
      setSelectedTransactions([]);
      const cleared: Record<string, string> = {};
      configParams.forEach(param => (cleared[param.name] = ''));
      setFieldValues(cleared);
      setIsUpSubscribedToAssistant(false);
      setIsLoadingTrans(false);
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error unsubscribing assistant', err);
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
  // Unsubscribe the entire URD (Universal Assistant Protocol)
  // --------------------------------------------------------------------------
  const handleUnsubscribeURD = async () => {
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
      setIsLoadingTrans(true);
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      await toggleUniveralAssistantsSubscribe(
        provider,
        address,
        network.protocolAddress,
        network.defaultURDUP,
        true // uninstall
      );

      toast({
        title: 'Success',
        description: 'Universal Assistant Protocol uninstalled.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear local states.
      setSelectedTransactions([]);
      const cleared: Record<string, string> = {};
      configParams.forEach(param => (cleared[param.name] = ''));
      setFieldValues(cleared);
      setIsLoadingTrans(false);
      // Refresh the page.
      window.location.reload();
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error uninstalling UAP:', err);
      if (!err.message.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error uninstalling UAP: ${err.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    }
  };

  // --------------------------------------------------------------------------
  // Render the component
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Text fontWeight="bold" fontSize="lg">
        Assistant Instructions
      </Text>
      <Flex gap={4} flexDirection="column">
        <Flex flexDirection="row" gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            Select the transaction types that you will engage this assistant
            for:
          </Text>
          <CheckboxGroup
            colorScheme="orange"
            value={selectedTransactions}
            onChange={(values: string[]) => setSelectedTransactions(values)}
          >
            <VStack
              align="stretch"
              border="1px solid var(--chakra-colors-uap-grey)"
              borderRadius="xl"
              py={2}
              px={7}
            >
              {Object.entries(transactionTypeMap)
                .filter(([key, { id }]) =>
                  supportedTransactionTypes.includes(id)
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
          <Flex key={param.name} flexDirection="row" gap={4} maxWidth="550px">
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
              // For bytes32 fields, convert an Ethereum address (if pasted or on blur)
              onBlur={() => {
                if (
                  param.type === 'bytes32' &&
                  /^0x[0-9A-Fa-f]{40}$/.test(fieldValues[param.name])
                ) {
                  setFieldValues({
                    ...fieldValues,
                    [param.name]: convertAddressToBytes32(
                      fieldValues[param.name]
                    ),
                  });
                }
              }}
              onPaste={e => {
                const pastedData = e.clipboardData.getData('text');
                if (
                  param.type === 'bytes32' &&
                  /^0x[0-9A-Fa-f]{40}$/.test(pastedData)
                ) {
                  e.preventDefault();
                  setFieldValues({
                    ...fieldValues,
                    [param.name]: convertAddressToBytes32(pastedData),
                  });
                }
              }}
              w="70%"
            />
          </Flex>
        ))}
      </Flex>
      <Flex gap={2}>
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={handleUnsubscribeURD}
          isLoading={isLoadingTrans}
          isDisabled={isLoadingTrans}
        >
          Unsubscribe Assistants
        </Button>
        <Button
          size="sm"
          bg="orange.500"
          color="white"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          onClick={handleSubmitConfig}
          isLoading={isLoadingTrans}
          isDisabled={isLoadingTrans}
        >
          Save Assistant Settings
        </Button>
      </Flex>
    </Flex>
  );
};

export default SetupAssistant;
