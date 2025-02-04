'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { usePathname } from 'next/navigation';

/**
 * Provides a top navigation bar including links to all pages.
 * All links now start with /[networkName], which is extracted from the current URL.
 */
const NavBar = () => {
  // Get the current pathname (e.g. "/lukso/catalog")
  const pathname = usePathname();
  // Split the pathname and filter out empty segments.
  const pathSegments = pathname.split('/').filter(seg => seg.length > 0);
  // The network name is assumed to be the first segment in the URL.
  const networkNameFromUrl = pathSegments[0] || '';

  // Fallback: derive the network name from the connected chainId (or default to chain 42)
  const { isConnected, chainId } = useWeb3ModalAccount();
  const networkNameFromChain = getUrlNameByChainId(
    isConnected && chainId ? chainId : 42
  );

  // Use the network name from the URL if available; otherwise, fallback.
  const networkName = networkNameFromUrl || networkNameFromChain;

  return (
    <nav className="uap-topbar">
      <Flex
        justify="space-between"
        alignItems="center"
        py="20px"
        px={{ base: '20px', md: '50px' }}
        borderBottom="2px solid"
        borderColor="uap.grey"
        height="85px"
      >
        <Box>
          {/* Home link now points to "/[networkName]" */}
          <Link href={`/${networkName}`}>
            <Flex flexDirection="row" align="center" justify="center" gap={2}>
              <Text
                fontSize={{ base: 'large', md: 'larger' }}
                fontFamily="Tomorrow"
                fontWeight="500"
              >
                UPAC
              </Text>
            </Flex>
          </Link>
        </Box>
        <Flex alignItems="center" gap={4}>
          <Button
            display={{ base: 'none', md: 'inline-flex' }}
            color="uap.grey"
            borderRadius="10px"
            border="1px solid var(--chakra-colors-uap-grey)"
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
