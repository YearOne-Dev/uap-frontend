import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';

import { BrowserProvider, Eip1193Provider } from 'ethers';
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

const SetupAssistant = (props: { assistantAddress: string }) => {
  const [burntPixAddress, setBurntPixAddress] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);

  // --- New state fields ---
  const [burntPixId, setBurntPixId] = useState<string>('');
  const [numIterations, setNumIterations] = useState<string>('');

  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();
  const provider = new BrowserProvider(walletProvider as Eip1193Provider);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBurntPixAddress(value);

    // Basic Ethereum address validation
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isValid);
  };

  // Handler for Burn Pix ID (alphanumeric)
  const handleBurnPixIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBurntPixId(e.target.value);
  };

  // Handler for number of iterations (integer only)
  const handleNumIterationsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    // Only allow integers (including an empty string for clearing)
    if (/^\d*$/.test(val)) {
      setNumIterations(val);
    }
  };

  const handleSubmitConfig = async () => {
    try {
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);
      const dataKeyForBurntPixAddress = generateMappingKey(
        'BurntPixAddress',
        burntPixAddress
      );
      const dataKeyForBurntPixId = generateMappingKey('BurntPixId', burntPixId);
      const dataKeyForNumIterations = generateMappingKey(
        'NumIterations',
        numIterations
      );
      const dataValues = [burntPixAddress, burntPixId, numIterations];
      const UP = ERC725__factory.connect(upAddress, signer);
      const tx = await UP.setDataBatch(
        [
          dataKeyForBurntPixAddress,
          dataKeyForBurntPixId,
          dataKeyForNumIterations,
        ],
        dataValues
      );
      await tx.wait();

      toast({
        title: 'Success',
        description: 'Configuration has been set successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error setting config', error);
      toast({
        title: 'Error',
        description: `Error setting config: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const upAddress = address as string;
      await toggleUniveralAssistantsSubscribe(
        provider,
        upAddress,
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
    } catch (error: any) {
      console.error('Error uninstalling UAP', error);
      toast({
        title: 'Error',
        description: `Error uninstalling UAP: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Grid templateColumns="1fr 2fr" gap={1} alignItems="center">
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Enter the address of the Burnt Pix contract
          </Text>
        </GridItem>
        <GridItem>
          <Flex alignItems="left">
            <Input
              placeholder="Enter address (e.g. 0x123...)"
              value={burntPixAddress}
              onChange={handleAddressChange}
              borderColor={isValidAddress ? 'gray.300' : 'red.500'}
              mr={2}
            />
          </Flex>
          {!isValidAddress && (
            <Text color="red.500" fontSize="sm" mt={2}>
              Please enter a valid Ethereum address.
            </Text>
          )}
        </GridItem>

        {/* --- New Field for Burn Pix ID (alphanumeric) --- */}
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Burn Pix ID
          </Text>
        </GridItem>
        <GridItem>
          <Input
            placeholder="Enter Burn Pix ID"
            value={burntPixId}
            onChange={handleBurnPixIdChange}
          />
        </GridItem>

        {/* --- New Field for Number of Iterations (integer only) --- */}
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Number of Iterations
          </Text>
        </GridItem>
        <GridItem>
          <Input
            placeholder="Enter an integer"
            type="number"
            value={numIterations}
            onChange={handleNumIterationsChange}
          />
        </GridItem>

        <GridItem>
          <Button
            maxW={200}
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleUnsubscribe}
          >
            Unsubscribe URD
          </Button>
        </GridItem>
        <GridItem>
          <Button
            maxW={200}
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            // Disable the Save button if address is invalid or empty
            isDisabled={!isValidAddress || burntPixAddress === ''}
            onClick={handleSubmitConfig}
          >
            Save
          </Button>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default SetupAssistant;
