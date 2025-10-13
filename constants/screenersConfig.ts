import { ScreenerAssistant } from './CustomTypes';
import { ethers } from 'ethers';

// Testnet Screener Assistants
export const notifierListScreenerTestnet: ScreenerAssistant = {
  address: '0x31c7ab87662132f5901f190032d49e0abe9fabec',
  name: 'Address List Screener',
  description: 'Screen transactions based on source',
  iconPath: '/screeners/default-list.svg',
  assistantType: 'Screener',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  configParams: [
    {
      name: 'returnValueWhenInList',
      type: 'bool',
      description: 'Screening behavior for listed addresses:',
      defaultValue: 'true',
      options: [
        { value: true, label: 'If source address is in list, screening passes' },
        { value: false, label: 'If source address is in list, screening fails' }
      ]
    }
  ],
  chainId: 4201,
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
};

export const notifierCurationScreenerTestnet: ScreenerAssistant = {
  address: '0x647360684dd6ad295d1c62bebc43c11a843a4248',
  name: 'Community Gate',
  description: 'Screen based on curated community membership - only members pass screening',
  iconPath: '/screeners/default-curation.svg',
  assistantType: 'Screener',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  configParams: [
    {
      name: 'curatedListAddress',
      type: 'address',
      description: 'Curated list contract address:',
      placeholder: 'Enter contract address (0x...)',
      required: true,
      validate: (value: any) => {
        return ethers.isAddress(value);
      },
      validationMessage: 'Please enter a valid curated list contract address'
    },
    {
      name: 'returnValueWhenCurated',
      type: 'bool',
      description: 'Screening behavior for community members:',
      defaultValue: 'true',
      options: [
        { value: true, label: 'Community members pass screening' },
        { value: false, label: 'Community members fail screening' }
      ]
    }
  ],
  chainId: 4201,
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
};

// Mainnet Screener Assistants
export const notifierListScreenerMainnet: ScreenerAssistant = {
  address: '0x7fe2bf2ec24f94fd43f10d6911123a18450e3c5e',
  name: 'Address List Screener',
  description: 'Screen transactions based on notifier address - only qualified addresses pass screening',
  iconPath: '/screeners/default-list.svg',
  assistantType: 'Screener',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  configParams: [
    {
      name: 'returnValueWhenInList',
      type: 'bool',
      description: 'Screening behavior for listed addresses:',
      defaultValue: 'true',
      options: [
        { value: true, label: 'If source address is in list, screening passes' },
        { value: false, label: 'If source address is in list, screening fails' }
      ]
    }
  ],
  chainId: 42,
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
};

export const notifierCurationScreenerMainnet: ScreenerAssistant = {
  address: '0x9ae3cdfe679935428094eea1668d30cdad8ede8c',
  name: 'Community Gate',
  description: 'Screen based on curated community membership - only members pass screening',
  iconPath: '/screeners/default-curation.svg',
  assistantType: 'Screener',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  configParams: [
    {
      name: 'curatedListAddress',
      type: 'address',
      description: 'Curated list contract address:',
      placeholder: 'Enter contract address (0x...)',
      required: true,
      validate: (value: any) => {
        return ethers.isAddress(value);
      },
      validationMessage: 'Please enter a valid curated list contract address'
    },
    {
      name: 'returnValueWhenCurated',
      type: 'bool',
      description: 'Screening behavior for community members:',
      defaultValue: 'true',
      options: [
        { value: true, label: 'Community members pass screening' },
        { value: false, label: 'Community members fail screening' }
      ]
    }
  ],
  chainId: 42,
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
};