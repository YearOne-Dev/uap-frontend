import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text, Button, HStack, useDisclosure, Image } from '@chakra-ui/react';
import { typeIdOptionsMap, typeIdOrder } from '@/constants/assistantTypes';
import {
  createUAPERC725Instance,
  generateUAPTypeConfigKey,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { ethers } from 'ethers';
import { supportedNetworks } from '@/constants/supportedNetworks';
import AssistantReorderModal from './AssistantReorderModal';
import {
  fetchExecutiveAssistantConfig,
} from '@/utils/configDataKeyValueStore';
import { transactionTypeMap } from './TransactionTypeBlock';

type UPTypeConfigDisplayProps = {
  upAddress: string;
  networkId: number;
};

interface AssistantInfo {
  address: string;
  name: string;
  currentOrder: number;
  configData: string;
}

const ReadConfiguredAssistants: React.FC<UPTypeConfigDisplayProps> = ({
  upAddress,
  networkId,
}) => {
  const [typeConfigs, setTypeConfigs] = useState<{
    [typeId: string]: AssistantInfo[];
  }>({});
  const [loading, isLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedTypeForReorder, setSelectedTypeForReorder] = useState<{
    typeId: string;
    typeName: string;
  } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchTypeConfigs = async () => {
      try {
        const { rpcUrl, name } = supportedNetworks[networkId];
        const provider = new ethers.JsonRpcProvider(rpcUrl, {
          name: name,
          chainId: networkId,
        });
        
        // Create UAP ERC725 instance for new format
        const erc725UAP = createUAPERC725Instance(upAddress, provider);
        const upContract = LSP0ERC725Account__factory.connect(upAddress, provider);
        
        const newTypeConfigs: { [typeId: string]: AssistantInfo[] } = {};

        for (const typeIdValue of typeIdOrder) {
          try {
            // Use new UAP format to get type configuration
            const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeIdValue);
            const encodedResult = await upContract.getData(typeConfigKey);
            
            if (encodedResult && encodedResult !== '0x') {
              // Decode using ERC725 UAP instance (address[] format)
              const assistantAddresses = erc725UAP.decodeValueType('address[]', encodedResult) as string[];
              
              if (assistantAddresses && assistantAddresses.length > 0) {
                // Fetch detailed config for each assistant
                const assistantInfos: AssistantInfo[] = [];
                
                for (let i = 0; i < assistantAddresses.length; i++) {
                  const assistantAddress = assistantAddresses[i];
                  const assistantName = supportedNetworks[networkId].assistants[assistantAddress.toLowerCase()]?.name || 'Unknown';
                  
                  // Fetch the executive config to get the config data
                  try {
                    const { configData } = await fetchExecutiveAssistantConfig(
                      erc725UAP,
                      upContract,
                      assistantAddress,
                      [typeIdValue]
                    );
                    
                    assistantInfos.push({
                      address: assistantAddress,
                      name: assistantName,
                      currentOrder: i,
                      configData: configData[typeIdValue] || '0x'
                    });
                  } catch (configError) {
                    console.warn(`Error fetching config for assistant ${assistantAddress}:`, configError);
                    // Still add the assistant even if config fetch fails
                    assistantInfos.push({
                      address: assistantAddress,
                      name: assistantName,
                      currentOrder: i,
                      configData: '0x'
                    });
                  }
                }
                
                newTypeConfigs[typeIdValue] = assistantInfos;
              }
            }
          } catch (typeError) {
            console.warn(`Error fetching config for type ${typeIdValue}:`, typeError);
            // Continue with other types if one fails
          }
        }

        setTypeConfigs(newTypeConfigs);
      } catch (error: any) {
        console.error('Error fetching UP Type Configs:', error);
        setError('Error fetching UP Type Configs');
      } finally {
        isLoading(false);
      }
    };
    
    if (upAddress && networkId) {
      fetchTypeConfigs();
    }
  }, [upAddress, networkId]);

  const handleReorderClick = (typeId: string, typeName: string) => {
    const option = typeIdOptionsMap[typeId as keyof typeof typeIdOptionsMap];
    setSelectedTypeForReorder({
      typeId,
      typeName: `${option.label} - ${option.description}`
    });
    onOpen();
  };

  const handleReorderComplete = () => {
    // Refetch the configs to show updated order
    if (upAddress && networkId) {
      const fetchTypeConfigs = async () => {
        try {
          const { rpcUrl, name } = supportedNetworks[networkId];
          const provider = new ethers.JsonRpcProvider(rpcUrl, {
            name: name,
            chainId: networkId,
          });
          
          // Create UAP ERC725 instance for new format
          const erc725UAP = createUAPERC725Instance(upAddress, provider);
          const upContract = LSP0ERC725Account__factory.connect(upAddress, provider);
          
          const newTypeConfigs: { [typeId: string]: AssistantInfo[] } = {};

          for (const typeIdValue of typeIdOrder) {
            try {
              // Use new UAP format to get type configuration
              const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeIdValue);
              const encodedResult = await upContract.getData(typeConfigKey);
              
              if (encodedResult && encodedResult !== '0x') {
                // Decode using ERC725 UAP instance (address[] format)
                const assistantAddresses = erc725UAP.decodeValueType('address[]', encodedResult) as string[];
                
                if (assistantAddresses && assistantAddresses.length > 0) {
                  // Fetch detailed config for each assistant
                  const assistantInfos: AssistantInfo[] = [];
                  
                  for (let i = 0; i < assistantAddresses.length; i++) {
                    const assistantAddress = assistantAddresses[i];
                    const assistantName = supportedNetworks[networkId].assistants[assistantAddress.toLowerCase()]?.name || 'Unknown';
                    
                    // Fetch the executive config to get the config data
                    try {
                      const { configData } = await fetchExecutiveAssistantConfig(
                        erc725UAP,
                        upContract,
                        assistantAddress,
                        [typeIdValue]
                      );
                      
                      assistantInfos.push({
                        address: assistantAddress,
                        name: assistantName,
                        currentOrder: i,
                        configData: configData[typeIdValue] || '0x'
                      });
                    } catch (configError) {
                      console.warn(`Error fetching config for assistant ${assistantAddress}:`, configError);
                      // Still add the assistant even if config fetch fails
                      assistantInfos.push({
                        address: assistantAddress,
                        name: assistantName,
                        currentOrder: i,
                        configData: '0x'
                      });
                    }
                  }
                  
                  newTypeConfigs[typeIdValue] = assistantInfos;
                }
              }
            } catch (typeError) {
              console.warn(`Error fetching config for type ${typeIdValue}:`, typeError);
              // Continue with other types if one fails
            }
          }

          setTypeConfigs(newTypeConfigs);
        } catch (error: any) {
          console.error('Error refetching UP Type Configs:', error);
        }
      };
      
      fetchTypeConfigs();
    }
  };

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (loading) {
    return <Spinner />;
  }

  if (Object.keys(typeConfigs).length === 0) {
    return <Text>No 🆙 assistant configurations found.</Text>;
  }

  return (
    <Box mt={4}>
      {typeIdOrder.map(typeIdValue => {
        if (typeConfigs[typeIdValue] && typeConfigs[typeIdValue].length > 0) {
          const option = typeIdOptionsMap[typeIdValue as keyof typeof typeIdOptionsMap];
          const assistants = typeConfigs[typeIdValue];
          
          return (
            <Box key={typeIdValue} mb={6}>
              <HStack justify="space-between" align="center" mb={3}>
                <HStack spacing={3}>
                  {/* Find the matching transaction type to get its icon */}
                  {(() => {
                    const transactionType = Object.values(transactionTypeMap).find(t => t.id === typeIdValue);
                    if (transactionType) {
                      return (
                        <Box display="flex" alignItems="center" justifyContent="center" w={6} h={6}>
                          {transactionType.icon ? (
                            <Text fontSize="lg">{transactionType.icon}</Text>
                          ) : transactionType.iconPath ? (
                            <Image src={transactionType.iconPath} alt={transactionType.typeName} w={5} h={5} />
                          ) : (
                            <Text fontSize="lg">⚡</Text>
                          )}
                        </Box>
                      );
                    }
                    return <Text fontSize="lg">⚡</Text>;
                  })()}
                  <Text fontWeight="bold">
                    {option.label} - {option.description}
                  </Text>
                </HStack>
                {assistants.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="orange"
                    onClick={() => handleReorderClick(typeIdValue, `${option.label} - ${option.description}`)}
                  >
                    Reorder ({assistants.length})
                  </Button>
                )}
              </HStack>
              
              {assistants.map((assistant, index) => (
                <Box key={assistant.address} ml={4} mb={2}>
                  <Text>
                    <Text as="span" fontWeight="semibold">
                      {assistant.name}
                    </Text>
                    <Text as="span" color="gray.500" fontSize="sm">
                      {` (Order ${assistant.currentOrder + 1})`}
                    </Text>
                    <Text as="span" color="gray.400" fontSize="xs" fontFamily="mono">
                      {`: ${assistant.address}`}
                    </Text>
                  </Text>
                </Box>
              ))}
            </Box>
          );
        }
        return null;
      })}
      
      {selectedTypeForReorder && (
        <AssistantReorderModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedTypeForReorder(null);
          }}
          typeId={selectedTypeForReorder.typeId}
          typeName={selectedTypeForReorder.typeName}
          assistants={typeConfigs[selectedTypeForReorder.typeId] || []}
          networkId={networkId}
          onReorderComplete={handleReorderComplete}
        />
      )}
    </Box>
  );
};

export default ReadConfiguredAssistants;