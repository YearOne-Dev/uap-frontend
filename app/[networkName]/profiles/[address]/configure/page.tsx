'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Button, useToast, Text, Avatar } from '@chakra-ui/react';
import ReadConfiguredAssistants from '@/components/ReadConfiguredAssistants';
import Breadcrumbs from '@/components/Breadcrumbs';

import { BrowserProvider, Eip1193Provider } from 'ethers';
import {
  customDecodeAddresses,
  generateMappingKey,
  unsubscribeFromUapURD,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';

import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { transactionTypeMap } from '@/components/TransactionTypeBlock';
import { CHAINS, networkNameToIdMapping } from '@/constants/supportedNetworks';
import { useNetwork } from '@/contexts/NetworkContext';
import { formatAddress } from '@/utils/utils';
import { getProfileBasicInfo } from '@/utils/universalProfile';

export default function ProfilePage({
  params,
}: {
  params: { address: string; networkName: CHAINS };
}) {
  const { address: profileAddress, networkName } = params;
  const { network } = useNetwork();
  const chainId = networkNameToIdMapping[networkName];

  // Web3 / state
  const toast = useToast({ position: 'bottom-left' });
  const { address: walletAddress, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  // Whether we have any subscribed assistants
  const [hasAnyAssistants, setHasAnyAssistants] = useState(false);

  // Loading state for unsubscribe transaction
  const [isLoading, setIsLoading] = useState(false);
  const [profileName, setProfileName] = useState<string>(
    formatAddress(profileAddress)
  );
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Read-only flag
  const isReadOnly = useMemo(() => {
    // If user is NOT connected, or wallet doesn't match the profile
    return (
      !isConnected ||
      walletAddress?.toLowerCase() !== profileAddress.toLowerCase()
    );
  }, [isConnected, walletAddress, profileAddress]);

  // Fetch profile info (avatar and name)
  useEffect(() => {
    getProfileBasicInfo(chainId, profileAddress).then(profileData => {
      setProfileName(profileData.upName || formatAddress(profileAddress));
      setProfileAvatar(profileData.avatar || null);
    });
  }, [chainId, profileAddress]);

  // Breadcrumbs
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: '/' },
      {
        name: 'Profiles',
        href: `/${networkName}/profiles/${profileAddress}`,
      },
      {
        name: `${profileName}`,
        href: `/${networkName}/profiles/${profileAddress}`,
      },
    ],
  });

  // --------------------------------------------------------------------------
  // Check if user is subscribed to any assistants
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!profileAddress || !walletProvider || !walletAddress) return;

    const checkAssistants = async () => {
      try {
        setIsLoading(true);
        const provider = new BrowserProvider(walletProvider as Eip1193Provider);
        const signer = await provider.getSigner(walletAddress);
        const upContract = ERC725__factory.connect(profileAddress, signer);

        // We'll read all transaction-type keys
        const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
        const allKeys = allTypeIds.map(id =>
          generateMappingKey('UAPTypeConfig', id)
        );

        const rawValues = await upContract.getDataBatch(allKeys);

        for (const encodedVal of rawValues) {
          if (encodedVal && encodedVal !== '0x') {
            const addresses = customDecodeAddresses(encodedVal);
            if (addresses.length > 0) {
              setHasAnyAssistants(true);
              setIsLoading(false);
              return;
            }
          }
        }

        // If no addresses found
        setHasAnyAssistants(false);
      } catch (err) {
        console.error('Error checking assistants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAssistants();
  }, [profileAddress, walletProvider, walletAddress]);

  // --------------------------------------------------------------------------
  // Unsubscribe from all assistants
  // --------------------------------------------------------------------------
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
        description: 'All assistants removed; reverted to default URD.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setHasAnyAssistants(false);
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

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <>
      {breadCrumbs}
      <Flex w="100%" flexDirection="column" gap={4} mt={4}>
        <Box w="100%" maxWidth="800px">
          <Flex flexDirection={'row'} alignItems={'center'} gap={2}>
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
          <ReadConfiguredAssistants
            upAddress={profileAddress}
            networkId={network.chainId}
          />
        </Box>

        <Box w="100%" maxWidth="800px">
          {/* If read-only, show a note that the page is read-only */}
          {isReadOnly && (
            <Text fontSize="sm" color="red.500" mb={2}>
              This page is in read-only mode. Connect with the correct wallet to
              manage this profile.
            </Text>
          )}

          <Flex alignItems="center" gap={3} mt={8} flexWrap="wrap">
            {/* Disable or hide this button when read-only */}
            <Button
              size="sm"
              colorScheme="red"
              onClick={handleProtocolUnsubscribe}
              isLoading={isLoading}
              isDisabled={isReadOnly || !hasAnyAssistants || isLoading}
            >
              Unsubscribe From All
            </Button>
          </Flex>
        </Box>
      </Flex>
    </>
  );
}
