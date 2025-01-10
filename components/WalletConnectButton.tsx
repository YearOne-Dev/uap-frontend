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
import { BrowserProvider, Eip1193Provider, verifyMessage } from 'ethers';

export default function WalletConnectButton() {
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { setMainControllerData, mainControllerData, profile } = useProfile();
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

  const shouldDisplaySignature =
    isConnected &&
    (!mainControllerData || mainControllerData.upWallet !== address);

  useEffect(() => {
    const handleSignMessage = async () => {
      console.log('mainControllerData:', mainControllerData);
      if (shouldDisplaySignature) {
        setUserConnected(true);

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

          // Save the main controller and UP wallet in the context
          setMainControllerData({
            mainUPController,
            upWallet: address as string,
          });

          console.log('Signature:', signature);
        } catch (error) {
          console.error('Error signing the message:', error);
        }
      } else {
        setUserConnected(false);
      }
    };

    handleSignMessage();
  }, [
    isConnected,
    address,
    chainId,
    walletProvider,
    mainControllerData,
    setMainControllerData,
    shouldDisplaySignature,
  ]);

  useEffect(() => {
    if (chainId) {
      const currentNetwork = getNetwork(chainId!);
      setNetworkIcon(currentNetwork.icon);
      setNetworkName(currentNetwork.name);
    }
  }, [chainId]);

  const getProfileUrl = () => {
    if (!chainId || !address) return '/';
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
