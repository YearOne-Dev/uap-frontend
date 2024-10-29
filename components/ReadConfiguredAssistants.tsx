import React, { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { typeIdOptionsMap, typeIdOrder } from '@/constants/assistantTypes';
import {
  customDecodeAddresses,
  generateMappingKey,
} from '@/utils/configDataKeyValueStore';
import { ERC725__factory } from '@/types';
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
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTypeConfigs = async () => {
      try {
        const { rpcUrl, name } = supportedNetworks[networkId];
        console.log('rpcUrl', rpcUrl);
        console.log('networkId', networkId);
        const provider = new ethers.JsonRpcProvider(rpcUrl, {
          name: name,
          chainId: networkId,
        });
        console.log('provider', provider);
        const newTypeConfigs: { [typeId: string]: string[] } = {};

        for (const typeIdValue of typeIdOrder) {
          // Generate mapping key
          const mappingKey = generateMappingKey('UAPTypeConfig', typeIdValue);

          // fetch data
          const UP = ERC725__factory.connect(upAddress, provider);
          const encodedResult = await UP.getData(mappingKey);
          const assistantAddresses = customDecodeAddresses(encodedResult);

          if (
            assistantAddresses &&
            Array.isArray(assistantAddresses) &&
            assistantAddresses.length > 0
          ) {
            newTypeConfigs[typeIdValue] = assistantAddresses;
          }
        }

        setTypeConfigs(newTypeConfigs);
      } catch (error: any) {
        console.error('Error fetching UP Type Configs:', error);
        setError('Error fetching UP Type Configs');
      }
    };
    if (upAddress && networkId) {
      fetchTypeConfigs();
    }
  }, [upAddress, networkId]);

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (Object.keys(typeConfigs).length === 0) {
    return <Text>No UAP Type Configurations found.</Text>;
  }

  return (
    <Box mt={4}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Current Assistant Configurations
      </Text>
      {typeIdOrder.map(typeIdValue => {
        if (typeConfigs[typeIdValue]) {
          const option = typeIdOptionsMap[typeIdValue];
          return (
            <Box key={typeIdValue} mb={4}>
              <Text fontWeight="bold">
                Type: {option.label} - {option.description}
              </Text>
              {typeConfigs[typeIdValue].map((address, index) => (
                <Text key={index}>Assistant Address: {address}</Text>
              ))}
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};

export default ReadConfiguredAssistants;
