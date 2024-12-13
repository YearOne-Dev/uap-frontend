import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Grid,
  GridItem,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import TransactionTypeBlock, {
  transactionTypeMap,
} from './TransactionTypeBlock';

const TransactionSelector: React.FC = () => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationAddress(value);

    // Basic Ethereum address validation
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsValidAddress(isValid);
  };

  return (
    <Box p={4}>
      <Grid templateColumns="1fr 2fr" gap={1} alignItems="center">
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Select a transaction type that you will engage this assistant for:
          </Text>
        </GridItem>
        <GridItem>
          <CheckboxGroup
            colorScheme="orange"
            value={selectedTransactions}
            onChange={(values: string[]) => setSelectedTransactions(values)}
          >
            <VStack spacing={2} align="stretch">
              {Object.entries(transactionTypeMap).map(
                ([key, { label, typeName, icon, iconPath }]) => (
                  <Checkbox key={key} value={key}>
                    <TransactionTypeBlock
                      label={label}
                      typeName={typeName}
                      icon={icon}
                      iconPath={iconPath}
                    />
                  </Checkbox>
                )
              )}
            </VStack>
          </CheckboxGroup>
        </GridItem>
        <GridItem>
          <Text fontWeight="bold" fontSize="md">
            Enter the address towards which you would like to forward the asset:
          </Text>
        </GridItem>
        <GridItem>
          <Flex alignItems="left">
            <Input
              placeholder="Enter destination address"
              value={destinationAddress}
              onChange={handleAddressChange}
              borderColor={isValidAddress ? 'gray.300' : 'red.500'}
              mr={2}
            />
          </Flex>
          {!isValidAddress && (
            <Text color="red.500" fontSize="sm" mt={2}>
              Please enter a valid address.
            </Text>
          )}
        </GridItem>
        {/* <Button
              size="sm"
              bg="orange.500"
              color="white"
              _hover={{ bg: 'orange.600' }}
              _active={{ bg: 'orange.700' }}
              isDisabled={!isValidAddress || destinationAddress === ''}
            >
              Save
        </Button> */}
      </Grid>
    </Box>
  );
};

export default TransactionSelector;
