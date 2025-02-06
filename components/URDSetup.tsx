'use client';
import React, { useState } from 'react';
import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import {
  toggleUniveralAssistantsSubscribe,
  updateBECPermissions,
} from '@/utils/configDataKeyValueStore';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useProfile } from '@/contexts/ProfileContext';

type URDSetupProps = {
  extensionHasPermissions: boolean;
};

const URDSetup: React.FC<URDSetupProps> = ({ extensionHasPermissions }) => {
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { mainControllerData } = useProfile();
  const provider = new BrowserProvider(walletProvider as Eip1193Provider);
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  // State to track loading/transaction status for each action
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const [isInstallingProtocol, setIsInstallingProtocol] = useState(false);

  const handleUpdateBECPermissions = async () => {
    const upAddress = address as string;
    if (!upAddress) {
      toast({
        title: 'Error',
        description: 'No wallet address found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (mainControllerData?.mainUPController === undefined) {
      toast({
        title: 'Error',
        description: 'No UP Extension main controller found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingPermissions(true);
    try {
      // Send the transaction to update permissions
      const tx = await updateBECPermissions(
        provider,
        upAddress,
        mainControllerData.mainUPController
      );
      toast({
        title: 'Transaction sent',
        description: 'Waiting for confirmation...',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      toast({
        title: 'Success',
        description: 'Permissions granted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error updating permissions', error);
      toast({
        title: 'Error',
        description: `Error giving UP Extension permissions: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleInstallUAP = async () => {
    const upAddress = address as string;
    if (!upAddress) {
      toast({
        title: 'Error',
        description: 'No wallet address found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsInstallingProtocol(true);
    try {
      // Send the transaction to install the protocol
      const tx = await toggleUniveralAssistantsSubscribe(
        provider,
        upAddress,
        network.protocolAddress,
        network.defaultURDUP,
        false
      );
      toast({
        title: 'Transaction sent',
        description: 'Waiting for confirmation...',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      toast({
        title: 'Success',
        description: 'Universal Assistant Protocol installed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh the page after the protocol subscription tx is confirmed
      window.location.reload();
    } catch (error: any) {
      console.error(
        'Error subscribing to UAP Universal Receiver Delegate',
        error
      );
      toast({
        title: 'Error',
        description: `Error subscribing to UAP Universal Receiver Delegate: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsInstallingProtocol(false);
    }
  };

  return (
    <Box textAlign="center" maxWidth="600px" mx="auto" mt={8}>
      <Text fontSize="lg" fontWeight="semibold" mb={4}>
        In order to engage an 🆙 Assistant you must first subscribe to the
        Universal Assistant Protocol on your 🆙
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Instruction 1 */}
        <HStack justifyContent="space-between" align="center">
          <Text fontSize="md" textAlign="left" fontWeight="semibold" flex="1">
            1. Give the UP Browser Extension the necessary permissions to
            subscribe to the protocol
          </Text>
          <Button
            minW="130px"
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleUpdateBECPermissions}
            isDisabled={extensionHasPermissions}
            isLoading={isUpdatingPermissions}
          >
            Give Permissions
          </Button>
        </HStack>

        {/* Instruction 2 */}
        <HStack justifyContent="space-between" align="center">
          <Text fontSize="md" textAlign="left" fontWeight="semibold" flex="1">
            2. Install the Universal Assistant Protocol on your 🆙
          </Text>
          <Button
            minW="130px"
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleInstallUAP}
            isLoading={isInstallingProtocol}
          >
            Install Protocol
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default URDSetup;
