'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ConfigureAssistantPage({
  params,
}: {
  params: { assistantAddress: string; networkName: string };
}) {
  const { networkName } = params;

  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      {
        name: 'Screeners',
        href: `/${networkName}/catalog`,
      },
      {
        name: `Screener ${params.assistantAddress}`,
        href: `/${networkName}/catalog/screener-assistants/${params.assistantAddress}`,
      },
      {
        name: 'Configure',
        href: `/${networkName}/catalog/screener-assistants/${params.assistantAddress}/configure`,
      },
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
          CATALOG SCREENER ASSISTANT CONFIGURE PAGE
        </Box>
      </Flex>
    </>
  );
}
