'use client';
import React from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  useColorModeValue,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { ScreenerAssistant } from '@/constants/CustomTypes';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface ScreenerAssistantSelectorProps {
  networkId: number;
  selectedScreeners: string[];
  onScreenerToggle: (screenerId: string, screener: ScreenerAssistant) => void;
  onAddScreener: () => void;
  maxScreeners?: number;
}

const ScreenerAssistantSelector: React.FC<ScreenerAssistantSelectorProps> = ({
  networkId,
  selectedScreeners,
  onScreenerToggle,
  onAddScreener,
  maxScreeners = 3,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBorderColor = useColorModeValue('orange.300', 'orange.400');

  const availableScreeners = React.useMemo(() => {
    const network = supportedNetworks[networkId];
    return network?.screeners ? Object.values(network.screeners) : [];
  }, [networkId]);

  const canAddMore = selectedScreeners.length < maxScreeners;

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={4}>
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold" fontSize="md">
            Screener Configuration
          </Text>
          <Text fontSize="sm" color="gray.600">
            Add screeners to qualify transactions for this assistant
          </Text>
        </VStack>
        {selectedScreeners.length > 0 && (
          <Badge colorScheme="orange" variant="subtle">
            {selectedScreeners.length} screener{selectedScreeners.length !== 1 ? 's' : ''} active
          </Badge>
        )}
      </HStack>

      {/* Show available screeners for selection */}
      <VStack spacing={3} align="stretch">
        <Text fontSize="sm" color="gray.600" mb={2}>
          {selectedScreeners.length === 0 ? 
            "Choose screeners to add to your assistant:" : 
            "Available screeners:"
          }
        </Text>
        
        {availableScreeners.map((screener) => {
          const isSelected = selectedScreeners.includes(screener.address);
          const canSelect = !isSelected && canAddMore;

          return (
            <Box
              key={screener.address}
              p={4}
              bg={cardBg}
              border="2px solid"
              borderColor={isSelected ? selectedBorderColor : borderColor}
              borderRadius="xl"
              cursor={canSelect || isSelected ? "pointer" : "not-allowed"}
              onClick={() => {
                if (canSelect || isSelected) {
                  onScreenerToggle(screener.address, screener);
                }
              }}
              _hover={{ 
                borderColor: canSelect || isSelected ? selectedBorderColor : borderColor,
                opacity: canSelect || isSelected ? 1 : 0.7
              }}
              transition="all 0.2s ease"
              position="relative"
              opacity={!canSelect && !isSelected ? 0.6 : 1}
            >
              {isSelected && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  bg="orange.500"
                  borderRadius="full"
                  p={1}
                >
                  <CheckIcon color="white" boxSize="3" />
                </Box>
              )}

              <HStack spacing={3} align="center">
                <Image
                  boxSize="12"
                  src={screener.iconPath}
                  alt={screener.name}
                  borderRadius="lg"
                  fallback={
                    <Box
                      boxSize="12"
                      bg="gray.100"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="xl">🛡️</Text>
                    </Box>
                  }
                />

                <VStack align="start" spacing={1} flex={1}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="sm">
                      {screener.name}
                    </Text>
                    {isSelected && (
                      <Badge colorScheme="orange" size="sm">
                        Active
                      </Badge>
                    )}
                    {!canSelect && !isSelected && (
                      <Badge colorScheme="gray" size="sm">
                        Limit reached
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.600" lineHeight="1.3">
                    {screener.description}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          );
        })}
        
        {selectedScreeners.length > 0 && (
          <Box p={3} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
            <Text fontSize="xs" color="blue.800">
              💡 Click on active screeners above to remove them, or add more screeners if needed
            </Text>
          </Box>
        )}
      </VStack>
      
      {/* Show fallback when no screeners available */}
      {availableScreeners.length === 0 && (
        <Box p={4} bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="lg">
          <Text fontSize="sm" color="yellow.800">
            No screener assistants are available for this network.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ScreenerAssistantSelector;