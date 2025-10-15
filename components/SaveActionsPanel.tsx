import React from 'react'
import {
  Badge,
  Button,
  HStack,
  VStack,
  Text,
} from '@chakra-ui/react'

interface SaveActionsPanelProps {
  isUPSubscribedToAssistant: boolean
  hasPendingChanges: boolean
  isProcessing: boolean
  onSave: () => void
  onReset: () => void
}

const SaveActionsPanel: React.FC<SaveActionsPanelProps> = ({
  isUPSubscribedToAssistant,
  hasPendingChanges,
  isProcessing,
  onSave,
  onReset,
}) => {
  const getStatusBadge = () => {
    if (isUPSubscribedToAssistant) {
      if (hasPendingChanges) {
        return <Badge colorScheme="orange">UNSAVED CHANGES</Badge>
      } else {
        return <Badge colorScheme="green">ASSISTANT IS ACTIVE</Badge>
      }
    } else {
      if (hasPendingChanges) {
        return <Badge colorScheme="blue">READY TO ACTIVATE</Badge>
      } else {
        return <Badge colorScheme="gray">NOT CONFIGURED</Badge>
      }
    }
  }

  const getActionButtonText = () => {
    if (isUPSubscribedToAssistant) {
      return hasPendingChanges ? 'Update Configuration' : 'Configuration Up to Date'
    } else {
      return 'Activate Assistant'
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontWeight="bold" fontSize="lg">
          Assistant Instructions
        </Text>
        {getStatusBadge()}
      </HStack>

      <HStack spacing={3}>
        <Button
          bg="orange.500"
          color="white"
          _hover={{ bg: 'orange.600' }}
          _active={{ bg: 'orange.700' }}
          onClick={onSave}
          isDisabled={!hasPendingChanges || isProcessing}
          isLoading={isProcessing}
          loadingText="Processing..."
          size="md"
          flex={1}
        >
          {getActionButtonText()}
        </Button>

        {hasPendingChanges && (
          <Button
            variant="outline"
            onClick={onReset}
            isDisabled={isProcessing}
            size="md"
          >
            Reset
          </Button>
        )}
      </HStack>

      {!hasPendingChanges && !isUPSubscribedToAssistant && (
        <Text fontSize="sm" color="gray.500">
          Configure the assistant parameters above and select transaction types to activate.
        </Text>
      )}
    </VStack>
  )
}

export default SaveActionsPanel