'use client';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { config } from '@/constants/config';
import { supportedNetworks } from '@/constants/supportedNetworks';

// Wallet Connect: Metadata Setup
const metadata = {
  name: config.metadata.title,
  description: config.metadata.description,
  url: config.metadata.url,
  icons: [config.metadata.icon],
};

// Wallet Connect: Configuration Element
const ethersConfig = defaultConfig({
  metadata,
});

// Wallet Connect: Chain Data
const chains = Object.values(supportedNetworks).map(network => ({
  chainId: network.chainId,
  name: network.name,
  currency: network.token,
  explorerUrl: network.explorer,
  rpcUrl: network.rpcUrl,
}));

// Wallet Connect: Chain Images
const walletConnectChainImages: Record<number, string> = {};
Object.values(supportedNetworks).forEach(network => {
  walletConnectChainImages[network.chainId] = network.icon;
});

// WalletConnect: Web3 Modal Instance
createWeb3Modal({
  ethersConfig,
  chains,
  projectId: config.walletTools.walletConnectProjectID || '1',
  chainImages: walletConnectChainImages,
  featuredWalletIds: ['NONE'],
  themeMode: 'light',
});

export function AppKit({ children }: any) {
  return children;
}
