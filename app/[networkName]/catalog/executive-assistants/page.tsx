'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ExecutiveAssistantsPage({
  params,
}: {
  params: { networkName: string };
}) {
  const { networkName } = params;
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      {
        name: 'Executives',
        href: `/${networkName}/catalog/executive-assistants`,
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
          EXECUTIVE ASSISTANTS PAGE
        </Box>
      </Flex>
    </>
  );
}
