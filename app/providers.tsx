'use client';
import theme from './theme';
import { ChakraProvider } from '@chakra-ui/react';
import { AppKit } from '@/contexts/Web3Modal';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NetworkProvider } from '@/contexts/NetworkContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppKit>
      <ChakraProvider theme={theme}>
        <ProfileProvider>
          <NetworkProvider>{children}</NetworkProvider>
        </ProfileProvider>
      </ChakraProvider>
    </AppKit>
  );
}
