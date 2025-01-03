'use client';
import React from 'react';
import { Flex, Image, Text, VStack } from '@chakra-ui/react';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';
import { curationCheckerAssistant, forwarderAssistant } from '@/constants/dummyData';
import AssistantSmallCard from './AssistantSmallCard';

const LandingBox = () => {
  const { isConnected, chainId } = useWeb3ModalAccount();
  const networkId = isConnected && chainId ? chainId : 42;

  return (
    <Flex
      minHeight={'inherit'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
      w={'100%'}
    >
      <VStack textAlign="center" spacing={0}>
        <Image
          src="/logo-uap.png"
          alt="UAP logo"
          height={{ base: '150px', md: '285px' }}
        />
        <Text
          as="h1"
          fontFamily={'Tomorrow'}
          fontSize="5xl"
          fontWeight="500"
          color="uap.grey"
        >
          <Flex align="center" justify="center">
            <Text
              as="span"
              fontSize={{
                base: '2xl',
                sm: '3xl',
                md: '4xl',
              }}
            >
              🆙 Assistants Catalog
            </Text>
          </Flex>
        </Text>
        <Text
          lineHeight="34px"
          fontSize={{
            base: 'lg',
            sm: 'xl',
            md: '2xl',
          }}
          color="uap.grey"
          fontFamily="Montserrat"
          fontWeight={500}
          align="center"
        >
          Engage your personal digital assistant
        </Text>
      </VStack>
      <Flex mt='20px' gap='5'>
        <AssistantSmallCard screener={curationCheckerAssistant} />
        <AssistantSmallCard screener={forwarderAssistant} />
      </Flex>
    </Flex>
  );
};

export default LandingBox;
