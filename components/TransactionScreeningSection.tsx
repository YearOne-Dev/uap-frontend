'use client';
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Switch,
  Collapse,
  useColorModeValue,
} from '@chakra-ui/react';
import ScreenerDropdownSelector from './ScreenerDropdownSelector';
import SelectedScreenerCard from './SelectedScreenerCard';
import ScreenerLogicSelector from './ScreenerLogicSelector';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface TransactionScreeningSectionProps {
  selectedConfigTypes: string[];
  enableScreeners: boolean;
  selectedScreeners: string[];
  screenerConfigs: { [screenerId: string]: any };
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
  useANDLogic,
  currentNetworkId,
  onEnableScreenersChange,
  onAddScreener,
  onRemoveScreener,
  onScreenerConfigChange,
  onLogicChange,
}) => {
  if (selectedConfigTypes.length === 0) return null;

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
              <Text fontSize="lg" fontWeight="bold" color="orange.800">
                🛡️ Transaction Screening
              </Text>
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
              Optional: Add screeners to qualify transactions for your assistant
            </Text>
          </VStack>

          {/* Desktop Layout */}
          <HStack spacing={6} align="center" display={{ base: "none", md: "flex" }}>
            <VStack align="start" spacing={1} flex={1} maxWidth="500px">
              <Text fontSize="lg" fontWeight="bold" color="orange.800">
                🛡️ Transaction Screening
              </Text>
              <Text fontSize="sm" color="orange.700">
                Optional: Add screeners to qualify transactions for your assistant
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
                        onConfigChange={onScreenerConfigChange}
                        onRemove={onRemoveScreener}
                        networkId={currentNetworkId}
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
                  💡 Your assistant will run for all transactions. Enable screening above to add qualification rules.
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