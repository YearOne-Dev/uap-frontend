import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import SupportedTransactions from '@/components/SupportedTransactions';
import {
  curationCheckerAssistant,
  forwarderAssistant,
} from '@/constants/dummyData';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssistantSmallCard from '@/components/AssistantSmallCard';

const ExecutiveAssistantPage: React.FC<{
  params: { networkName: string; assistantAddress: string };
}> = ({ params }) => {
  const { networkName } = params;
  const breadCrumbs = Breadcrumbs({
    items: [
      { name: 'UPAC', href: '/' },
      { name: 'Catalog', href: `/${networkName}/catalog` },
      {
        name: 'Executives',
        href: `/${networkName}/catalog`,
      },
      {
        name: `Assistant ${params.assistantAddress}`,
        href: `/${networkName}/catalog/executive-assistants/${params.assistantAddress}`,
      },
    ],
  });

  return (
    <Box p={4} w="100%">
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4} w="100%">
        <Flex w="100%">
          <AssistantInfo assistant={forwarderAssistant} />
          <SupportedTransactions assistant={forwarderAssistant} />
        </Flex>
        <Box border="1px" borderColor="gray.200" w="100%" />
        <Flex
          flexDirection="row"
          gap={4}
          mt={4}
          justifyContent="left"
          alignItems="center"
          w="100%"
        >
          <Flex flexDirection="column" alignItems="center">
            <Text fontWeight="bold" fontSize="md">
              Screening
            </Text>
            <Text fontWeight="bold" fontSize="md">
              Options
            </Text>
          </Flex>

          <AssistantSmallCard assistant={curationCheckerAssistant} />
        </Flex>
        <Box border="1px" borderColor="gray.200" />
      </Flex>
    </Box>
  );
};

export default ExecutiveAssistantPage;
