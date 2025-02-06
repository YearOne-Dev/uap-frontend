import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Grid,
  GridItem,
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

type SetupAssistantProps = {
  assistantAddress: string;
};

const SetupAssistant: React.FC<SetupAssistantProps> = ({
  assistantAddress,
}) => {
  const [burntPixId, setBurntPixId] = useState<string>('');
  const [iters, setIters] = useState<string>('');
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

  // Helper function to pad an Ethereum address into a 32-byte hex string.
  const convertAddressToBytes32 = (addr: string): string => {
    // addr is expected to be in the format "0x" + 40 hex characters.
    // We pad it on the left with zeros to reach 66 characters total.
    return '0x' + '0'.repeat(24) + addr.slice(2);
  };

  // Ethers helper
  const getSigner = async () => {
    if (!walletProvider || !address)
      throw new Error('No wallet/address found!');
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    return provider.getSigner(address);
  };

  // --------------------------------------------------------------------------
  // On Page Load, Fetch Existing Config
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!address) return;

    const loadExistingConfig = async () => {
      try {
        const signer = await getSigner();
        const upContract = ERC725__factory.connect(address, signer);

        // Build an array of transaction type IDs
        const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
        // Build the data keys for each ID
        const allTypeConfigKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );

        // Build the assistant config key
        const assistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          assistantAddress
        );

        // Fetch them all in one call
        const allData = await upContract.getDataBatch([
          ...allTypeConfigKeys,
          assistantConfigKey,
        ]);
        // The first N are the type config values; the last is assistant config
        const typeConfigValues = allData.slice(0, allTypeIds.length);
        const assistantConfigValue = allData[allTypeIds.length];

        const abiCoder = new AbiCoder();
        const newlySelectedTx: string[] = [];

        // Decode each transaction type: single address
        typeConfigValues.forEach((encodedValue, index) => {
          if (!encodedValue || encodedValue === '0x') {
            return; // no address stored
          }
          // Decode as a single address (32 bytes expected)
          const storedAddresses = customDecodeAddresses(encodedValue);
          // todo: for now it will only have one address
          const storedAddress = storedAddresses[0];

          // If it matches our assistant’s address, we push that txTypeId
          if (storedAddress.toLowerCase() === assistantAddress.toLowerCase()) {
            newlySelectedTx.push(allTypeIds[index]);
          }
        });

        // Decode the assistant config => (collectionAddr, burntPixId, iters)
        if (assistantConfigValue && assistantConfigValue !== '0x') {
          const decoded = abiCoder.decode(
            ['address', 'bytes32', 'uint256'],
            assistantConfigValue
          );
          const pixId = decoded[1] as string;
          const iterationCount = decoded[2] as any;
          setBurntPixId(pixId);
          setIters(iterationCount.toString());
          setIsUpSubscribedToAssistant(true);
        } else {
          setIsUpSubscribedToAssistant(false);
        }

        // Update state with discovered subscriptions
        setSelectedTransactions(newlySelectedTx);
        setIsLoadingTrans(false);
      } catch (err) {
        setIsLoadingTrans(false);
        console.error('Failed to load existing config:', err);
      }
    };

    loadExistingConfig();
  }, [address, assistantAddress]);

  // --------------------------------------------------------------------------
  // Save config
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

    if (!burntPixId || !iters) {
      toast({
        title: 'Incomplete data',
        description: 'Please fill in burntPixId and iterations.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!/^0x[0-9A-Fa-f]{64}$/.test(burntPixId)) {
      toast({
        title: 'Invalid burntPixId',
        description: 'Must be 32-byte hex (0x + 64 characters).',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (isNaN(Number(iters))) {
      toast({
        title: 'Invalid iterations',
        description: 'Please enter a valid number.',
        status: 'error',
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

      const abiCoder = new AbiCoder();

      // For each selected transaction type, store the *single address*
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);

        // Encode as a single address
        dataValues.push(customEncodeAddresses([assistantAddress]));
      });

      // Also encode the assistant’s settings (collectionAddr, burntPixId, iters)
      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const settingsValue = abiCoder.encode(
        ['address', 'bytes32', 'uint256'],
        [network.burntPixCollectionAddress, burntPixId, Number(iters)]
      );
      dataKeys.push(assistantSettingsKey);

      dataValues.push(settingsValue);

      // Write everything in one transaction
      const tx = await upContract.setDataBatch(dataKeys, dataValues);
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Burnt Pix Refiner Assistant settings saved successfully!',
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
        duration: 5000,
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

      // For each currently subscribed type, clear the key with '0x'
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);
        dataValues.push('0x');
      });

      // Also clear the assistant config
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
        description: 'Unsubscribed from Burnt Pix Refiner Assistant!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear local UI state
      setSelectedTransactions([]);
      setBurntPixId('');
      setIters('');
      setIsUpSubscribedToAssistant(false);
      setIsLoadingTrans(false);
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error unsubscribing assistant', err);
      toast({
        title: 'Error',
        description: `Error unsubscribing assistant: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --------------------------------------------------------------------------
  // Unsubscribe the entire UAP
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

      // Clear local states
      setSelectedTransactions([]);
      setBurntPixId('');
      setIters('');
      setIsLoadingTrans(false);
      // refresh page
      window.location.reload();
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error uninstalling UAP:', err);
      toast({
        title: 'Error',
        description: `Error uninstalling UAP: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <Flex p={6} flexDirection={'column'} gap={8}>
      <Text fontWeight="bold" fontSize="lg">
        Assistant Instructions
      </Text>
      <Flex gap={4} flexDirection={'column'}>
        <Flex flexDirection={'row'} gap={4} maxWidth="550px">
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
              {Object.entries(transactionTypeMap).map(
                ([key, { id, label, typeName, icon, iconPath }]) => (
                  <Checkbox key={key} value={id}>
                    <TransactionTypeBlock
                      label={label}
                      typeName={typeName}
                      icon={icon}
                      iconPath={iconPath}
                    />
                  </Checkbox>
                )
              )}
            </VStack>
          </CheckboxGroup>
        </Flex>
        <Flex flexDirection={'row'} gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            BurntPix NFT id you want to refine:
          </Text>
          <Input
            placeholder="Enter NFT id"
            value={burntPixId}
            onChange={e => setBurntPixId(e.target.value)}
            // onBlur: if the input is a 42-character Ethereum address, convert it
            onBlur={() => {
              if (/^0x[0-9A-Fa-f]{40}$/.test(burntPixId)) {
                setBurntPixId(convertAddressToBytes32(burntPixId));
              }
            }}
            // onPaste: automatically convert a pasted Ethereum address
            onPaste={e => {
              const pastedData = e.clipboardData.getData('text');
              if (/^0x[0-9A-Fa-f]{40}$/.test(pastedData)) {
                e.preventDefault(); // Prevent the default paste behavior
                setBurntPixId(convertAddressToBytes32(pastedData));
              }
            }}
            w="70%"
          />
        </Flex>
        <Flex flexDirection={'row'} gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            Number of refinement iterations incoming transactions will
            contribute:
          </Text>
          <Input
            placeholder="e.g. 100"
            value={iters}
            onChange={e => setIters(e.target.value)}
            w="70%"
          />
        </Flex>
      </Flex>
      <Flex gap={2}>
        <Button
          size="sm"
          colorScheme="red"
          variant={'outline'}
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
