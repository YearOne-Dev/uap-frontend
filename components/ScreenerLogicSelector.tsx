'use client';
import React from 'react';
import {
  Box,
  RadioGroup,
  Radio,
  Stack,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';

interface ScreenerLogicSelectorProps {
  useANDLogic: boolean;
  onLogicChange: (useAND: boolean) => void;
  screenerCount: number;
  screenerNames: string[];
}

const ScreenerLogicSelector: React.FC<ScreenerLogicSelectorProps> = ({
  useANDLogic,
  onLogicChange,
  screenerCount,
  screenerNames,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Don't show logic selector if there's only one screener
  if (screenerCount <= 1) {
    return null;
  }

  const LogicIcon: React.FC<{ type: 'and' | 'or'; isActive: boolean }> = ({ type, isActive }) => (
    <Box
      w={8}
      h={8}
      borderRadius="full"
      bg={isActive ? 'orange.500' : 'gray.200'}
      color={isActive ? 'white' : 'gray.600'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="xs"
      fontWeight="bold"
    >
      {type.toUpperCase()}
    </Box>
  );

  return (
    <Box
      p={4}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="semibold">
            Screening Logic
          </Text>
          <Badge colorScheme="blue" variant="subtle">
            {screenerCount} screeners
          </Badge>
        </HStack>

        <RadioGroup
          value={useANDLogic ? 'and' : 'or'}
          onChange={(value) => onLogicChange(value === 'and')}
        >
          <Stack spacing={4}>
            {/* AND Logic Option */}
            <Box
              p={3}
              border="2px solid"
              borderColor={useANDLogic ? 'orange.300' : 'gray.200'}
              borderRadius="lg"
              cursor="pointer"
              onClick={() => onLogicChange(true)}
              _hover={{ borderColor: 'orange.300' }}
              transition="all 0.2s ease"
            >
              <Radio value="and" colorScheme="orange">
                <HStack spacing={3} align="center">
                  <LogicIcon type="and" isActive={useANDLogic} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      ALL screeners must pass (AND)
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Transaction passes screening only if it qualifies through every screener
                    </Text>
                  </VStack>
                </HStack>
              </Radio>
            </Box>

            {/* OR Logic Option */}
            <Box
              p={3}
              border="2px solid"
              borderColor={!useANDLogic ? 'orange.300' : 'gray.200'}
              borderRadius="lg"
              cursor="pointer"
              onClick={() => onLogicChange(false)}
              _hover={{ borderColor: 'orange.300' }}
              transition="all 0.2s ease"
            >
              <Radio value="or" colorScheme="orange">
                <HStack spacing={3} align="center">
                  <LogicIcon type="or" isActive={!useANDLogic} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      ANY screener can pass (OR)
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Transaction passes screening if it qualifies through at least one screener
                    </Text>
                  </VStack>
                </HStack>
              </Radio>
            </Box>
          </Stack>
        </RadioGroup>

        {/* Visual Example */}
        <Box p={3} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
          <Text fontSize="xs" color="blue.800" fontWeight="semibold" mb={2}>
            Example with your screeners:
          </Text>
          <VStack align="start" spacing={1}>
            {screenerNames.slice(0, 2).map((name, index) => (
              <Text key={index} fontSize="xs" color="blue.700">
                • {name}
              </Text>
            ))}
            {screenerNames.length > 2 && (
              <Text fontSize="xs" color="blue.600">
                ... and {screenerNames.length - 2} more
              </Text>
            )}
          </VStack>
          <Text fontSize="xs" color="blue.700" mt={2}>
            {useANDLogic 
              ? `With AND logic: All ${screenerCount} screeners must pass for transaction to qualify`
              : `With OR logic: Any 1 of ${screenerCount} screeners can pass for transaction to qualify`
            }
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default ScreenerLogicSelector;