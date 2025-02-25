'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import URDSetup from '@/components/URDSetup';
import SignInBox from '@/components/SignInBox';
import { getNetwork } from '@/utils/utils';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import {
  doesControllerHaveMissingPermissions,
  isUAPInstalled,
} from '@/utils/configDataKeyValueStore';
import SetupAssistant from '@/components/SetupAssistant';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BrowserProvider } from 'ethers';
import {
  CHAINS,
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { useProfile } from '@/contexts/ProfileProvider';

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: CHAINS; assistantAddress: string };
}) {
  const { networkName } = params;
  const network = supportedNetworks[networkNameToIdMapping[networkName]];
  const assistantInfo =
    network.assistants[params.assistantAddress.toLowerCase()];

  const networkUrlId = getChainIdByUrlName(params.networkName);
  const { profileDetailsData, isConnected, chainId, switchNetwork } =
    useProfile();
  const [isMissingPermissions, setIsMissingPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isURDInstalled, setIsURDInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = profileDetailsData?.upWallet;

  const checkURDInstalled = useCallback(async () => {
    if (!isConnected || !address || !window.lukso) {
      setError('User disconnected or wallet not available');
      setIsLoading(false);
      return;
    }
    try {
      const provider = new BrowserProvider(window.lukso);
      const urdInstalled = await isUAPInstalled(
        provider,
        address,
        network.protocolAddress
      );
      setIsURDInstalled(urdInstalled);
    } catch (error) {
      console.error('Error checking assistant installation', error);
      setError('Failed to check assistant installation');
    } finally {
      setIsLoading(false);
    }
  }, [address, network.protocolAddress, isConnected]);

  const checkPermissions = useCallback(async () => {
    if (!address || !profileDetailsData?.mainUPController) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const missingPermissions = await doesControllerHaveMissingPermissions(
        profileDetailsData.mainUPController,
        address
      );
      setIsMissingPermissions(missingPermissions.length > 0);
    } catch (error) {
      console.error('Error checking permissions', error);
      setError('Failed to check permissions');
    } finally {
      setIsLoading(false);
    }
  }, [address, profileDetailsData]);

  useEffect(() => {
    setIsLoading(true);
    checkURDInstalled();
  }, [checkURDInstalled]);

  useEffect(() => {
    setIsLoading(true);
    checkPermissions();
  }, [checkPermissions]);

  if (!assistantInfo) {
    return <Text>Assistant not found</Text>;
  }

  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      { name: 'Executives', href: `/${networkName}/catalog` },
      {
        name: `${assistantInfo.name}`,
        href: `/${networkName}/catalog/executive-assistants/${params.assistantAddress}`,
      },
      {
        name: 'Configure',
        href: `/${networkName}/catalog/executive-assistants/${params.assistantAddress}/configure`,
      },
    ],
  });

  const renderConfigureBody = () => {
    if (!isConnected || !address) {
      return <SignInBox boxText={'Sign in to configure an Assistant'} />;
    }

    if (chainId && chainId !== networkUrlId) {
      return (
        <Flex
          height="100%"
          w="100%"
          alignContent="center"
          justifyContent="center"
          pt={4}
        >
          <VStack>
            <Text>You’re connected to {getNetwork(chainId).name}.</Text>
            <Text>
              Please change network to {getNetwork(networkUrlId).name}
            </Text>
            <Button onClick={() => switchNetwork(networkUrlId)}>
              Change network
            </Button>
          </VStack>
        </Flex>
      );
    }

    if (isLoading) {
      return <Spinner size={'xl'} alignSelf={'center'} />;
    }

    if (error) {
      return <Text color="red.500">{error}</Text>;
    }

    console.log(
      !profileDetailsData?.mainUPController,
      isMissingPermissions,
      !isURDInstalled
    );
    if (
      !profileDetailsData?.mainUPController ||
      isMissingPermissions ||
      !isURDInstalled
    ) {
      return (
        <URDSetup
          extensionHasPermissions={!isMissingPermissions}
          networkName={networkName}
        />
      );
    }

    return <SetupAssistant config={assistantInfo} />;
  };

  return (
    <Box p={4} w="100%">
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4} w="100%">
        <Flex w="100%">
          <AssistantInfo assistant={assistantInfo} />
        </Flex>
        <Box border="1px" borderColor="gray.200" w="100%" />
        {renderConfigureBody()}
      </Flex>
    </Box>
  );
}
