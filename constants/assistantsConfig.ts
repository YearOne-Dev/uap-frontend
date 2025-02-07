import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

const yearOneDonatioMainnetAddress='';
const yearOneDonatioTestnetAddress='0x9b071Fe3d22EAd27E2CDFA1Afec7EAa3c3F32009';
const yearOneDonationPercentage=10;

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
  donationConfig: {
    donationPercentage: yearOneDonationPercentage,
    donationAddress: yearOneDonatioTestnetAddress,
  },
  configParams: [
    { name: 'iterations', type: 'uint256' },
    { name: 'collectionAddress', type: 'address' },
    { name: 'burntPixId', type: 'bytes32' },
  ],
  chainId: 4201,
};

export const donationAssistantTestnet: ExecutiveAssistant = {
  address: '0x4E88F07CA39EBcC589AF2C4f6f5246Df4c820536',
  name: 'Donation Assistant',
  description:
    'Donate LYX to an external wallet in every transaction that you sends you LYX.',
  iconPath: '/assistants/donations.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  supportedTransactionTypes: [LSP1_TYPE_IDS.LSP0ValueReceived],
  configParams: [
    { name: 'destinationAddress', type: 'address' },
    { name: 'donationPercentage', type: 'uint256' },
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
  donationConfig: {
    donationPercentage: yearOneDonationPercentage,
    donationAddress: yearOneDonatioMainnetAddress, // TODO: Add mainnet address
  },
  configParams: [
    { name: 'iterations', type: 'uint256' },
    { name: 'collectionAddress', type: 'address' },
    { name: 'burntPixId', type: 'bytes32' },
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
