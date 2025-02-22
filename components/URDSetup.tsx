'use client';
import React, { useState } from 'react';
import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react';
import { BrowserProvider } from 'ethers';
import {
  subscribeToUapURD,
  updateBECPermissions,
} from '@/utils/configDataKeyValueStore';
import {
  CHAINS,
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { useProfile } from '@/contexts/ProfileProvider';

type URDSetupProps = {
  networkName: CHAINS;
  extensionHasPermissions: boolean;
};

const URDSetup: React.FC<URDSetupProps> = ({
  extensionHasPermissions,
  networkName,
}) => {
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData, isConnected } = useProfile();
  const network = supportedNetworks[networkNameToIdMapping[networkName]];

  const address = profileDetailsData?.upWallet;

  // State to track loading/transaction status for each action
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const [isInstallingProtocol, setIsInstallingProtocol] = useState(false);
  const [hasExtensionPermissions, setHasExtensionPermissions] = useState(
    extensionHasPermissions
  );

  const handleUpdateBECPermissions = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Error',
        description: 'No wallet address found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!profileDetailsData?.mainUPController) {
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
      const provider = new BrowserProvider(window.lukso);
      await updateBECPermissions(
        provider,
        address,
        profileDetailsData.mainUPController
      );

      toast({
        title: 'Success',
        description: 'Permissions granted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setHasExtensionPermissions(true);
    } catch (error: any) {
      console.error('Error updating permissions', error);
      if (!error.message?.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error giving UP Extension permissions: ${error.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleInstallUAP = async () => {
    if (!isConnected || !address) {
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
      const provider = new BrowserProvider(window.lukso);
      await subscribeToUapURD(provider, address, network.protocolAddress);
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

      window.location.reload(); // Refresh page after confirmation
    } catch (error: any) {
      console.error(
        'Error subscribing to UAP Universal Receiver Delegate',
        error
      );
      if (!error.message?.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error subscribing to UAP Universal Receiver Delegate: ${error.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
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
            isDisabled={hasExtensionPermissions || !isConnected}
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
            isDisabled={!isConnected || !hasExtensionPermissions}
          >
            Install Protocol
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default URDSetup;
