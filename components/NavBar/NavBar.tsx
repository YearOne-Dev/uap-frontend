'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { supportedNetworks } from '@/constants/supportedNetworks';

const NavBar = () => {
  const pathname = usePathname();

  // Extract network name from the current URL path
  // Path format: /[networkName]/... or just /[networkName]
  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  const networkName = pathSegments[0] || supportedNetworks['42'].urlName;

  return (
    <nav className="uap-topbar">
      <Flex
        justify="space-between"
        alignItems="center"
        py="20px"
        px={{ base: '20px', md: '50px' }}
        borderBottom="2px solid"
        borderColor="gray.200"
        height="85px"
      >
        <Box>
          <Link href={`/${networkName}`}>
            <Flex flexDirection="row" align="center" justify="center" gap={2}>
              <Text
                fontSize={{ base: 'large', md: 'larger' }}
                fontFamily="Tomorrow"
                fontWeight="500"
              >
                UP Assistants
              </Text>
            </Flex>
          </Link>
        </Box>
        <Flex alignItems="center" gap={4}>
          <Button
            display={{ base: 'none', md: 'inline-flex' }}
            color="gray.600"
            borderRadius="10px"
            border="1px solid"
            borderColor="gray.400"
            fontFamily="Montserrat"
            fontWeight={500}
            bg="yellow.100"
            as={Link}
            href={`/${networkName}/catalog`}
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
