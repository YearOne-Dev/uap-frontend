'use client';
import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Image,
} from '@chakra-ui/react';
import { formatAddress } from '@/utils/utils';
import ReadConfiguredAssistants from '@/components/ReadConfiguredAssistants';
import { supportedNetworks } from '@/constants/supportedNetworks';
export default function ProfilePage({
  params,
}: {
  params: { address: string; network: number };
}) {
  const { address, network } = params;
  console.log('address', address);
  const { icon, displayName, chainId } = supportedNetworks[network];

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
        <Image src={icon} alt={icon} height={'30px'} />
        <Box ml={2}>{displayName} /</Box>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" ml={2} mr={2}>
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
          <ReadConfiguredAssistants
            upAddress={address as string}
            networkId={Number(chainId)}
          />
        </Box>
      </Flex>
    </>
  );
}
