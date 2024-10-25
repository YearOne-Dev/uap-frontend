'use client';
import React, { createContext, useContext } from 'react';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getNetwork } from '@/utils/utils';

interface NetworkContextType {
  network: (typeof supportedNetworks)[number];
}

const appNetworkId = Number(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!);

const initialNetworkContextValue: NetworkContextType = {
  network: getNetwork(appNetworkId),
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
    network: getNetwork(appNetworkId),
  };
  return (
    <NetworkContext.Provider value={contextProperties}>
      {children}
    </NetworkContext.Provider>
  );
}
