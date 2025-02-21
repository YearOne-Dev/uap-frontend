'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork,
} from '@reown/appkit/react';
import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { Eip1193Provider } from 'ethers';

interface ExtendedEip1193Provider extends Eip1193Provider {
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener?(event: string, listener: (...args: any[]) => void): this;
  off?(event: string, listener: (...args: any[]) => void): this;
}

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
interface MainControllerData {
  mainUPController: string;
  upWallet: string;
}

interface ProfileContextType {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  issuedAssets: string[];
  mainControllerData: MainControllerData | null;
  setMainControllerData: React.Dispatch<
    React.SetStateAction<MainControllerData | null>
  >;
  error: string | null;
}

const initialProfileContextValue: ProfileContextType = {
  profile: null,
  setProfile: () => {},
  issuedAssets: [],
  setIssuedAssets: () => {},
  mainControllerData: null,
  setMainControllerData: () => {},
  error: null,
};

const ProfileContext = createContext<ProfileContextType>(
  initialProfileContextValue
);

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } =
    useAppKitProvider<ExtendedEip1193Provider>('eip155');
  const { chainId } = useAppKitNetwork();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [mainControllerData, setMainControllerData] =
    useState<MainControllerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedProfileData = localStorage.getItem('profileData');
    const storedProfile = storedProfileData
      ? JSON.parse(storedProfileData)
      : null;
    if (storedProfile && storedProfile.address === address) {
      setProfile(storedProfile.data);
    } else if (!isConnected) {
      setProfile(null);
    }

    const storedControllerData = localStorage.getItem('mainControllerData');
    if (storedControllerData) {
      const parsedController: MainControllerData =
        JSON.parse(storedControllerData);
      if (isConnected && address && parsedController.upWallet === address) {
        setMainControllerData(parsedController);
      } else if (!isConnected) {
        setMainControllerData(null);
      }
    }
  }, [address, isConnected]);

  const profileImageMemo = useMemo(
    () => profile?.profileImage,
    [profile?.profileImage]
  );
  useEffect(() => {
    if (
      !chainId ||
      !profileImageMemo ||
      profileImageMemo.length === 0 ||
      profile?.mainImage
    ) {
      return;
    }
    getImageFromIPFS(profileImageMemo[0].url, Number(chainId)).then(
      imageUrl => {
        setProfile(prev => (prev ? { ...prev, mainImage: imageUrl } : null));
      },
      err => {
        console.error('Failed to fetch IPFS image:', err);
        setError('Failed to load profile image');
      }
    );
  }, [profileImageMemo, chainId]);

  useEffect(() => {
    if (profile && address) {
      localStorage.setItem(
        'profileData',
        JSON.stringify({ address, data: profile })
      );
    }
  }, [profile, address]);

  useEffect(() => {
    if (mainControllerData) {
      localStorage.setItem(
        'mainControllerData',
        JSON.stringify(mainControllerData)
      );
    }
  }, [mainControllerData]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!address || !chainId || !isConnected || !walletProvider) {
        return;
      }

      const chainIdNum = Number(chainId);
      const currentNetwork = supportedNetworks[chainIdNum];
      if (!currentNetwork || currentNetwork.hasUPSupport === false) {
        setProfile(null);
        setError('Network not supported');
        return;
      }

      const erc725js = new ERC725(
        lsp3ProfileSchema as ERC725JSONSchema[],
        address,
        currentNetwork.rpcUrl,
        { ipfsGateway: currentNetwork.ipfsGateway }
      );

      try {
        setError(null);
        const profileMetaData = await erc725js.fetchData('LSP3Profile');
        const lsp12IssuedAssets = await erc725js.fetchData(
          'LSP12IssuedAssets[]'
        );

        if (profileMetaData.value && 'LSP3Profile' in profileMetaData.value) {
          setProfile(profileMetaData.value.LSP3Profile);
        } else {
          setProfile(null);
        }

        if (lsp12IssuedAssets.value && Array.isArray(lsp12IssuedAssets.value)) {
          setIssuedAssets(lsp12IssuedAssets.value);
        } else {
          setIssuedAssets([]);
        }
      } catch (error) {
        console.error('Cannot fetch profile data:', error);
        setError('Failed to fetch profile data');
      }
    };

    fetchProfileData();
  }, [address, chainId, walletProvider, isConnected]);

  useEffect(() => {
    if (!walletProvider) return;

    const handleChainChanged = () => {
      setProfile(null);
      setIssuedAssets([]);
    };

    walletProvider.on('chainChanged', handleChainChanged);

    return () => {
      if (walletProvider.removeListener) {
        walletProvider.removeListener('chainChanged', handleChainChanged);
      } else if (walletProvider.off) {
        walletProvider.off('chainChanged', handleChainChanged);
      }
    };
  }, [walletProvider]);

  const contextValue = useMemo(
    () => ({
      profile,
      setProfile,
      setIssuedAssets,
      issuedAssets,
      mainControllerData,
      setMainControllerData,
      error,
    }),
    [profile, issuedAssets, mainControllerData, error]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}
