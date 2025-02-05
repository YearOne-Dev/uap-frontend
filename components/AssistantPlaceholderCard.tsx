'use client';

import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';

const AssistantPlaceholderCard = () => {
  return (
    <Flex
      border="1px solid #2C5765"
      borderRadius="10px"
      p={4}
      flexDirection={['column', 'row']} // Stacked on small screens
      alignItems="center"
      maxWidth={['100%', '400px']}
      w="100%"
      minHeight="250px"
      minW={'300px'} // Ensures all cards have the same height
    >
      <Image
        boxSize={['80px', '100px']} // Placeholder avatar
        borderRadius="full"
        border="2px solid"
        src="/assistants/UPAssistantPFP.jpeg" // Empty src for placeholder
        alt="Placeholder"
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
            Coming Soon
          </Text>
          <Flex
            fontSize={['sm', 'md']}
            color="gray.600"
            mb={2}
            flexDirection={'row'}
            gap={2}
            justifyContent={'flex-start'}
            alignItems={'center'}
          >
            <Text fontWeight={600}>By:</Text>
            <Avatar
              border={'1px solid var(--chakra-colors-uap-grey)'}
              height={'20px'}
              width={'20px'}
            />
            <Text fontWeight={600}>Anyone</Text>
          </Flex>
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
            Executive Assistant
          </Badge>
          <Text fontSize={['sm', 'md']} color="gray.600">
            More assistants coming soon. Join the waitlist to add yours to the
            catalog!
          </Text>
        </Box>
        <Button
          mt="4"
          as="a"
          href="/waitlist-signup" // Link to waitlist signup page
          colorScheme="orange"
          variant="solid"
          size="sm"
          width={['100%', '200px']} // Full width on small screens
          borderRadius={'10px'}
        >
          Add yours!
        </Button>
      </Flex>
    </Flex>
  );
};

export default AssistantPlaceholderCard;
