'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssistantInfo from '@/components/AssistantInfo';
import { forwarderAssistant } from '@/constants/dummyData';

export default function CatalogPage({
  params,
}: {
  params: { networkName: string };
}) {
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Catalog', href: `/${params.networkName}/catalog` },
    ],
  });
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
          <Box>Executive Assistants</Box>
          <AssistantInfo assistant={forwarderAssistant} />

          <Box>Screener Assistants</Box>
        </Box>
      </Flex>
    </>
  );
}
