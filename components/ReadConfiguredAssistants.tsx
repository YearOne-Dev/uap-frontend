import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { typeIdOptionsMap, typeIdOrder } from '@/constants/assistantTypes';
import {
  createUAPERC725Instance,
  generateUAPTypeConfigKey,
} from '@/utils/configDataKeyValueStore';
import { LSP0ERC725Account__factory } from '@/types';
import { ethers } from 'ethers';
import { supportedNetworks } from '@/constants/supportedNetworks';

type UPTypeConfigDisplayProps = {
  upAddress: string;
  networkId: number;
};

const ReadConfiguredAssistants: React.FC<UPTypeConfigDisplayProps> = ({
  upAddress,
  networkId,
}) => {
  const [typeConfigs, setTypeConfigs] = useState<{
    [typeId: string]: string[];
  }>({});
  const [loading, isLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
        
        const newTypeConfigs: { [typeId: string]: string[] } = {};

        for (const typeIdValue of typeIdOrder) {
          try {
            // Use new UAP format to get type configuration
            const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeIdValue);
            const encodedResult = await upContract.getData(typeConfigKey);
            
            if (encodedResult && encodedResult !== '0x') {
              // Decode using ERC725 UAP instance (address[] format)
              const assistantAddresses = erc725UAP.decodeValueType('address[]', encodedResult) as string[];
              
              if (assistantAddresses && assistantAddresses.length > 0) {
                newTypeConfigs[typeIdValue] = assistantAddresses;
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
        if (typeConfigs[typeIdValue]) {
          const option = typeIdOptionsMap[typeIdValue];
          return (
            <Box key={typeIdValue} mb={4}>
              <Text fontWeight="bold">
                {option.label} - {option.description}
              </Text>
              {typeConfigs[typeIdValue].map((address, index) => {
                const assistantName =
                  supportedNetworks[networkId].assistants[address.toLowerCase()]
                    ?.name;
                return (
                  <Text key={index}>
                    {`${assistantName ? assistantName : 'Unknown'} (Order ${index})`}: {address}
                  </Text>
                );
              })}
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};

export default ReadConfiguredAssistants;