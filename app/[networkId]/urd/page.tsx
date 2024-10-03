'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Text,
  useToast,
  Button,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { ethers, BrowserProvider, Eip1193Provider } from 'ethers';
import ERC725 from '@erc725/erc725.js';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { useProfile } from '@/contexts/ProfileContext';
import { getNetwork } from '@/utils/utils';
import WalletNetworkSelectorButton from '@/components/AppNetworkSelectorDropdown';
import SignInBox from '@/components/SignInBox';
import { getDetailsEmptyState } from '@/utils/fieldValidations';

export default function UAPConfigPage({ params }: { params: { networkId: string } }) {
  const toast = useToast({ position: 'bottom-left' });
  const { address, chainId: walletNetworkId, isConnected } = useWeb3ModalAccount();
  console.log('address', address);
  console.log('walletNetworkId', walletNetworkId);
  console.log('isConnected', isConnected);
  const { walletProvider } = useWeb3ModalProvider();
  const { setIssuedAssets } = useProfile();
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [error, setError] = useState('');
  const [typeId, setTypeId] = useState('');
  const [assistantAddresses, setAssistantAddresses] = useState(['']);
  const router = useRouter();

  useEffect(() => {
    if (address) {
      setIsUserConnected(true);
    }
  }, [address]);

  const handleAssistantAddressChange = (index, event) => {
    const newAddresses = [...assistantAddresses];
    newAddresses[index] = event.target.value;
    setAssistantAddresses(newAddresses);
  };

  const handleAddAssistantAddress = () => {
    setAssistantAddresses([...assistantAddresses, '']);
  };

  const handleRemoveAssistantAddress = (index) => {
    const newAddresses = assistantAddresses.filter((_, i) => i !== index);
    setAssistantAddresses(newAddresses);
  };

  const handleSubmit = async (event) => {
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
      const signer = await provider.getSigner();
      const upAddress = address; // Assuming the user is interacting with their own UP
      const currentNetwork = getNetwork(walletNetworkId);

      // Generate mapping key
      const generateMappingKey = (keyName, typeId) => {
        const hashedKey = ethers.keccak256(ethers.toUtf8Bytes(keyName));
        const first10Bytes = ethers.hexlify(hashedKey).slice(0, 22); // 0x + 20 chars
        const last20Bytes = typeId.slice(-40); // Last 20 bytes (40 hex chars)
        return first10Bytes + last20Bytes;
      };

      const mappingKey = generateMappingKey('UAPTypeConfig', typeId);

      // Define the schema with the dynamic key
      const schema = [
        {
          name: 'UAPTypeConfig:<bytes32>',
          key: mappingKey,
          keyType: 'Mapping',
          valueType: 'address[]',
          valueContent: 'Address',
        },
      ];

      // Create an instance of ERC725 with the schema
      const erc725 = new ERC725(schema, upAddress, provider, {
        ipfsGateway: currentNetwork.ipfsGateway,
      });

      // Prepare the data to set
      const dataToSet = {
        [`UAPTypeConfig:${typeId}`]: assistantAddresses,
      };

      // Encode the data
      const encodedData = erc725.encodeData(dataToSet);

      // Prepare the transaction
      const ERC725YInterface = [
        'function setData(bytes32[] memory keys, bytes[] memory values) external',
      ];

      const contract = new ethers.Contract(upAddress, ERC725YInterface, signer);

      const tx = await contract.setData(encodedData.keys, encodedData.values);
      await tx.wait();

      toast({
        title: 'Success',
        description: 'UAPTypeConfig has been set successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Redirect or update as needed
      router.push(`/profile/${params.networkId}/${upAddress}`);
    } catch (error) {
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

  return walletNetworkId && isUserConnected ? (
    <>
      <Breadcrumb
        separator="/"
        color={'hashlists.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/profile/${params.networkId}/${address}`}>
            {'Profile'}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" mr={2}>
            Set UAPTypeConfig
          </BreadcrumbLink>
          <WalletNetworkSelectorButton
            currentNetwork={parseInt(params.networkId)}
            urlTemplate={(networkId) => `/uap-config/${networkId}`}
          />
        </BreadcrumbItem>
      </Breadcrumb>
      <Flex
        display="flex"
        w={'100%'}
        flexDirection={'column'}
        flexWrap={'wrap'}
        gap={4}
        mt={4}
      >
        <Box flex="1" w={'100%'} maxWidth="800px">
          <form onSubmit={handleSubmit}>
            <FormControl isRequired mb={4}>
              <FormLabel>Type ID (bytes32)</FormLabel>
              <Input
                placeholder="0x..."
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Assistant Addresses</FormLabel>
              {assistantAddresses.map((addr, index) => (
                <Flex key={index} mb={2}>
                  <Input
                    placeholder="0x..."
                    value={addr}
                    onChange={(e) => handleAssistantAddressChange(index, e)}
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
      </Flex>
    </>
  ) : (
    <>
      <Breadcrumb
        separator="/"
        color={'hashlists.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/profile/${params.networkId}/${address}`}>
            {'Profile'}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" mr={2}>
            Set UAPTypeConfig
          </BreadcrumbLink>
          <WalletNetworkSelectorButton
            currentNetwork={parseInt(params.networkId)}
            urlTemplate={(networkId) => `/uap-config/${networkId}`}
          />
        </BreadcrumbItem>
      </Breadcrumb>
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
