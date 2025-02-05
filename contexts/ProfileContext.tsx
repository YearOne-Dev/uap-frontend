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
  mainImage?: string;
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
  issuedAssets: string[];
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
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
    // 1) Try loading the saved Profile
    const storedProfileData = localStorage.getItem('profileData');
    if (storedProfileData) {
      const parsed = JSON.parse(storedProfileData);
      // If we stored a specific 'account' inside the data,
      // we might match it to the current address.
      // Some folks skip the "account" check and always set it.
      // Up to you:
      if (address && parsed.account === address) {
        setProfile(parsed.data);
      } else {
        // you could setProfile(null) or leave the old profile if you prefer
        setProfile(null);
      }
    } else {
      setProfile(null);
    }

    // 2) Try loading the saved Controller Data
    const storedControllerData = localStorage.getItem('mainControllerData');
    if (storedControllerData) {
      const parsedController = JSON.parse(storedControllerData);
      // You could check if parsedController.upWallet === address
      // If so, set it. Otherwise, set it to null.
      // But typically it's okay to keep it unless you explicitly want
      // to tie it to the same wallet each time:
      if (address && parsedController.upWallet === address) {
        setMainControllerData(parsedController);
      } else {
        // OPTIONAL: If you want to require a matching address in localStorage:
        // setMainControllerData(null);
        // Otherwise:
        setMainControllerData(parsedController);
      }
    } else {
      setMainControllerData(null);
    }
  }, [address]);

  // Whenever mainControllerData changes, store it (do not remove if null unless you want to).
  useEffect(() => {
    if (mainControllerData) {
      localStorage.setItem(
        'mainControllerData',
        JSON.stringify(mainControllerData)
      );
    } else {
      // If you truly want to remove data from localStorage when set to null:
      // localStorage.removeItem('mainControllerData');
      // Or you can do nothing, so that we keep the data around.
    }
  }, [mainControllerData]);

  const contextValue = useMemo(
    () => ({
      profile,
      setProfile,
      issuedAssets,
      setIssuedAssets,
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
