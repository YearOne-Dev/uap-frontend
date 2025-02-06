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
  const { address } = useWeb3ModalAccount();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [mainControllerData, setMainControllerData] =
    useState<MainControllerData | null>(null);

  // Load from localStorage whenever 'address' changes or on first mount
  useEffect(() => {
    const storedProfileData = localStorage.getItem('profileData');
    if (storedProfileData) {
      const parsed = JSON.parse(storedProfileData);
      if (address && parsed.account === address) {
        setProfile(parsed.data);
      } else {
        setProfile(null);
      }
    } else {
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

  // Save `mainControllerData` to local storage when it changes
  useEffect(() => {
    if (mainControllerData) {
      localStorage.setItem(
        'mainControllerData',
        JSON.stringify(mainControllerData)
      );
    }
  }, [mainControllerData]);

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
