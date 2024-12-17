'use client';
import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  BrowserProvider,
  Eip1193Provider,
  ethers,
  verifyMessage,
} from 'ethers';
import ERC725 from '@erc725/erc725.js';
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { getNetwork } from '@/utils/utils';
import SignInBox from '@/components/SignInBox';
import ConfiguredAssistants from '@/components/ConfiguredAssistants';
import { SiweMessage } from 'siwe';

// Import the Type ID options map and order
import { typeIdOptionsMap, typeIdOrder } from '@/constants/assistantTypes';
import {
  customEncodeAddresses,
  generateMappingKey,
  toggleUniveralAssistantsSubscribe,
  updateBECPermissions,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
import { useNetwork } from '@/contexts/NetworkContext';
import WalletNetworkSelectorButton from '@/components/AppNetworkSelectorDropdown';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import { useProfile } from '@/contexts/ProfileContext';

const UAPConfigPage = ({ params }: { params: { networkName: string } }) => {
  const networkUrlId = getChainIdByUrlName(params.networkName);
  const { setMainUPController } = useProfile();
  const toast = useToast({ position: 'bottom-left' });
  const {
    address,
    chainId: walletNetworkId,
    isConnected,
  } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { open } = useWeb3Modal();
  const [isUserConnected, setIsUserConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [typeId, setTypeId] = useState<string>('');
  const [assistantAddresses, setAssistantAddresses] = useState<string[]>(['']);

  const { network } = useNetwork();

  useEffect(() => {
    if (address) {
      setIsUserConnected(true);
    }
  }, [address]);

  const handleAssistantAddressChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const newAddresses = [...assistantAddresses];
    newAddresses[index] = event.target.value;
    setAssistantAddresses(newAddresses);
  };

  const handleAddAssistantAddress = () => {
    setAssistantAddresses([...assistantAddresses, '']);
  };

  const handleRemoveAssistantAddress = (index: number) => {
    const newAddresses = assistantAddresses.filter((_, i) => i !== index);
    setAssistantAddresses(newAddresses);
  };
  const handleToggleAssistant = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to proceed.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const provider = new BrowserProvider(walletProvider as Eip1193Provider);

    try {
      //const accounts = await provider.send('eth_requestAccounts', []);
      //console.log('Accounts:', accounts);
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);
      console.log('Signer:', signer);
      // Assuming the user is interacting with their own UP// Prepare a message with the SIWE-specific format
      const siweMessage = new SiweMessage({
        domain: window.location.host, // Domain requesting the signing
        uri: window.location.origin,
        address: upAddress, // Address performing the signing
        statement:
          'Signing this message will enable the Universal Assistants Catalog to allow your UP Browser Extension to manage Assistant configurations.', // Human-readable assertion the user signs  // URI from the resource that is the subject of the signature
        version: '1', // Current version of the SIWE Message
        chainId: network.chainId, // Chain ID to which the session is bound to
        resources: [`${window.location.origin}/terms`], // Authentication resource as part of authentication by the relying party
      }).prepareMessage();
      // Request the extension to sign the message
      const signature = await signer.signMessage(siweMessage);
      const mainUPController = verifyMessage(siweMessage, signature);
      setMainUPController(mainUPController);
      console.log('signer:', signer);
      console.log('upAddress:', upAddress);
      console.log('mainController:', mainUPController);
      console.log('step 0');
      await updateBECPermissions(provider, upAddress, mainUPController!);
      console.log('step 1');
      await toggleUniveralAssistantsSubscribe(
        provider,
        upAddress,
        network.protocolAddress,
        network.defaultURDUP,
        false
      );

      toast({
        title: 'Success',
        description: 'UAPTypeConfig has been set successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error setting UAPTypeConfig', error);
      setError(`Error setting UAPTypeConfig: ${error.message}`);
      toast({
        title: 'Error',
        description: `Error setting UAPTypeConfig: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmitConfig = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to proceed.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const provider = new BrowserProvider(walletProvider as Eip1193Provider);

    // Input validation
    if (!ethers.isHexString(typeId, 32)) {
      toast({
        title: 'Invalid Type ID',
        description: 'Type ID must be a valid bytes32 hex string.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    for (let addr of assistantAddresses) {
      if (!ethers.isAddress(addr)) {
        toast({
          title: 'Invalid Address',
          description: `Assistant address ${addr} is not valid.`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    try {
      //const accounts = await provider.send('eth_requestAccounts', []);
      //console.log('Accounts:', accounts);
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);
      console.log('Signer:', signer);
      // Assuming the user is interacting with their own UP// Prepare a message with the SIWE-specific format
      const siweMessage = new SiweMessage({
        domain: window.location.host, // Domain requesting the signing
        uri: window.location.origin,
        address: upAddress, // Address performing the signing
        statement:
          'Signing this message will enable the Universal Assistants Catalog to allow your UP Browser Extension to manage Assistant configurations.', // Human-readable assertion the user signs  // URI from the resource that is the subject of the signature
        version: '1', // Current version of the SIWE Message
        chainId: network.chainId, // Chain ID to which the session is bound to
        resources: [`${window.location.origin}/terms`], // Authentication resource as part of authentication by the relying party
      }).prepareMessage();
      // Request the extension to sign the message
      const signature = await signer.signMessage(siweMessage);
      const signerAddress = verifyMessage(siweMessage, signature);
      console.log('signer:', signer);
      console.log('upAddress:', upAddress);
      console.log('mainController:', signerAddress);
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
          value: assistantAddresses,
        },
      ]);
      // use custom function to encode the data
      const encodedValues = customEncodeAddresses(assistantAddresses);

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
      setError(`Error setting UAPTypeConfig: ${error.message}`);
      toast({
        title: 'Error',
        description: `Error setting UAPTypeConfig: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const breadCrumbs = (
    <>
      <Breadcrumb
        separator="/"
        color={'uap.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" mr={2}>
            Configure Assistant
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    </>
  );

  if (!walletNetworkId || !isUserConnected) {
    return (
      <>
        {breadCrumbs}
        <Flex
          height="100%"
          w="100%"
          alignContent="center"
          justifyContent="center"
          pt={4}
        >
          <SignInBox boxText={'Sign in to set UAPTypeConfig'} />
        </Flex>
      </>
    );
  }

  if (walletNetworkId !== networkUrlId) {
    return (
      <>
        {breadCrumbs}
        <Flex
          height="100%"
          w="100%"
          alignContent="center"
          justifyContent="center"
          pt={4}
        >
          <VStack>
            <Text>
              You're on the {network.name} site but your connected wallet is on{' '}
              {getNetwork(walletNetworkId).name}
            </Text>
            <Text>Please change network</Text>
            <Button onClick={() => open({ view: 'Networks' })}>
              Change network
            </Button>
            <Text>Or visit the {getNetwork(walletNetworkId).name} section</Text>
            <WalletNetworkSelectorButton
              currentNetwork={networkUrlId}
              urlTemplate={`/urd`}
            />
          </VStack>
        </Flex>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb and other components */}
      {breadCrumbs}
      <Flex
        display="flex"
        w={'100%'}
        flexDirection={'column'}
        flexWrap={'wrap'}
        gap={4}
        mt={4}
      >
        <Box flex="1" w={'100%'} maxWidth="800px">
          <ConfiguredAssistants
            upAddress={address as string}
            networkId={walletNetworkId as number}
            walletProvider={walletProvider as Eip1193Provider}
          />
          <form onSubmit={handleSubmitConfig}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Assistant Configuration
            </Text>
            <FormControl isRequired mb={4}>
              <FormLabel>Transaction Event Type</FormLabel>
              <Select
                placeholder="Select Type ID"
                value={typeId}
                onChange={e => setTypeId(e.target.value)}
              >
                {typeIdOrder.map(typeIdValue => {
                  const option = typeIdOptionsMap[typeIdValue];
                  return (
                    <option value={option.value} key={option.value}>
                      {option.label} - {option.description}
                    </option>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Assistant Addresses</FormLabel>
              {assistantAddresses.map((addr, index) => (
                <Flex key={index} mb={2}>
                  <Input
                    placeholder="0x..."
                    value={addr}
                    onChange={e => handleAssistantAddressChange(index, e)}
                  />
                  {assistantAddresses.length > 1 && (
                    <Button
                      ml={2}
                      onClick={() => handleRemoveAssistantAddress(index)}
                    >
                      Remove
                    </Button>
                  )}
                </Flex>
              ))}
              <Button mt={2} onClick={handleAddAssistantAddress}>
                Add Address
              </Button>
            </FormControl>
            <Button colorScheme="teal" type="submit">
              Set UAPTypeConfig
            </Button>
          </form>
          {error && (
            <Text mt={4} color={'red'}>
              {error}
            </Text>
          )}
        </Box>

        <form onSubmit={handleToggleAssistant}>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Enable Assistant
          </Text>
          <Button colorScheme="teal" type="submit">
            Enable Universal Assistants
          </Button>
        </form>
      </Flex>
    </>
  );
};

export default UAPConfigPage;
