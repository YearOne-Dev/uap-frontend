'use client';
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Image,
  Badge,
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { transactionTypeMap } from './TransactionTypeBlock';

interface TransactionTypeSelectorProps {
  supportedTransactionTypes: string[];
  selectedConfigTypes: string[];
  onAddType: (typeId: string) => void;
  onRemoveType: (typeId: string) => void;
}

const TransactionTypeSelector: React.FC<TransactionTypeSelectorProps> = ({
  supportedTransactionTypes,
  selectedConfigTypes,
  onAddType,
  onRemoveType,
}) => {
  // Get available types that haven't been selected yet
  const availableTypes = Object.entries(transactionTypeMap)
    .filter(([_, { id }]) => 
      supportedTransactionTypes.includes(id) && !selectedConfigTypes.includes(id)
    );

  const canAddMore = availableTypes.length > 0;

  const handleTypeSelect = (typeId: string) => {
    onAddType(typeId);
  };

  if (!canAddMore) {
    return (
      <VStack align="stretch" spacing={4}>
        <VStack align="start" spacing={2}>
          <Text fontSize="md" fontWeight="bold">
            Set Which Transactions Will Engage Assistant
          </Text>
          <Box p={3} bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="lg">
            <Text fontSize="sm" color="orange.800" textAlign="center">
              All supported transaction types have been added
            </Text>
          </Box>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <VStack align="start" spacing={2}>
        <Text fontSize="md" fontWeight="bold">
          Set Which Transactions Will Engage Assistant
        </Text>
        
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
              maxWidth="400px"
            >
              <Text fontSize="sm">Add Transaction Type</Text>
            </MenuButton>
            
            <MenuList
              bg="white"
              border="2px solid"
              borderColor="orange.200"
              borderRadius="xl"
              boxShadow="0 12px 24px rgba(59, 130, 246, 0.15)"
              maxH="400px"
              overflowY="auto"
              minW="400px"
              p={0}
            >
              <Box p={4} bg="orange.50" borderBottom="2px solid" borderColor="orange.100" borderTopRadius="xl">
                <Text fontSize="xs" fontWeight="bold" color="orange.800" textTransform="uppercase" letterSpacing="wide">
                  Available Transaction Types
                </Text>
                <Text fontSize="xs" color="orange.600" mt={1}>
                  Choose which transactions will activate this assistant
                </Text>
              </Box>
              
              {availableTypes.map(([key, { id, label, typeName, icon, iconPath }], index) => (
                <React.Fragment key={key}>
                  <MenuItem
                    onClick={() => handleTypeSelect(id)}
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
                      {/* Transaction Type Icon */}
                      <Box flexShrink={0}>
                        {iconPath ? (
                          <Image
                            boxSize="10"
                            src={iconPath}
                            alt={`${label} ${typeName}`}
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
                                <Text fontSize="lg">{icon || '📄'}</Text>
                              </Box>
                            }
                          />
                        ) : (
                          <Box
                            boxSize="10"
                            bg="orange.100"
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="lg">{icon || '📄'}</Text>
                          </Box>
                        )}
                      </Box>

                      {/* Transaction Type Details */}
                      <VStack align="start" spacing={1} flex={1} minW={0}>
                        <HStack justify="space-between" width="100%">
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                            {label} {typeName}
                          </Text>
                          <Badge colorScheme="blue" size="sm" flexShrink={0}>
                            Transaction Type
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="xs" color="gray.600" lineHeight="1.3" noOfLines={1}>
                          Activate assistant when {label.toLowerCase()} {typeName.toLowerCase()}
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
                  
                  {/* Add separator between items */}
                  {index < availableTypes.length - 1 && (
                    <Box h="1px" bg="orange.100" mx={4} />
                  )}
                </React.Fragment>
              ))}
              
              <Box p={4} bg="orange.50" borderTop="2px solid" borderColor="orange.100" borderBottomRadius="xl">
                <Text fontSize="xs" color="orange.600" textAlign="center" lineHeight="1.4">
                  💡 Each transaction type can have its own screener configuration
                </Text>
              </Box>
            </MenuList>
          </Menu>
        </Box>
      </VStack>
    </VStack>
  );
};

export default TransactionTypeSelector;