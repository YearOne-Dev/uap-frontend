'use client';
import React from 'react';
import {
  Box,
  Text,
  HStack,
  Switch,
} from '@chakra-ui/react';

interface ScreenerLogicSelectorProps {
  useANDLogic: boolean;
  onLogicChange: (useAND: boolean) => void;
  screenerCount: number;
}

const ScreenerLogicSelector: React.FC<ScreenerLogicSelectorProps> = ({
  useANDLogic,
  onLogicChange,
  screenerCount,
}) => {
  // Don't show logic selector if there's only one screener
  if (screenerCount <= 1) {
    return null;
  }

  return (
    <HStack 
      justify="space-between" 
      align="center" 
      p={3} 
      bg="white" 
      border="1px solid" 
      borderColor="gray.200" 
      borderRadius="lg"
    >
      <HStack spacing={3}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          Screening Logic:
        </Text>
        <Text fontSize="sm" color={useANDLogic ? "blue.600" : "green.600"} fontWeight="semibold">
          {useANDLogic ? "ALL must pass" : "ANY can pass"}
        </Text>
      </HStack>
      
      <HStack spacing={2} align="center">
        <Text fontSize="xs" color="gray.500">OR</Text>
        <Switch
          isChecked={useANDLogic}
          onChange={(e) => onLogicChange(e.target.checked)}
          colorScheme="blue"
          size="sm"
        />
        <Text fontSize="xs" color="gray.500">AND</Text>
      </HStack>
    </HStack>
  );
};

export default ScreenerLogicSelector;