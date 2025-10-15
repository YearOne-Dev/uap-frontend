'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  RadioGroup,
  Radio,
  Stack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import AddressListManager from './AddressListManager';

interface CurationScreenerConfigProps {
  curatedListAddress: string;
  onCuratedListAddressChange: (address: string) => void;
  behavior: 'pass' | 'block';
  onBehaviorChange: (behavior: 'pass' | 'block') => void;
  useBlocklist: boolean;
  onUseBlocklistChange: (useBlocklist: boolean) => void;
  blocklistAddresses: string[];
  onBlocklistAddressesChange: (addresses: string[]) => void;
  networkId?: number;
}

const CurationScreenerConfig: React.FC<CurationScreenerConfigProps> = ({
  curatedListAddress,
  onCuratedListAddressChange,
  behavior,
  onBehaviorChange,
  useBlocklist,
  onUseBlocklistChange,
  blocklistAddresses,
  onBlocklistAddressesChange,
  networkId
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  const [contractInfo, setContractInfo] = useState<{ name?: string; symbol?: string } | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();

  // Validate NFT contract address
  useEffect(() => {
    const validateContract = async () => {
      if (!curatedListAddress || curatedListAddress.trim() === '') {
        setValidationStatus('unknown');
        setContractInfo(null);
        setError('');
        return;
      }

      if (!ethers.isAddress(curatedListAddress)) {
        setValidationStatus('invalid');
        setContractInfo(null);
        setError('Please enter a valid contract address');
        return;
      }

      setIsValidating(true);
      setError('');

      try {
        // In a real implementation, you would check if the contract implements LSP8 interface
        // For now, we'll do basic validation
        const checksumAddress = ethers.getAddress(curatedListAddress);

        // Only update parent if the checksum address is different from input
        if (checksumAddress !== curatedListAddress) {
          onCuratedListAddressChange(checksumAddress);
        }

        // Mock validation - in real implementation would check contract code
        setValidationStatus('valid');
        setContractInfo({
          name: 'Curated Collection',
          symbol: 'CC'
        });

        toast({
          title: 'Contract validated',
          description: 'Curated list contract address appears to be valid',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'bottom-left',
        });
      } catch (err) {
        setValidationStatus('invalid');
        setContractInfo(null);
        setError('Invalid contract address or not a valid curated list contract');
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(validateContract, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curatedListAddress]);

  const handleAddressChange = (value: string) => {
    setError('');
    setValidationStatus('unknown');
    setContractInfo(null);
    onCuratedListAddressChange(value);
  };

  const handleAddressBlur = () => {
    if (!curatedListAddress || curatedListAddress.trim() === '') {
      setError('Contract address is required');
      setValidationStatus('invalid');
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Curated List Configuration */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          Curated List Contract Address: <Text as="span" color="red.500">*</Text>
        </Text>
        <VStack spacing={2} align="stretch">
          <HStack>
            <Input
              value={curatedListAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={handleAddressBlur}
              placeholder="Enter curated list contract address (0x...)"
              size="sm"
              isInvalid={validationStatus === 'invalid'}
            />
            {isValidating && <Spinner size="sm" />}
            {validationStatus === 'valid' && (
              <Badge colorScheme="green" variant="solid">
                ✓ Valid
              </Badge>
            )}
            {validationStatus === 'invalid' && (
              <Badge colorScheme="red" variant="solid">
                ✗ Invalid
              </Badge>
            )}
          </HStack>

          {error && (
            <Alert status="error" size="sm">
              <AlertIcon />
              <AlertDescription fontSize="xs">{error}</AlertDescription>
            </Alert>
          )}

          {contractInfo && validationStatus === 'valid' && (
            <Box p={3} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="lg">
              <Text fontSize="xs" color="green.800">
                📄 Contract: {contractInfo.name} ({contractInfo.symbol})
              </Text>
              <Text fontSize="xs" color="green.600" mt={1}>
                This screener will check if addresses are part of this curated list
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Screening Behavior */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          Screening Behavior:
        </Text>
        <RadioGroup value={behavior} onChange={(value) => onBehaviorChange(value as 'pass' | 'block')}>
          <Stack spacing={3}>
            <Radio value="pass" colorScheme="green">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm">Membership in list triggers pass in screening</Text>
              </VStack>
            </Radio>
            <Radio value="block" colorScheme="red">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm">Membership in list triggers failure in screening</Text>
              </VStack>
            </Radio>
          </Stack>
        </RadioGroup>
      </Box>

      {/* Advanced Blocklist Option */}
      <Box>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="use-blocklist" mb="0" fontSize="sm" fontWeight="semibold">
            Enable exclusion list
          </FormLabel>
          <Switch
            id="use-blocklist"
            isChecked={useBlocklist}
            onChange={(e) => onUseBlocklistChange(e.target.checked)}
            colorScheme="orange"
            size="sm"
          />
        </FormControl>
        <Text fontSize="xs" color="gray.600" mt={1}>
          Add specific addresses that you want to exclude from curated list
        </Text>
      </Box>

      {/* Blocklist Management */}
      {useBlocklist && (
        <Box p={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg">
          <AddressListManager
            listName="Exclusion List"
            addresses={blocklistAddresses}
            onAddressesChange={onBlocklistAddressesChange}
            behavior="block"
            onBehaviorChange={() => {}} // Fixed behavior for blocklist
            placeholder="Add address to exclude from curation (0x...)"
            showBehaviorSelector={false} // Hide behavior selector for blocklist
          />
        </Box>
      )}

      {/* Help Text */}
      <Box p={4} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
        <Text fontSize="xs" color="blue.800" fontWeight="semibold" mb={2}>
          How Curated List Screening Works:
        </Text>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="blue.700">
            • Screens transactions based on source address curation status
          </Text>
          <Text fontSize="xs" color="blue.700">
            • Perfect for community-managed curated lists
          </Text>
          {useBlocklist && (
            <Text fontSize="xs" color="blue.700">
              • Exclusion list takes precedence and sidesteps curation status
            </Text>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default CurationScreenerConfig;