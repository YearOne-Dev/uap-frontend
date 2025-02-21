'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { usePathname } from 'next/navigation';

const NavBar = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(seg => seg.length > 0);
  const networkNameFromUrl = pathSegments[0] || '';

  // Use useAppKitNetwork for chainId
  const { isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const chainIdNum = chainId ? Number(chainId) : 42; // Default to 42 (Lukso Mainnet) if not connected
  const networkNameFromChain = getUrlNameByChainId(
    isConnected && chainId ? chainIdNum : 42
  );

  const networkName = networkNameFromUrl || networkNameFromChain;

  return (
    <nav className="uap-topbar">
      <Flex
        justify="space-between"
        alignItems="center"
        py="20px"
        px={{ base: '20px', md: '50px' }}
        borderBottom="2px solid"
        borderColor="var(--chakra-colors-uap-grey)"
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
            color="uap.grey"
            borderRadius="10px"
            border="1px solid"
            borderColor="var(--chakra-colors-uap-grey)"
            fontFamily="Montserrat"
            fontWeight={500}
            backgroundColor="uap.yellow"
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
