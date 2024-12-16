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
import {
  BrowserProvider,
  Eip1193Provider,
  ethers,
  verifyMessage,
} from 'ethers';
import ERC725 from '@erc725/erc725.js';
import { SiweMessage } from 'siwe';
import {
  customEncodeAddresses,
  generateMappingKey,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { useNetwork } from '@/contexts/NetworkContext';

const TransactionSelector = (props: { assistantAddress: string }) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const { network } = useNetwork();
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationAddress(value);

    // Basic Ethereum address validation
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isValid);
  };

  const handleSubmitConfig = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);

    const typeId = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification; // todo delete this line

    try {
      //const accounts = await provider.send('eth_requestAccounts', []);
      //console.log('Accounts:', accounts);
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);
      // console.log('Signer:', signer);
      // // Assuming the user is interacting with their own UP// Prepare a message with the SIWE-specific format
      // const siweMessage = new SiweMessage({
      //   domain: window.location.host, // Domain requesting the signing
      //   uri: window.location.origin,
      //   address: upAddress, // Address performing the signing
      //   statement:
      //     'Signing this message will enable the Universal Assistants Catalog to allow your UP Browser Extension to manage Assistant configurations.', // Human-readable assertion the user signs  // URI from the resource that is the subject of the signature
      //   version: '1', // Current version of the SIWE Message
      //   chainId: network.chainId, // Chain ID to which the session is bound to
      //   resources: [`${window.location.origin}/terms`], // Authentication resource as part of authentication by the relying party
      // }).prepareMessage();
      // Request the extension to sign the message
      // const signature = await signer.signMessage(siweMessage);
      // const signerAddress = verifyMessage(siweMessage, signature);
      // console.log('signer:', signer);
      // console.log('upAddress:', upAddress);
      // console.log('mainController:', signerAddress);
      const mappingKey = generateMappingKey('UAPTypeConfig', typeId);

      // Define the schema with the dynamic key
      const typeSchema = {
        name: 'UAPTypeConfig:<bytes32>',
        key: mappingKey,
        keyType: 'Mapping',
        valueType: 'address[]',
        valueContent: 'Address',
      };
      const schema = [typeSchema];

      // Create an instance of ERC725 with the schema
      const erc725 = new ERC725(schema as any, upAddress, provider, {
        ipfsGateway: network.ipfsGateway,
      });

      // Encode the data
      const encodedKeysData = erc725.encodeData([
        {
          keyName: typeSchema.name,
          dynamicKeyParts: [typeId],
          value: [props.assistantAddress],
        },
      ]);
      // use custom function to encode the data
      const encodedValues = customEncodeAddresses([props.assistantAddress]);

      console.log('Encoded data:', encodedKeysData);

      const UP = ERC725__factory.connect(upAddress, signer);
      const tx = await UP.connect(signer).setData(
        encodedKeysData.keys[0],
        encodedValues
      );

      await tx.wait();

      toast({
        title: 'Success',
        description: 'UAPTypeConfig has been set successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Redirect or update as needed
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
                ([key, { label, typeName, icon, iconPath }]) => (
                  <Checkbox key={key} value={key}>
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
      </Grid>
    </Box>
  );
};

export default TransactionSelector;
