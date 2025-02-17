'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Button,
  useToast,
  Text,
  Avatar,
  Link as ChakraLink,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import ReadConfiguredAssistants from '@/components/ReadConfiguredAssistants';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import {
  customDecodeAddresses,
  generateMappingKey,
  unsubscribeFromUapURD,
} from '@/utils/configDataKeyValueStore';
import { ERC725, ERC725__factory } from '@/types';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { transactionTypeMap } from '@/components/TransactionTypeBlock';
import {
  CHAINS,
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { formatAddress } from '@/utils/utils';
import { getProfileBasicInfo } from '@/utils/universalProfile';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';

export default function ProfilePage({
  params,
}: {
  params: { address: string; networkName: CHAINS };
}) {
  const { address: profileAddress, networkName } = params;
  const network = supportedNetworks[networkNameToIdMapping[networkName]];
  const chainId = networkNameToIdMapping[networkName];
  const toast = useToast({ position: 'bottom-left' });
  const { address: walletAddress, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const [isUAPInstalled, setIsUAPInstalled] = useState(false);
  const [hasAnyAssistants, setHasAnyAssistants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileName, setProfileName] = useState(formatAddress(profileAddress));
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const isReadOnly = useMemo(
    () =>
      !isConnected ||
      walletAddress?.toLowerCase() !== profileAddress.toLowerCase(),
    [isConnected, walletAddress, profileAddress]
  );

  useEffect(() => {
    getProfileBasicInfo(chainId, profileAddress).then(profileData => {
      setProfileName(profileData.upName || formatAddress(profileAddress));
      setProfileAvatar(profileData.avatar || null);
    });
  }, [chainId, profileAddress]);

  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: '/' },
      {
        name: 'Profiles',
        href: `/${networkName}/profiles/${profileAddress}/configure`,
      },
      {
        name: `${profileName}`,
        href: `/${networkName}/profiles/${profileAddress}/configure`,
      },
    ],
  });

  useEffect(() => {
    if (!profileAddress || !walletProvider || !walletAddress) return;
    const fetchAssistants = async () => {
      try {
        setIsLoading(true);
        const provider = new BrowserProvider(walletProvider as Eip1193Provider);
        const signer = await provider.getSigner(walletAddress);
        const upContract: ERC725 = ERC725__factory.connect(
          profileAddress,
          signer
        );
        const allTypeIds = Object.values(transactionTypeMap).map(o => o.id);
        const allKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );
        allKeys.push(ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
        const rawValues = await upContract.getDataBatch(allKeys);
        const isProtocolInstalled =
          rawValues[allKeys.length - 1].toLowerCase() ===
          network.protocolAddress.toLowerCase();
        setIsUAPInstalled(isProtocolInstalled);
        for (const encodedVal of [...rawValues.slice(0, allKeys.length - 1)]) {
          if (encodedVal && encodedVal !== '0x') {
            const addresses = customDecodeAddresses(encodedVal);
            if (addresses.length > 0) {
              setHasAnyAssistants(true);
              setIsLoading(false);
              return;
            }
          }
        }
        setHasAnyAssistants(false);
      } catch (err) {
        console.error('Error checking assistants:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssistants();
  }, [profileAddress, walletProvider, walletAddress, network.protocolAddress]);

  const handleProtocolUnsubscribe = async () => {
    if (!walletAddress || !profileAddress) {
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
      setIsLoading(true);
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      await unsubscribeFromUapURD(
        provider,
        profileAddress,
        network.protocolAddress,
        network.defaultURDUP
      );
      toast({
        title: 'Success',
        description: 'All assistants removed and unusubscribed from protocol.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setHasAnyAssistants(false);
      setIsUAPInstalled(false);
    } catch (err: any) {
      console.error('Error unsubscribing from all:', err);
      if (!err.message?.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error unsubscribing from all assistants: ${err.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {breadCrumbs}
      <Flex w="100%" flexDirection="column" gap={4} mt={4}>
        <Box w="100%" maxWidth="800px">
          <Flex flexDirection="row" alignItems="center" gap={2}>
            {profileAvatar && (
              <Avatar
                border="1px solid var(--chakra-colors-uap-grey)"
                src={profileAvatar}
                height="40px"
                width="40px"
              />
            )}
            <Text fontSize="lg" fontWeight="bold">
              {profileName ? profileName : formatAddress(profileAddress)}
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              Assistants
            </Text>
          </Flex>
          {!hasAnyAssistants && !isLoading && isConnected && (
            <Box
              bg="gray.100"
              p={4}
              mt={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <Text>
                Looks like you’re not engaging any UP! Assistants.
                <ChakraLink
                  as={NextLink}
                  href={`/${networkName}/catalog`}
                  color="blue.500"
                  textDecoration="underline"
                  ml={1}
                >
                  Visit our Assistant Catalog
                </ChakraLink>{' '}
                to find a helpful friend!
              </Text>
            </Box>
          )}
          {hasAnyAssistants && (
            <ReadConfiguredAssistants
              upAddress={profileAddress}
              networkId={network.chainId}
            />
          )}
        </Box>
        <Box w="100%" maxWidth="800px">
          {isReadOnly && isConnected && (
            <Text fontSize="sm" color="red.500" mb={2}>
              This page is in read-only mode. Connect with the correct wallet to
              manage this profile.
            </Text>
          )}
          <Flex alignItems="center" gap={3} mt={8} flexWrap="wrap">
            {(hasAnyAssistants || isUAPInstalled) && (
              <Button
                size="sm"
                colorScheme="red"
                onClick={handleProtocolUnsubscribe}
                isLoading={isLoading}
                isDisabled={
                  isReadOnly ||
                  !(hasAnyAssistants || isUAPInstalled) ||
                  isLoading
                }
              >
                Unsubscribe From Protocol And All Assistants
              </Button>
            )}
          </Flex>
        </Box>
      </Flex>
    </>
  );
}
