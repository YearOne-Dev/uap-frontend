import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';

// todo remove dummy data
export const forwarderAssistant: ExecutiveAssistant = {
  address: '0xA9b77D351200f5C9B1F6b7B730fFFA97bF991503',
  name: 'Asset Forwarder',
  description:
    'An executive assistant that can forward digital assets to another destination address.',
  iconPath: 'assets/assistants/forwarder.svg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xEfD8Dc18502167988633f29d88ad45103D84C28A',
  supportedTransactionTypes: ['LSP7Tokens', 'LSP8Tokens', 'LYX'],
  configParams: [{ name: 'destinationAddress', type: 'address' }],
  chainId: 4201,
};

export const curationCheckerAssistant: ScreenerAssistant = {
  address: '0x...',
  name: 'Curation Checker',
  description:
    'A screener assistant that can check if a digital asset is curated.',
  iconPath: 'assets/assistants/curation-checker.svg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Screener',
  supportedTransactionTypes: ['LSP7Tokens', 'LSP8Tokens', 'LYX'],
  creatorAddress: '0x...',
  configParams: { curatedListAddress: '0x...' },
  chainId: 4201,
};
