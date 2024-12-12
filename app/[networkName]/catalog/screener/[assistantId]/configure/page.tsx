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

export default function ConfigureAssistantPage({
  params,
}: {
  params: { assistantId: string; networkName: string };
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
            urlTemplate={`/catalog/screener/${params.assistantId}/configure`}
          />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${networkName}/catalog`} ml={2} mr={2}>
            Catalog
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/${networkName}/catalog/screener`}
            ml={2}
            mr={2}
          >
            Screener
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/${networkName}/catalog/screener/${params.assistantId}`}
            ml={2}
            mr={2}
          >
            Assistant {params.assistantId}
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
          CATALOG SCREENER ASSISTANT CONFIGURE PAGE
        </Box>
      </Flex>
    </>
  );
}
