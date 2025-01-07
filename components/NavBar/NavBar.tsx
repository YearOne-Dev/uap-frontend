'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { useAppKitAccount } from '@reown/appkit/react';
import { getUrlNameByChainId } from '@/utils/universalProfile';

/**
 * Provides a top navigation bar including links to all pages.
 */
const NavBar = () => {
  const { isConnected, caipAddress } = useAppKitAccount();
  const chainId = caipAddress?.split(':')[1];
  const networkId = isConnected && chainId ? chainId : 42;
  const urlName = getUrlNameByChainId(Number(networkId));

  return (
    <nav className="uap-topbar">
      <Flex
        justify="space-between"
        alignItems="center"
        py="20px"
        px={{ base: '20px', md: '50px' }}
        borderBottom={`2px solid`}
        borderColor={'uap.grey'}
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
            color={'uap.grey'}
            borderRadius="10px"
            border="1px solid var(--chakra-colors-uap-grey)"
            fontFamily={'Montserrat'}
            fontWeight={500}
            backgroundColor={'uap.yellow'}
            as={Link}
            href={`/${urlName}/catalog`}
          >
            Browse Assistants
          </Button>
          <WalletConnectButton />
        </Flex>
      </Flex>
    </nav>
  );
};

export default NavBar;
