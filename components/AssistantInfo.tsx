import React from 'react';
import { Badge, Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';
import { getNetwork } from '@/utils/utils';

interface AssistantInfoProps {
  assistant: ExecutiveAssistant | ScreenerAssistant;
  includeLink?: boolean;
}

const AssistantInfo = ({
  assistant,
  includeLink = false,
}: AssistantInfoProps) => {
  let link = '';
  if (includeLink) {
    const network = getNetwork(assistant.chainId);
    link += '/' + network.urlName;
    link += '/catalog';
    link +=
      assistant.assistantType === 'Screener'
        ? '/screener-assistants'
        : '/executive-assistants';
    link += `/${assistant.address}`;
  }
  return (
    <Flex
      p={4}
      flexDirection={['column', 'row']}
      alignItems={['flex-start', 'center']}
      w="100%"
    >
      <Image
        boxSize={['40px', '50px']}
        borderRadius="full"
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
        mb={[2, 0]} // Add margin-bottom on small screens
      />
      <Box ml={[0, 4]} mt={[2, 0]} w="100%">
        <Flex alignItems={['flex-start', 'center']} flexWrap="wrap" gap={5}>
          <Text fontSize={['md', 'lg']} fontWeight="bold" mb={[1, 0]}>
            {assistant.name}
          </Text>
          <Badge
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
        <Text fontSize={['sm', 'md']} color="gray.600">
          {assistant.description}
        </Text>
        <Text fontSize={['sm', 'md']} color="gray.600" mb={4}>
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
        {includeLink && (
          <Button
            as="a"
            href={link}
            colorScheme="orange"
            variant="solid"
            size="sm"
          >
            View Details
          </Button>
        )}
      </Box>
    </Flex>
  );
};

export default AssistantInfo;
