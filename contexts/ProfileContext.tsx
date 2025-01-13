'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';

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
  setIssuedAssets: () => {},
  issuedAssets: [],
  mainControllerData: null,
  setMainControllerData: () => {},
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
  const [mainControllerData, setMainControllerData] =
    useState<MainControllerData | null>(null);

  // Load profile and controller data from local storage on initial render
  useEffect(() => {
    const loadProfileFromLocalStorage = () => {
      const storedProfileData = localStorage.getItem('profileData');
      return storedProfileData ? JSON.parse(storedProfileData) : null;
    };

    const loadMainControllerDataFromLocalStorage = () => {
      const storedData = localStorage.getItem('mainControllerData');
      return storedData ? JSON.parse(storedData) : null;
    };

    const storedProfile = loadProfileFromLocalStorage();
    if (storedProfile && storedProfile.account === address) {
      setProfile(storedProfile.data);
    } else {
      setProfile(null);
    }

    const storedControllerData = loadMainControllerDataFromLocalStorage();
    setMainControllerData(storedControllerData);
  }, [address]);

  // Save `mainControllerData` to local storage when it changes
  useEffect(() => {
    if (mainControllerData) {
      localStorage.setItem(
        'mainControllerData',
        JSON.stringify(mainControllerData)
      );
    } else {
      localStorage.removeItem('mainControllerData');
    }
  }, [mainControllerData]);

  // Context properties
  const contextProperties = useMemo(
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
    <ProfileContext.Provider value={contextProperties}>
      {children}
    </ProfileContext.Provider>
  );
}
