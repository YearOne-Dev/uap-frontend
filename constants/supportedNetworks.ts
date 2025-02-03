interface ChainInfo {
  name: string;
  displayName: string;
  urlName: string;
  chainId: number;
  url: string;
  rpcUrl: string;
  ipfsGateway: string;
  explorer: string;
  token: string;
  burntPixCollectionAddress: string;
  protocolAddress: string;
  defaultURDUP: string;
  hasUPSupport: boolean;
  icon: string;
}

export enum CHAINS {
  LUKSO = 'lukso',
  LUKSO_TESTNET = 'lukso-testnet',
}

export const supportedNetworks: { [key: string]: ChainInfo } = {
  '42': {
    name: 'LUKSO',
    displayName: 'Lukso Mainnet',
    urlName: 'lukso',
    chainId: 42,
    url: 'https://universalassitant.app',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.mainnet.lukso.network/',
    token: 'LYX',
    protocolAddress: '',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    burntPixCollectionAddress: '0x',
    hasUPSupport: true,
    icon: '/lyx_icon_mainnet.svg',
  },
  '4201': {
    name: 'LUKSO Testnet',
    displayName: 'Lukso Testnet',
    urlName: 'lukso-testnet',
    chainId: 4201,
    url: 'https://testnet.universalassitant.app',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.testnet.lukso.network/',
    token: 'LYXt',
    burntPixCollectionAddress: '0x12167f1c2713ac4f740b4700c4c72bc2de6c686f',
    protocolAddress: '0xc3F4196fbe74E7257Cb4A5c92aaD1E21186d7cAE',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    hasUPSupport: true,
    icon: '/lyx_icon_testnet.svg',
  },
};

export const networkNameToIdMapping: { [key: string]: number } = {
  [CHAINS.LUKSO]: 42,
  [CHAINS.LUKSO_TESTNET]: 4201,
} ;
