import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
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
          const storedAddress = abiCoder.decode(
            ['address'],
            encodedValue
          )[0] as string;

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
        description: 'Must be 32-byte hex (0x + 64).',
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
        const singleAddressEncoded = abiCoder.encode(
          ['address'],
          [assistantAddress]
        );
        dataValues.push(singleAddressEncoded);
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
    <Box p={4}>
      <Grid templateColumns="1fr 2fr" gap={2} alignItems="start">
        {/* Transaction Types */}
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Select a transaction type that you will engage this assistant for:
          </Text>
        </GridItem>
        <GridItem>
          <CheckboxGroup
            colorScheme="orange"
            value={selectedTransactions}
            onChange={(values: string[]) => setSelectedTransactions(values)}
          >
            <VStack
              align="stretch"
              border="1px solid #E2E8F0"
              borderRadius="10px"
              p={6}
              width="fit-content"
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
        </GridItem>

        {/* Assistant Settings */}
        <GridItem colSpan={2} mt={6}>
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            1. Configure Burnt Pix Refiner Assistant Settings
          </Text>
        </GridItem>

        <GridItem>
          <Text>The id of the burnt pix you want to refine:</Text>
        </GridItem>
        <GridItem>
          <Input
            placeholder="0x1234... (64 chars)"
            value={burntPixId}
            w={80}
            onChange={e => setBurntPixId(e.target.value)}
          />
        </GridItem>

        <GridItem>
          <Text>Iterations:</Text>
        </GridItem>
        <GridItem>
          <Input
            placeholder="e.g. 100"
            value={iters}
            onChange={e => setIters(e.target.value)}
            w={20}
          />
        </GridItem>

        {/* Action Buttons */}
        <GridItem mt={4}>
          {isUpSubscribedToAssistant ? (
            <Button
              size="sm"
              bg="orange.500"
              color="white"
              mr="2"
              _hover={{ bg: 'orange.600' }}
              _active={{ bg: 'orange.700' }}
              onClick={handleUnsubscribeAssistant}
              isLoading={isLoadingTrans}
              isDisabled={isLoadingTrans}
            >
              Unsubscribe Assistant
            </Button>
          ) : null}
          <Button
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleUnsubscribeURD}
            isLoading={isLoadingTrans}
            isDisabled={isLoadingTrans}
          >
            Unsubscribe URD
          </Button>
        </GridItem>
        <GridItem mt={4}>
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
            Save
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SetupAssistant;
