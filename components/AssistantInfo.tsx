import React from 'react';
import { Badge, Box, Flex, Image, Text } from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';

const AssistantInfo: React.FC<{
  assistant: ExecutiveAssistant | ScreenerAssistant;
}> = ({ assistant }) => {
  return (
    <Flex
      p={4}
      flexDirection={['column', 'row']} // Stack vertically on small screens
      alignItems={['flex-start', 'center']} // Adjust alignment based on screen size
      w="100%" // Full width for better responsiveness
    >
      <Image
        boxSize={['40px', '50px']} // Adjust size for small and larger screens
        borderRadius="full"
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
        mb={[2, 0]} // Add margin-bottom on small screens
      />
      <Box ml={[0, 4]} mt={[2, 0]} w="100%">
        <Flex
          alignItems={['flex-start', 'center']} // Adjust alignment
          flexWrap="wrap"
        >
          <Text fontSize={['md', 'lg']} fontWeight="bold" mb={[1, 0]}>
            {assistant.name}
          </Text>
          <Badge
            ml={[0, 4]} // Remove margin-left on small screens
            mt={[2, 0]} // Add margin-top on small screens
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
        <Text fontSize={['sm', 'md']} color="gray.600" mb={2}>
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
