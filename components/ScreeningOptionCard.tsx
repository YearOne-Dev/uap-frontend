import React from 'react';
import { Badge, Box, Flex, Image, Text } from "@chakra-ui/react";


// Screening Option Card Component
 const ScreeningOptionCard = () => {
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
          alt="Screener Logo"
        />
        <Box ml={4}>
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            Curation Checker
          </Text>
          <Text fontSize="sm" color="gray.600" mb={2}>
            By:{' '}
            <span style={{ fontWeight: 'bold', color: '#E53E3E' }}>Year One</span>
          </Text>
          <Badge
            colorScheme="blue"
            fontSize="0.8em"
            borderRadius="md"
            px={2}
            py={1}
            mb={2}
          >
            Screener Assistant
          </Badge>
          <Text fontSize="sm" color="gray.600">
            Checks if a specified address is a member of a curated list.
          </Text>
        </Box>
      </Flex>
    );
  }

  export default ScreeningOptionCard;
