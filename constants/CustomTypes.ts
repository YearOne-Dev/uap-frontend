export type Link = {
  name: string;
  url: string;
};

export type ExecutiveAssistant = {
  address: string;
  name: string;
  description: string;
  iconPath: string;
  links: Link[];
  assistantType: 'Executive';
  creatorAddress: string;
  supportedTransactionTypes: string[];
  configParams: { destinationAddress: string };
};

export type ScreenerAssistant = {
  address: string;
  name: string;
  description: string;
  iconPath: string;
  links: Link[];
  assistantType: 'Screener';
  creatorAddress: string;
  configParams: { curatedListAddress: string };
};
