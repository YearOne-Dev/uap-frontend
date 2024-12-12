import React from 'react';
import {
  Flex,
  Image,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';

// Supported Transactions Component
const SupportedTransactions = () => {
    return (
      <Flex
        borderWidth="1px"
        borderRadius="lg"
        p={4}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontWeight="bold">Supported Transactions</Text>
        <HStack spacing={4}>
          <VStack>
            <Image
              src="https://via.placeholder.com/24"
              alt="Icon"
              boxSize="24px"
            />
            <Text fontSize="sm">LSP7s</Text>
          </VStack>
          <VStack>
            <Image
              src="https://via.placeholder.com/24"
              alt="Icon"
              boxSize="24px"
            />
            <Text fontSize="sm">LSP8s</Text>
          </VStack>
          <VStack>
            <Image
              src="https://via.placeholder.com/24"
              alt="Icon"
              boxSize="24px"
            />
            <Text fontSize="sm">LYX</Text>
          </VStack>
        </HStack>
      </Flex>
    );
  }

  export default SupportedTransactions;