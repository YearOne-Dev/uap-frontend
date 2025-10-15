import React from 'react'
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react'

interface ConfigParam {
  name: string
  type: string
  description?: string
  defaultValue?: string
}

interface AssistantFormFieldsProps {
  configParams: ConfigParam[]
  fieldValues: Record<string, string>
  onFieldChange: (name: string, value: string) => void
}

const AssistantFormFields: React.FC<AssistantFormFieldsProps> = ({
  configParams,
  fieldValues,
  onFieldChange,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      {configParams.map(param => (
        <FormControl key={param.name}>
          <FormLabel>{param.name}</FormLabel>
          <Input
            value={fieldValues[param.name] || ''}
            onChange={(e) => onFieldChange(param.name, e.target.value)}
            placeholder={param.defaultValue || ''}
          />
        </FormControl>
      ))}
    </VStack>
  )
}

export default AssistantFormFields