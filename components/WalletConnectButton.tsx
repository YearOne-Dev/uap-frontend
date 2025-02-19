'use client';
import React, { useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  useToast,
} from '@chakra-ui/react';
import {
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import Link from 'next/link';
import { SiweMessage } from 'siwe';
import { BrowserProvider, Eip1193Provider, verifyMessage } from 'ethers';

import { formatAddress, getNetwork } from '@/utils/utils';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { useProfile } from '@/contexts/ProfileContext';

export default function WalletConnectButton() {
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const toast = useToast({ position: 'bottom-left' });

  const { profile, mainControllerData, setMainControllerData } = useProfile();

  // Determine if we already have a mainControllerData entry for the current wallet
  const isSigned =
    Boolean(isConnected) &&
    Boolean(mainControllerData) &&
    mainControllerData?.upWallet === address;

  // Derived display variables
  const buttonText = isConnected
    ? profile?.name || formatAddress(address ?? '')
    : 'Sign In';

  const buttonStyles = isConnected
    ? { background: '#DB7C3D', color: '#fff' }
    : { background: '#FFF8DD', color: '#053241' };

  const profileImage =
    isConnected && profile?.mainImage ? (
      <Avatar
        size="sm"
        border="1px solid #053241"
        name={profile.name}
        src={profile.mainImage}
      />
    ) : null;

  const currentNetwork = chainId ? getNetwork(chainId) : undefined;
  const networkIcon = currentNetwork?.icon;
  const networkName = currentNetwork?.name;

  // We only want to run the sign-in once, so we use a ref to track if we've triggered it.
  const signTriggeredRef = useRef(false);

  // Attempt to sign the SIWE message if connected but not yet signed
  useEffect(() => {
    // Reset the ref if user disconnects
    if (!isConnected) {
      signTriggeredRef.current = false;
      return;
    }

    // If connected and not signed, run the signature flow once
    if (isConnected && !isSigned && !signTriggeredRef.current) {
      signTriggeredRef.current = true;
      (async () => {
        try {
          const provider = new BrowserProvider(
            walletProvider as Eip1193Provider
          );
          const siweMessage = new SiweMessage({
            domain: window.location.host,
            uri: window.location.origin,
            address: address,
            statement:
              'Signing this message will enable the Universal Assistants Catalog to read your UP Browser Extension to manage Assistant configurations.',
            version: '1',
            chainId: chainId,
            resources: [`${window.location.origin}/terms`],
          }).prepareMessage();

          const signer = await provider.getSigner(address);
          const signature = await signer.signMessage(siweMessage);
          const mainUPController = verifyMessage(siweMessage, signature);

          // Save the main controller data
          setMainControllerData({
            mainUPController,
            upWallet: address as string,
          });
        } catch (error: any) {
          console.error('Error signing the message:', error);
          if (!error.message.includes('user rejected action')) {
            toast({
              title: 'Error',
              description: `Error signing the message: ${error.message}`,
              status: 'error',
              duration: null,
              isClosable: true,
            });
          }
          disconnect();
          // If error, allow future sign attempts
          signTriggeredRef.current = false;
        }
      })();
    }
  }, [
    isConnected,
    isSigned,
    chainId,
    address,
    walletProvider,
    setMainControllerData,
    disconnect,
    toast,
  ]);

  // Build dynamic profile link
  const getProfileUrl = () => {
    if (!chainId || !address) return '/';
    const networkUrlName = getUrlNameByChainId(chainId);
    return `/${networkUrlName}/profiles/${address}`;
  };

  // If user is signed/connected, show the menu; otherwise, show a connect button
  if (isSigned) {
    return (
      <Menu>
        <MenuButton
          as={Button}
          style={{
            fontFamily: 'Montserrat',
            fontWeight: 600,
            border: '1px solid #053241',
            borderRadius: 10,
            ...buttonStyles,
          }}
          size="md"
        >
          <Flex gap={2} alignItems="center" justifyContent="center">
            {profileImage}
            {buttonText}
          </Flex>
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} href={getProfileUrl()}>
            Global Settings
          </MenuItem>
          <MenuDivider />
          <MenuGroup>
            <Flex
              mx={4}
              my={2}
              fontWeight={600}
              flexDirection="row"
              gap={2}
              alignItems="center"
            >
              <Box>Network:</Box>
              {networkIcon && (
                <Image height="20px" src={networkIcon} alt={networkName} />
              )}
            </Flex>
            <MenuItem onClick={() => open({ view: 'Networks' })}>
              Change network
            </MenuItem>
            <MenuItem onClick={() => disconnect()}>Sign out</MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    );
  }

  return (
    <Button
      style={{
        fontFamily: 'Montserrat',
        fontWeight: 600,
        border: '1px solid #053241',
        borderRadius: 10,
        ...buttonStyles,
      }}
      onClick={() => open()}
      size="md"
    >
      {buttonText}
    </Button>
  );
}
