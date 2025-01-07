'use client';
import React from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { Flex, Image, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import {
  curationCheckerAssistant,
  forwarderAssistant,
} from '@/constants/dummyData';
import AssistantSmallCard from './AssistantSmallCard';

const LandingBox = () => {
  return (
    <Flex
      minHeight="inherit"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      w="100%"
      p={[4, 6, 8]} // Add padding for small to larger screens
    >
      <VStack textAlign="center" spacing={4}>
        <Image
          src="/logo-uap.png"
          alt="UAP logo"
          height={{ base: '150px', md: '285px' }}
        />
        <Text
          as="h1"
          fontFamily="Tomorrow"
          fontSize={{
            base: '3xl',
            sm: '4xl',
            md: '5xl',
          }}
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
            base: 'md',
            sm: 'lg',
            md: 'xl',
          }}
          color="uap.grey"
          fontFamily="Montserrat"
          fontWeight={500}
          align="center"
        >
          Engage your personal digital assistant
        </Text>
      </VStack>
      {/* Adjust Assistant Cards */}
      <Wrap
        mt="20px"
        spacing={5}
        justify="center"
        w="100%" // Full width for cards
      >
        <WrapItem>
          <AssistantSmallCard
            assistant={curationCheckerAssistant}
            includeLink
          />
        </WrapItem>
        <WrapItem>
          <AssistantSmallCard assistant={forwarderAssistant} includeLink />
        </WrapItem>
      </Wrap>
    </Flex>
  );
};

export default LandingBox;
