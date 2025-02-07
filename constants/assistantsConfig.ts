import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const burntPixRefinerTestnet: ExecutiveAssistant = {
  address: '0x8097f5E8236eFDCD743cd9615C6167685eD233ee',
  name: 'BurntPix Refiner',
  description:
    'Make transactions directed at you contribute iterations to a BurntPix of your choice.',
  iconPath: '/assistants/BurntPixRefiner.png',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP0ValueReceived,
  ],
  configParams: [
    {
      name: 'collectionAddress',
      type: 'address',
      defaultValue: '0x12167f1c2713ac4f740b4700c4c72bc2de6c686f',
      hidden: true,
      description: '',
    },
    {
      name: 'burntPixId',
      type: 'bytes32',
      hidden: false,
      description: 'BurntPix NFT id you want to refine:',
      placeholder: 'Enter NFT id',
    },
    {
      name: 'iterations',
      type: 'uint256',
      defaultValue: '100',
      hidden: false,
      description:
        'Number of refinement iterations incoming transactions will contribute:',
      placeholder: 'e.g. 100',
    },
  ],
  chainId: 4201,
};

export const donationAssistantTestnet: ExecutiveAssistant = {
  address: '0x4E88F07CA39EBcC589AF2C4f6f5246Df4c820536',
  name: 'Tip Assistant',
  description:
    'Tip LYX to an external wallet in every transaction that you sends you LYX.',
  iconPath: '/assistants/donations.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
  configParams: [
    {
      name: 'destinationAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to tip:',
      placeholder: "Enter destination address"
    },
    {
      name: 'donationPercentage',
      type: 'uint256',
      defaultValue: '10',
      hidden: false,
      description: 'Percentage of LYX to tip:',
      placeholder: "e.g 10"
    },
  ],
  chainId: 4201,
};

export const burntPixRefinerMainnet: ExecutiveAssistant = {
  address: '',
  name: 'BurntPix Refiner',
  description:
    'Make transactions directed at you contribute iterations to a BurntPix of your choice.',
  iconPath: '/assistants/BurntPixRefiner.png',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP0ValueReceived,
  ],
  configParams: [
    {
      name: 'collectionAddress',
      type: 'address',
      defaultValue: '',
      hidden: true,
      description: '',
    },
    {
      name: 'burntPixId',
      type: 'bytes32',
      defaultValue: '',
      hidden: false,
      description: 'BurntPix NFT id you want to refine:',
      placeholder: 'Enter NFT id',
    },
    {
      name: 'iterations',
      type: 'uint256',
      defaultValue: '100',
      hidden: false,
      description:
        'Number of refinement iterations incoming transactions will contribute:',
      placeholder: 'e.g. 100',
    },
  ],
  chainId: 42,
};

const testnetAssistants: {
  [key: string]: ExecutiveAssistant | ScreenerAssistant;
} = {
  [burntPixRefinerTestnet.address.toLowerCase()]: burntPixRefinerTestnet,
  [donationAssistantTestnet.address.toLowerCase()]: donationAssistantTestnet,
};

const mainnetAssistants: {
  [key: string]: ExecutiveAssistant | ScreenerAssistant;
} = {};

export const getAssistant = (
  address: string,
  networkId: number
): ExecutiveAssistant | ScreenerAssistant | null => {
  console.log('getAssistant', address, networkId);
  if (networkId === 4201) {
    return testnetAssistants[address.toLowerCase()];
  }
  if (networkId === 42) {
    return mainnetAssistants[address.toLowerCase()];
  }
  return null;
};

export const getAllAssistants = (
  networkId: number
): { [key: string]: ExecutiveAssistant | ScreenerAssistant } => {
  if (networkId === 42) {
    return testnetAssistants;
  }
  if (networkId === 4201) {
    return mainnetAssistants;
  }
  return {};
};
