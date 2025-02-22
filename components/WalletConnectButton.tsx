'use client';
import React, { useEffect } from 'react';
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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatAddress, getNetwork } from '@/utils/utils';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { useProfile } from '@/contexts/ProfileProvider';
import { getImageFromIPFS } from '@/utils/ipfs';

export default function WalletConnectButton() {
  const {
    profileDetailsData,
    isConnected,
    chainId,
    connectAndSign,
    disconnect,
    switchNetwork,
  } = useProfile();
  const [mainImage, setMainImage] = React.useState<string | null>(null);
  const [appChainId, setAppChainId] = React.useState<number | null>(null);
  const toast = useToast({ position: 'bottom-left' });
  const pathname = usePathname();

  const address = profileDetailsData?.upWallet;
  const isSigned =
    isConnected && !!profileDetailsData && !!profileDetailsData.profile;

  const buttonText =
    isSigned && profileDetailsData.profile
      ? profileDetailsData.profile.name || formatAddress(address ?? '')
      : 'Sign In';
  const buttonStyles =
    isSigned && profileDetailsData.profile
      ? { bg: '#DB7C3D', color: '#fff' }
      : { bg: '#FFF8DD', color: '#053241' };
  const profileImage =
    isSigned && profileDetailsData.profile && mainImage ? (
      <Avatar
        size="sm"
        border="1px solid #053241"
        name={profileDetailsData.profile.name}
        src={mainImage} // Assuming IPFS hash
        onError={() => console.log('Failed to load profile image')}
      />
    ) : null;

  const currentNetwork = chainId ? getNetwork(chainId) : undefined;
  const networkIcon = currentNetwork?.icon;
  const networkName = currentNetwork?.name;

  useEffect(() => {
    setAppChainId(pathname.includes('/lukso-testnet') ? 4201 : 42);
  }, [pathname]);

  // fetch main image whenever profile
  useEffect(() => {
    if (
      !profileDetailsData ||
      !profileDetailsData.profile ||
      !profileDetailsData.profile.profileImage ||
      !chainId
    ) {
      setMainImage(null);
      return;
    }
    const profileMainImage = profileDetailsData.profile.profileImage[0].url;
    getImageFromIPFS(profileMainImage, Number(chainId)).then(image => {
      setMainImage(image);
    });
  }, [profileDetailsData, chainId]);

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
        description: `Switched to ${targetChainId === 42 ? 'Lukso Mainnet' : 'Lukso Testnet'}`,
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

  if (isSigned && chainId !== appChainId) {
    return (
      <Button
        fontFamily="Montserrat"
        fontWeight={600}
        border="1px solid #053241"
        borderRadius={10}
        {...buttonStyles}
        onClick={handleNetworkSwitch}
        size="md"
      >
        {`Switch to ${Number(appChainId) === 42 ? 'LUKSO' : 'LUKSO Testnet'}`}
      </Button>
    );
  }

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
