'use client';
import React from 'react';
import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react';
import { BrowserProvider, Eip1193Provider, verifyMessage } from 'ethers';
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

const URDSetup: React.FC = () => {
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useWeb3ModalProvider();
  const { mainControllerData } = useProfile();
  const provider = new BrowserProvider(walletProvider as Eip1193Provider);
  const { address } = useWeb3ModalAccount();
  const { network } = useNetwork();

  /*
  Error giving UP Extension permissions: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons: 1. You might have mismatching versions of React and the renderer (such as React DOM) 2. You might be breaking the Rules of Hooks 3. You might have more than one copy of React in the same app See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.
  */

  const handleUpdateBECPermissions = async () => {
    try {
      const upAddress = address as string;
      if (mainControllerData?.mainUPController === undefined) {
        throw new Error('No UP Extension main controller found');
      }
      await updateBECPermissions(
        provider,
        upAddress,
        mainControllerData?.mainUPController
      );
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
    }
  };

  const handleInstallUAP = async () => {
    const upAddress = address as string;
    try {
      await toggleUniveralAssistantsSubscribe(
        provider,
        upAddress,
        network.protocolAddress,
        network.defaultURDUP,
        false
      );
      toast({
        title: 'Success',
        description: 'Universal Assistant Protocol installed.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error(
        'Error subscribing to UAP Universal Receiver Delegate',
        error
      );
      toast({
        title: 'Error',
        description: `EError subscribing to UAP Universal Receiver Delegate: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box textAlign="center" maxWidth="600px" mx="auto" mt={8}>
      <Text fontSize="lg" fontWeight="semibold" mb={4}>
        In order to engage an assistant you must first install the Universal
        Assistant Protocol on your 🆙
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Instruction 1 */}
        <HStack justifyContent="space-between" align="center">
          <Text fontSize="md" textAlign="left" fontWeight="semibold" flex="1">
            1. Give the UP Browser Extension the necessary permissions to engage
            the protocol
          </Text>
          <Button
            minW="130px"
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleUpdateBECPermissions}
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
          >
            Install Protocol
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default URDSetup;
