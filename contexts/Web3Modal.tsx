import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { defineChain } from '@reown/appkit/networks';
import { config } from '@/constants/config';
import { supportedNetworks } from '@/constants/supportedNetworks';

const projectId = config.walletTools.walletConnectProjectID as string;
// Metadata for the our App as seen through the wallet connection UI
const metadata = {
  name: config.metadata.title,
  description: config.metadata.description,
  url: config.metadata.url,
  icons: [config.metadata.icon],
};

const getDefinedChain = (chainId: number) => {
  return defineChain({
    id: chainId,
    name: supportedNetworks[chainId].displayName,
    nativeCurrency: {
      name: supportedNetworks[chainId].token,
      symbol: supportedNetworks[chainId].token,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [supportedNetworks[chainId].rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: `${supportedNetworks[chainId].displayName} Explorer`,
        url: supportedNetworks[chainId].explorer,
        apiUrl: supportedNetworks[chainId].explorerApi,
      },
    },
    contracts: {
      multicall3: { ...supportedNetworks[chainId].multicall3 },
    },
    custom: {
      wrapped: supportedNetworks[chainId].wrapped,
    },
    testnet: supportedNetworks[chainId].testnet,
    chainNamespace: 'eip155',
    caipNetworkId: `eip155:${chainId}`,
  });
};

// Create the AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [getDefinedChain(42), getDefinedChain(4201)],
  projectId,
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
  },
});

export function AppKit({ children }: any) {
  return children;
}
