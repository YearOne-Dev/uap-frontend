import React from 'react';
import { Flex, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import WalletConnectButton from '@/components/WalletConnectButton';

interface SignInBoxProps {
  boxText: string;
}
const SignInBox = ({ boxText }: SignInBoxProps) => {
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200'); // Adjusts color based on the theme

  return (
    <Flex justifyContent="center" alignItems="center" height="100%" mt="15vh">
      <VStack
        p={5}
        backgroundColor={bgColor}
        border="1px solid"
        borderRadius="lg"
        width="350px"
        textAlign="center"
        padding="20px"
      >
        <Text
          fontSize="lg"
          fontWeight="bold"
          fontFamily="Montserrat"
          size="18px"
          lineHeight="24px"
          color="dark.purple.500"
        >
          {boxText}
        </Text>
        <WalletConnectButton />
      </VStack>
    </Flex>
  );
};

export default SignInBox;
