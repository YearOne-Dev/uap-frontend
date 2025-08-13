import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const tipAssistantTestnet: ExecutiveAssistant = {
  address: '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9',
  name: 'Tip Assistant',
  description:
    'Tip LYX to an external wallet with every incoming LYX transaction.',
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
      validationMessage: 'Tip address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
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

export const forwarderAssistantTestnet: ExecutiveAssistant = {
  address: '0x1296ace80af3230c961c79a9bee6a07b4a45f53f',
  name: 'Forwarder Assistant',
  description: 'Forward incoming assets to an external address.',
  iconPath: '/assistants/forwarder.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
  ],
  configParams: [
    {
      name: 'targetAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to forward assets to:',
      placeholder: 'Enter destination address',
      validationMessage: 'Destination address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
    },
  ],
  chainId: 4201,
};

export const burntPixRefinerTestnet: ExecutiveAssistant = {
  address: '0x6bec84e010fd6083509121ff7966ffc9fe35c803',
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

export const tipAssistantMainnet: ExecutiveAssistant = {
  address: '0x63908b663b712ef1bdd3b64ee47780e4967346fc',
  name: 'Tip Assistant',
  description:
    'Tip LYX to an external wallet with every incoming LYX transaction.',
  iconPath: '/assistants/donations.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
  configParams: [
    {
      name: 'tipAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to tip:',
      placeholder: 'Enter destination address',
      validationMessage: 'Tip address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
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
  chainId: 42,
};

export const forwarderAssistantMainnet: ExecutiveAssistant = {
  address: '0xc503d7f50c4d2c0649fa86e43c247eb4e2e62fec',
  name: 'Forwarder Assistant',
  description: 'Forward incoming assets to an external address.',
  iconPath: '/assistants/forwarder.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
  ],
  configParams: [
    {
      name: 'targetAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to forward assets to:',
      placeholder: 'Enter destination address',
      validationMessage: 'Destination address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
    },
  ],
  chainId: 42,
};

export const burntPixRefinerMainnet: ExecutiveAssistant = {
  address: '0x7ea957947e3dd7e2dc24582804711c1b9a3f898f',
  name: 'BurntPix Refiner',
  description:
    'Make transactions directed at you contribute iterations to a BurntPix of your choice.',
  iconPath: '/assistants/BurntPixRefiner.png',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP0ValueReceived,
  ],
  configParams: [
    {
      name: 'collectionAddress',
      type: 'address',
      defaultValue: '0x3983151E0442906000DAb83c8b1cF3f2D2535F82',
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
