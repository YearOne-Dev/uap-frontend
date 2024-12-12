'use client';
import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
} from '@chakra-ui/react';
import WalletNetworkSelectorButton from '@/components/AppNetworkSelectorDropdown';
import { getChainIdByUrlName } from '@/utils/universalProfile';

export default function CatalogPage({
  params,
}: {
  params: { networkName: string };
}) {
  const { networkName } = params;
  const network = getChainIdByUrlName(networkName);

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
          <WalletNetworkSelectorButton
            currentNetwork={network}
            urlTemplate={`/catalog`}
          />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" ml={2} mr={2}>
            Catalog
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
          CATALOG PAGE
        </Box>
      </Flex>
    </>
  );
}
