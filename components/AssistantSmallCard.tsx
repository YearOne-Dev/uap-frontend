import React from 'react';
import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';

// todo: link: hidratation issue
const AssistantSmallCard: React.FC<{
  screener: ExecutiveAssistant | ScreenerAssistant;
}> = ({ screener }) => {
  return (
    <Flex
      border="1px solid #2C5765"
      borderRadius="10px"
      p={4}
      flexDirection="row"
      alignItems="center"
      maxWidth="400px"
    >
      <Image
        boxSize="50px"
        borderRadius="full"
        src={screener.iconPath}
        alt={`${screener.name} Logo`}
      />
      <Box ml={4}>
        <Text fontSize="lg" fontWeight="bold" mb={1}>
          {screener.name}
        </Text>
        <Text fontSize="sm" color="gray.600" mb={2}>
          By:{' '}
          <a
            href={screener.links[0].url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 'bold', color: '#E53E3E' }}
          >
            Year One
          </a>
        </Text>
        <Badge
          fontSize="0.8em"
          borderRadius="md"
          border="1px solid"
          borderColor="uap.font"
          color="uap.font"
          bg="transparent"
          textTransform="none"
        >
          {screener.assistantType} Assistant
        </Badge>
        <Text fontSize="sm" color="gray.600">
          {screener.description}
        </Text>
      </Box>
    </Flex>
  );
};

export default AssistantSmallCard;
