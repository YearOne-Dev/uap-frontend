'use client';
import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  useToast,
  Spinner,
  Flex,
  Badge,
  Image,
} from '@chakra-ui/react';
import { DragHandleIcon, ExternalLinkIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { transactionTypeMap } from './TransactionTypeBlock';
import { BrowserProvider } from 'ethers';
import {
  createUAPERC725Instance,
  reorderExecutiveAssistants,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';

interface AssistantInfo {
  address: string;
  name: string;
  currentOrder: number;
  configData: string;
}

interface AssistantReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeId: string;
  typeName: string;
  assistants: AssistantInfo[];
  networkId: number;
  onReorderComplete: () => void;
}

const AssistantReorderModal: React.FC<AssistantReorderModalProps> = ({
  isOpen,
  onClose,
  typeId,
  typeName,
  assistants,
  networkId,
  onReorderComplete,
}) => {
  const [orderedAssistants, setOrderedAssistants] = useState<AssistantInfo[]>(assistants);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const toast = useToast({ position: 'bottom-left' });
  const { profileDetailsData } = useProfile();
  const address = profileDetailsData?.upWallet;

  // Reset ordered assistants when modal opens or assistants change
  React.useEffect(() => {
    setOrderedAssistants([...assistants].sort((a, b) => a.currentOrder - b.currentOrder));
  }, [assistants, isOpen]);

  const getSigner = useCallback(async () => {
    if (!window.lukso || !address) {
      throw new Error('No wallet/address found!');
    }
    const provider = new BrowserProvider(window.lukso);
    return provider.getSigner(address);
  }, [address]);

  const moveAssistant = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= orderedAssistants.length || 
        toIndex < 0 || toIndex >= orderedAssistants.length) {
      return;
    }

    const newOrdered = [...orderedAssistants];
    const [movedAssistant] = newOrdered.splice(fromIndex, 1);
    newOrdered.splice(toIndex, 0, movedAssistant);
    setOrderedAssistants(newOrdered);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveAssistant(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openAssistantInNewTab = (assistantAddress: string) => {
    const network = supportedNetworks[networkId];
    if (network?.assistants[assistantAddress.toLowerCase()]) {
      // Create URL for specific assistant configuration page
      const url = `${window.location.origin}/${network.urlName}/catalog/executive-assistants/${assistantAddress}`;
      window.open(url, '_blank');
    }
  };

  const handleSaveNewOrder = async () => {
    if (!address) {
      toast({
        title: 'Not connected',
        description: 'Please connect your wallet first.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsProcessing(true);
      const signer = await getSigner();
      const upContract = LSP0ERC725Account__factory.connect(address, signer);
      const erc725UAP = createUAPERC725Instance(address, signer.provider);

      // Use the new reorderExecutiveAssistants function
      const assistantsForReorder = orderedAssistants.map(a => ({
        address: a.address,
        configData: a.configData
      }));

      const { keys, values } = await reorderExecutiveAssistants(
        erc725UAP,
        upContract,
        typeId,
        assistantsForReorder
      );

      // Execute the transaction
      if (keys.length > 0) {
        const tx = await upContract.setDataBatch(keys, values);
        await tx.wait();
      }

      toast({
        title: 'Success',
        description: 'Assistant order updated successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onReorderComplete();
      onClose();
    } catch (err: any) {
      console.error('Error reordering assistants:', err);
      if (!err.message.includes('user rejected action')) {
        toast({
          title: 'Error',
          description: `Error reordering assistants: ${err.message}`,
          status: 'error',
          duration: null,
          isClosable: true,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const hasChanges = () => {
    return orderedAssistants.some((assistant, index) => assistant.currentOrder !== index);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pr={12}>
          <HStack spacing={3} align="center">
            {/* Find the matching transaction type to get its icon */}
            {(() => {
              const transactionType = Object.values(transactionTypeMap).find(t => t.id === typeId);
              if (transactionType) {
                return (
                  <Box display="flex" alignItems="center" justifyContent="center" w={8} h={8}>
                    {transactionType.icon ? (
                      <Text fontSize="xl">{transactionType.icon}</Text>
                    ) : transactionType.iconPath ? (
                      <Image src={transactionType.iconPath} alt={transactionType.typeName} w={6} h={6} />
                    ) : (
                      <Text fontSize="xl">⚡</Text>
                    )}
                  </Box>
                );
              }
              return <Text fontSize="xl">⚡</Text>;
            })()}
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                Reorder Assistants
              </Text>
              <Text fontSize="sm" color="gray.600" fontWeight="normal">
                {typeName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowX="hidden">
          <Box mb={6} p={4} bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="lg">
            <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={2}>
              How Assistant Execution Works
            </Text>
            <Text fontSize="sm" color="orange.700" lineHeight="1.5">
              Assistants process transactions sequentially from top to bottom. Each assistant receives the transaction data, 
              performs its action, and passes the potentially modified result to the next assistant in the chain.
            </Text>
          </Box>
          
          <VStack spacing={0} align="stretch">
            {orderedAssistants.map((assistant, index) => (
              <React.Fragment key={assistant.address}>
                <Box
                  p={4}
                  border="1px solid"
                  borderColor={draggedIndex === index ? "orange.300" : "var(--chakra-colors-uap-grey)"}
                  borderRadius="xl"
                  bg={draggedIndex === index ? "orange.50" : "white"}
                  _hover={{ bg: draggedIndex === index ? "orange.100" : "gray.50" }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  cursor={draggedIndex === index ? "grabbing" : "grab"}
                  opacity={draggedIndex === index ? 0.8 : 1}
                  transform={draggedIndex === index ? "rotate(1deg)" : "none"}
                  transition="all 0.2s ease"
                  shadow={draggedIndex === index ? "lg" : "md"}
                  position="relative"
                  overflow="hidden"
                >
                  {/* Order Badge positioned absolutely */}
                  <Badge 
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme={draggedIndex === index ? "orange" : "blue"}
                    fontSize="xs"
                    px={2}
                    borderRadius="full"
                    zIndex={1}
                  >
                    #{index + 1}
                  </Badge>

                  <HStack spacing={3} align="center">
                    <DragHandleIcon 
                      color={draggedIndex === index ? "orange.500" : "gray.400"} 
                      cursor="grab" 
                      _hover={{ color: "orange.500" }}
                      fontSize="md"
                      flexShrink={0}
                    />
                    
                    {/* Assistant Icon */}
                    <Image
                      boxSize="10"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={draggedIndex === index ? "orange.300" : "var(--chakra-colors-uap-grey)"}
                      src={supportedNetworks[networkId]?.assistants[assistant.address.toLowerCase()]?.iconPath}
                      alt={assistant.name}
                      fallback={
                        <Box
                          boxSize="10"
                          borderRadius="full"
                          bg="gray.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          border="2px solid"
                          borderColor={draggedIndex === index ? "orange.300" : "var(--chakra-colors-uap-grey)"}
                        >
                          <Text fontSize="lg">🤖</Text>
                        </Box>
                      }
                      flexShrink={0}
                    />
                    
                    <VStack align="start" spacing={1} flex={1} overflow="hidden" minW={0}>
                      <Text fontWeight="bold" fontSize="sm" color="gray.800" noOfLines={1}>
                        {assistant.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="mono" letterSpacing="tight" noOfLines={1}>
                        {assistant.address}
                      </Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={2} lineHeight="1.3">
                        {supportedNetworks[networkId]?.assistants[assistant.address.toLowerCase()]?.description || 'Custom assistant configuration'}
                      </Text>
                    </VStack>
                    
                    <VStack spacing={1} flexShrink={0}>
                      <HStack spacing={0}>
                        <IconButton
                          icon={<ChevronUpIcon />}
                          size="xs"
                          variant="ghost"
                          aria-label="Move up"
                          isDisabled={index === 0}
                          onClick={() => moveAssistant(index, index - 1)}
                          _hover={{ bg: "orange.100" }}
                          minW="6"
                          h="6"
                        />
                        <IconButton
                          icon={<ChevronDownIcon />}
                          size="xs"
                          variant="ghost"
                          aria-label="Move down"
                          isDisabled={index === orderedAssistants.length - 1}
                          onClick={() => moveAssistant(index, index + 1)}
                          _hover={{ bg: "orange.100" }}
                          minW="6"
                          h="6"
                        />
                      </HStack>
                      
                      <IconButton
                        icon={<ExternalLinkIcon />}
                        size="xs"
                        variant="outline"
                        colorScheme="orange"
                        aria-label="Open assistant configuration"
                        onClick={() => openAssistantInNewTab(assistant.address)}
                        minW="7"
                        h="7"
                      />
                    </VStack>
                  </HStack>
                </Box>
                
                {/* Flow Arrow - only show between items, not after the last one */}
                {index < orderedAssistants.length - 1 && (
                  <Flex justify="center" py={2}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      w={8}
                      h={8}
                      borderRadius="full"
                      bg="orange.100"
                      border="2px solid"
                      borderColor="orange.300"
                    >
                      <ArrowDownIcon color="orange.500" fontSize="sm" />
                    </Box>
                  </Flex>
                )}
              </React.Fragment>
            ))}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isProcessing}>
            Cancel
          </Button>
          <Button
            bg="orange.500"
            color="white"
            _hover={{ bg: 'orange.600' }}
            _active={{ bg: 'orange.700' }}
            onClick={handleSaveNewOrder}
            isLoading={isProcessing}
            loadingText="Saving..."
            isDisabled={!hasChanges() || isProcessing}
          >
            Save New Order
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AssistantReorderModal;