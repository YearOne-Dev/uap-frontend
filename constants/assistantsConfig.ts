import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const tipAssistantTestnet: ExecutiveAssistant = {
  address: '0xf24c39a4d55994e70059443622fc166f05b5ff14',
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
  address: '0xc7ac1d785a3d67c6194daca801822f377fd93569',
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
  address: '0x34a8ad9cf56dece5790f64f790de137b517169c6',
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
  address: '0x0c3dc7ea7521c79b99a667f2024d76714d33def2',
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
  address: '0x3cb70b7553d4aff2c0062d54a72ef99cfe228020',
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
  address: '0xf13ff6e628cd1c3c20b0ac904ff7759b34ef5d7e',
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
