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
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json' assert { type: 'json' };
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';

import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getNetwork } from '@/utils/utils';

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

interface ProfileContextType {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  issuedAssets: string[];
  mainUPController: string | undefined;
  setMainUPController: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const initialProfileContextValue: ProfileContextType = {
  profile: null,
  setProfile: () => {},
  setIssuedAssets: () => {},
  issuedAssets: [],
  mainUPController: undefined,
  setMainUPController: () => {}, // todo do we need a disconnect?
};

// Set up the empty React context
const ProfileContext = createContext<ProfileContextType>(
  initialProfileContextValue
);

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { address } = useWeb3ModalAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [mainUPController, setMainUPController] = useState<
    string | undefined
  >();

  // Load profile from local storage on initial render
  useEffect(() => {
    const loadProfileFromLocalStorage = () => {
      const storedProfileData = localStorage.getItem('profileData');
      return storedProfileData ? JSON.parse(storedProfileData) : null;
    };

    const storedProfile = loadProfileFromLocalStorage();
    if (storedProfile && storedProfile.account === address) {
      setProfile(storedProfile.data);
    } else {
      setProfile(null);
    }

    const storedController = localStorage.getItem('mainUPController');
    if (storedController) {
      setMainUPController(storedController);
    }
  }, [address]);

  // Save `mainUPController` to local storage when it changes
  useEffect(() => {
    if (mainUPController) {
      localStorage.setItem('mainUPController', mainUPController);
    } else {
      localStorage.removeItem('mainUPController');
    }
  }, [mainUPController]);

  // Context properties
  const contextProperties = useMemo(
    () => ({
      profile,
      setProfile,
      setIssuedAssets,
      issuedAssets,
      mainUPController,
      setMainUPController,
    }),
    [profile, issuedAssets, mainUPController]
  );

  return (
    <ProfileContext.Provider value={contextProperties}>
      {children}
    </ProfileContext.Provider>
  );
}
