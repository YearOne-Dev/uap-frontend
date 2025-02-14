'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from '@web3modal/ethers/react';
import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json' assert { type: 'json' };
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
}

const initialProfileContextValue: ProfileContextType = {
  profile: null,
  setProfile: () => {},
  issuedAssets: [],
  setIssuedAssets: () => {},
  mainControllerData: null,
  setMainControllerData: () => {},
};

const ProfileContext = createContext<ProfileContextType>(
  initialProfileContextValue
);

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [mainControllerData, setMainControllerData] =
    useState<MainControllerData | null>(null);

  useEffect(() => {
    const loadProfileFromLocalStorage = () => {
      const storedProfileData = localStorage.getItem('profileData');
      return storedProfileData ? JSON.parse(storedProfileData) : null;
    };

    const storedProfile = loadProfileFromLocalStorage();
    if (storedProfile && storedProfile.account === address) {
      setProfile(storedProfile.data);
    } else {
      // Reset profile if account has changed
      setProfile(null);
    }

    const storedControllerData = localStorage.getItem('mainControllerData');
    if (storedControllerData) {
      const parsedController = JSON.parse(storedControllerData);
      if (address && parsedController.upWallet === address) {
        setMainControllerData(parsedController);
      } else {
        setMainControllerData(parsedController);
      }
    } else {
      setMainControllerData(null);
    }
  }, [address]);

  useEffect(() => {
    if (profile && profile.profileImage && profile.profileImage.length > 0) {
      getImageFromIPFS(profile.profileImage[0].url, chainId as number).then(
        imageUrl => {
          // @ts-ignore
          setProfile(prevProfile => {
            return {
              ...prevProfile,
              mainImage: imageUrl,
            };
          });
        }
      );
    }
  }, [profile?.profileImage, chainId]);

  // Save profile to local storage whenever it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem(
        'profileData',
        JSON.stringify({ address, data: profile })
      );
    }
  }, [profile, address, chainId]);

  // Save `mainControllerData` to local storage when it changes
  useEffect(() => {
    if (mainControllerData) {
      localStorage.setItem(
        'mainControllerData',
        JSON.stringify(mainControllerData)
      );
    }
  }, [mainControllerData]);

  // Fetch and update profile data from blockchain
  useEffect(() => {
    const fetchProfileData = async () => {
      if (
        !address ||
        !chainId ||
        // @ts-ignore
        (walletProvider && !walletProvider.isUniversalProfileExtension)
      ) {
        setProfile(null);
        return;
      }

      // Get the current network properties from the list of supported networks
      const currentNetwork = supportedNetworks[chainId];

      if (!currentNetwork || currentNetwork.hasUPSupport === false) {
        setProfile(null);
        return;
      }

      // Instanciate the LSP3-based smart contract
      const erc725js = new ERC725(
        lsp3ProfileSchema as ERC725JSONSchema[],
        address,
        currentNetwork.rpcUrl,
        { ipfsGateway: currentNetwork.ipfsGateway }
      );

      try {
        // Download and verify the full profile metadata
        const profileMetaData = await erc725js.fetchData('LSP3Profile');
        const lsp12IssuedAssets = await erc725js.fetchData(
          'LSP12IssuedAssets[]'
        );

        if (
          profileMetaData.value &&
          typeof profileMetaData.value === 'object' &&
          'LSP3Profile' in profileMetaData.value
        ) {
          // Update the profile state
          setProfile(profileMetaData.value.LSP3Profile);
        }

        if (lsp12IssuedAssets.value && Array.isArray(lsp12IssuedAssets.value)) {
          // Update the issued assets state
          setIssuedAssets(lsp12IssuedAssets.value);
        }
      } catch (error) {
        console.log('Can not fetch profile data: ', error);
      }
    };

    fetchProfileData();
  }, [address, chainId, walletProvider]);

  // Detect account and network changes
  useEffect(() => {
    if (!walletProvider) return;

    // Reload the current page or force refresh state
    // We need to update because switching networks can change the profile data like the address
    // the current modal doesn't change the address when switching networks
    const handleChainChanged = () => {
      window.location.reload();
    };

    // Add event listeners
    (walletProvider as any).on('chainChanged', handleChainChanged);

    // Cleanup event listeners on component unmount
    return () => {
      (walletProvider as any).removeListener(
        'chainChanged',
        handleChainChanged
      );
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
    }),
    [profile, issuedAssets, mainControllerData]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}
