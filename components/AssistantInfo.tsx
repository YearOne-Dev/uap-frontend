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

interface AssistantInfoProps {
  assistant: ExecutiveAssistant | ScreenerAssistant;
  includeLink?: boolean;
}

const AssistantInfo = ({
  assistant,
  includeLink = false,
}: AssistantInfoProps) => {
  // Use the creator address to display a formatted name until we fetch more data.
  const [creatorName, setCreatorName] = useState<string>(
    formatAddress(assistant.creatorAddress)
  );
  const [creatorAvatar, setCreatorAvatar] = useState<string | null>(null);

  // Fetch profile info (avatar and name) for the assistant's creator.
  useEffect(() => {
    getProfileBasicInfo(assistant.chainId, assistant.creatorAddress).then(
      profileData => {
        setCreatorName(
          profileData.upName || formatAddress(assistant.creatorAddress)
        );
        setCreatorAvatar(profileData.avatar || null);
      }
    );
  }, [assistant.chainId, assistant.creatorAddress]);

  const networkConfig = getNetwork(assistant.chainId);

  // Construct the details link similarly to the first file.
  let link = '';
  if (includeLink) {
    link += '/' + networkConfig.urlName;
    link += '/catalog';
    link += `/${assistant.assistantType.toLowerCase()}-assistants`;
    link += `/${assistant.address}`;
  }

  return (
    <Flex
      p={4}
      flexDirection={['column', 'row']}
      alignItems={['flex-start', 'center']}
      w="100%" // Preserve the original container width.
    >
      <Image
        boxSize={['80px', '100px']}
        borderRadius="full"
        border="2px solid" // Add a border similar to the first component.
        src={assistant.iconPath}
        alt={`${assistant.name} Logo`}
        mb={[2, 0]}
      />
      <Box ml={[0, 4]} mt={[2, 0]} w="100%">
        {/* Assistant Name */}
        <Text fontSize={['md', 'lg']} fontWeight="bold" mb={1}>
          {assistant.name}
        </Text>

        {/* By-line section similar to the first file */}
        <Flex
          fontSize={['sm', 'md']}
          color="gray.600"
          mb={2}
          flexDirection="row"
          gap={2}
          alignItems="center"
        >
          <Text fontWeight={600}>By:</Text>
          {creatorAvatar && (
            <Avatar
              border="1px solid var(--chakra-colors-uap-grey)"
              src={creatorAvatar}
              height="20px"
              width="20px"
            />
          )}
          <Link
            fontWeight={600}
            isExternal
            href={`${networkConfig.universalEverything}/${assistant.creatorAddress}?network=${networkConfig.urlName}`}
          >
            {creatorName}
          </Link>
        </Flex>

        {/* Assistant type badge */}
        <Badge
          fontSize={['0.7em', '0.8em']}
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

        {/* Assistant description */}
        <Text fontSize={['sm', 'md']} color="gray.600">
          {assistant.description}
        </Text>

        {/* Details button, if required */}
        {includeLink && (
          <Button
            mt="4"
            as="a"
            href={link}
            colorScheme="orange"
            variant="solid"
            size="sm"
            width={['100%', '200px']}
            borderRadius="10px"
          >
            View Details
          </Button>
        )}
      </Box>
    </Flex>
  );
};

export default AssistantInfo;
