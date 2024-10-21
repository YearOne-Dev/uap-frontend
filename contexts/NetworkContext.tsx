'use client';
import React, { createContext, useContext } from 'react';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface NetworkContextType {
  networkId: number;
  network: (typeof supportedNetworks)[number];
}

const appNetworkId = Number(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!);

const initialNetworkContextValue: NetworkContextType = {
  networkId: appNetworkId,
  network: supportedNetworks[appNetworkId],
};

const NetworkContext = createContext<NetworkContextType>(
  initialNetworkContextValue
);

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const contextProperties = {
    networkId: initialNetworkContextValue.networkId,
    network: supportedNetworks[initialNetworkContextValue.networkId],
  };
  return (
    <NetworkContext.Provider value={contextProperties}>
      {children}
    </NetworkContext.Provider>
  );
}
