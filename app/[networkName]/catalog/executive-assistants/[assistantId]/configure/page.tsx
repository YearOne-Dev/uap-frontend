'use client';
import React, { useEffect } from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react';
import AssistantInfo from '@/components/AssistantInfo';
import { forwarderAssistant } from '@/constants/dummyData';
import URDSetup from '@/components/URDSetup';
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import SignInBox from '@/components/SignInBox';
import { getNetwork } from '@/utils/utils';
import { getChainIdByUrlName } from '@/utils/universalProfile';
import { useNetwork } from '@/contexts/NetworkContext';
import { doesControllerHaveMissingPermissions } from '@/utils/configDataKeyValueStore';

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: string; assistantId: string };
}) {
  const { networkName } = params;
  const networkUrlId = getChainIdByUrlName(params.networkName);
  const { open } = useWeb3Modal();

  const { address, chainId: walletNetworkId } = useWeb3ModalAccount();
  // todo validate that id from url is a valid assistant id

  useEffect(() => {
    if (!address) {
      return;
    }
    // todo:
    // check if there are missing permissions for urd even if installed, on page load
    // const hasMissingPermissions = async () => {
    // const missingPermissions = await doesControllerHaveMissingPermissions(
    //     mainUPController, // TODO: where to get this from?
    //     address
    //   );
    //   return missingPermissions.length > 0;
    // }

    // check if URD is installed on page load
  }, []);

  const breadCrumbs = (
    <>
      <Breadcrumb
        separator="/"
        color={'uap.orange'}
        fontFamily={'Tomorrow'}
        fontWeight={600}
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">#</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`${networkName}/catalog`} ml={2} mr={2}>
            Catalog
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/${networkName}/catalog/executive-assistants`}
            ml={2}
            mr={2}
          >
            Executive Assistants
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/${networkName}/catalog/executive-assistants/${params.assistantId}`}
            ml={2}
            mr={2}
          >
            Assistant {params.assistantId}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="" ml={2} mr={2}>
            Configure
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    </>
  );

  const renderConfigureBody = () => {
    if (!walletNetworkId || !address) {
      return <SignInBox boxText={'Sign in to set UAPTypeConfig'} />;
    }

    if (walletNetworkId !== networkUrlId) {
      return (
        <Flex
          height="100%"
          w="100%"
          alignContent="center"
          justifyContent="center"
          pt={4}
        >
          <VStack>
            <Text>You're connect to {getNetwork(walletNetworkId).name}.</Text>
            <Text>Please change network</Text>
            <Button onClick={() => open({ view: 'Networks' })}>
              Change network
            </Button>
          </VStack>
        </Flex>
      );
    }

    // todo if URD is set, show URDSetup
    // if(missing permissions or !urd) {
    // return <TransactionSelector />;

    // }

    return <URDSetup />;
  };

  return (
    <Box p={4} w="100%">
      {breadCrumbs}
      <Flex direction="column" gap={4} mt={4} w="100%">
        <Flex w="100%">
          <AssistantInfo assistant={forwarderAssistant} />
        </Flex>
        <Box border="1px" borderColor="gray.200" w="100%" />
        {renderConfigureBody()}
        <Box border="1px" borderColor="gray.200" w="100%" />
      </Flex>
    </Box>
  );
}
