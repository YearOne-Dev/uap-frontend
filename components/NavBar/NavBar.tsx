'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';

/**
 * Provides a top navigation bar including links to all pages.
 */
const NavBar = () => {
  return (
    <nav className="hashlists-topbar">
      <Flex
        justify="space-between"
        alignItems="center"
        py="20px"
        px={{ base: '20px', md: '50px' }}
        borderBottom={`2px solid`}
        borderColor={'hashlists.grey'}
        height={'85px'}
      >
        <Box>
          <Link href="/">
            <Flex flexDirection={'row'} align="center" justify="center" gap={2}>
              <Text
                fontSize={{ base: 'large', md: 'larger' }}
                fontFamily={'Tomorrow'}
                fontWeight="500"
              >
                UPAC
              </Text>
            </Flex>
          </Link>
        </Box>
        <Flex alignItems="center" gap={4}>
          <Button
            display={{
              base: 'none',
              md: 'inline-flex',
            }}
            color={'hashlists.grey'}
            borderRadius="10px"
            border="1px solid var(--chakra-colors-hashlists-grey)"
            fontFamily={'Montserrat'}
            fontWeight={500}
            backgroundColor={'hashlists.yellow'}
            as={Link}
            href="/4201/urd"
          >
            Configure
          </Button>
          <WalletConnectButton />
        </Flex>
      </Flex>
    </nav>
  );
};

export default NavBar;
