import React, { useState } from 'react';
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
import { BrowserProvider, Eip1193Provider } from 'ethers';
import {
  customEncodeAddresses,
  generateMappingKey,
  toggleUniveralAssistantsSubscribe,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useNetwork } from '@/contexts/NetworkContext';

const SetupAssistant = (props: { assistantAddress: string }) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useAppKitProvider('eip155');
  const { address } = useAppKitAccount();
  const { network } = useNetwork();
  const provider = new BrowserProvider(walletProvider as Eip1193Provider);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationAddress(value);

    // Basic Ethereum address validation
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isValid);
  };

  const handleSubmitConfig = async () => {
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);

    try {
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);

      // Separate keys and values into two arrays
      const dataKeys = selectedTransactions.map(typeId =>
        generateMappingKey('UAPTypeConfig', typeId)
      );
      const dataValues = selectedTransactions.map(() =>
        customEncodeAddresses([props.assistantAddress])
      );

      const UP = ERC725__factory.connect(upAddress, signer);
      // Call setDataBatch with two arrays
      const tx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);

      await tx.wait();

      toast({
        title: 'Success',
        description: 'UAPTypeConfig has been set successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error setting UAPTypeConfig', error);
      toast({
        title: 'Error',
        description: `Error setting UAPTypeConfig: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnsubscribe = async () => {
    // todo find a better place for this
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
            Select a transaction type that you will engage this assistant for:
          </Text>
        </GridItem>
        <GridItem>
          <CheckboxGroup
            colorScheme="orange"
            value={selectedTransactions}
            onChange={(values: string[]) => setSelectedTransactions(values)}
          >
            <VStack spacing={2} align="stretch">
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
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Enter the address towards which you would like to forward the asset:
          </Text>
        </GridItem>
        <GridItem>
          <Flex alignItems="left">
            <Input
              placeholder="Enter destination address"
              value={destinationAddress}
              onChange={handleAddressChange}
              borderColor={isValidAddress ? 'gray.300' : 'red.500'}
              mr={2}
            />
          </Flex>
          {!isValidAddress && (
            <Text color="red.500" fontSize="sm" mt={2}>
              Please enter a valid address.
            </Text>
          )}
        </GridItem>
        <Button
          size="sm"
          bg="orange.500"
          color="white"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          isDisabled={!isValidAddress || destinationAddress === ''}
          onClick={handleSubmitConfig}
        >
          Save
        </Button>
        <Button
          size="sm"
          bg="orange.500"
          color="white"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          onClick={handleUnsubscribe}
        >
          Unsubscribe URD
        </Button>
      </Grid>
    </Box>
  );
};

export default SetupAssistant;
