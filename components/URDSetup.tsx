import React from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';

const URDSetup: React.FC = () => {
  return (
    <Box textAlign="center" maxWidth="600px" mx="auto" mt={8}>
      <Text fontSize="lg" fontWeight="semibold" mb={4}>
        In order to engage an assistant you must first install the Universal
        Assistant Protocol on your 🆙
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Instruction 1 */}
        <HStack justifyContent="space-between" align="center">
          <Text fontSize="md" textAlign="left" fontWeight="semibold" flex="1">
            1. Give the UP Browser Extension the necessary permissions to engage
            the protocol
          </Text>
          <Button
            minW="130px"
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
          >
            Give Permissions
          </Button>
        </HStack>

        {/* Instruction 2 */}
        <HStack justifyContent="space-between" align="center">
          <Text fontSize="md" textAlign="left" fontWeight="semibold" flex="1">
            2. Install the Universal Assistant Protocol on your 🆙
          </Text>
          <Button
            minW="130px"
            size="sm"
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
          >
            Give Permissions
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default URDSetup;
