'use client';

import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import { ExecutiveAssistant, ScreenerAssistant } from '@/constants/CustomTypes';
import { formatAddress, getNetwork } from '@/utils/utils';
import { getProfileBasicInfo } from '@/utils/universalProfile';

const AssistantSmallCard = ({
  assistant,
  includeLink = false,
}: {
  assistant: ExecutiveAssistant | ScreenerAssistant;
  includeLink?: boolean;
}) => {
  const networkConfig = getNetwork(assistant.chainId);
  const [creatorName, setCreatorName] = useState<string>(
    formatAddress(assistant.creatorAddress)
  );
  const [creatorAvatar, setCreatorAvatar] = useState<string | null>();

  useEffect(() => {
    getProfileBasicInfo(assistant.chainId, assistant.creatorAddress).then(
      profileData => {
        setCreatorName(
          profileData.upName || formatAddress(assistant.creatorAddress)
        );
        setCreatorAvatar(profileData.avatar || null);
      }
    );
  });

  let link = '';
  if (includeLink) {
    const network = getNetwork(assistant.chainId);
    link += '/' + network.urlName;
    link += '/catalog';
    link += `/${assistant.assistantType.toLowerCase()}-assistants`;
    link += `/${assistant.address}`;
  }

  return (
    <Flex
      border="1px solid #2C5765"
      borderRadius="10px"
      p={4}
      flexDirection={['column', 'row']} // Stacked on small screens
      alignItems="center"
      maxWidth={['100%', '400px']}
      w="100%"
      minHeight="250px"
      minW={'300px'} // Ensures all cards have the same height
    >
      <Image
        boxSize={['80px', '100px']} // Smaller image on small screens
        borderRadius="full"
        border="2px solid"
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
        mb={[4, 0]} // Margin bottom for stacked layout
      />
      <Flex
        ml={[0, 4]}
        flexDirection="column"
        justifyContent="space-between" // Ensures content is evenly spaced
        alignItems={['center', 'flex-start']} // Center on small screens
        textAlign={['center', 'left']} // Center text on small screens
        w="100%"
        h="100%" // Ensure content stretches to fill the height
      >
        <Box>
          <Text fontSize={['md', 'lg']} fontWeight="bold" mb={1}>
            {assistant.name}
          </Text>
          <Flex
            fontSize={['sm', 'md']}
            color="gray.600"
            mb={2}
            flexDirection={'row'}
            gap={2}
            justifyContent={'flex-start'}
            alignItems={'center'}
          >
            <Text fontWeight={600}>By:</Text>
            {creatorAvatar && (
              <Avatar
                border={'1px solid var(--chakra-colors-uap-grey)'}
                src={creatorAvatar}
                height={'20px'}
                width={'20px'}
              />
            )}
            <Link
              fontWeight={600}
              isExternal
              href={`${networkConfig.universalEverything}/${assistant.creatorAddress}?network=${networkConfig.luksoSiteName}`}
            >
              {creatorName}
            </Link>
          </Flex>
          <Badge
            fontSize={['0.7em', '0.8em']} // Smaller font size on small screens
            borderRadius="md"
            border="1px solid"
            borderColor="uap.font"
            color="uap.font"
            bg="transparent"
            textTransform="none"
            mb={2}
          >
            {assistant.assistantType} Assistant
          </Badge>
          <Text fontSize={['sm', 'md']} color="gray.600">
            {assistant.description}
          </Text>
        </Box>
        {includeLink && (
          <Button
            mt="4"
            as="a"
            href={link}
            colorScheme="orange"
            variant="solid"
            size="sm"
            width={['100%', '200px']} // Full width on small screens
            borderRadius={'10px'}
          >
            View Details
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default AssistantSmallCard;
