'use client';
import React, { useEffect, useState } from 'react';
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
} from '@chakra-ui/react';
import {
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { formatAddress, getNetwork } from '@/utils/utils';
import { useProfile } from '@/contexts/ProfileContext';
import Link from 'next/link';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { SiweMessage } from 'siwe';
import { BrowserProvider, Eip1193Provider } from 'ethers';

export default function WalletConnectButton() {
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address, isConnected, chainId } = useWeb3ModalAccount();

  const { profile } = useProfile();
  const [networkIcon, setNetworkIcon] = useState<string>();
  const [networkName, setNetworkName] = useState<string>();
  const [userConnected, setUserConnected] = useState(false);
  const [buttonMessage, setButtonMessage] = useState('Sign In');
  const [buttonStyling, setButtonStyling] = useState({
    background: '#FFF8DD',
    color: '#053241',
  });
  const { walletProvider } = useWeb3ModalProvider();

  useEffect(() => {
    setButtonMessage(
      isConnected
        ? profile?.name
          ? profile.name
          : formatAddress(address as string)
        : 'Sign In'
    );
  }, [profile, isConnected, address]);

  useEffect(() => {
    setButtonStyling(
      isConnected
        ? { background: '#DB7C3D', color: '#fff' }
        : { background: '#FFF8DD', color: '#053241' }
    );
  }, [isConnected]);

  const profileImage =
    isConnected && profile && profile.mainImage ? (
      <Avatar
        size={'sm'}
        border={'1px solid #053241'}
        name={profile.name}
        src={profile.mainImage}
      />
    ) : null;

  
useEffect(() => {
  const handleSignMessage = async () => {
    if (isConnected) {
      setUserConnected(true);

      try {
        // Prepare the SIWE message
        const provider = new BrowserProvider(walletProvider as Eip1193Provider);

        const siweMessage = new SiweMessage({
          domain: window.location.host, // Domain requesting the signing
          uri: window.location.origin,
          address: address, // Address performing the signing
          statement:
            'Signing this message will enable the Universal Assistants Catalog to allow your UP Browser Extension to manage Assistant configurations.', // Human-readable assertion the user signs
          version: '1', // Current version of the SIWE Message
          chainId: chainId, // Chain ID to which the session is bound
          resources: [`${window.location.origin}/terms`], // Authentication resource
        }).prepareMessage();

        // Get the signer and sign the message
        const signer = await provider.getSigner(address);
        const signature = await signer.signMessage(siweMessage);

        // Log or store the signature
        console.log('Signature:', signature);
      } catch (error) {
        console.error('Error signing the message:', error);
      }
    } else {
      setUserConnected(false);
    }
  };

  handleSignMessage(); // Call the async function
}, [isConnected, address, chainId,
  walletProvider]);

  useEffect(() => {
    if (chainId) {
      const currentNetwork = getNetwork(chainId!);
      setNetworkIcon(currentNetwork.icon);
      setNetworkName(currentNetwork.name);
    }
  }, [chainId]);

  const getProfileUrl = () => {
    if (!chainId || !address) return '/'; // lint
    const networkUrlName = getUrlNameByChainId(chainId);
    return `/${networkUrlName}/profile/${address}`;
  };

  return userConnected ? (
    <Menu>
      <MenuButton
        as={Button}
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 600,
          border: '1px solid #053241',
          borderRadius: 10,
          ...buttonStyling,
        }}
        size={'md'}
      >
        <Flex gap={2} alignItems={'center'} justifyContent={'center'}>
          {profileImage}
          {buttonMessage}
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem as={Link} href={getProfileUrl()}>
          View profile
        </MenuItem>
        <MenuDivider />
        <MenuGroup>
          <Flex
            mx={4}
            my={2}
            fontWeight={600}
            flexDirection={'row'}
            gap={2}
            alignItems={'center'}
          >
            <Box>Network:</Box>
            <Image height={'20px'} src={networkIcon} alt={networkName} />
          </Flex>
          <MenuItem onClick={() => open({ view: 'Networks' })}>
            Change network
          </MenuItem>
          <MenuItem onClick={() => disconnect()}>Sign out</MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  ) : (
    <Button
      style={{
        fontFamily: 'Montserrat',
        fontWeight: 600,
        border: '1px solid #053241',
        borderRadius: 10,
        ...buttonStyling,
      }}
      onClick={() => open()}
      size={'md'}
    >
      {buttonMessage}
    </Button>
  );
}
