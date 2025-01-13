import React from 'react';
import { Badge, Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';
import { getNetwork } from '@/utils/utils';

const AssistantSmallCard = ({
  assistant,
  includeLink = false,
}: {
  assistant: ExecutiveAssistant | ScreenerAssistant;
  includeLink?: boolean;
}) => {
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
      border="1px solid #2C5765"
      borderRadius="10px"
      p={4}
      flexDirection={['column', 'row']} // Stacked on small screens
      alignItems="center"
      maxWidth={['100%', '400px']}
      w="100%"
      minHeight="250px" // Ensures all cards have the same height
    >
      <Image
        boxSize={['40px', '50px']} // Smaller image on small screens
        borderRadius="full"
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
        mb={[4, 0]} // Margin bottom for stacked layout
      />
      <Flex
        ml={[0, 4]}
        flexDirection="column"
        justifyContent="space-between" // Ensures content is evenly spaced
        alignItems={['center', 'flex-start']} // Center on small screens
        textAlign={['center', 'left']} // Center text on small screens
        w="100%"
        h="100%" // Ensure content stretches to fill the height
      >
        <Box>
          <Text fontSize={['md', 'lg']} fontWeight="bold" mb={1}>
            {assistant.name}
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
          <Badge
            fontSize={['0.7em', '0.8em']} // Smaller font size on small screens
            borderRadius="md"
            border="1px solid"
            borderColor="uap.font"
            color="uap.font"
            bg="transparent"
            textTransform="none"
            mb={2}
          >
            {assistant.assistantType} Assistant
          </Badge>
          <Text fontSize={['sm', 'md']} color="gray.600">
            {assistant.description}
          </Text>
        </Box>
        {includeLink && (
          <Button
            mt="4"
            as="a"
            href={link}
            colorScheme="orange"
            variant="solid"
            size="sm"
            width={['100%', '200px']} // Full width on small screens
          >
            View Details
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default AssistantSmallCard;
