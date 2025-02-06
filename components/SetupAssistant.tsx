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
  // useEffect(() => {
  //   if (!address) return;

  //   const loadExistingConfig = async () => {
  //     try {
  //       const signer = await getSigner();
  //       const upContract = ERC725__factory.connect(address, signer);
  //       const abiCoder = new AbiCoder();

  //       // Build an array of transaction type IDs and corresponding keys for this assistant.
  //       const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
  //       const allTypeConfigKeys = allTypeIds.map(id =>
  //         generateMappingKey('UAPTypeConfig', id)
  //       );

  //       // Build the burn‑pix assistant config key.
  //       const assistantConfigKey = generateMappingKey(
  //         'UAPExecutiveConfig',
  //         assistantAddress
  //       );

  //       // Fetch all keys in one batch call.
  //       const allData = await upContract.getDataBatch([
  //         ...allTypeConfigKeys,
  //         assistantConfigKey,
  //       ]);
  //       // The first N entries are the type config values; the last one is the assistant config.
  //       const typeConfigValues = allData.slice(0, allTypeIds.length);
  //       const assistantConfigValue = allData[allTypeIds.length];

  //       const newlySelectedTx: string[] = [];

  //       // Decode each transaction type.
  //       typeConfigValues.forEach((encodedValue, index) => {
  //         if (!encodedValue || encodedValue === '0x') return;

  //         const typeId = allTypeIds[index];
  //         let addresses: string[];

  //         if (typeId === LSP1_TYPE_IDS.LSP0ValueReceived) {
  //           // For LSP0ValueReceived, the value is encoded as an array via abiCoder.encode(['address[]'], [assistants])
  //           addresses = abiCoder.decode(['address[]'], encodedValue)[0];
  //         } else {
  //           // For other types, the value might be custom encoded.
  //           // Our custom encoding for a single address produces 22 bytes (0x + 44 hex digits).
  //           if (encodedValue.length === 46) {
  //             // Skip the first 4 hex characters (the uint16 count) and take the remaining 40 hex digits as the address.
  //             const addr = "0x" + encodedValue.slice(6);
  //             addresses = [addr];
  //           } else {
  //             // Otherwise, assume standard ABI encoding.
  //             addresses = [abiCoder.decode(['address'], encodedValue)[0]];
  //           }
  //         }

  //         // Check if the burn‑pix assistant is among the addresses.
  //         if (
  //           addresses
  //             .map((addr) => addr.toLowerCase())
  //             .includes(assistantAddress.toLowerCase())
  //         ) {
  //           newlySelectedTx.push(typeId);
  //         // // Decode as a single address (32 bytes expected)
  //         // const storedAddresses = customDecodeAddresses(encodedValue);
  //         // // todo: for now it will only have one address
  //         // const storedAddress = storedAddresses[0];

  //         // // If it matches our assistant’s address, we push that txTypeId
  //         // if (storedAddress.toLowerCase() === assistantAddress.toLowerCase()) {
  //         //   newlySelectedTx.push(allTypeIds[index]);
  //         }
  //       });

  //       // Determine if the burn‑pix assistant is configured.
  //       const burnpixConfigured =
  //         assistantConfigValue && assistantConfigValue !== '0x';
  //       if (burnpixConfigured) {
  //         const decoded = abiCoder.decode(
  //           ['address', 'bytes32', 'uint256'],
  //           assistantConfigValue
  //         );
  //         const pixId = decoded[1] as string;
  //         const iterationCount = decoded[2] as any;
  //         setBurntPixId(pixId);
  //         setIters(iterationCount.toString());
  //         setIsUpSubscribedToAssistant(true);
  //       } else {
  //         setIsUpSubscribedToAssistant(false);
  //       }

  //       // Update state with discovered transaction subscriptions.
  //       setSelectedTransactions(newlySelectedTx);

  //       // --- Donation Assistant Configuration Check ---
  //       // Build the donation assistant config key.
  //       const donationAssistantConfigKey = generateMappingKey(
  //         'UAPExecutiveConfig',
  //         donationAssistantAddress
  //       );
  //       const donationAssistantConfigValue = await upContract.getData(
  //         donationAssistantConfigKey
  //       );

  //       if (
  //         donationAssistantConfigValue &&
  //         donationAssistantConfigValue !== '0x'
  //       ) {
  //         // Donation assistant is configured.
  //         setDonationCheckboxDisabled(true);
  //         setIsSaveChecked(true); // The checkbox is checked (and disabled) when donation config exists.
  //       } else {
  //         // Donation assistant not configured.
  //         setDonationCheckboxDisabled(false);
  //         // If no burn‑pix assistant is configured, default the donation checkbox to true;
  //         // otherwise (if burnpix is configured) default it to false.
  //         if (!burnpixConfigured) {
  //           setIsSaveChecked(true);
  //         } else {
  //           setIsSaveChecked(false);
  //         }
  //       }

  //       setIsLoadingTrans(false);
  //     } catch (err) {
  //       setIsLoadingTrans(false);
  //       console.error('Failed to load existing config:', err);
  //     }
  //   };

  //   loadExistingConfig();
  // }, [address, assistantAddress]);
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
      const abiCoder = new AbiCoder();

      const dataKeys: string[] = [];
      const dataValues: string[] = [];

      // ===============================
      // TYPE CONFIGURATION
      // ===============================
      // For most transaction types, we write a single address (the burn‑pix assistant).
      // However, for LSP0ValueReceived we want to combine the assistants.
      selectedTransactions.forEach(txTypeId => {
        console.log(txTypeId);
        if (txTypeId !== LSP1_TYPE_IDS.LSP0ValueReceived) {
          // For other types, simply encode the burn‑pix assistant address.
          // const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
          // dataKeys.push(typeConfigKey);
          // const encodedValue = abiCoder.encode(['address'], [assistantAddress]);
          // dataValues.push(encodedValue);
          const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
          dataKeys.push(typeConfigKey);

          // Encode as a single address
          dataValues.push(customEncodeAddresses([assistantAddress]));
        }
        // const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
        // dataKeys.push(typeConfigKey);

        // // Encode as a single address
        // dataValues.push(customEncodeAddresses([assistantAddress]));
      });

      // For LSP0ValueReceived, combine both assistants if donation is enabled.
      if (selectedTransactions.includes(LSP1_TYPE_IDS.LSP0ValueReceived)) {
        const typeConfigKey = generateMappingKey(
          'UAPTypeConfig',
          LSP1_TYPE_IDS.LSP0ValueReceived
        );
        dataKeys.push(typeConfigKey);

        let assistants: string[] = [assistantAddress]; // always include burn‑pix assistant
        if (!donationCheckboxDisabled && isSaveChecked) {
          assistants.push(donationAssistantAddress);
        }
        // Use the custom encoder to pack a uint16 length + the addresses
        // const encodedAssistants = abiCoder.encode(['address[]'], [assistants]);
        // dataValues.push(encodedAssistants);
        dataValues.push(
          customEncodeAddresses(assistants)
        );
      }

      // ===============================
      // EXECUTIVE CONFIGURATION
      // ===============================
      // Save burn‑pix assistant settings
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

      // Save donation assistant configuration if applicable.
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
  // Unsubscribe only this Burnt pix Assistant
  // --------------------------------------------------------------------------
  // const handleUnsubscribeAssistant = async () => {
  //   if (!address) {
  //     toast({
  //       title: 'Not connected',
  //       description: 'Please connect your wallet first.',
  //       status: 'info',
  //       duration: 5000,
  //       isClosable: true,
  //     });
  //     return;
  //   }

  //   try {
  //     setIsLoadingTrans(true);
  //     const signer = await getSigner();
  //     const upContract = ERC725__factory.connect(address, signer);
  //     const abiCoder = new AbiCoder();

  //     const dataKeys: string[] = [];
  //     const dataValues: string[] = [];

  //     // Process each selected transaction type.
  //     for (const txTypeId of selectedTransactions) {
  //       const typeConfigKey = generateMappingKey('UAPTypeConfig', txTypeId);
  //       if (txTypeId !== LSP1_TYPE_IDS.LSP0ValueReceived) {
  //         // For non-array-based type configs, simply clear the value.
  //         dataKeys.push(typeConfigKey);
  //         dataValues.push('0x');
  //       } else {
  //         // For LSP0ValueReceived, decode the stored array.
  //         const currentValue = await upContract.getData(typeConfigKey);
  //         if (currentValue && currentValue !== '0x') {
  //           // Decode as an array of addresses.
  //           const decoded = abiCoder.decode(['address[]'], currentValue);
  //           let addresses: string[] = decoded[0];
  //           // Remove the burn‑pix assistant address.
  //           addresses = addresses.filter(
  //             addr => addr.toLowerCase() !== assistantAddress.toLowerCase()
  //           );
  //           if (addresses.length > 0) {
  //             // Re‑encode the updated array.
  //             const newEncoded = abiCoder.encode(['address[]'], [addresses]);
  //             dataKeys.push(typeConfigKey);
  //             dataValues.push(newEncoded);
  //           } else {
  //             // If no addresses remain, clear the key.
  //             dataKeys.push(typeConfigKey);
  //             dataValues.push('0x');
  //           }
  //         }
  //       }
  //     }

  //     // Clear the burn‑pix assistant's executive configuration.
  //     const assistantSettingsKey = generateMappingKey('UAPExecutiveConfig', assistantAddress);
  //     dataKeys.push(assistantSettingsKey);
  //     dataValues.push('0x');

  //     const tx = await upContract.setDataBatch(dataKeys, dataValues);
  //     await tx.wait();

  //     toast({
  //       title: 'Success',
  //       description: 'Unsubscribed from Burnt Pix Refiner Assistant!',
  //       status: 'success',
  //       duration: 5000,
  //       isClosable: true,
  //     });

  //     // Update UI state as appropriate.
  //     // (For example, you might remove LSP0ValueReceived from selectedTransactions if no assistants remain.)
  //     setSelectedTransactions(prev =>
  //       prev.filter(txId => txId !== LSP1_TYPE_IDS.LSP0ValueReceived)
  //     );
  //     setBurntPixId('');
  //     setIters('');
  //     setIsUpSubscribedToAssistant(false);
  //     setIsLoadingTrans(false);
  //   } catch (err: any) {
  //     setIsLoadingTrans(false);
  //     console.error('Error unsubscribing assistant', err);
  //     toast({
  //       title: 'Error',
  //       description: `Error unsubscribing assistant: ${err.message}`,
  //       status: 'error',
  //       duration: 5000,
  //       isClosable: true,
  //     });
  //   }
  // };

  // NOTES:
  // 1) I think if we are removing URD we should also reset the configuration of the assistants.
  // so, when rejoining there arent surprises.
  // 2) if unsbuscribing removes the Burnt pix and also the Donation it wont be clear. What if the user set both and then only wants to keep one

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

  // const handleUnsubscribeDonationAssistant = async () => {
  //   if (!address) {
  //     toast({
  //       title: 'Not connected',
  //       description: 'Please connect your wallet first.',
  //       status: 'info',
  //       duration: 5000,
  //       isClosable: true,
  //     });
  //     return;
  //   }

  //   try {
  //     setIsLoadingTrans(true);
  //     const signer = await getSigner();
  //     const upContract = ERC725__factory.connect(address, signer);
  //     const abiCoder = new AbiCoder();

  //     const dataKeys: string[] = [];
  //     const dataValues: string[] = [];

  //     // Build the donation assistant executive config key.
  //     const donationAssistantConfigKey = generateMappingKey('UAPExecutiveConfig', donationAssistantAddress);
  //     // Clear the donation assistant executive config.
  //     dataKeys.push(donationAssistantConfigKey);
  //     dataValues.push('0x');

  //     // Update the LSP0ValueReceived type configuration.
  //     const typeConfigKey = generateMappingKey('UAPTypeConfig', LSP1_TYPE_IDS.LSP0ValueReceived);
  //     const currentValue = await upContract.getData(typeConfigKey);
  //     if (currentValue && currentValue !== '0x') {
  //       const decoded = abiCoder.decode(['address[]'], currentValue);
  //       let addresses: string[] = decoded[0];
  //       // Remove the donation assistant address.
  //       addresses = addresses.filter(
  //         addr => addr.toLowerCase() !== donationAssistantAddress.toLowerCase()
  //       );
  //       if (addresses.length > 0) {
  //         const newEncoded = abiCoder.encode(['address[]'], [addresses]);
  //         dataKeys.push(typeConfigKey);
  //         dataValues.push(newEncoded);
  //       } else {
  //         dataKeys.push(typeConfigKey);
  //         dataValues.push('0x');
  //       }
  //     }

  //     const tx = await upContract.setDataBatch(dataKeys, dataValues);
  //     await tx.wait();

  //     toast({
  //       title: 'Success',
  //       description: 'Unsubscribed from Donation Assistant!',
  //       status: 'success',
  //       duration: 5000,
  //       isClosable: true,
  //     });

  //     // Reset donation assistant state in the UI.
  //     setDonationCheckboxDisabled(false);
  //     setIsSaveChecked(false);
  //     setIsLoadingTrans(false);
  //   } catch (err: any) {
  //     setIsLoadingTrans(false);
  //     console.error('Error unsubscribing donation assistant', err);
  //     toast({
  //       title: 'Error',
  //       description: `Error unsubscribing donation assistant: ${err.message}`,
  //       status: 'error',
  //       duration: 5000,
  //       isClosable: true,
  //     });
  //   }
  // };

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
        <Flex flexDirection={'row'} gap={4} maxWidth="550px">
          <Text fontWeight="bold" fontSize="sm">
            Donate 1% of the transactions value to the Year One Team
          </Text>
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
