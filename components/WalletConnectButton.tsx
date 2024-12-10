'use client';
import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Image,
  MenuGroup,
  Box,
  MenuDivider,
} from '@chakra-ui/react';
import {
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
} from '@web3modal/ethers/react';
import { formatAddress, getNetwork } from '@/utils/utils';
import { useProfile } from '@/contexts/ProfileContext';
import Link from 'next/link';

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
    if (isConnected) {
      setUserConnected(true);
    } else {
      setUserConnected(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (chainId) {
      const currentNetwork = getNetwork(chainId!);
      setNetworkIcon(currentNetwork.icon);
      setNetworkName(currentNetwork.name);
    }
  }, [chainId]);

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
        <MenuItem as={Link} href={`${chainId}/profile/${address}`}>
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
