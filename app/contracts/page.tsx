import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Heading,
  Image,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { useNetwork } from '@/contexts/NetworkContext';

export default function Contracts() {
  const { network } = useNetwork();
  return (
    <>
      <Flex w={'100%'} justifyContent={'flex-start'}>
        <Breadcrumb
          separator="/"
          color={'hashlists.orange'}
          fontFamily={'Tomorrow'}
          fontWeight={600}
        >
          <BreadcrumbItem>
            <BreadcrumbLink href="/">#</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="" mr={2}>
              Contracts
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
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
                href={`${network.explorer}address/${network.protocolAddress}`}
              >
                <Button>
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    gap={3}
                    flexDirection="row"
                    w="250px"
                  >
                    <Box>{network.name}</Box>
                    <FaExternalLinkAlt />
                    <Image
                      src={network.icon}
                      alt={network.icon}
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
