'use client';
import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
} from '@chakra-ui/react';
import { formatAddress } from '@/utils/utils';
import ReadConfiguredAssistants from '@/components/ReadConfiguredAssistants';
import { getChainIdByUrlName } from '@/utils/universalProfile';

export default function ProfileConfigurePage({
  params,
}: {
  params: { address: string; networkName: string };
}) {
  const { address, networkName } = params;
  const network = getChainIdByUrlName(networkName);

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
        color={'uap.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${network}/profile/${address}`} ml={2} mr={2}>
            Profile {formatAddressForBreadcrumbs(address)}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" ml={2} mr={2}>
            Configure
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
            networkId={network}
          />
        </Box>
      </Flex>
    </>
  );
}
