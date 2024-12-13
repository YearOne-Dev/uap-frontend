import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';

// todo remove dummy data
export const forwarderAssistant: ExecutiveAssistant = {
  address: '0x...',
  name: 'Asset Forwarder',
  description:
    'An executive assistant that can forward digital assets to another destination address.',
  iconPath: 'assets/assistants/forwarder.svg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0x...',
  supportedTransactionTypes: ['LSP7Tokens', 'LSP8Tokens', 'LYX'],
  configParams: { destinationAddress: '0x...' },
};

export const curationCheckerAssistant: ScreenerAssistant = {
  address: '0x...',
  name: 'Curation Checker',
  description:
    'A screener assistant that can check if a digital asset is curated.',
  iconPath: 'assets/assistants/curation-checker.svg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Screener',
  creatorAddress: '0x...',
  configParams: { curatedListAddress: '0x...' },
};
