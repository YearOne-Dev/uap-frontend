import React from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Text,
} from '@chakra-ui/react';
import ScreeningOptionCard from '@/components/ScreeningOptionCard';
import AssistantInfo from '@/components/AssistantInfo';
import SupportedTransactions from '@/components/SupportedTransactions';
import {
  curationCheckerAssistant,
  forwarderAssistant,
} from '@/constants/dummyData';

const ExecutiveAssistantPage: React.FC<{
  params: { networkName: string; assistantId: string };
}> = ({ params }) => {
  const { networkName } = params;

  const breadCrumbs = (
    <Breadcrumb separator="/" color="uap.orange" fontWeight="600">
      <BreadcrumbItem>
        <BreadcrumbLink href="/">#</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href={`/${networkName}/catalog`}>
          Catalog
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink href={`/${networkName}/catalog/executive-assistants`}>
          Executive Assistants
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>
        <BreadcrumbLink href="">Assistant {params.assistantId}</BreadcrumbLink>
      </BreadcrumbItem>
    </Breadcrumb>
  );

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

          <ScreeningOptionCard screener={curationCheckerAssistant} />
        </Flex>
        <Box border="1px" borderColor="gray.200" />
      </Flex>
    </Box>
  );
};

export default ExecutiveAssistantPage;
