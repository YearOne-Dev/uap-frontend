'use client';
import React, { useCallback, useEffect } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import URDSetup from '@/components/URDSetup';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork,
} from '@reown/appkit/react';
import SignInBox from '@/components/SignInBox';
import { getNetwork } from '@/utils/utils';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import {
  doesControllerHaveMissingPermissions,
  isUAPInstalled,
} from '@/utils/configDataKeyValueStore';
import { useProfile } from '@/contexts/ProfileContext';
import SetupAssistant from '@/components/SetupAssistant';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import {
  CHAINS,
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { ExecutiveAssistant } from '@/constants/CustomTypes';

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: CHAINS; assistantAddress: string };
}) {
  const { networkName } = params;
  const network = supportedNetworks[networkNameToIdMapping[networkName]];
  const assistantInfo =
    network.assistants[params.assistantAddress.toLowerCase()];

  // Call all hooks unconditionally
  const networkUrlId = getChainIdByUrlName(params.networkName);
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155');
  const { mainControllerData } = useProfile();
  const [isMissingPermissions, setIsMissingPermissions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isURDInstalled, setIsURDInstalled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { address, isConnected } = useAppKitAccount();
  const { chainId: walletNetworkId } = useAppKitNetwork();

  const checkURDInstalled = useCallback(async () => {
    if (!isConnected || !walletProvider || !address) {
      setError('User disconnected or wallet not available');
      return;
    }
    try {
      const provider = new BrowserProvider(walletProvider);
      const urdInstalled = await isUAPInstalled(
        provider,
        address,
        network.protocolAddress
      );
      setIsURDInstalled(urdInstalled);
    } catch (error) {
      console.error('Error checking assistant installation', error);
      setError('Failed to check assistant installation');
    }
  }, [address, network.protocolAddress, isConnected, walletProvider]);

  useEffect(() => {
    if (!address) return;
    checkURDInstalled();
  }, [address, checkURDInstalled]);

  useEffect(() => {
    if (!address || !mainControllerData?.mainUPController) {
      setIsLoading(false);
      return;
    }

    const getMissingPermissions = async () => {
      try {
        setError(null);
        const missingPermissions = await doesControllerHaveMissingPermissions(
          mainControllerData.mainUPController,
          address
        );
        setIsMissingPermissions(missingPermissions.length > 0);
      } catch (error) {
        console.error('Error checking permissions', error);
        setError('Failed to check permissions');
      } finally {
        setIsLoading(false);
      }
    };

    getMissingPermissions();
  }, [address, mainControllerData]);

  if (!assistantInfo) {
    return <Text>Assistant not found</Text>;
  }

  const isExecutiveAssistant = (info: any): info is ExecutiveAssistant => {
    return info && 'name' in info;
  };

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
    if (!walletNetworkId || !address) {
      return <SignInBox boxText={'Sign in to configure an Assistant'} />;
    }

    if (walletNetworkId !== networkUrlId) {
      return (
        <Flex
          height="100%"
          w="100%"
          alignContent="center"
          justifyContent="center"
          pt={4}
        >
          <VStack>
            <Text>You’re connected to {getNetwork(walletNetworkId).name}.</Text>
            <Text>
              Please change network to {getNetwork(networkUrlId).name}
            </Text>
            <Button onClick={() => open({ view: 'Networks' })}>
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

    if (
      !mainControllerData?.mainUPController ||
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

    return isExecutiveAssistant(assistantInfo) ? (
      <SetupAssistant config={assistantInfo} />
    ) : (
      <Text>Invalid assistant configuration</Text>
    );
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
