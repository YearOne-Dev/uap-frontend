'use client';
import React, { useEffect } from 'react';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import URDSetup from '@/components/URDSetup';
import {
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import SignInBox from '@/components/SignInBox';
import { getNetwork } from '@/utils/utils';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import { useNetwork } from '@/contexts/NetworkContext';
import {
  doesControllerHaveMissingPermissions,
  isDelegateAlreadySet,
} from '@/utils/configDataKeyValueStore';
import { useProfile } from '@/contexts/ProfileContext';
import SetupAssistant from '@/components/SetupAssistant';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { getAssistant } from '@/constants/assistantsConfig';
import { CHAINS, networkNameToIdMapping } from '@/constants/supportedNetworks';

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: CHAINS; assistantAddress: string };
}) {
  const { networkName } = params;
  const assistantInfo = getAssistant(
    params.assistantAddress,
    networkNameToIdMapping[networkName]
  );

  // Call all hooks unconditionally
  const networkUrlId = getChainIdByUrlName(params.networkName);
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { mainControllerData } = useProfile();
  const [isMissingPermissions, setIsMissingPermissions] = React.useState(false);
  const [isURDInstalled, setIsURDInstalled] = React.useState(false);
  const { network } = useNetwork();
  const {
    address,
    chainId: walletNetworkId,
    isConnected,
  } = useWeb3ModalAccount();

  useEffect(() => {
    console.log('mainUPController', mainControllerData?.mainUPController);

    if (!address || !mainControllerData?.mainUPController) {
      return;
    }

    const getMissingPermissions = async () => {
      try {
        const missingPermissions = await doesControllerHaveMissingPermissions(
          mainControllerData.mainUPController,
          address
        );
        setIsMissingPermissions(missingPermissions.length > 0);
      } catch (error) {
        console.error('Error checking permissions', error);
      }
    };

    const checkURDInstalled = async () => {
      console.log('checkURDInstalled called');
      if (!isConnected) {
        alert('User disconnected');
        return;
      }
      try {
        const provider = new BrowserProvider(walletProvider as Eip1193Provider);
        const urdInstalled = await isDelegateAlreadySet(
          provider,
          address,
          network.protocolAddress
        );
        console.log('urdInstalled', urdInstalled);
        setIsURDInstalled(urdInstalled);
      } catch (error) {
        console.error('Error checking assistant installation', error);
      }
    };

    checkURDInstalled();
    getMissingPermissions();
  }, [
    address,
    mainControllerData,
    network.protocolAddress,
    setIsMissingPermissions,
    isConnected,
    walletProvider,
  ]);

  // Now that all hooks have been called, conditionally render if assistantInfo is missing.
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
            <Text>Please change network</Text>
            <Button onClick={() => open({ view: 'Networks' })}>
              Change network
            </Button>
          </VStack>
        </Flex>
      );
    }

    if (
      !mainControllerData?.mainUPController ||
      isMissingPermissions ||
      !isURDInstalled
    ) {
      // TODO: pass isMissingPermissions to URDSetup if needed
      return <URDSetup extensionHasPermissions={!isMissingPermissions} />;
    }

    return <SetupAssistant assistantAddress={params.assistantAddress} />;
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
