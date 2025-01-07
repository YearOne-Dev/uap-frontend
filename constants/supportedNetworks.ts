interface ChainInfo {
  name: string;
  displayName: string;
  urlName: string;
  chainId: number;
  url: string;
  rpcUrl: string;
  ipfsGateway: string;
  explorer: string;
  explorerApi: string;
  token: string;
  protocolAddress: string;
  multicall3: {
    readonly address: `0x${string}`;
    readonly blockCreated: number;
  };
  defaultURDUP: string;
  wrapped: string;
  hasUPSupport: boolean;
  testnet: boolean;
  icon: string;
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
    explorerApi: 'https://explorer.execution.testnet.lukso.network/api/v2',
    token: 'LYX',
    protocolAddress: '',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    wrapped: '0xB789fbA6532378151D2395f1171B1a7461BF6fBe',
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 468183,
    },
    hasUPSupport: true,
    testnet: false,
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
    explorer: 'https://explorer.execution.testnet.lukso.network',
    explorerApi: 'https://explorer.execution.testnet.lukso.network/api/v2',
    token: 'LYXt',
    protocolAddress: '0xc3F4196fbe74E7257Cb4A5c92aaD1E21186d7cAE',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    wrapped: '0xB789fbA6532378151D2395f1171B1a7461BF6fBe',
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 605348,
    },
    hasUPSupport: true,
    testnet: true,
    icon: '/lyx_icon_testnet.svg',
  },
};
