'use client';
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Image,
  Switch,
  Collapse,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { transactionTypeMap } from './TransactionTypeBlock';
import ScreenerDropdownSelector from './ScreenerDropdownSelector';
import SelectedScreenerCard from './SelectedScreenerCard';
import ScreenerLogicSelector from './ScreenerLogicSelector';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface UnifiedTransactionTypePanelProps {
  typeId: string;
  onRemove: (typeId: string) => void;
  onReorder?: (typeId: string, typeName: string) => void;
  
  // Execution order info
  executionOrder?: number;
  predictedExecutionOrder?: number;
  allAssistantsCount?: number;
  
  // Status
  isConfigured: boolean;
  isActive: boolean;

  // Screener props
  enableScreeners: boolean;
  selectedScreeners: string[];
  screenerConfigs: { [screenerId: string]: any };
  originalScreenerConfigs?: { [screenerId: string]: any };
  useANDLogic: boolean;
  currentNetworkId: number;
  onEnableScreenersChange: (enabled: boolean) => void;
  onAddScreener: (instanceId: string, screener: any) => void;
  onRemoveScreener: (instanceId: string) => void;
  onScreenerConfigChange: (instanceId: string, config: any) => void;
  onLogicChange: (useAND: boolean) => void;
}

const UnifiedTransactionTypePanel: React.FC<UnifiedTransactionTypePanelProps> = ({
  typeId,
  onRemove,
  onReorder,
  executionOrder,
  predictedExecutionOrder,
  allAssistantsCount,
  isConfigured,
  isActive,
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
  // Get type info from the map
  const typeInfo = Object.values(transactionTypeMap).find(t => t.id === typeId);
  
  if (!typeInfo) return null;

  const { label, typeName, icon, iconPath } = typeInfo;

  // Determine status badge
  const getStatusBadge = () => {
    if (isActive && isConfigured) {
      return <Badge colorScheme="green" size="sm">ACTIVE</Badge>;
    } else if (isConfigured && !isActive) {
      return <Badge colorScheme="gray" size="sm">CONFIGURED</Badge>;
    } else {
      return <Badge colorScheme="orange" size="sm">PENDING</Badge>;
    }
  };

  return (
    <VStack 
      spacing={8}
      align="stretch"
      maxWidth="750px"
      width="100%"
      position="relative"
    >
      {/* Transaction Type Panel */}
      <Box
        border="2px solid"
        borderColor="orange.200"
        borderRadius="xl"
        bg="white"
        overflow="hidden"
        position="relative"
        _hover={{ borderColor: 'orange.300', shadow: 'md' }}
        transition="all 0.2s"
      >
        {/* Remove button */}
        <IconButton
          icon={<CloseIcon />}
          size="xs"
          position="absolute"
          top={{ base: 4, md: 3 }}
          right={4}
          variant="ghost"
          aria-label="Remove transaction type"
          onClick={() => onRemove(typeId)}
          color="gray.400"
          _hover={{ color: 'red.500', bg: 'red.50' }}
          zIndex={1}
        />

        {/* Transaction Type Header - Compact Design */}
        <Box
          position="relative"
          bg="orange.50"
          borderBottom="1px solid"
          borderBottomColor="orange.200"
          borderTopRadius="xl"
        >
          {/* Mobile Layout - Keep existing mobile design */}
          <VStack align="stretch" spacing={3} display={{ base: "flex", md: "none" }} px={4} py={4}>
            <HStack justify="space-between" align="center" pl={{ base: 0, md: 4 }} pr={8}>
              <HStack spacing={2} align="center">
                <Box flexShrink={0}>
                  {iconPath ? (
                    <Image
                      boxSize="6"
                      src={iconPath}
                      alt={`${label} ${typeName}`}
                      borderRadius="md"
                      fallback={
                        <Box
                          boxSize="6"
                          bg="orange.200"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="sm">{icon || '📄'}</Text>
                        </Box>
                      }
                    />
                  ) : (
                    <Box
                      boxSize="6"
                      bg="orange.200"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="sm">{icon || '📄'}</Text>
                    </Box>
                  )}
                </Box>
                <Text fontSize="sm" fontWeight="bold" color="orange.700">
                  {label} {typeName}
                </Text>
              </HStack>
              {getStatusBadge()}
            </HStack>
            
            {(executionOrder !== undefined || predictedExecutionOrder !== undefined || (allAssistantsCount && allAssistantsCount > 1 && onReorder)) && (
              <HStack spacing={3} align="center">
                {(executionOrder !== undefined || predictedExecutionOrder !== undefined) && (
                  <Text fontSize="xs" color="orange.600" fontWeight="semibold">
                    Global Order: {
                      executionOrder !== undefined
                        ? executionOrder + 1
                        : predictedExecutionOrder !== undefined
                        ? `${predictedExecutionOrder + 1} (pending)`
                        : 'Unknown'
                    }
                  </Text>
                )}

                {allAssistantsCount && allAssistantsCount > 1 && onReorder && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="orange"
                    fontSize="xs"
                    onClick={() => onReorder(typeId, `${label} ${typeName}`)}
                  >
                    Reorder ({allAssistantsCount})
                  </Button>
                )}
              </HStack>
            )}
          </VStack>

          {/* Desktop Layout - Ultra Compact Single Line */}
          <HStack justify="space-between" align="center" display={{ base: "none", md: "flex" }} pl={4} pr={12} py={3}>
            <HStack spacing={3} align="center" flex={1}>
              {/* Icon */}
              <Box flexShrink={0}>
                {iconPath ? (
                  <Image
                    boxSize="5"
                    src={iconPath}
                    alt={`${label} ${typeName}`}
                    borderRadius="md"
                    fallback={
                      <Box
                        boxSize="5"
                        bg="orange.200"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="sm">{icon || '📄'}</Text>
                      </Box>
                    }
                  />
                ) : (
                  <Box
                    boxSize="5"
                    bg="orange.200"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm">{icon || '📄'}</Text>
                  </Box>
                )}
              </Box>
              
              {/* Transaction Type Name */}
              <Text fontSize="sm" fontWeight="bold" color="orange.700">
                {label} {typeName}
              </Text>
              
              {/* Execution Order - Inline */}
              {(executionOrder !== undefined || predictedExecutionOrder !== undefined) && (
                <Text fontSize="xs" color="orange.500" fontWeight="black">
                  Global Order: {
                    executionOrder !== undefined
                      ? executionOrder + 1
                      : predictedExecutionOrder !== undefined
                      ? `${predictedExecutionOrder + 1} (pending)`
                      : '?'
                  }
                </Text>
              )}
              
              {/* Reorder Button - Inline & Compact */}
              {allAssistantsCount && allAssistantsCount > 1 && onReorder && (
                <Button
                  size="xs"
                  variant="solid"
                  colorScheme="orange"
                  fontSize="xs"
                  px={3}
                  h={6}
                  onClick={() => onReorder(typeId, `${label} ${typeName}`)}
                >
                  Change Order
                </Button>
              )}
            </HStack>
            
            {/* Status Badge */}
            {getStatusBadge()}
          </HStack>
        </Box>

        {/* Transaction Screening Section - Unified with proper overflow handling */}
        <Box p={6} position="relative">
          <VStack spacing={4} align="stretch">
            <Box>
              {/* Mobile and Tablet Layout */}
              <VStack align="stretch" spacing={3} display={{ base: "flex", md: "none" }}>
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={2}>
                    <Text fontSize="md" fontWeight="bold" color="blue.800">
                      {enableScreeners ? 'Screening enabled' : 'Screening disabled'}
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={enableScreeners}
                    onChange={(e) => {
                      onEnableScreenersChange(e.target.checked);
                    }}
                    colorScheme="blue"
                    size="lg"
                  />
                </HStack>
              </VStack>

              {/* Desktop Layout */}
              <HStack spacing={6} align="center" display={{ base: "none", md: "flex" }}>
                <VStack align="start" spacing={2} maxWidth="500px">
                  <Text fontSize="md" fontWeight="bold" color="blue.800">
                    {enableScreeners ? 'Screening enabled' : 'Screening disabled'}
                  </Text>
                </VStack>
                <Switch
                  isChecked={enableScreeners}
                  onChange={(e) => {
                    onEnableScreenersChange(e.target.checked);
                  }}
                  colorScheme="blue"
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
                <Box position="relative">
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
                    <Text fontSize="md" fontWeight="semibold" color="blue.800">
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
                  <Box p={4} bg="white" borderRadius="lg" border="1px solid" borderColor="blue.300">
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      💡 Your assistant will activate for all matching transactions. Enable screening above to add activation conditions.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Collapse>
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
};

export default UnifiedTransactionTypePanel;