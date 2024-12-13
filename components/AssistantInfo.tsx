import React from 'react';
import { Box, Flex, Image, Text, Badge } from '@chakra-ui/react';

type Link = {
  name: string;
  url: string;
};

type ExecutiveAssistant = {
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

const AssistantInfo: React.FC<{ assistant: ExecutiveAssistant }> = ({
  assistant,
}) => {
  return (
    <Flex
      p={4}
      flexDirection="row"
      alignItems="center"
      minWidth="400px"
      maxWidth="600px"
    >
      <Image
        boxSize="50px"
        borderRadius="full"
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
      />
      <Box ml={4}>
        <Flex alignItems="center" flexWrap="nowrap">
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            {assistant.name}
          </Text>
          <Badge
            ml={4}
            fontSize="0.8em"
            borderRadius="md"
            border="1px solid"
            borderColor="uap.orange"
            color="uap.orange"
            bg="transparent"
            textTransform="none"
          >
            {assistant.assistantType} Assistant
          </Badge>
        </Flex>
        <Text fontSize="sm" color="gray.600">
          {assistant.description}
        </Text>
        <Text fontSize="sm" color="gray.600" mb={2}>
          By:{' '}
          <a
            href={assistant.links[0].url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 'bold', color: '#E53E3E' }}
          >
            Year One
          </a>
        </Text>
      </Box>
    </Flex>
  );
};

export default AssistantInfo;
