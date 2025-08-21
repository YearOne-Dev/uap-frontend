/**
 * Debugging and payload inspection utilities for screener configuration
 * These utilities help verify that the UI generates correct blockchain payloads
 * and provide detailed insights into the screener configuration process
 */

import { AbiCoder } from 'ethers'
import ERC725 from '@erc725/erc725.js'
import uapSchema from '@/schemas/UAP.json'

// Types for debugging output
interface ScreenerConfigDebugInfo {
  instanceId: string
  screenerAddress: string
  screenerType: string
  configData: any
  encodedConfig: string
  manualBytePackedValue?: string
  addressListName?: string
  isValid: boolean
  validationErrors: string[]
}

interface PayloadDebugInfo {
  description: string
  keys: string[]
  values: string[]
  keyValuePairs: { [key: string]: string }
  totalGasEstimate?: number
  screenerDetails: ScreenerConfigDebugInfo[]
  useANDLogic: boolean
  warnings: string[]
}

interface DecodedScreenerConfig {
  executiveAddress: string
  screenerAddress: string
  configData: string
  isValidFormat: boolean
  decodingErrors: string[]
}

// Mock screener registry for debugging (would normally come from constants)
const SCREENER_REGISTRY = {
  // Address List Screener
  '0x31c7ab87662132f5901f190032d49e0abe9fabec': {
    name: 'Address List Screener',
    type: 'AddressList',
    configParams: ['returnValueWhenInList']
  },
  // Community Gate Screener  
  '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1': {
    name: 'Community Gate',
    type: 'CommunityGate',
    configParams: ['curatedListAddress', 'returnValueWhenCurated']
  }
}

/**
 * Create debug-enabled ERC725 instance
 */
export const createDebugERC725Instance = (upAddress: string): ERC725 => {
  return new ERC725(uapSchema as any, upAddress, undefined)
}

/**
 * Validate and inspect screener configuration payload
 */
export const inspectScreenerPayload = (
  executiveAddress: string,
  typeId: string,
  executionOrder: number,
  selectedScreeners: string[],
  screenerConfigs: { [instanceId: string]: any },
  useANDLogic: boolean,
  currentNetworkId: number,
  supportedNetworks: any
): PayloadDebugInfo => {
  
  const debugInfo: PayloadDebugInfo = {
    description: `Screener payload for executive ${executiveAddress} on type ${typeId} with execution order ${executionOrder}`,
    keys: [],
    values: [],
    keyValuePairs: {},
    screenerDetails: [],
    useANDLogic,
    warnings: []
  }

  // Create mock ERC725 instance for key generation
  const mockERC725 = createDebugERC725Instance(executiveAddress)
  
  try {
    // Validate basic parameters
    if (!executiveAddress || !typeId) {
      debugInfo.warnings.push('Missing required parameters: executiveAddress or typeId')
      return debugInfo
    }

    if (selectedScreeners.length === 0) {
      debugInfo.warnings.push('No screeners selected')
      return debugInfo
    }

    // Process each screener instance
    const screenerAddresses: string[] = []
    const screenerConfigData: string[] = []
    const addressListNames: string[] = []

    for (const instanceId of selectedScreeners) {
      const screenerAddress = instanceId.split('_')[0]
      const screener = supportedNetworks[currentNetworkId]?.screeners[screenerAddress.toLowerCase()]
      const config = screenerConfigs[instanceId]

      const screenerDebugInfo: ScreenerConfigDebugInfo = {
        instanceId,
        screenerAddress,
        screenerType: screener?.name || 'Unknown',
        configData: config,
        encodedConfig: '0x',
        isValid: true,
        validationErrors: []
      }

      if (!screener) {
        screenerDebugInfo.isValid = false
        screenerDebugInfo.validationErrors.push(`Screener not found in registry for address ${screenerAddress}`)
        debugInfo.warnings.push(`Unknown screener: ${screenerAddress}`)
      }

      if (!config) {
        screenerDebugInfo.isValid = false
        screenerDebugInfo.validationErrors.push('Missing configuration')
        debugInfo.warnings.push(`Missing config for instance ${instanceId}`)
      }

      if (screener && config) {
        // Validate and encode based on screener type
        if (screener.name === 'Address List Screener') {
          if (!config.addresses || config.addresses.length === 0) {
            screenerDebugInfo.isValid = false
            screenerDebugInfo.validationErrors.push('Address List Screener requires at least one address')
          } else {
            // Encode configuration
            const abiCoder = new AbiCoder()
            const encodedConfig = abiCoder.encode(['bool'], [config.returnValueWhenInList])
            screenerDebugInfo.encodedConfig = encodedConfig

            // Manual byte packing
            const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
            const screenerBytes = screenerAddress.toLowerCase().replace('0x', '')
            const configBytes = encodedConfig.replace('0x', '')
            screenerDebugInfo.manualBytePackedValue = '0x' + executiveBytes + screenerBytes + configBytes

            screenerAddresses.push(screenerAddress)
            screenerConfigData.push(encodedConfig)
            screenerDebugInfo.addressListName = 'UAPAddressList'
            addressListNames.push('UAPAddressList')
          }
        } else if (screener.name === 'Community Gate') {
          if (!config.curatedListAddress) {
            screenerDebugInfo.isValid = false
            screenerDebugInfo.validationErrors.push('Community Gate requires curated list address')
          } else {
            // Encode configuration
            const abiCoder = new AbiCoder()
            const encodedConfig = abiCoder.encode(
              ['address', 'bool'],
              [config.curatedListAddress, config.returnValueWhenCurated]
            )
            screenerDebugInfo.encodedConfig = encodedConfig

            // Manual byte packing
            const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
            const screenerBytes = screenerAddress.toLowerCase().replace('0x', '')
            const configBytes = encodedConfig.replace('0x', '')
            screenerDebugInfo.manualBytePackedValue = '0x' + executiveBytes + screenerBytes + configBytes

            screenerAddresses.push(screenerAddress)
            screenerConfigData.push(encodedConfig)
            screenerDebugInfo.addressListName = config.useBlocklist ? 'UAPBlockList' : ''
            addressListNames.push(config.useBlocklist ? 'UAPBlockList' : '')
          }
        }
      }

      debugInfo.screenerDetails.push(screenerDebugInfo)
    }

    // Generate keys and values
    if (screenerAddresses.length > 0) {
      // 1. Executive screeners key
      const screenersKey = `UAPExecutiveScreeners:${typeId}:${executionOrder}`
      const encodedScreeners = 'ENCODED_ADDRESS_ARRAY' // Placeholder
      debugInfo.keys.push(screenersKey)
      debugInfo.values.push(encodedScreeners)
      debugInfo.keyValuePairs[screenersKey] = encodedScreeners

      // 2. AND/OR logic key
      const logicKey = `UAPExecutiveScreenersANDLogic:${typeId}:${executionOrder}`
      const encodedLogic = useANDLogic ? '0x01' : '0x00'
      debugInfo.keys.push(logicKey)
      debugInfo.values.push(encodedLogic)
      debugInfo.keyValuePairs[logicKey] = encodedLogic

      // 3. Individual screener config keys
      for (let i = 0; i < screenerAddresses.length; i++) {
        const screenerOrder = executionOrder * 1000 + i
        const configKey = `UAPScreenerConfig:${typeId}:${screenerOrder}`
        const configValue = debugInfo.screenerDetails[i].manualBytePackedValue || '0x'
        
        debugInfo.keys.push(configKey)
        debugInfo.values.push(configValue)
        debugInfo.keyValuePairs[configKey] = configValue

        // 4. Address list name keys (if applicable)
        if (addressListNames[i]) {
          const listNameKey = `UAPAddressListName:${typeId}:${screenerOrder}`
          const listNameValue = `ENCODED_STRING:${addressListNames[i]}`
          debugInfo.keys.push(listNameKey)
          debugInfo.values.push(listNameValue)
          debugInfo.keyValuePairs[listNameKey] = listNameValue
        }
      }
    }

    // Estimate gas cost (rough approximation)
    debugInfo.totalGasEstimate = debugInfo.keys.length * 20000 // ~20k gas per SSTORE

  } catch (error) {
    debugInfo.warnings.push(`Error during payload inspection: ${error}`)
  }

  return debugInfo
}

/**
 * Decode screener configuration from raw blockchain data
 */
export const decodeScreenerConfig = (configValue: string): DecodedScreenerConfig => {
  const result: DecodedScreenerConfig = {
    executiveAddress: '',
    screenerAddress: '',
    configData: '',
    isValidFormat: false,
    decodingErrors: []
  }

  try {
    if (!configValue || configValue === '0x') {
      result.decodingErrors.push('Empty or null config value')
      return result
    }

    if (configValue.length < 82) { // 2 + 40 + 40 minimum
      result.decodingErrors.push(`Config value too short: ${configValue.length} chars, minimum 82 required`)
      return result
    }

    // Manual byte unpacking
    result.executiveAddress = '0x' + configValue.slice(2, 42)
    result.screenerAddress = '0x' + configValue.slice(42, 82)
    result.configData = '0x' + configValue.slice(82)
    result.isValidFormat = true

    // Validate addresses
    if (!/^0x[0-9a-fA-F]{40}$/.test(result.executiveAddress)) {
      result.decodingErrors.push(`Invalid executive address format: ${result.executiveAddress}`)
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(result.screenerAddress)) {
      result.decodingErrors.push(`Invalid screener address format: ${result.screenerAddress}`)
    }

  } catch (error) {
    result.decodingErrors.push(`Decoding error: ${error}`)
  }

  return result
}

/**
 * Compare saved payload with expected contract format
 */
export const validatePayloadConsistency = (
  generatedPayload: PayloadDebugInfo,
  contractData?: { [key: string]: string }
): { isConsistent: boolean; discrepancies: string[] } => {
  const discrepancies: string[] = []

  // Validate key-value pair structure
  if (generatedPayload.keys.length !== generatedPayload.values.length) {
    discrepancies.push(`Key-value mismatch: ${generatedPayload.keys.length} keys, ${generatedPayload.values.length} values`)
  }

  // Validate screener configuration completeness
  for (const screenerDetail of generatedPayload.screenerDetails) {
    if (!screenerDetail.isValid) {
      discrepancies.push(`Invalid screener config for ${screenerDetail.instanceId}: ${screenerDetail.validationErrors.join(', ')}`)
    }

    if (screenerDetail.manualBytePackedValue) {
      // Validate byte packing format
      const expected = screenerDetail.manualBytePackedValue
      if (!expected.startsWith('0x') || expected.length < 82) {
        discrepancies.push(`Invalid byte-packed format for ${screenerDetail.instanceId}`)
      }
    }
  }

  // Compare with contract data if provided
  if (contractData) {
    for (const key of generatedPayload.keys) {
      if (contractData[key] !== undefined) {
        const expectedValue = contractData[key]
        const generatedValue = generatedPayload.keyValuePairs[key]
        if (expectedValue !== generatedValue) {
          discrepancies.push(`Value mismatch for key ${key}: expected ${expectedValue}, got ${generatedValue}`)
        }
      }
    }
  }

  return {
    isConsistent: discrepancies.length === 0,
    discrepancies
  }
}

/**
 * Pretty print debug information for console output
 */
export const formatDebugOutput = (debugInfo: PayloadDebugInfo): string => {
  const lines: string[] = []
  
  lines.push('🛡️  SCREENER CONFIGURATION DEBUG INFO')
  lines.push('=' .repeat(50))
  lines.push(`Description: ${debugInfo.description}`)
  lines.push(`Logic Type: ${debugInfo.useANDLogic ? 'AND (all must pass)' : 'OR (any can pass)'}`)
  lines.push(`Total Keys: ${debugInfo.keys.length}`)
  lines.push(`Estimated Gas: ${debugInfo.totalGasEstimate || 'N/A'}`)
  lines.push('')

  if (debugInfo.warnings.length > 0) {
    lines.push('⚠️  WARNINGS:')
    debugInfo.warnings.forEach(warning => lines.push(`  - ${warning}`))
    lines.push('')
  }

  lines.push('📋 SCREENER DETAILS:')
  debugInfo.screenerDetails.forEach((detail, index) => {
    lines.push(`  ${index + 1}. ${detail.screenerType} (${detail.isValid ? '✅ Valid' : '❌ Invalid'})`)
    lines.push(`     Instance: ${detail.instanceId}`)
    lines.push(`     Address: ${detail.screenerAddress}`)
    if (detail.validationErrors.length > 0) {
      lines.push(`     Errors: ${detail.validationErrors.join(', ')}`)
    }
    if (detail.encodedConfig && detail.encodedConfig !== '0x') {
      lines.push(`     Encoded: ${detail.encodedConfig}`)
    }
    if (detail.manualBytePackedValue) {
      lines.push(`     Packed: ${detail.manualBytePackedValue.slice(0, 50)}...`)
    }
    lines.push('')
  })

  lines.push('🔑 KEY-VALUE PAIRS:')
  Object.entries(debugInfo.keyValuePairs).forEach(([key, value]) => {
    lines.push(`  ${key}`)
    lines.push(`    → ${value.slice(0, 50)}${value.length > 50 ? '...' : ''}`)
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Test screener configuration against known good patterns
 */
export const runScreenerConfigTests = (debugInfo: PayloadDebugInfo): { passed: number; failed: number; results: string[] } => {
  const results: string[] = []
  let passed = 0
  let failed = 0

  // Test 1: Basic validation
  if (debugInfo.screenerDetails.every(detail => detail.isValid)) {
    results.push('✅ All screener configurations are valid')
    passed++
  } else {
    results.push('❌ Some screener configurations are invalid')
    failed++
  }

  // Test 2: Key-value consistency
  if (debugInfo.keys.length === debugInfo.values.length && debugInfo.keys.length > 0) {
    results.push('✅ Key-value pairs are consistent')
    passed++
  } else {
    results.push('❌ Key-value pairs are inconsistent')
    failed++
  }

  // Test 3: Manual byte packing format
  const bytePackedConfigs = debugInfo.screenerDetails.filter(detail => detail.manualBytePackedValue)
  if (bytePackedConfigs.every(detail => detail.manualBytePackedValue!.length >= 82)) {
    results.push('✅ Manual byte packing format is correct')
    passed++
  } else {
    results.push('❌ Manual byte packing format is incorrect')
    failed++
  }

  // Test 4: AND/OR logic encoding
  const logicValue = debugInfo.keyValuePairs[Object.keys(debugInfo.keyValuePairs).find(key => key.includes('ANDLogic')) || '']
  if (logicValue === '0x01' || logicValue === '0x00') {
    results.push('✅ AND/OR logic encoding is correct')
    passed++
  } else {
    results.push('❌ AND/OR logic encoding is incorrect')
    failed++
  }

  return { passed, failed, results }
}

// Export types for use in tests
export type {
  ScreenerConfigDebugInfo,
  PayloadDebugInfo,
  DecodedScreenerConfig
}