import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { LSP3ProfileMetadata } from '@lukso/lsp3-contracts';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getNetwork } from '@/utils/utils';

export interface IProfileBasicInfo {
  upName: string | null;
  avatar: string | null;
}

export const getProfileBasicInfo = async (
  chainId: number,
  contributor: string
): Promise<IProfileBasicInfo> => {
  let upName = null,
    avatar = null;
  try {
    const networkConfig = getNetwork(chainId);
    const ipfsGateway = networkConfig.ipfsGateway;
    const profileData = await getProfileData(
      contributor,
      ipfsGateway,
      networkConfig.rpcUrl
    );
    if (profileData) {
      if (profileData.profileImage && profileData.profileImage.length > 0) {
        avatar = `${ipfsGateway}/${profileData.profileImage[0].url.replace(
          'ipfs://',
          ''
        )}`;
      }
      upName = profileData.name;
    }
  } catch (error) {
    console.error('Error fetching profile data for', contributor, error);
  } finally {
    return { upName, avatar };
  }
};

const getProfileData = async (
  universalProfileAddress: string,
  ipfsGateway: string,
  rpcUrl: string
): Promise<LSP3ProfileMetadata> => {
  const erc725js = new ERC725(
    lsp3ProfileSchema as ERC725JSONSchema[],
    universalProfileAddress,
    rpcUrl,
    {
      ipfsGateway: ipfsGateway,
    }
  );

  const profileData = await erc725js.fetchData('LSP3Profile');
  return (profileData!.value as { LSP3Profile: Record<string, any> })
    .LSP3Profile as LSP3ProfileMetadata;
};

export const getUrlNameByChainId = (chainId: number): string => {
  return supportedNetworks[chainId].urlName;
};

export const getChainIdByUrlName = (urlName: string): number => {
  return (
    Object.values(supportedNetworks).find(
      network => network.urlName === urlName
    )?.chainId || 42
  );
};
