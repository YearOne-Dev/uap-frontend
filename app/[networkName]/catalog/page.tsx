'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssistantInfo from '@/components/AssistantInfo';
import { networkNameToIdMapping, supportedNetworks } from "@/constants/supportedNetworks";

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
      <Flex display="flex" w="100%" flexDirection="column" flexWrap="wrap">
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
              <AssistantInfo
                assistant={{
                  address: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
                  name: 'Universal Profile Assistant',
                  description: 'The Universal Profile Assistant is a decentralized application that allows users to manage their universal profiles.',
                  iconPath: '/lyx_icon_mainnet.svg',
                  links: [{
                    name: 'X',
                    url: 'https://x.com/yearone_io',
                  }],
                  creatorAddress: '0x',
                  supportedTransactionTypes: [],
                  chainId: networkNameToIdMapping[params.networkName],
                  assistantType: 'Executive',
                  configParams: [],
                }}
                includeLink
              />
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
              <AssistantInfo assistant={{
                address: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
                name: 'Universal Profile Assistant',
                description: 'The Universal Profile Assistant is a decentralized application that allows users to manage their universal profiles.',
                iconPath: '/lyx_icon_mainnet.svg',
                links: [{
                  name: 'X',
                  url: 'https://x.com/yearone_io',
                }],
                creatorAddress: '0x',
                supportedTransactionTypes: [],
                chainId: networkNameToIdMapping[params.networkName],
                assistantType: 'Screener',
                configParams: [],
              }} includeLink />
            </Box>
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
