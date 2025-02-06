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
  const networkConfig = supportedNetworks[networkNameToIdMapping[params.networkName]];
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: `/${params.networkName}` },
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
              {
                networkConfig.assistants.map((assistant) => (
                  <Box
                    border="1px solid"
                    borderColor="uap.font"
                    borderRadius={10}
                    p={4}
                  >
                  <AssistantInfo key={assistant.address} assistant={assistant} includeLink />
                  </Box>
                ))
              }
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
