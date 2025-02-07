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

type ConfigParam = {
  name: string;
  type: string;
};

type SetupAssistantProps = {
  assistantAddress: string;
  configParams: ConfigParam[];
  supportedTransactionTypes: string[]; // only these types will be rendered
};

const SetupAssistant: React.FC<SetupAssistantProps> = ({
  assistantAddress,
  configParams,
  supportedTransactionTypes,
}) => {
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  // Configuration field values
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    configParams.forEach(param => {
      initial[param.name] = '';
    });
    return initial;
  });

  // Which transaction types currently have this assistant
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );

  // Each transaction-type ID -> array of addresses
  const [typeConfigAddresses, setTypeConfigAddresses] = useState<
    Record<string, string[]>
  >({});

  const [isUpSubscribedToAssistant, setIsUpSubscribedToAssistant] =
    useState<boolean>(false);
  const [isLoadingTrans, setIsLoadingTrans] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const getSigner = async () => {
    if (!walletProvider || !address)
      throw new Error('No wallet/address found!');
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    return provider.getSigner(address);
  };

  const convertAddressToBytes32 = (addr: string): string => {
    return '0x' + '0'.repeat(24) + addr.slice(2);
  };

  // --------------------------------------------------------------------------
  // On Page Load: fetch existing configuration
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;

    const loadExistingConfig = async () => {
      try {
        setIsLoadingTrans(true);
        const signer = await getSigner();
        const upContract = ERC725__factory.connect(address, signer);

        // Get keys for all transaction types
        const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
        const allTypeConfigKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );

        // Assistant's config key
        const assistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          assistantAddress
        );

        // Fetch them all
        const allData = await upContract.getDataBatch([
          ...allTypeConfigKeys,
          assistantConfigKey,
        ]);
        const typeConfigValues = allData.slice(0, allTypeIds.length);
        const assistantConfigValue = allData[allTypeIds.length];

        const abiCoder = new AbiCoder();
        const newlySelectedTx: string[] = [];
        const newTypeConfigAddresses: Record<string, string[]> = {};

        // Decode each transaction type's addresses
        typeConfigValues.forEach((encodedValue, index) => {
          const typeId = allTypeIds[index];
          if (!encodedValue || encodedValue === '0x') {
            newTypeConfigAddresses[typeId] = [];
            return;
          }
          const storedAddresses = customDecodeAddresses(encodedValue);
          newTypeConfigAddresses[typeId] = storedAddresses;

          // If the assistant is in the array, mark this type as selected
          if (
            storedAddresses
              .map(addr => addr.toLowerCase())
              .includes(assistantAddress.toLowerCase())
          ) {
            newlySelectedTx.push(typeId);
          }
        });

        setTypeConfigAddresses(newTypeConfigAddresses);
        setSelectedTransactions(newlySelectedTx);

        // Decode assistant's config if present
        if (assistantConfigValue && assistantConfigValue !== '0x') {
          const types = configParams.map(param => param.type);
          const decoded = abiCoder.decode(types, assistantConfigValue);
          const newFieldValues: Record<string, string> = {};
          configParams.forEach((param, index) => {
            newFieldValues[param.name] = decoded[index].toString();
          });
          setFieldValues(newFieldValues);
          setIsUpSubscribedToAssistant(true);
        } else {
          setIsUpSubscribedToAssistant(false);
        }
      } catch (err) {
        console.error('Failed to load existing config:', err);
      } finally {
        setIsLoadingTrans(false);
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

    // Validate fields
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

      // Update addresses for every transaction type
      const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
      const updatedTypeConfigAddresses = { ...typeConfigAddresses };

      allTypeIds.forEach(typeId => {
        let addresses = [...(updatedTypeConfigAddresses[typeId] || [])];

        if (supportedTransactionTypes.includes(typeId)) {
          const existingIndex = addresses.findIndex(
            a => a.toLowerCase() === assistantAddress.toLowerCase()
          );
          // If user selected it, ensure the assistant is in the array
          if (selectedTransactions.includes(typeId)) {
            if (existingIndex === -1) {
              addresses.unshift(assistantAddress);
            }
          } else {
            // If user un-selected it, remove from the array
            if (existingIndex !== -1) {
              addresses.splice(existingIndex, 1);
            }
          }
        }

        updatedTypeConfigAddresses[typeId] = addresses;

        // Encode or clear
        const typeConfigKey = generateMappingKey('UAPTypeConfig', typeId);
        if (addresses.length === 0) {
          dataKeys.push(typeConfigKey);
          dataValues.push('0x');
        } else {
          dataKeys.push(typeConfigKey);
          dataValues.push(customEncodeAddresses(addresses));
        }
      });

      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const types = configParams.map(param => param.type);
      const values = configParams.map(param => fieldValues[param.name]);
      const settingsValue = abiCoder.encode(types, values);

      dataKeys.push(assistantSettingsKey);
      dataValues.push(settingsValue);

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      setTypeConfigAddresses(updatedTypeConfigAddresses);
      setIsUpSubscribedToAssistant(true);

      toast({
        title: 'Success',
        description: 'Assistant settings saved successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsLoadingTrans(false);
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
  // Unsubscribe *only* this Assistant from all transaction types
  // (Do NOT remove or clear the assistant's UAPExecutiveConfig)
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
      const updatedTypeConfigAddresses = { ...typeConfigAddresses };

      Object.entries(updatedTypeConfigAddresses).forEach(
        ([typeId, addresses]) => {
          const idx = addresses.findIndex(
            a => a.toLowerCase() === assistantAddress.toLowerCase()
          );
          if (idx !== -1) {
            addresses.splice(idx, 1);
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

      // Note: We do *not* remove the assistant's UAPExecutiveConfig here,
      // since we want to preserve settings if they resubscribe later.

      if (dataKeys.length === 0) {
        setIsLoadingTrans(false);
        toast({
          title: 'No Removal Needed',
          description: 'Assistant was not found in any types to remove.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      setTypeConfigAddresses(updatedTypeConfigAddresses);
      setSelectedTransactions([]);
      setIsLoadingTrans(false);

      toast({
        title: 'Success',
        description: 'Successfully removed this Assistant from all types!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      setIsLoadingTrans(false);
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
        true
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
  // Render
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Text fontWeight="bold" fontSize="lg">
        Assistant Instructions
      </Text>

      <Flex gap={4} flexDirection="column">
        {/* Transaction Type Selection */}
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
                .filter(([_, { id }]) => supportedTransactionTypes.includes(id))
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
          <Flex key={param.name} flexDirection="row" gap={4} maxWidth="550px">
            <Text fontWeight="bold" fontSize="sm">
              {param.name} ({param.type}):
            </Text>
            <Input
              placeholder={`Enter ${param.name}`}
              value={fieldValues[param.name] || ''}
              onChange={e =>
                setFieldValues({
                  ...fieldValues,
                  [param.name]: e.target.value,
                })
              }
              onBlur={() => {
                // Auto-convert address => bytes32 if needed
                const val = fieldValues[param.name];
                if (
                  param.type === 'bytes32' &&
                  /^0x[0-9A-Fa-f]{40}$/.test(val)
                ) {
                  setFieldValues({
                    ...fieldValues,
                    [param.name]: convertAddressToBytes32(val),
                  });
                }
              }}
              onPaste={e => {
                // Same auto-conversion on paste
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
          variant="outline"
          colorScheme="orange"
          onClick={handleUnsubscribeAssistant}
          isLoading={isLoadingTrans}
          isDisabled={isLoadingTrans || !isUpSubscribedToAssistant}
        >
          Unsubscribe This Assistant
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
