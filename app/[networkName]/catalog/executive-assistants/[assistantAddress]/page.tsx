import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import SupportedTransactions from '@/components/SupportedTransactions';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssistantSmallCard from '@/components/AssistantSmallCard';
import { getAllAssistants, getAssistant } from '@/constants/assistantsConfig';
import { CHAINS, networkNameToIdMapping } from '@/constants/supportedNetworks';

// http://localhost:3000/lukso-testnet/catalog/executive-assistants/0x8097f5E8236eFDCD743cd9615C6167685eD233ee
const ExecutiveAssistantPage: React.FC<{
  params: { networkName: CHAINS; assistantAddress: string };
}> = ({ params }) => {
  console.log('YOOOOOO');
  const { networkName } = params;
  const assistantInfo = getAssistant(
    params.assistantAddress,
    networkNameToIdMapping[networkName]
  );
  console.log('assistantInfo', assistantInfo);
  if (!assistantInfo) {
    return <Text>Assistant not found</Text>;
  }
  /*
  const assistants = Object.values(getAllAssistants(Number(networkName)));
  const executiveAssistants = assistants.filter(
    assistant => assistant.assistantType === 'Executive'
  );
  const screenerAssistants = assistants.filter(
    assistant => assistant.assistantType === 'Screener'
  );
  */
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      {
        name: 'Executives',
        href: `/${networkName}/catalog`,
      },
      {
        name: `${assistantInfo.name}`,
        href: `/${networkName}/catalog/executive-assistants/${assistantInfo.address}`,
      },
    ],
  });
  // Get assistant data

  return (
    <Box p={4} w="100%">
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4} w="100%">
        <Flex w="100%">
          <AssistantInfo assistant={assistantInfo} />
          <SupportedTransactions assistant={assistantInfo} />
        </Flex>
        <Box border="1px" borderColor="gray.200" w="100%" />
      </Flex>
    </Box>
  );
};

export default ExecutiveAssistantPage;
