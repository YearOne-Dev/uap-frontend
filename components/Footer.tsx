'use client';
import React from 'react';
import { Box, Flex, Link, Text, Select } from '@chakra-ui/react';
import {
  FaBookMedical,
  FaFileCode,
  FaSquareGithub,
  FaBook,
} from 'react-icons/fa6';
import { usePathname, useRouter } from 'next/navigation';

export default function Footer() {
  // Get the current pathname (e.g. "/lukso/catalog")
  const pathname = usePathname();
  const router = useRouter();

  // Split the pathname and filter out empty segments.
  const pathSegments = pathname.split('/').filter(seg => seg.length > 0);
  // The network name is assumed to be the first segment in the URL.
  const networkNameFromUrl = pathSegments[0] || '';

  // Determine the current network: if the URL contains "lukso-testnet" then use that, otherwise default to "lukso".
  const currentNetwork =
    networkNameFromUrl.toLowerCase() === 'lukso-testnet'
      ? 'lukso-testnet'
      : '/';

  // When the network selection changes, redirect the user to the new network's home page.
  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNetwork = e.target.value;
    router.push(`/${selectedNetwork}`);
  };

  return (
    <Box
      as="footer"
      borderTop="2px solid var(--chakra-colors-uap-grey)"
      height="90px"
      className="uap-footer"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        py={8}
        px={{ base: '20px', md: '50px' }}
      >
        {/* Left side: Network dropdown and links */}
        <Flex alignItems="center" gap={4}>
          {/* Network Dropdown on the far left */}
          <Select
            size="sm"
            value={currentNetwork}
            onChange={handleNetworkChange}
            focusBorderColor="transparent"
            _focus={{ boxShadow: 'none' }}
            cursor={'pointer'}
            border={'1px solid chakra-colors-uap-grey'}
          >
            <option value="/">LUKSO</option>
            <option value="lukso-testnet">LUKSO Testnet</option>
          </Select>

          {/* Desktop links */}
          <Flex alignItems="center" gap={3} display={['none', 'none', 'flex']}>
            <Link
              href="https://github.com/yearone-io/uap-protocol"
              isExternal
              fontSize="24px"
            >
              <FaSquareGithub color="var(--chakra-colors-uap-grey)" />
            </Link>
            <Link href={`/contracts`}>
              <Text fontSize="md" fontWeight={400} letterSpacing={1.5}>
                Contracts
              </Text>
            </Link>
            <Link isExternal href="https://docs.upassistants.com">
              <Text fontSize="md" fontWeight={400} letterSpacing={1.5}>
                Docs
              </Text>
            </Link>
            <Link href="/terms">
              <Text fontSize="md" fontWeight={400} letterSpacing={1.5}>
                Terms
              </Text>
            </Link>
          </Flex>

          {/* Mobile links */}
          <Flex gap={3} display={['flex', 'flex', 'none']} alignItems="center">
            <Link
              href="https://github.com/yearone-io/uap-protocol"
              isExternal
              fontSize="24px"
            >
              <FaSquareGithub color="var(--chakra-colors-uap-grey)" />
            </Link>
            <Link href={`/contracts`} fontSize="20px">
              <FaFileCode color="var(--chakra-colors-uap-grey)" />
            </Link>
            <Link
              isExternal
              href="https://docs.upassistants.com"
              fontSize="20px"
            >
              <FaBookMedical color="var(--chakra-colors-uap-grey)" />
            </Link>
            <Link href="/terms" fontSize="20px">
              <FaBook color="var(--chakra-colors-uap-grey)" />
            </Link>
          </Flex>
        </Flex>

        {/* Right side: Attribution */}
        <Text
          fontSize="xs"
          lineHeight="xs"
          fontWeight={500}
          letterSpacing={1.5}
          color="uap.grey"
        >
          built by{' '}
          <Link
            href="https://x.com/YearOneIO"
            textDecoration="underline"
            target="_blank"
            color="var(--chakra-colors-uap-grey)"
          >
            @yearoneio
          </Link>
        </Text>
      </Flex>
    </Box>
  );
}
