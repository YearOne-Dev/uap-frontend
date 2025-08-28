'use client';
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  IconButton,
  useColorModeValue,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { ScreenerAssistant } from '@/constants/CustomTypes';
import AddressListManager from './AddressListManager';
import CurationScreenerConfig from './CurationScreenerConfig';

interface SelectedScreenerCardProps {
  instanceId: string;
  screener: ScreenerAssistant;
  config: any;
  onConfigChange: (instanceId: string, config: any) => void;
  onRemove: (instanceId: string) => void;
  networkId: number;
  isLoadedFromBlockchain?: boolean; // New prop to indicate if this was loaded vs newly added
  originalConfig?: any; // Original config for change detection
}

const SelectedScreenerCard: React.FC<SelectedScreenerCardProps> = ({
  instanceId,
  screener,
  config,
  onConfigChange,
  onRemove,
  networkId,
  isLoadedFromBlockchain = false,
  originalConfig,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('blue.200', 'blue.400');
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const handleConfigUpdate = (newConfig: any) => {
    onConfigChange(instanceId, {
      ...config,
      ...newConfig,
    });
  };

  // Determine screener status
  const getScreenerStatus = () => {
    // Check if screener is properly configured
    let isConfigured = false;
    
    if (screener.name === 'Address List Screener') {
      isConfigured = config?.addresses && config.addresses.length > 0;
    } else if (screener.name === 'Community Gate') {
      isConfigured = config?.curatedListAddress && config.curatedListAddress.trim() !== '';
    }

    if (isLoadedFromBlockchain) {
      // Check if loaded screener has been modified
      if (originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)) {
        return { text: "Unsaved Changes", colorScheme: "orange" };
      }
      return { text: "Active", colorScheme: "green" };
    }

    // For newly added screeners
    if (isConfigured) {
      return { text: "Pending Activation", colorScheme: "orange" };
    } else {
      return { text: "Configure Required", colorScheme: "yellow" };
    }
  };

  const status = getScreenerStatus();

  return (
    <Box
      p={4}
      bg={cardBg}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="xl"
      position="relative"
      shadow="sm"
    >
      {/* Header */}
      <HStack justify="space-between" align="center" mb={3}>
        <HStack spacing={3} align="center" flex={1}>
          {/* Screener Icon */}
          <Image
            boxSize="8"
            src={screener.iconPath}
            alt={screener.name}
            borderRadius="lg"
            fallback={
              <Box
                boxSize="8"
                bg="blue.100"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="sm">🛡️</Text>
              </Box>
            }
          />

          {/* Screener Info */}
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <HStack spacing={2} align="center">
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                {screener.name}
              </Text>
              <Badge colorScheme={status.colorScheme} size="sm">
                {status.text}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.600" noOfLines={1}>
              {screener.description}
            </Text>
          </VStack>

          {/* Expand/Collapse Button */}
          <IconButton
            aria-label={isOpen ? "Collapse configuration" : "Expand configuration"}
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="sm"
            variant="ghost"
            onClick={onToggle}
          />
        </HStack>

        {/* Remove Button */}
        <IconButton
          aria-label="Remove screener"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={() => onRemove(instanceId)}
        />
      </HStack>

      {/* Configuration Section */}
      <Collapse in={isOpen}>
        <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
          <Text fontSize="sm" fontWeight="semibold" mb={3} color="blue.800">
            ⚙️ Screening Configuration
          </Text>

          {screener.name === 'Address List Screener' && (
            <AddressListManager
              listName="Address Screening List"
              addresses={config?.addresses || []}
              onAddressesChange={(addresses) => {
                handleConfigUpdate({ addresses });
              }}
              behavior={config?.returnValueWhenInList ? 'allow' : 'block'}
              onBehaviorChange={(behavior) => {
                handleConfigUpdate({
                  returnValueWhenInList: behavior === 'allow'
                });
              }}
              placeholder="Add address to screening list (0x...)"
            />
          )}

          {screener.name === 'Community Gate' && (
            <CurationScreenerConfig
              curatedListAddress={config?.curatedListAddress || ''}
              onCuratedListAddressChange={(address) => {
                handleConfigUpdate({
                  curatedListAddress: address
                });
              }}
              behavior={config?.returnValueWhenCurated ? 'allow' : 'block'}
              onBehaviorChange={(behavior) => {
                handleConfigUpdate({
                  returnValueWhenCurated: behavior === 'allow'
                });
              }}
              useBlocklist={config?.useBlocklist || false}
              onUseBlocklistChange={(useBlocklist) => {
                handleConfigUpdate({ useBlocklist });
              }}
              blocklistAddresses={config?.blocklistAddresses || []}
              onBlocklistAddressesChange={(addresses) => {
                handleConfigUpdate({
                  blocklistAddresses: addresses
                });
              }}
              networkId={networkId}
            />
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SelectedScreenerCard;