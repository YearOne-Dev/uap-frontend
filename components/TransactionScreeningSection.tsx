'use client';
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Collapse,
  Image,
  Flex,
} from '@chakra-ui/react';
import ScreenerDropdownSelector from './ScreenerDropdownSelector';
import SelectedScreenerCard from './SelectedScreenerCard';
import ScreenerLogicSelector from './ScreenerLogicSelector';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { transactionTypeMap } from './TransactionTypeBlock';

interface TransactionScreeningSectionProps {
  selectedConfigTypes: string[];
  enableScreeners: boolean;
  selectedScreeners: string[];
  screenerConfigs: { [screenerId: string]: any };
  originalScreenerConfigs?: { [screenerId: string]: any }; // Original configs for change detection
  useANDLogic: boolean;
  currentNetworkId: number;
  onEnableScreenersChange: (enabled: boolean) => void;
  onAddScreener: (instanceId: string, screener: any) => void;
  onRemoveScreener: (instanceId: string) => void;
  onScreenerConfigChange: (instanceId: string, config: any) => void;
  onLogicChange: (useAND: boolean) => void;
}

const TransactionScreeningSection: React.FC<TransactionScreeningSectionProps> = ({
  selectedConfigTypes,
  enableScreeners,
  selectedScreeners,
  screenerConfigs,
  originalScreenerConfigs,
  useANDLogic,
  currentNetworkId,
  onEnableScreenersChange,
  onAddScreener,
  onRemoveScreener,
  onScreenerConfigChange,
  onLogicChange,
}) => {
  if (selectedConfigTypes.length === 0) return null;

  // Get transaction type info for the first (and only) type
  const typeId = selectedConfigTypes[0];
  const typeInfo = Object.values(transactionTypeMap).find(t => t.id === typeId);

  return (
    <Box 
      maxWidth="750px" // Constrain maximum width for better readability
      p={6} 
      bg="orange.50" 
      border="2px solid" 
      borderColor="orange.200" 
      borderRadius="xl"
      position="relative"
    >
      <VStack spacing={4} align="stretch">
        <Box>
          {/* Mobile and Tablet Layout */}
          <VStack align="stretch" spacing={3} display={{ base: "flex", md: "none" }}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={2}>
                <Text fontSize="lg" fontWeight="bold" color="orange.800">
                  🛡️ Transaction Screening
                </Text>
                {typeInfo && (
                  <HStack spacing={2} align="center">
                    <Text fontSize="sm" color="orange.600">
                      for
                    </Text>
                    <Flex align="center" gap={1}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.700">
                        {typeInfo.label}
                      </Text>
                      <HStack spacing={1} align="center">
                        {typeInfo.icon && (
                          <Text fontSize="sm">
                            {typeInfo.icon}
                          </Text>
                        )}
                        {typeInfo.iconPath && (
                          <Image src={typeInfo.iconPath} alt={typeInfo.typeName} height="16px" />
                        )}
                        <Text fontSize="sm" fontWeight="bold" color="orange.700">
                          {typeInfo.typeName}
                        </Text>
                      </HStack>
                    </Flex>
                  </HStack>
                )}
              </VStack>
              <Switch
                isChecked={enableScreeners}
                onChange={(e) => {
                  onEnableScreenersChange(e.target.checked);
                }}
                colorScheme="orange"
                size="lg"
              />
            </HStack>
            <Text fontSize="sm" color="orange.700">
              Optional: Add screeners to control when your assistant activates (transactions always process)
            </Text>
          </VStack>

          {/* Desktop Layout */}
          <HStack spacing={6} align="center" display={{ base: "none", md: "flex" }}>
            <VStack align="start" spacing={2} flex={1} maxWidth="500px">
              <Text fontSize="lg" fontWeight="bold" color="orange.800">
                🛡️ Transaction Screening
              </Text>
              {typeInfo && (
                <HStack spacing={2} align="center">
                  <Text fontSize="sm" color="orange.600">
                    for
                  </Text>
                  <Flex align="center" gap={1}>
                    <Text fontSize="md" fontWeight="bold" color="orange.700">
                      {typeInfo.label}
                    </Text>
                    <HStack spacing={1} align="center">
                      {typeInfo.icon && (
                        <Text fontSize="md">
                          {typeInfo.icon}
                        </Text>
                      )}
                      {typeInfo.iconPath && (
                        <Image src={typeInfo.iconPath} alt={typeInfo.typeName} height="18px" />
                      )}
                      <Text fontSize="md" fontWeight="bold" color="orange.700">
                        {typeInfo.typeName}
                      </Text>
                    </HStack>
                  </Flex>
                </HStack>
              )}
              <Text fontSize="sm" color="orange.700">
                Optional: Add screeners to control when your assistant activates (transactions always process)
              </Text>
            </VStack>
            <Switch
              isChecked={enableScreeners}
              onChange={(e) => {
                onEnableScreenersChange(e.target.checked);
              }}
              colorScheme="orange"
              size="lg"
            />
          </HStack>
        </Box>

        <Collapse in={enableScreeners}>
          <VStack spacing={6} align="stretch">
            {/* Screening Logic Toggle - Show at top if multiple screeners */}
            {selectedScreeners.length > 1 && (
              <ScreenerLogicSelector
                useANDLogic={useANDLogic}
                onLogicChange={onLogicChange}
                screenerCount={selectedScreeners.length}
              />
            )}

            {/* Add Screener Dropdown */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="orange.800">
                Add Transaction Screeners:
              </Text>
              <ScreenerDropdownSelector
                networkId={currentNetworkId}
                selectedScreeners={selectedScreeners}
                onAddScreener={onAddScreener}
                maxScreeners={5}
              />
            </Box>

            {/* Selected Screener Cards */}
            {selectedScreeners.length > 0 && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="semibold" color="orange.800">
                  Active Screeners:
                </Text>
                
                {selectedScreeners.map((instanceId, index) => {
                  // Extract screener address from instanceId
                  const screenerAddress = instanceId.split('_')[0];
                  const screener = supportedNetworks[currentNetworkId]?.screeners[screenerAddress.toLowerCase()];
                  
                  if (!screener) return null;

                  return (
                    <React.Fragment key={instanceId}>
                      <SelectedScreenerCard
                        instanceId={instanceId}
                        screener={screener}
                        config={screenerConfigs[instanceId] || {}}
                        originalConfig={originalScreenerConfigs?.[instanceId]}
                        onConfigChange={onScreenerConfigChange}
                        onRemove={onRemoveScreener}
                        networkId={currentNetworkId}
                        isLoadedFromBlockchain={instanceId.includes('_loaded_')}
                      />
                      
                      {/* AND/OR Logic Indicator between cards */}
                      {index < selectedScreeners.length - 1 && selectedScreeners.length > 1 && (
                        <Box textAlign="center" py={2}>
                          <Box
                            display="inline-block"
                            px={3}
                            py={1}
                            bg={useANDLogic ? 'blue.500' : 'green.500'}
                            color="white"
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {useANDLogic ? 'AND' : 'OR'}
                          </Box>
                        </Box>
                      )}
                    </React.Fragment>
                  );
                })}
              </VStack>
            )}

            {!enableScreeners && (
              <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="orange.300">
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  💡 Your assistant will activate for all matching transactions. Enable screening above to add activation conditions.
                </Text>
              </Box>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default TransactionScreeningSection;