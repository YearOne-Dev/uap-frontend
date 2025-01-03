'use client';
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { formatAddress } from '@/utils/utils';
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

  const formatAddressForBreadcrumbs = (address: string | undefined) => {
    const truncatedAddress = formatAddress(address ? address : '');
    if (truncatedAddress === '0x') {
      return '';
    } else {
      return truncatedAddress;
    }
  };

  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Profile', href: `/${networkName}/profile/${address}` },
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
