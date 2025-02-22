'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { SiweMessage } from 'siwe';
import { BrowserProvider, verifyMessage } from 'ethers';
import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';

interface Profile {
  name: string;
  description: string;
  tags: string[];
  links: Link[];
  profileImage: Image[];
  backgroundImage: Image[];
  mainImage: string | undefined;
}

interface Link {
  title: string;
  url: string;
}

interface Image {
  width: number;
  height: number;
  hashFunction: string;
  hash: string;
  url: string;
}

interface IProfileDetailsData {
  mainUPController: string;
  upWallet: string;
  profile: Profile | null;
  issuedAssets: string[];
}

interface ProfileContextType {
  issuedAssets: string[];
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  profileDetailsData: IProfileDetailsData | null;
  setProfileDetailsData: React.Dispatch<
    React.SetStateAction<IProfileDetailsData | null>
  >;
  error: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectAndSign: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [profileDetailsData, setProfileDetailsData] =
    useState<IProfileDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const connectingRef = useRef(false);

  // fetches profile details from the blockchain upon user first connecting and signing siwe message
  const connectAndSign = async () => {
    if (connectingRef.current) {
      console.log('ProfileProvider: Connect skipped, in progress');
      return;
    }
    try {
      connectingRef.current = true;
      if (!window.lukso) {
        throw new Error(
          'No wallet provider detected. Please install UP Browser Extension.'
        );
      }
      const provider = new BrowserProvider(window.lukso);
      providerRef.current = provider;
      const accounts = await provider.send('eth_requestAccounts', []);
      const upWallet = accounts[0];
      const currentChainId = Number(await provider.send('eth_chainId', []));
      setChainId(currentChainId);
      setIsConnected(true);

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: upWallet,
        statement: 'Sign in to Universal Assistants Catalog',
        version: '1',
        chainId: currentChainId,
        resources: [`${window.location.origin}/terms`],
      }).prepareMessage();

      const signature = await provider.send('personal_sign', [
        siweMessage,
        upWallet,
      ]);
      const mainUPController = verifyMessage(siweMessage, signature);
      const { profile, issuedAssets } = await fetchProfileData(
        upWallet,
        currentChainId,
        true
      );
      const newProfileData: IProfileDetailsData = {
        mainUPController,
        upWallet,
        profile,
        issuedAssets,
      };
      localStorage.setItem(
        'profileDetailsData',
        JSON.stringify(newProfileData)
      );
      setProfileDetailsData(newProfileData);
    } catch (error: any) {
      console.error('ProfileProvider: Error', error);
      setIsConnected(false);
      setProfileDetailsData(null);
      setIssuedAssets([]);
      setError(error.message);
      providerRef.current = null;
    } finally {
      connectingRef.current = false;
    }
  };

  /*
  const sendSiweMessageGetControllerAndFetchProfile = async (upWallet: string) => {
    try {
      if (!window.lukso) {
        throw new Error('No wallet provider detected. Please install UP Browser Extension.');
      }
      const provider = new BrowserProvider(window.lukso);
      providerRef.current = provider;
      const currentChainId = Number(await provider.send('eth_chainId', []));
      setChainId(currentChainId);
      setIsConnected(true);

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: upWallet,
        statement: 'Sign in to Universal Assistants Catalog',
        version: '1',
        chainId: currentChainId,
        resources: [`${window.location.origin}/terms`],
      }).prepareMessage();

      const signature = await provider.send('personal_sign', [siweMessage, upWallet]);
      const mainUPController = verifyMessage(siweMessage, signature);
      const { profile, issuedAssets } = await fetchProfileData(upWallet, true);
      const newProfileData: IProfileDetailsData = { mainUPController, upWallet, profile, issuedAssets };
      localStorage.setItem('profileDetailsData', JSON.stringify(newProfileData));
      setProfileDetailsData(newProfileData);
    } catch (error: any) {
      console.error('ProfileProvider: Error', error);
      setIsConnected(false);
      setProfileDetailsData(null);
      setIssuedAssets([]);
      setError(error.message);
      providerRef.current = null;
    }
  };
  */

  const disconnect = () => {
    setProfileDetailsData(null);
    setIsConnected(false);
    setChainId(null);
    setIssuedAssets([]);
    setError(null);
    localStorage.removeItem('profileDetailsData');
    localStorage.removeItem('profileData');
    providerRef.current = null;
    console.log('ProfileProvider: Disconnected');
  };

  const fetchProfileData = async (
    upWallet?: string,
    currentChainId?: number,
    forceFetch: boolean = false
  ) => {
    const walletToFetch = upWallet || profileDetailsData?.upWallet;
    if (
      !walletToFetch ||
      !currentChainId ||
      !providerRef.current ||
      (!isConnected && !forceFetch)
    ) {
      console.log('ProfileProvider: Skipping fetchProfileData, missing data', {
        walletToFetch,
        currentChainId,
        isConnected,
      });
      return { profile: null, issuedAssets: [] };
    }
    const currentNetwork = supportedNetworks[Number(currentChainId)];
    if (!currentNetwork || currentNetwork.hasUPSupport === false) {
      setError('Network not supported');
      return { profile: null, issuedAssets: [] };
    }

    const erc725js = new ERC725(
      lsp3ProfileSchema as ERC725JSONSchema[],
      walletToFetch,
      currentNetwork.rpcUrl,
      { ipfsGateway: currentNetwork.ipfsGateway }
    );
    try {
      setError(null);
      console.log('ProfileProvider: Fetching profile for', {
        walletToFetch,
        currentChainId,
      });
      const profileMetaData = await erc725js.fetchData('LSP3Profile');
      const lsp12IssuedAssets = await erc725js.fetchData('LSP12IssuedAssets[]');
      let newProfile = null;
      let newIssuedAssets: string[] = [];

      if (
        profileMetaData.value &&
        typeof profileMetaData.value === 'object' &&
        'LSP3Profile' in profileMetaData.value
      ) {
        newProfile = profileMetaData.value.LSP3Profile as Profile;
        const mainImageIpfsPath = newProfile.profileImage[0].url;
        const mainImage = await getImageFromIPFS(
          mainImageIpfsPath,
          currentChainId
        );
        newProfile.mainImage = mainImage;
      } else {
        console.log('ProfileProvider: No profile data found');
      }
      if (lsp12IssuedAssets.value && Array.isArray(lsp12IssuedAssets.value)) {
        newIssuedAssets = lsp12IssuedAssets.value as string[];
      }
      return { profile: newProfile, issuedAssets: newIssuedAssets };
    } catch (error) {
      console.error('ProfileProvider: Cannot fetch profile data:', error);
      setError('Failed to fetch profile data');
      return { profile: null, issuedAssets: [] };
    }
  };

  const switchNetwork = async (newChainId: number) => {
    try {
      if (!window.lukso) throw new Error('No wallet provider detected');
      const provider = providerRef.current || new BrowserProvider(window.lukso);
      providerRef.current = provider;
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${newChainId.toString(16)}` },
      ]);
      setChainId(newChainId);
      console.log('ProfileProvider: Switched network', { newChainId });
      await connectAndSign();
    } catch (error: any) {
      console.error('ProfileProvider: Switch network error', error);
      if (error.code === 4902 && providerRef.current) {
        await providerRef.current.send('wallet_addEthereumChain', [
          {
            chainId: `0x${newChainId.toString(16)}`,
            chainName: newChainId === 42 ? 'Lukso Mainnet' : 'Lukso Testnet',
            rpcUrls: [
              newChainId === 42
                ? 'https://rpc.lukso.network'
                : 'https://rpc.testnet.lukso.network',
            ],
            nativeCurrency: { name: 'LYX', symbol: 'LYX', decimals: 18 },
            blockExplorerUrls: [
              newChainId === 42
                ? 'https://explorer.lukso.network'
                : 'https://explorer.testnet.lukso.network',
            ],
          },
        ]);
        setChainId(newChainId);
        await connectAndSign();
      } else {
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    if (!window.lukso) return;

    const restoreSession = async () => {
      const storedProfileDetails = localStorage.getItem('profileDetailsData');
      if (storedProfileDetails && !isConnected) {
        const parsedProfileDetails: IProfileDetailsData =
          JSON.parse(storedProfileDetails);
        try {
          const provider = new BrowserProvider(window.lukso);
          providerRef.current = provider;
          const accounts = await provider.send('eth_accounts', []);
          if (
            accounts.length > 0 &&
            accounts.includes(parsedProfileDetails.upWallet)
          ) {
            setProfileDetailsData(parsedProfileDetails);
            setIsConnected(true);
            const currentChainId = Number(
              await provider.send('eth_chainId', [])
            );
            setChainId(currentChainId);
            console.log('ProfileProvider: Restored session', {
              ...parsedProfileDetails,
              chainId: currentChainId,
            });
          } else {
            console.log(
              'ProfileProvider: Session not restored, no active account'
            );
            localStorage.removeItem('profileDetailsData');
          }
        } catch (error) {
          console.error('ProfileProvider: Session restore error', error);
          localStorage.removeItem('profileDetailsData');
          providerRef.current = null;
        }
      }
    };

    restoreSession();

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('ProfileProvider: Accounts changed', {
        accounts,
        currentUpWallet: profileDetailsData?.upWallet,
      });
      if (accounts.length === 0) {
        disconnect();
      } else if (
        !profileDetailsData ||
        accounts[0] !== profileDetailsData.upWallet
      ) {
        setProfileDetailsData(null);
        setIssuedAssets([]);
        connectAndSign();
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number(chainIdHex);
      setChainId(newChainId);
      setIssuedAssets([]);
      console.log('ProfileProvider: Chain changed', { newChainId });
      connectAndSign();
    };

    window.lukso.on('accountsChanged', handleAccountsChanged);
    window.lukso.on('chainChanged', handleChainChanged);

    return () => {
      window.lukso.removeListener('accountsChanged', handleAccountsChanged);
      window.lukso.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected, profileDetailsData?.upWallet]);

  const contextValue = useMemo(
    () => ({
      issuedAssets,
      setIssuedAssets,
      profileDetailsData,
      setProfileDetailsData,
      error,
      isConnected,
      chainId,
      connectAndSign,
      disconnect,
      switchNetwork,
    }),
    [issuedAssets, profileDetailsData, error, isConnected, chainId]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
