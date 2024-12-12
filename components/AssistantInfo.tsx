
import React from 'react';
import {
    Box,
    Flex,
    Image,
    Text,
    Badge,
  } from '@chakra-ui/react';

const AssistantInfo = () => {
  return (
    <Flex
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      flexDirection="row"
      alignItems="center"
      maxWidth="400px"
    >
      <Image
        boxSize="50px"
        borderRadius="full"
        src="https://via.placeholder.com/50"
        alt="Assistant Logo"
      />
      <Box ml={4}>
        <Flex alignItems="center" flexWrap="nowrap">
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            Asset Forwarder
          </Text>
          <Badge colorScheme="orange" fontSize="0.8em" borderRadius="md">
            Executive Assistant
          </Badge>
        </Flex>
        <Text fontSize="sm" color="gray.600">
          An executive assistant that can forward digital assets to another
          destination address.
        </Text>
        <Text fontSize="sm" color="gray.600" mb={2}>
          By:{' '}
          <span style={{ fontWeight: 'bold', color: '#E53E3E' }}>Year One</span>
        </Text>
      </Box>
    </Flex>
  );
} 

export default AssistantInfo;