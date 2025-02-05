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
  generateMappingKey,
  toggleUniveralAssistantsSubscribe,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { useNetwork } from '@/contexts/NetworkContext';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

type SetupAssistantProps = {
  assistantAddress: string;
};

const SetupAssistant: React.FC<SetupAssistantProps> = ({
  assistantAddress,
}) => {
  const DONATION_PERCENTAGE = 1;
  // This is the donation assistant address used to build the key.
  // (It may be different from the value stored on-chain.)
  const donationAssistantAddress = '0x51abDe764f6ccA1beAB04e9c864b95d28Bb92116';

  const [burntPixId, setBurntPixId] = useState<string>('');
  const [iters, setIters] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [isUpSubscribedToAssistant, setIsUpSubscribedToAssistant] =
    useState<boolean>(false);
  const [isLoadingTrans, setIsLoadingTrans] = useState<boolean>(true);
  // State to control the donation checkbox value
  const [isSaveChecked, setIsSaveChecked] = useState<boolean>(false);
  //if true, the donation checkbox is disabled (because a donation config exists).
  const [donationCheckboxDisabled, setDonationCheckboxDisabled] =
    useState<boolean>(false);

  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  // --------------------------------------------------------------------------
  // Ethers helper: get the signer.
  // --------------------------------------------------------------------------
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
        const abiCoder = new AbiCoder();

        // Build an array of transaction type IDs and corresponding keys for this assistant.
        const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
        const allTypeConfigKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );

        // Build the burn‑pix assistant config key.
        const assistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          assistantAddress
        );

        // Fetch all keys in one batch call.
        const allData = await upContract.getDataBatch([
          ...allTypeConfigKeys,
          assistantConfigKey,
        ]);
        // The first N entries are the type config values; the last one is the assistant config.
        const typeConfigValues = allData.slice(0, allTypeIds.length);
        const assistantConfigValue = allData[allTypeIds.length];

        const newlySelectedTx: string[] = [];

        // Decode each transaction type (each stored as a single address).
        typeConfigValues.forEach((encodedValue, index) => {
          if (!encodedValue || encodedValue === '0x') return;
          const storedAddress = abiCoder.decode(
            ['address'],
            encodedValue
          )[0] as string;
          if (storedAddress.toLowerCase() === assistantAddress.toLowerCase()) {
            newlySelectedTx.push(allTypeIds[index]);
          }
        });

        // Determine if the burn‑pix assistant is configured.
        const burnpixConfigured =
          assistantConfigValue && assistantConfigValue !== '0x';
        if (burnpixConfigured) {
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

        // Update state with discovered transaction subscriptions.
        setSelectedTransactions(newlySelectedTx);

        // --- Donation Assistant Configuration Check ---
        // Build the donation assistant config key.
        const donationAssistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          donationAssistantAddress
        );
        const donationAssistantConfigValue = await upContract.getData(
          donationAssistantConfigKey
        );

        if (
          donationAssistantConfigValue &&
          donationAssistantConfigValue !== '0x'
        ) {
          // Donation assistant is configured.
          setDonationCheckboxDisabled(true);
          setIsSaveChecked(true); // The checkbox is checked (and disabled) when donation config exists.
        } else {
          // Donation assistant not configured.
          setDonationCheckboxDisabled(false);
          // If no burn‑pix assistant is configured, default the donation checkbox to true;
          // otherwise (if burnpix is configured) default it to false.
          if (!burnpixConfigured) {
            setIsSaveChecked(true);
          } else {
            setIsSaveChecked(false);
          }
        }

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
      const abiCoder = new AbiCoder();

      const dataKeys: string[] = [];
      const dataValues: string[] = [];

      // Save the burn‑pix assistant configuration for each selected transaction type.
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);
        const singleAddressEncoded = abiCoder.encode(
          ['address'],
          [donationAssistantAddress] // needs the 2 assistants
        );
        dataValues.push(singleAddressEncoded);
      });

      // Save the burn‑pix assistant's settings (collectionAddr, burntPixId, iters).
      const assistantSettingsKey = generateMappingKey(
        'UAPExecutiveConfig',
        assistantAddress
      );
      const settingsValue = abiCoder.encode(
        ['address', 'bytes32', 'uint256'],
        [network.burntPixCollectionAddress, burntPixId, Number(iters)]
      );
      // dataKeys.push(assistantSettingsKey);
      // dataValues.push(settingsValue);

      // Save Donation Assistant configuration only if the donation checkbox is not disabled
      // (i.e. donation assistant is not already configured) and the checkbox is checked.
      if (
        !donationCheckboxDisabled &&
        selectedTransactions.includes(LSP1_TYPE_IDS.LSP0ValueReceived) &&
        isSaveChecked
      ) {
        const donationAssistantConfigKey = generateMappingKey(
          'UAPExecutiveConfig',
          donationAssistantAddress
        );
        const destinationAddress = '0x9b071Fe3d22EAd27E2CDFA1Afec7EAa3c3F32009';
        const donationAssistantSettingsValue = abiCoder.encode(
          ['address', 'uint256'],
          [destinationAddress, DONATION_PERCENTAGE]
        );
        dataKeys.push(donationAssistantConfigKey);
        dataValues.push(donationAssistantSettingsValue);
      }
      // Write all configurations in one transaction.
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

      // Clear each subscribed transaction type key.
      selectedTransactions.forEach(txTypeId => {
        const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        dataKeys.push(typeConfigKey);
        dataValues.push('0x');
      });

      // Also clear the burn‑pix assistant config.
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

      // Clear local UI state and reset donation checkbox.
      setSelectedTransactions([]);
      setBurntPixId('');
      setIters('');
      setIsUpSubscribedToAssistant(false);
      setIsSaveChecked(false);
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
      // (If needed, add additional logic to unsubscribe the Donation Assistant here.)
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

      // Clear local states and refresh.
      setSelectedTransactions([]);
      setBurntPixId('');
      setIters('');
      setIsLoadingTrans(false);
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

  // Unsubscribe only the Donation Assistant
  const handleUnsubscribeDonationAssistant = async () => {
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

      // Build the donation assistant config key.
      const donationAssistantConfigKey = generateMappingKey(
        'UAPExecutiveConfig',
        donationAssistantAddress
      );

      // Clear the donation assistant configuration by setting its value to "0x"
      const tx = await upContract.setDataBatch(
        [donationAssistantConfigKey],
        ['0x']
      );
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Unsubscribed from Donation Assistant!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset donation assistant state.
      setDonationCheckboxDisabled(false);
      // Optionally, reset the checkbox value to your desired default.
      setIsSaveChecked(false);
      setIsLoadingTrans(false);
    } catch (err: any) {
      setIsLoadingTrans(false);
      console.error('Error unsubscribing donation assistant', err);
      toast({
        title: 'Error',
        description: `Error unsubscribing donation assistant: ${err.message}`,
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

        {/* Donation Checkbox (rendered only if the donation transaction type is selected) */}
        {selectedTransactions.includes(LSP1_TYPE_IDS.LSP0ValueReceived) && (
          <GridItem colSpan={2} mt={4}>
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              2. Configure Donation Assistant Settings
            </Text>
            <Flex align="center">
              Donate 1% of the transaction value to the Year One Team
              <Checkbox
                isChecked={isSaveChecked}
                onChange={() => setIsSaveChecked(!isSaveChecked)}
                ml="10px"
                isDisabled={donationCheckboxDisabled}
              />
              {donationCheckboxDisabled && (
                <Text ml="10px" color="gray.600">
                  (Already Configured, go to the Donation Assistant to edit it.)
                </Text>
              )}
            </Flex>
          </GridItem>
        )}

        {/* Action Buttons */}
        <GridItem mt={4}>
          {isUpSubscribedToAssistant ? (
            <>
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
              {donationCheckboxDisabled && (
                <Button
                  size="sm"
                  bg="orange.500"
                  color="white"
                  mr="2"
                  _hover={{ bg: 'orange.600' }}
                  _active={{ bg: 'orange.700' }}
                  onClick={handleUnsubscribeDonationAssistant}
                  isLoading={isLoadingTrans}
                  isDisabled={isLoadingTrans}
                >
                  Unsubscribe Donation Assistant
                </Button>
              )}
            </>
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
