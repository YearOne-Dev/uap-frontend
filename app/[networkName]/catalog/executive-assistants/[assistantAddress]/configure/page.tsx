'use client';
import React, { useEffect } from 'react';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import { forwarderAssistant } from '@/constants/dummyData';
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
import Breadcrumbs from '@/components/Breadcrumbs';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import SetupBurntPixAssistant from '@/components/SetupBurntPixAssistant';

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: string; assistantAddress: string };
}) {
  const { networkName } = params;
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
  // todo validate that id from url is a valid assistant id

  useEffect(() => {
    console.log('mainUPController', mainControllerData?.mainUPController);

    if (!address || !mainControllerData?.mainUPController) {
      return;
    }

    const getMissingPermissions = async () => {
      try {
        const missingPermissions = await doesControllerHaveMissingPermissions(
          mainControllerData?.mainUPController,
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
  ]);

  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      {
        name: 'Executives',
        href: `/${networkName}/catalog`,
      },
      {
        name: `Assistant ${params.assistantAddress}`,
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
      return <SignInBox boxText={'Sign in to set UAPTypeConfig'} />;
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
            <Text>You're connect to {getNetwork(walletNetworkId).name}.</Text>
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
      // todo pass isMissingPermissions to URDSetup
      return <URDSetup />;
    }

    return (
      <SetupBurntPixAssistant
        assistantAddress={params.assistantAddress as string}
      />
    );
  };

  return (
    <Box p={4} w="100%">
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4} w="100%">
        <Flex w="100%">
          <AssistantInfo assistant={forwarderAssistant} />
        </Flex>
        <Box border="1px" borderColor="gray.200" w="100%" />
        {renderConfigureBody()}
        <Box border="1px" borderColor="gray.200" w="100%" />
      </Flex>
    </Box>
  );
}
