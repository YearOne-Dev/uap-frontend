import React from 'react';
import { Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';

export const transactionTypeMap: {
  [key: string]: {
    label: string;
    typeName: string;
    icon?: string;
    iconPath?: string;
  };
} = {
  LSP7Tokens: { label: 'Receiving', typeName: 'LSP7s', icon: '🪙' },
  LSP8Tokens: { label: 'Receiving', typeName: 'LSP8s', icon: '🖼️' },
  LYX: {
    label: 'Receiving',
    typeName: 'LYX',
    iconPath: '/lyx_icon_mainnet.svg',
  },
};

const TransactionBlock: React.FC<{
  label: string;
  typeName: string;
  icon?: string;
  iconPath?: string;
}> = ({ label, typeName, icon, iconPath }) => (
  <VStack textAlign="center" spacing={1}>
    <Text fontWeight="bold" fontSize="md">
      {label}
    </Text>
    <Flex>
      <Text fontWeight="bold" fontSize="md" ml="4px">
        {icon && icon}
        {iconPath && <Image src={iconPath} alt={iconPath} height={'20px'} />}
      </Text>
      <Text fontWeight="bold" fontSize="md">
        {typeName}
      </Text>
    </Flex>
  </VStack>
);

const SupportedTransactions: React.FC<{
  assistant: ExecutiveAssistant | ScreenerAssistant;
}> = ({ assistant }) => {
  return (
    <Flex p={4} flexDirection="row" alignItems="center" w="100%" gap="4">
      <Flex flexDirection="column" alignItems="center">
        <Text fontWeight="bold" fontSize="md">
          Supported
        </Text>
        <Text fontWeight="bold" fontSize="md">
          Transactions
        </Text>
      </Flex>
      <HStack spacing={8} justifyContent="center" alignItems="center">
        {assistant.supportedTransactionTypes.map(type =>
          transactionTypeMap[type] ? (
            <TransactionBlock
              key={type}
              typeName={transactionTypeMap[type].typeName}
              label={transactionTypeMap[type].label}
              icon={transactionTypeMap[type].icon}
              iconPath={transactionTypeMap[type].iconPath}
            />
          ) : (
            <Text key={type} fontWeight="bold" fontSize="md">
              Unknown Transaction: {type}
            </Text>
          )
        )}
      </HStack>
    </Flex>
  );
};

export default SupportedTransactions;
