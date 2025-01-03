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
}

export type ExecutiveAssistant = AbstractAssistant & {
  assistantType: 'Executive';
  supportedTransactionTypes: string[];
  configParams: { destinationAddress: string };
};

export type ScreenerAssistant = AbstractAssistant & {
  assistantType: 'Screener';
  configParams: { curatedListAddress: string };
};
