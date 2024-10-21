import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Heading,
} from '@chakra-ui/react';
import { formatAddress } from '@/utils/utils';

type PageProps = {
  params: {
    address: string;
  };
};

export default function Profile({ params }: PageProps) {
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
              Profile
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="" mr={2}>
              {formatAddress(params.address)}
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
            Viewing {params.address}
          </Heading>
        </Flex>
      </Flex>
    </>
  );
}
