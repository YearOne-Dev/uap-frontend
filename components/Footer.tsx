import React from 'react';
import { Box, Flex, Text, Link } from '@chakra-ui/react';
import { FaSquareGithub, FaBookMedical, FaDatabase } from 'react-icons/fa6';

export default function Footer() {
  return (
    <Box
      as="footer"
      borderTop="2px solid var(--chakra-colors-uap-grey)"
      height={'90px'}
      className="uap-footer"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        py={8}
        px={{ base: '20px', md: '50px' }}
      >
        <Flex alignItems="center">
          <Flex gap={3} display={['none', 'none', 'flex']}>
            <Link
              href="https://github.com/yearone-io/uap-protocol"
              isExternal
              fontSize="24px"
            >
              <FaSquareGithub color={'var(--chakra-colors-uap-grey)'} />
            </Link>
            <Link href={'/contracts'}>
              <Text fontSize="md" fontWeight={400} letterSpacing={1.5}>
                Contracts
              </Text>
            </Link>
            <Link href={'https://docs.uap.xyz'}>
              <Text fontSize="md" fontWeight={400} letterSpacing={1.5}>
                Docs
              </Text>
            </Link>
          </Flex>
          <Flex gap={3} display={['flex', 'flex', 'none']} alignItems="center">
            <Link
              href="https://github.com/yearone-io/uap-protocol"
              isExternal
              fontSize="24px"
            >
              <FaSquareGithub color={'var(--chakra-colors-uap-grey)'} />
            </Link>
            <Link href={'/contracts'} fontSize="20px">
              <FaDatabase color={'var(--chakra-colors-uap-grey)'} />
            </Link>
            <Link href={'https://docs.uap.xyz'} fontSize="20px">
              <FaBookMedical color={'var(--chakra-colors-uap-grey)'} />
            </Link>
          </Flex>
        </Flex>
        <Text
          fontSize="xs"
          lineHeight="xs"
          fontWeight={500}
          letterSpacing={1.5}
          color={'uap.grey'}
        >
          built by
          <Link
            href="https://twitter.com/YearOneIO"
            textDecoration="underline"
            target="blank"
            color={'var(--chakra-colors-uap-grey)'}
          >
            @yearoneio
          </Link>
        </Text>
      </Flex>
    </Box>
  );
}
