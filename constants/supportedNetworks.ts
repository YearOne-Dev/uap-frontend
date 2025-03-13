import { ExecutiveAssistant } from '@/constants/CustomTypes';
import {
  burntPixRefinerMainnet,
  burntPixRefinerTestnet,
  forwarderAssistantMainnet,
  forwarderAssistantTestnet,
  tipAssistantMainnet,
  tipAssistantTestnet,
} from '@/constants/assistantsConfig';

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
  protocolAddress: string;
  defaultURDUP: string;
  hasUPSupport: boolean;
  icon: string;
  universalEverything: string;
  luksoSiteName: string;
  assistants: { [key: string]: ExecutiveAssistant };
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
    url: 'https://upassistants.com',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.mainnet.lukso.network/',
    token: 'LYX',
    protocolAddress: '0x94de6507142a5f820b7fa8c01e9cde9c88ca8491',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    hasUPSupport: true,
    icon: '/lyx_icon_mainnet.svg',
    universalEverything: 'https://universaleverything.io',
    luksoSiteName: 'mainnet',
    assistants: {
      [tipAssistantMainnet.address.toLowerCase()]: tipAssistantMainnet,
      [forwarderAssistantMainnet.address.toLowerCase()]:
        forwarderAssistantMainnet,
      [burntPixRefinerMainnet.address.toLowerCase()]: burntPixRefinerMainnet,
    },
  },
  '4201': {
    name: 'LUKSO Testnet',
    displayName: 'Lukso Testnet',
    urlName: 'lukso-testnet',
    chainId: 4201,
    url: 'https://upassistants.com',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.testnet.lukso.network/',
    token: 'LYXt',
    protocolAddress: '0xb59419c3d408304d026194c2034c028bc6be3726',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    hasUPSupport: true,
    icon: '/lyx_icon_testnet.svg',
    universalEverything: 'https://universaleverything.io',
    luksoSiteName: 'testnet',
    assistants: {
      [tipAssistantTestnet.address.toLowerCase()]: tipAssistantTestnet,
      [forwarderAssistantTestnet.address.toLowerCase()]:
        forwarderAssistantTestnet,
      [burntPixRefinerTestnet.address.toLowerCase()]: burntPixRefinerTestnet,
    },
  },
};

export const networkNameToIdMapping: { [key: string]: number } = {
  [CHAINS.LUKSO]: 42,
  [CHAINS.LUKSO_TESTNET]: 4201,
};
