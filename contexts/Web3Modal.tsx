'use client';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { lukso, luksoTestnet } from '@reown/appkit/networks';
import { config } from '@/constants/config';

// Singleton to prevent multiple initializations
let isAppKitInitialized = false;

const metadata = {
  name: config.metadata.title,
  description: config.metadata.description,
  url: config.metadata.url,
  icons: [config.metadata.icon],
};

if (!isAppKitInitialized) {
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [lukso, luksoTestnet],
    defaultNetwork: luksoTestnet,
    metadata,
    projectId:
      config.walletTools.walletConnectProjectID ||
      'cd59de0360dceb28a232003dd4ff3b29', // Replace with your actual ID
    features: {
      analytics: true,
    },
  });
  isAppKitInitialized = true;
}

export function AppKit({ children }: { children: React.ReactNode }) {
  return children;
}
