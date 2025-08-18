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

export type ConfigParam = {
  name: string;
  type: string;
  description: string;
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
  validate?: (value: any, upAddress: string) => boolean;
  validationMessage?: string;
  options?: { value: any; label: string }[]; // For radio button selections
};

export type ExecutiveAssistant = AbstractAssistant & {
  assistantType: 'Executive';
  configParams: ConfigParam[];
};

export type ScreenerAssistant = {
  address: string;
  name: string;
  description: string;
  iconPath: string;
  assistantType: 'Screener';
  creatorAddress: string;
  configParams: ConfigParam[];
  chainId: number;
  links?: Link[];
};
