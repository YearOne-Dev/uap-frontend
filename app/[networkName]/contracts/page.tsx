'use client';
import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Link as ChakraLink,
} from '@chakra-ui/react';
import {
  CHAINS,
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import { FaExternalLinkAlt } from 'react-icons/fa';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getNetwork } from '@/utils/utils';

export default function Contracts({
  params,
}: {
  params: { networkName: CHAINS };
}) {
  const network = getNetwork(networkNameToIdMapping[params.networkName]);
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UP Assistants', href: `/${params.networkName}` },
      { name: 'Contracts', href: `/${params.networkName}/contracts` },
    ],
  });

  return (
    <>
      <Flex w={'100%'} justifyContent={'flex-start'}>
        {breadCrumbs}
      </Flex>
      <Flex
        display="flex"
        w={'100%'}
        flexDirection={'row'}
        flexWrap={'wrap'}
        gap={16}
        justifyContent="center"
        alignItems="center"
      >
        <Flex
          justifyContent="center"
          alignItems="center"
          flexDir={'column'}
          w={'100%'}
          maxWidth="250px"
          gap={3}
        >
          <Heading
            fontSize={'lg'}
            fontWeight={600}
            fontFamily={'Tomorrow'}
            color={'#053241'}
          >
            View Universal Assistant protocol contract deployments
          </Heading>
          {Object.keys(supportedNetworks).map((networkId: string) => {
            return (
              <ChakraLink
                isExternal
                key={networkId}
                href={`${supportedNetworks[networkId].explorer}address/${supportedNetworks[networkId].protocolAddress}`}
              >
                <Button>
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    gap={3}
                    flexDirection="row"
                    w="250px"
                  >
                    <Box>{supportedNetworks[networkId].name}</Box>
                    <FaExternalLinkAlt />
                    <Image
                      src={supportedNetworks[networkId].icon}
                      alt={supportedNetworks[networkId].icon}
                      height={'30px'}
                    />
                  </Flex>
                </Button>
              </ChakraLink>
            );
          })}
        </Flex>
      </Flex>
    </>
  );
}
