export type Link = {
  name: string;
  url: string;
};
export type AbstractAssistant = {
  address: string;
  name: string;
  description: string;
  iconPath: string;
  links: Link[];
  creatorAddress: string;
  supportedTransactionTypes: string[];
  chainId: number;
};

export type ExecutiveAssistant = AbstractAssistant & {
  assistantType: 'Executive';
  configParams: { name: string; type: string }[];
  donationConfig?: { donationAddress: string; donationPercentage: number };
};

export type ScreenerAssistant = AbstractAssistant & {
  assistantType: 'Screener';
  configParams: { name: string; type: string }[];
};
