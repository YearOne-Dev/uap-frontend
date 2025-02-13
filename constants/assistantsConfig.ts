import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const tipAssistantTestnet: ExecutiveAssistant = {
  address: '0x912c9816aC5b7Ee8A02B5e8CFd66f04596Bdb6A9',
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
      name: 'tipAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to tip:',
      placeholder: 'Enter destination address',
    },
    {
      name: 'tipAmount',
      type: 'uint256',
      defaultValue: '2',
      hidden: false,
      description: 'Percentage of LYX to tip:',
      placeholder: 'e.g 10',
      validate: (value: any) => {
        const number = parseInt(value);
        return number > 0 && number <= 100 && value.indexOf('.') === -1;
      },
      validationMessage:
        'Tip amount must be between 1 and 100 without decimals',
    },
  ],
  chainId: 4201,
};

// TODO tipAssistantMainnet

export const burntPixRefinerTestnet: ExecutiveAssistant = {
  address: '0xA52d78067089f07f9492e173E2fA76E712201e3D',
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
      validate: (value: any) => {
        return parseInt(value) >= 0;
      },
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
      validate: (value: any) => {
        return parseInt(value) >= 0;
      },
    },
  ],
  chainId: 42,
};

const testnetAssistants: {
  [key: string]: ExecutiveAssistant | ScreenerAssistant;
} = {
  // DO NOT INCLUDE FEE ASSISTANT
  [burntPixRefinerTestnet.address.toLowerCase()]: burntPixRefinerTestnet,
  [tipAssistantTestnet.address.toLowerCase()]: tipAssistantTestnet,
};

const mainnetAssistants: {
  // DO NOT INCLUDE FEE ASSISTANT
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
  // excluding fee assistant
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
