'use client';
import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
} from '@chakra-ui/react';
import { Eip1193Provider } from 'ethers';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { formatAddress } from '@/utils/utils';
import ConfiguredAssistants from '@/components/ConfiguredAssistants';
import { useNetwork } from '@/contexts/NetworkContext';
import WalletNetworkSelectorButton from '@/components/AppNetworkSelectorDropdown';

const ProfilePage = () => {
  const { address, chainId: walletNetworkId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { network } = useNetwork();

  const formatAddressForBreadcrumbs = (address: string | undefined) => {
    const truncatedAddress = formatAddress(address ? address : '');
    if (truncatedAddress === '0x') {
      return '';
    } else {
      return truncatedAddress;
    }
  };

  const breadCrumbs = (
    <>
      <Breadcrumb
        separator="/"
        color={'hashlists.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <WalletNetworkSelectorButton
            currentNetwork={network.chainId}
            urlTemplate={() => `/urd`}
          />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" mr={2}>
            Profile {formatAddressForBreadcrumbs(address)}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    </>
  );

  return (
    <>
      {breadCrumbs}
      <Flex
        display="flex"
        w={'100%'}
        flexDirection={'column'}
        flexWrap={'wrap'}
        gap={4}
        mt={4}
      >
        <Box flex="1" w={'100%'} maxWidth="800px">
          <ConfiguredAssistants
            upAddress={address as string}
            networkId={walletNetworkId as number}
            walletProvider={walletProvider as Eip1193Provider}
          />
        </Box>
      </Flex>
    </>
  );
};

export default ProfilePage;
