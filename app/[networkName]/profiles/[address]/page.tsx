'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import ReadConfiguredAssistants from '@/components/ReadConfiguredAssistants';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import Breadcrumbs from '@/components/Breadcrumbs';
export default function ProfilePage({
  params,
}: {
  params: { address: string; networkName: string };
}) {
  const { address, networkName } = params;
  const network = getChainIdByUrlName(networkName);


  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: '/' },
      { name: 'Profile', href: `/${networkName}/profiles/${address}` },
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
          <ReadConfiguredAssistants
            upAddress={address as string}
            networkId={network}
          />
        </Box>
      </Flex>
    </>
  );
}
