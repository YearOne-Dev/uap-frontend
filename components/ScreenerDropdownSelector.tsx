'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { ScreenerAssistant } from '@/constants/CustomTypes';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface ScreenerDropdownSelectorProps {
  networkId: number;
  selectedScreeners: string[];
  onAddScreener: (screenerId: string, screener: ScreenerAssistant) => void;
  maxScreeners?: number;
}

const ScreenerDropdownSelector: React.FC<ScreenerDropdownSelectorProps> = ({
  networkId,
  selectedScreeners,
  onAddScreener,
  maxScreeners = 5,
}) => {
  // Removed unused color mode variables as we now use fixed orange theme colors

  const availableScreeners = React.useMemo(() => {
    const network = supportedNetworks[networkId];
    return network?.screeners ? Object.values(network.screeners) : [];
  }, [networkId]);

  const canAddMore = selectedScreeners.length < maxScreeners;

  const handleScreenerSelect = (screener: ScreenerAssistant) => {
    // Generate unique instance ID to support multiple instances of same screener
    const instanceId = `${screener.address}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onAddScreener(instanceId, screener);
  };

  if (!canAddMore) {
    return (
      <Box p={3} bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="lg">
        <Text fontSize="sm" color="yellow.800" textAlign="center">
          Maximum number of screeners ({maxScreeners}) reached
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          leftIcon={<AddIcon />}
          bg="white"
          color="orange.700"
          border="2px solid"
          borderColor="orange.300"
          _hover={{ 
            bg: "orange.50", 
            borderColor: "orange.400"
          }}
          _active={{ 
            bg: "orange.100"
          }}
          size="md"
          width="100%"
          textAlign="left"
          fontWeight="semibold"
          h="12"
        >
          <Text fontSize="sm">Add Transaction Screener</Text>
        </MenuButton>
        
        <MenuList
          bg="white"
          border="2px solid"
          borderColor="orange.200"
          borderRadius="xl"
          boxShadow="0 12px 24px rgba(251, 211, 141, 0.2)"
          maxH="400px"
          overflowY="auto"
          minW="400px"
          p={0}
        >
          {availableScreeners.length === 0 ? (
            <MenuItem isDisabled>
              <Text fontSize="sm" color="gray.500">
                No screeners available for this network
              </Text>
            </MenuItem>
          ) : (
            <>
              <Box p={4} bg="orange.50" borderBottom="2px solid" borderColor="orange.100" borderTopRadius="xl">
                <Text fontSize="xs" fontWeight="bold" color="orange.800" textTransform="uppercase" letterSpacing="wide">
                  Available Transaction Screeners
                </Text>
                <Text fontSize="xs" color="orange.600" mt={1}>
                  Choose screeners to control when your assistant activates
                </Text>
              </Box>
              
              {availableScreeners.map((screener, index) => (
                <React.Fragment key={screener.address}>
                  <MenuItem
                    onClick={() => handleScreenerSelect(screener)}
                    _hover={{ 
                      bg: "orange.25"
                    }}
                    _active={{ 
                      bg: "orange.50"
                    }}
                    p={4}
                    transition="background-color 0.15s ease"
                  >
                  <HStack spacing={3} align="center" width="100%">
                    {/* Screener Icon */}
                    <Box flexShrink={0}>
                      <Image
                        boxSize="10"
                        src={screener.iconPath}
                        alt={screener.name}
                        borderRadius="lg"
                        fallback={
                          <Box
                            boxSize="10"
                            bg="orange.100"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="lg">🛡️</Text>
                          </Box>
                        }
                      />
                    </Box>

                    {/* Screener Details */}
                    <VStack align="start" spacing={1} flex={1} minW={0}>
                      <HStack justify="space-between" width="100%">
                        <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                          {screener.name}
                        </Text>
                        <Badge colorScheme="orange" size="sm" flexShrink={0}>
                          Screening Assistant
                        </Badge>
                      </HStack>
                      
                      <Text fontSize="xs" color="gray.600" lineHeight="1.3" noOfLines={2}>
                        {screener.description}
                      </Text>
                      
                    </VStack>

                    {/* Add Indicator */}
                    <Box
                      bg="orange.500"
                      color="white"
                      borderRadius="full"
                      w="6"
                      h="6"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <AddIcon boxSize="3" />
                    </Box>
                  </HStack>
                  </MenuItem>
                  
                  {/* Add separator between screener items */}
                  {index < availableScreeners.length - 1 && (
                    <Box h="1px" bg="orange.100" mx={4} />
                  )}
                </React.Fragment>
              ))}
              
              <Box p={4} bg="orange.50" borderTop="2px solid" borderColor="orange.100" borderBottomRadius="xl">
                <Text fontSize="xs" color="orange.600" textAlign="center" lineHeight="1.4">
                  💡 You can add multiple instances of the same screener with different configurations
                </Text>
              </Box>
            </>
          )}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default ScreenerDropdownSelector;