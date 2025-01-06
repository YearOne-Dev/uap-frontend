'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssistantInfo from '@/components/AssistantInfo';
import {
  curationCheckerAssistant,
  forwarderAssistant,
} from '@/constants/dummyData';

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
        w="100%"
        flexDirection="column"
        flexWrap="wrap"
        // px={[4, 8, 16]} // Responsive padding for small, medium, and large screens
      >
        <Flex
          gap={[4, 8, 20]} // Adjust gap based on screen size
          flex="1"
          w="100%"
          flexDirection={['column', 'column', 'row']} // Stack on smaller screens
          maxWidth="1400px"
        >
          <Box flex="1">
            <Box
              color="uap.font"
              fontFamily="Montserrat"
              fontSize={['lg', 'xl', '2xl']} // Responsive font size
              fontWeight={700}
              mb={4}
            >
              Executive Assistants
            </Box>
            <Box
              border="1px solid"
              borderColor="uap.font"
              borderRadius={10}
              p={4}
            >
              <AssistantInfo assistant={forwarderAssistant} />
            </Box>
          </Box>
          <Box flex="1">
            <Box
              color="uap.font"
              fontFamily="Montserrat"
              fontSize={['lg', 'xl', '2xl']} // Responsive font size
              fontWeight={700}
              mb={4}
            >
              Screener Assistants
            </Box>
            <Box
              border="1px solid"
              borderColor="uap.font"
              borderRadius={10}
              p={4}
            >
              <AssistantInfo assistant={curationCheckerAssistant} />
            </Box>
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
