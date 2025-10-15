'use client';
import React from 'react';
import {
  VStack,
  Text,
  Flex,
  Input,
} from '@chakra-ui/react';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface AssistantConfigurationSectionProps {
  selectedConfigTypes: string[];
  configParams: any[];
  fieldValues: Record<string, string>;
  assistantAddress: string;
  currentNetworkId: number;
  onFieldChange: (fieldName: string, value: string) => void;
}

const AssistantConfigurationSection: React.FC<AssistantConfigurationSectionProps> = ({
  selectedConfigTypes,
  configParams,
  fieldValues,
  assistantAddress,
  currentNetworkId,
  onFieldChange,
}) => {
  if (configParams.length === 0) return null;

  const assistantName = supportedNetworks[currentNetworkId]?.assistants[assistantAddress.toLowerCase()]?.name || 'assistant';

  return (
    <VStack spacing={4} align="stretch">
      <VStack align="start" spacing={2}>
        <Text fontSize="lg" fontWeight="bold">
          🤖 Assistant Configuration
        </Text>
        <Text fontSize="sm" color="gray.600">
          Configure the specific settings for your {assistantName}
        </Text>
      </VStack>
      
      <VStack spacing={4} align="stretch">
        {configParams.map(param => (
          <Flex
            key={param.name}
            flexDirection="row"
            gap={4}
            maxWidth="550px"
            display={param.hidden ? 'none' : undefined}
          >
            <Text fontWeight="bold" fontSize="sm" w="70%">
              {param.description}
            </Text>
            <Input
              hidden={param.hidden}
              placeholder={param.placeholder}
              value={fieldValues[param.name] || ''}
              onChange={e => onFieldChange(param.name, e.target.value)}
              w="70%"
            />
          </Flex>
        ))}
      </VStack>
    </VStack>
  );
};

export default AssistantConfigurationSection;