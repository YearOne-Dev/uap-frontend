import React from 'react';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { Flex, Select, Image } from '@chakra-ui/react';
import { getNetwork } from '@/utils/utils';
import { useNetwork } from '@/contexts/NetworkContext';

const WalletNetworkSelectorButton = ({
  currentNetwork,
  urlTemplate,
}: {
  currentNetwork: number;
  urlTemplate: (networkId: number) => string;
}) => {
  const { network } = useNetwork();
  return (
    <Flex gap={2} flexDirection={'row'} alignItems={'center'}>
      <Image src={network.icon} alt={network.icon} height={'30px'} />
      <Select
        border={'1px solid var(--chakra-colors-hashlists-orange)'}
        variant="outline"
        defaultValue={currentNetwork}
        fontWeight={600}
        onChange={event => {
          const chainId = parseInt(event.target.value);
          window.location.href = getNetwork(chainId).url + urlTemplate(chainId);
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
