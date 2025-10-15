import React from 'react'
import {
  Text,
  Badge,
  HStack,
  VStack,
  Button,
} from '@chakra-ui/react'

interface ExecutionOrderDisplayProps {
  typeId: string
  typeName: string
  executionOrder?: number
  predictedExecutionOrder?: number
  isSubscribed: boolean
  allAssistants?: { address: string; name: string; currentOrder: number; configData: string }[]
  onReorderClick?: () => void
}

const ExecutionOrderDisplay: React.FC<ExecutionOrderDisplayProps> = ({
  typeId,
  typeName,
  executionOrder,
  predictedExecutionOrder,
  isSubscribed,
  allAssistants = [],
  onReorderClick,
}) => {
  const getExecutionOrderDisplay = () => {
    if (isSubscribed && executionOrder !== undefined) {
      return `Execution Order: ${executionOrder + 1}`
    } else if (predictedExecutionOrder !== undefined) {
      return `Execution Order: ${predictedExecutionOrder + 1} (pending activation)`
    }
    return 'Execution Order: Not configured'
  }

  const shouldShowReorderButton = () => {
    return isSubscribed && allAssistants.length > 1
  }

  return (
    <VStack spacing={2} align="start">
      <HStack spacing={2}>
        <Text fontSize="sm" color="gray.600">
          {getExecutionOrderDisplay()}
        </Text>
        {isSubscribed && (
          <Badge colorScheme="green" size="sm">
            ACTIVE
          </Badge>
        )}
        {!isSubscribed && predictedExecutionOrder !== undefined && (
          <Badge colorScheme="orange" size="sm">
            PENDING
          </Badge>
        )}
      </HStack>
      
      {shouldShowReorderButton() && onReorderClick && (
        <Button
          size="xs"
          variant="outline"
          colorScheme="orange"
          onClick={onReorderClick}
        >
          Reorder Assistants for {typeName}
        </Button>
      )}
      
      {allAssistants.length > 1 && (
        <Text fontSize="xs" color="gray.500">
          {allAssistants.length} assistants configured for this type
        </Text>
      )}
    </VStack>
  )
}

export default ExecutionOrderDisplay