'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatAddress, getNetwork } from '@/utils/utils';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { useProfile } from '@/contexts/ProfileProvider';
import { getImageFromIPFS } from '@/utils/ipfs'; // Assuming this utility exists
import { supportedNetworks } from '@/constants/supportedNetworks';

export default function WalletConnectButton() {
  const {
    profileDetailsData,
    isConnected,
    chainId,
    connectAndSign,
    disconnect,
    switchNetwork,
  } = useProfile();
  const toast = useToast({ position: 'bottom-left' });
  const connectTriggeredRef = useRef(false);
  const pathname = usePathname();
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined); // State for the main image

  const address = profileDetailsData?.upWallet;
  const profile = profileDetailsData?.profile;
  const isSigned = isConnected && !!profileDetailsData && !!profile;

  const buttonText =
    isSigned && profile
      ? profile.name || formatAddress(address ?? '')
      : 'Sign In';
  const buttonStyles =
    isSigned && profile
      ? { bg: '#DB7C3D', color: '#fff' }
      : { bg: '#FFF8DD', color: '#053241' };

  // Safely handle profile image (fetch only if needed)
  useEffect(() => {
    if (
      !isSigned ||
      !profile ||
      !profile.profileImage ||
      profile.profileImage.length === 0
    ) {
      setMainImage(undefined); // Reset if no profile image
      return;
    }

    const firstImage = profile.profileImage[0];
    if (!firstImage || !firstImage.url) {
      console.log('WalletConnectButton: No valid profile image URL found', {
        profileImage: profile.profileImage,
      });
      setMainImage(undefined);
      return;
    }

    const profileMainImage = firstImage.url;
    getImageFromIPFS(profileMainImage, Number(chainId))
      .then(image => {
        setMainImage(image);
      })
      .catch(err => {
        console.error(
          'WalletConnectButton: Failed to fetch mainImage from IPFS:',
          err
        );
        setMainImage(undefined);
      });
  }, [isSigned, profile, chainId]); // Depend on profile and chainId to trigger re-fetch

  const profileImage = mainImage ? (
    <Avatar
      size="sm"
      border="1px solid #053241"
      name={profile?.name || ''}
      src={mainImage}
    />
  ) : null;

  const currentNetwork = chainId ? getNetwork(chainId) : undefined;
  const networkIcon = currentNetwork?.icon;
  const networkName = currentNetwork?.name;

  const appChainId = pathname.includes(supportedNetworks['4201'].urlName)
    ? 4201
    : supportedNetworks['42'].urlName || pathname === '/'
      ? 42
      : 4201;

  useEffect(() => {
    if (!isConnected || !chainId || !profileDetailsData) {
      connectTriggeredRef.current = false;
      setIsNetworkModalOpen(false);
      return;
    }
    console.log('WalletConnectButton: Checking network mismatch', {
      chainId,
      appChainId,
    });

    if (chainId !== appChainId) {
      setIsNetworkModalOpen(true);
    } else {
      setIsNetworkModalOpen(false);
    }

    if (isSigned || connectTriggeredRef.current || !address) {
      return;
    }

    connectTriggeredRef.current = true;
  }, [isConnected, chainId, address, isSigned, profileDetailsData, appChainId]);

  const getProfileUrl = () => {
    if (!chainId || !address) return '/';
    const networkUrlName = getUrlNameByChainId(chainId);
    return `/${networkUrlName}/profiles/${address}`;
  };

  const handleNetworkSwitch = async () => {
    try {
      const targetChainId = chainId === 42 ? 4201 : 42; // Toggle between Mainnet and Testnet
      await switchNetwork(targetChainId);
      toast({
        title: 'Network Changed',
        description: `Switched to ${supportedNetworks[targetChainId].displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleSwitchToAppNetwork = async () => {
    try {
      await switchNetwork(appChainId);
      setIsNetworkModalOpen(false);
      toast({
        title: 'Network Changed',
        description: `Switched to ${supportedNetworks[appChainId].displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  const handleConnect = async () => {
    try {
      await connectAndSign();
      toast({
        title: 'Success',
        description: 'Successfully signed in',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to sign in: ${error.message}`,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    }
  };

  if (isSigned) {
    return (
      <>
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
              <MenuItem onClick={handleNetworkSwitch}>Change network</MenuItem>
              <MenuItem onClick={disconnect}>Sign out</MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
        <Modal
          isOpen={isNetworkModalOpen}
          onClose={() => setIsNetworkModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Network Mismatch</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>
                Your wallet is connected to{' '}
                {supportedNetworks[Number(chainId)]?.displayName} (Chain ID:{' '}
                {chainId}), but the app is on{' '}
                {supportedNetworks[Number(appChainId)]?.displayName} (Chain ID:{' '}
                {appChainId}). Please switch your wallet network to continue.
              </Text>
              <Button colorScheme="blue" onClick={handleSwitchToAppNetwork}>
                Switch to {supportedNetworks[Number(appChainId)]?.displayName}
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <Button
      fontFamily="Montserrat"
      fontWeight={600}
      border="1px solid #053241"
      borderRadius={10}
      {...buttonStyles}
      onClick={handleConnect}
      size="md"
    >
      {buttonText}
    </Button>
  );
}
