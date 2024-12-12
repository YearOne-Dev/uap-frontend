import React from 'react';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { Flex, Select, Image } from '@chakra-ui/react';
import { getNetwork } from '@/utils/utils';

const WalletNetworkSelectorButton = ({
  currentNetwork,
  urlTemplate,
}: {
  currentNetwork: number;
  urlTemplate: string;
}) => {
  const { icon } = supportedNetworks[currentNetwork];
  return (
    <Flex gap={2} flexDirection={'row'} alignItems={'center'}>
      <Image src={icon} alt={icon} height={'30px'} />
      <Select
        border={'1px solid var(--chakra-colors-uap-orange)'}
        variant="outline"
        value={currentNetwork}
        fontWeight={600}
        onChange={event => {
          const chainId = parseInt(event.target.value);
          const network = getNetwork(chainId);

          const url = `/` + network.urlName + urlTemplate;
          window.location.href = url;
        }}
      >
        {Object.keys(supportedNetworks).map((networkId: string) => {
          const network = getNetwork(networkId);
          return (
            <option key={networkId} value={Number(networkId)}>
              {network.name}
            </option>
          );
        })}
      </Select>
    </Flex>
  );
};

export default WalletNetworkSelectorButton;
