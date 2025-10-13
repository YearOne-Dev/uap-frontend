'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  IconButton,
  useToast,
  Badge,
  Flex,
  RadioGroup,
  Radio,
  Stack,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';

interface AddressListManagerProps {
  listName: string;
  addresses: string[];
  onAddressesChange: (addresses: string[]) => void;
  behavior: 'pass' | 'block';
  onBehaviorChange: (behavior: 'pass' | 'block') => void;
  placeholder?: string;
}

const AddressListManager: React.FC<AddressListManagerProps> = ({
  listName,
  addresses,
  onAddressesChange,
  behavior,
  onBehaviorChange,
  placeholder = "Enter address (0x...)"
}) => {
  const [newAddress, setNewAddress] = useState('');
  const [error, setError] = useState('');
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: addresses.length > 0 });

  const validateAddress = (address: string): boolean => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  const handleAddAddress = () => {
    setError('');
    
    if (!newAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!validateAddress(newAddress)) {
      setError('Invalid address format');
      return;
    }

    const checksumAddress = ethers.getAddress(newAddress);
    
    if (addresses.some(addr => addr.toLowerCase() === checksumAddress.toLowerCase())) {
      setError('Address already in list');
      return;
    }

    const updatedAddresses = [...addresses, checksumAddress];
    onAddressesChange(updatedAddresses);
    setNewAddress('');
    
    toast({
      title: 'Address added',
      description: `Added to screening list (${behavior === 'pass' ? 'pass' : 'fail'} screening)`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'bottom-left',
    });
  };

  const handleRemoveAddress = (addressToRemove: string) => {
    const updatedAddresses = addresses.filter(
      addr => addr.toLowerCase() !== addressToRemove.toLowerCase()
    );
    onAddressesChange(updatedAddresses);
    
    toast({
      title: 'Address removed',
      description: `Removed from screening list`,
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'bottom-left',
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAddress();
    }
  };

  return (
    <Box>
      {/* Screening Behavior */}
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          Screening Behavior:
        </Text>
        <RadioGroup value={behavior} onChange={(value) => onBehaviorChange(value as 'pass' | 'block')}>
          <Stack direction="row" spacing={6}>
            <Radio value="pass" colorScheme="green">
              <Text fontSize="sm">If source address is in list, screening passes</Text>
            </Radio>
            <Radio value="block" colorScheme="red">
              <Text fontSize="sm">If source address is in list, screening fails</Text>
            </Radio>
          </Stack>
        </RadioGroup>
      </Box>

      {/* Address Input */}
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Add Address:
        </Text>
        <HStack>
          <Input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            size="sm"
            isInvalid={!!error}
          />
          <IconButton
            icon={<AddIcon />}
            onClick={handleAddAddress}
            aria-label="Add address"
            colorScheme="blue"
            size="sm"
            isDisabled={!newAddress.trim()}
          />
        </HStack>
        {error && (
          <Text color="red.500" fontSize="xs" mt={1}>
            {error}
          </Text>
        )}
      </Box>

      {/* Address List */}
      <Box>
        <HStack justify="space-between" align="center" mb={2}>
          <HStack>
            <Text fontSize="sm" fontWeight="semibold">
              {listName} ({addresses.length} address{addresses.length !== 1 ? 'es' : ''}) <Text as="span" color="red.500">*</Text>
            </Text>
            {addresses.length > 0 && (
              <Badge colorScheme={behavior === 'pass' ? 'green' : 'red'} size="sm">
                {behavior}
              </Badge>
            )}
          </HStack>
          {addresses.length > 0 && (
            <IconButton
              icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={onToggle}
              aria-label="Toggle address list"
              size="xs"
              variant="ghost"
            />
          )}
        </HStack>

        <Collapse in={isOpen}>
          {addresses.length === 0 ? (
            <Box
              p={4}
              bg="gray.50"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              textAlign="center"
            >
              <Text fontSize="sm" color="red.500" fontWeight="semibold">
                ⚠️ At least one address is required for screening to work
              </Text>
              <Text fontSize="xs" color="gray.600" mt={1}>
                No addresses in {behavior} list
              </Text>
            </Box>
          ) : (
            <VStack spacing={2} align="stretch">
              {addresses.map((address, index) => (
                <Flex
                  key={address}
                  p={3}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  justify="space-between"
                  align="center"
                >
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <Text fontSize="xs" fontWeight="semibold">
                      Address #{index + 1}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      fontFamily="mono" 
                      color="gray.600"
                      noOfLines={1}
                      title={address}
                    >
                      {address}
                    </Text>
                  </VStack>
                  <IconButton
                    icon={<DeleteIcon />}
                    onClick={() => handleRemoveAddress(address)}
                    aria-label="Remove address"
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    ml={2}
                    flexShrink={0}
                  />
                </Flex>
              ))}
            </VStack>
          )}
        </Collapse>
      </Box>

      {addresses.length === 0 && (
        <Box mt={3} p={3} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
          <Text fontSize="xs" color="blue.800">
            💡 Add addresses to create a {behavior} list for this filter
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default AddressListManager;