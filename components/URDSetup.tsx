import React from 'react';
import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react';
import { BrowserProvider, Eip1193Provider, verifyMessage } from 'ethers';
import {
  toggleUniveralAssistantsSubscribe,
  updateBECPermissions,
} from '@/utils/configDataKeyValueStore';
import { SiweMessage } from 'siwe';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useProfile } from '@/contexts/ProfileContext';

const URDSetup: React.FC = () => {
  const toast = useToast({ position: 'bottom-left' });
  const { walletProvider } = useAppKitProvider('eip155');
  const provider = new BrowserProvider(walletProvider as Eip1193Provider);
  const { address } = useAppKitAccount();
  const { network } = useNetwork();
  const { setMainUPController } = useProfile();

  const handleUpdateBECPermissions = async () => {
    try {
      const upAddress = address as string;
      const signer = await provider.getSigner(upAddress);
      // Assuming the user is interacting with their own UP// Prepare a message with the SIWE-specific format
      const siweMessage = new SiweMessage({
        domain: window.location.host, // Domain requesting the signing
        uri: window.location.origin,
        address: upAddress, // Address performing the signing
        statement:
          'Signing this message will enable the Universal Assistants Catalog to allow your UP Browser Extension to manage Assistant configurations.', // Human-readable assertion the user signs  // URI from the resource that is the subject of the signature
        version: '1', // Current version of the SIWE Message
        chainId: network.chainId, // Chain ID to which the session is bound to
        resources: [`${window.location.origin}/terms`], // Authentication resource as part of authentication by the relying party
      }).prepareMessage();
      // Request the extension to sign the message
      const signature = await signer.signMessage(siweMessage);
      const mainUPController = verifyMessage(siweMessage, signature);
      setMainUPController(mainUPController);
      await updateBECPermissions(provider, upAddress, mainUPController!);
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
        description: `Error setting UAPTypeConfig: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInstallUAP = async () => {
    const upAddress = address as string;
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
