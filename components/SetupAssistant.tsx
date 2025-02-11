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
import { InfoIcon } from '@chakra-ui/icons';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

const SetupAssistant: React.FC<{
  config: ExecutiveAssistant;
}> = ({
  config: {
    address: assistantAddress,
    supportedTransactionTypes,
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
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [isLoadingTrans, setIsLoadingTrans] = useState<boolean>(true);
  const [isUpSubscribedToAssistant, setIsUpSubscribedToAssistant] =
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

        // Build the keys for each transaction type.
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
        // find if the assistant is already configured
        Object.values(newTypeConfigAddresses).forEach(addresses => {
          if (
            addresses
              .map(addr => addr.toLowerCase())
              .includes(assistantAddress.toLowerCase())
          ) {
            const types = configParams.map(param => param.type);
            const decoded = abiCoder.decode(types, assistantConfigValue);
            const newFieldValues: Record<string, string> = {};
            configParams.forEach((param, index) => {
              newFieldValues[param.name] = decoded[index].toString();
            });
            setFieldValues(newFieldValues);
            setIsUpSubscribedToAssistant(true);
          }
        });
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
      const feesConfig = network.feesConfig;

      // ==== TYPES ====
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

        // only apply fee assistant if LSP0ValueReceived is selected
        if (
          selectedTransactions.includes(LSP1_TYPE_IDS.LSP0ValueReceived) &&
          typeId === LSP1_TYPE_IDS.LSP0ValueReceived
        ) {
          const feeAssistantIndex = addresses.findIndex(
            a =>
              a.toLowerCase() === feesConfig.feeAssistantAddress.toLowerCase()
          );
          if (feeAssistantIndex === -1) {
            addresses.unshift(feesConfig.feeAssistantAddress);
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
      // ==== FIELDS ====

      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const types = configParams.map(param => param.type);
      const values = configParams.map(param => fieldValues[param.name]);
      const settingsValue = abiCoder.encode(types, values);

      dataKeys.push(assistantSettingsKey);
      dataValues.push(settingsValue);

      // always re-write the fee assistant settings
      if (selectedTransactions.includes(LSP1_TYPE_IDS.LSP0ValueReceived)) {
        const feeAssistantSettingsKey = generateMappingKey(
          'UAPExecutiveConfig',
          feesConfig.feeAssistantAddress
        );
        const feeSettingsValue = abiCoder.encode(
          ['address', 'uint256'],
          [feesConfig.feeDestinationAddress, feesConfig.feeAssistantAmount]
        );
        dataKeys.push(feeAssistantSettingsKey);
        dataValues.push(feeSettingsValue);
      }

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
  // Determine whether the assistant is considered "active"
  // (Has settings + at least one transaction type subscription)
  // --------------------------------------------------------------------------
  const isActive = isUpSubscribedToAssistant && selectedTransactions.length > 0;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection="column" gap={8}>
      <Flex alignItems="center" gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          Assistant Instructions
        </Text>
        {isActive ? (
          <Badge colorScheme="green">ASSISTANT IS ACTIVE</Badge>
        ) : (
          <Badge colorScheme="yellow">ASSISTANT IS NOT ACTIVE</Badge>
        )}
      </Flex>

      <Flex gap={4} flexDirection="column">
        {/* Transaction Type Selection */}
        <Flex flexDirection="row" gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            Select the transaction types that you will activate this assistant
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
              onBlur={() => {
                // Auto-convert address => bytes32 if needed
                const val = fieldValues[param.name];
                if (
                  param.type === 'bytes32' &&
                  /^0x[0-9A-Fa-f]{40}$/.test(val)
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
      <Flex gap="2" alignItems="center">
        <Text fontSize="0.8em" textAlign="center">
          <InfoIcon color="gray.500" mb={'4px'} /> A fee of 0.5% will be applied
          to only LYX transactions when using the UAP protocol.
        </Text>
      </Flex>

      <Flex gap={2}>
        <Button
          size="sm"
          variant="outline"
          colorScheme="orange"
          onClick={handleUnsubscribeAssistant}
          isLoading={isLoadingTrans}
          isDisabled={isLoadingTrans || !isUpSubscribedToAssistant}
        >
          Inactivate Assistant
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
          Save Activation Settings
        </Button>
      </Flex>
    </Flex>
  );
};

export default SetupAssistant;
