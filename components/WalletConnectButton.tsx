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
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork,
} from '@reown/appkit/react';
import Link from 'next/link';
import { SiweMessage } from 'siwe';
import { BrowserProvider, Eip1193Provider, verifyMessage } from 'ethers';
import { formatAddress, getNetwork } from '@/utils/utils';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { useProfile } from '@/contexts/ProfileContext';

export default function WalletConnectButton() {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>('eip155');
  const toast = useToast({ position: 'bottom-left' });

  const { profile, mainControllerData, setMainControllerData } = useProfile();

  const isSigned =
    isConnected &&
    !!mainControllerData &&
    mainControllerData.upWallet === address;
  const connectTriggeredRef = useRef(false);

  const buttonText = isConnected
    ? profile?.name || formatAddress(address ?? '')
    : 'Sign In';
  const buttonStyles = isConnected
    ? { bg: '#DB7C3D', color: '#fff' }
    : { bg: '#FFF8DD', color: '#053241' };
  const profileImage: React.ReactNode =
    isConnected && profile?.mainImage ? (
      <Avatar
        size="sm"
        border="1px solid #053241"
        name={profile.name}
        src={profile.mainImage}
      />
    ) : null;

  const currentNetwork = chainId ? getNetwork(Number(chainId)) : undefined;
  const networkIcon = currentNetwork?.icon;
  const networkName = currentNetwork?.name;

  useEffect(() => {
    if (!isConnected) {
      connectTriggeredRef.current = false;
      return;
    }

    if (
      isSigned ||
      connectTriggeredRef.current ||
      !address ||
      !walletProvider ||
      !chainId
    ) {
      return;
    }

    connectTriggeredRef.current = true;
    (async () => {
      try {
        const provider = new BrowserProvider(walletProvider);
        const siweMessage = new SiweMessage({
          domain: window.location.host,
          uri: window.location.origin,
          address,
          statement:
            'Signing this message will enable the Universal Assistants Catalog to read your UP Browser Extension to manage Assistant configurations.',
          version: '1',
          chainId: Number(chainId),
          resources: [`${window.location.origin}/terms`],
        }).prepareMessage();

        // Try reusing session first, only prompt if necessary
        let signature: string;
        try {
          signature = await provider.send('personal_sign', [
            siweMessage,
            address,
          ]);
        } catch (err) {
          if (
            err.code === 'METHOD_NOT_FOUND' ||
            err.message.includes('not supported')
          ) {
            const signer = await provider.getSigner();
            signature = await signer.signMessage(siweMessage);
          } else {
            throw err;
          }
        }

        const mainUPController = verifyMessage(siweMessage, signature);
        setMainControllerData({ mainUPController, upWallet: address });
        toast({
          title: 'Success',
          description: 'Successfully signed in',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error: any) {
        console.error('Error signing the message:', error);
        if (
          error.code === 'ACTION_REJECTED' ||
          error.message.includes('user rejected')
        ) {
          toast({
            title: 'Sign In Cancelled',
            description: 'You cancelled the sign-in request.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Error',
            description: `Failed to sign in: ${error.message}`,
            status: 'error',
            duration: null,
            isClosable: true,
          });
          disconnect();
          connectTriggeredRef.current = false;
        }
      }
    })();
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

  const getProfileUrl = () => {
    if (!chainId || !address) return '/';
    const networkUrlName = getUrlNameByChainId(Number(chainId));
    return `/${networkUrlName}/profiles/${address}`;
  };

  if (isSigned) {
    return (
      <Menu>
        <MenuButton
          as={Button}
          fontFamily="Montserrat"
          fontWeight={600}
          border="1px solid #053241"
          borderRadius={10}
          {...buttonStyles}
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
      fontFamily="Montserrat"
      fontWeight={600}
      border="1px solid #053241"
      borderRadius={10}
      {...buttonStyles}
      onClick={() => open()}
      size="md"
    >
      {buttonText}
    </Button>
  );
}
