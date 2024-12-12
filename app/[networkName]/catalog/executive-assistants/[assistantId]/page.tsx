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


// Screening Options Component
function ScreeningOptions() {
  return (
    <Flex flexDirection="row" alignItems="flex-start" gap={4} mt={4}>
      <Text fontWeight="bold" fontSize="md" color="gray.600">
        Screening Options
      </Text>
      <ScreeningOptionCard />
    </Flex>
  );
}

export default function ExecutiveAssistantPage({
  params,
}: {
  params: { networkName: string; assistantId: string };
}) {
  const { networkName } = params;

  const breadCrumbs = (
    <Breadcrumb separator="/" color="hashlists.orange" fontWeight="600">
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
    <Box p={4}>
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4}>
        <Flex>
          <AssistantInfo />
          <SupportedTransactions />
        </Flex>
        <ScreeningOptions />
      </Flex>
    </Box>
  );
}
