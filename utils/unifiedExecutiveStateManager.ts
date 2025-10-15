import { ERC725 } from '@erc725/erc725.js'
import { encodeTupleKeyValue } from '@erc725/erc725.js/build/main/src/lib/utils'
import {
  generateUAPTypeConfigKey,
  generateUAPExecutiveConfigKey,
  generateUAPExecutiveScreenersKey,
  generateUAPExecutiveScreenersANDLogicKey,
  generateUAPScreenerConfigKey,
  generateUAPAddressListNameKey,
  calculateScreenerOrder,
  encodeBoolValue,
  fetchScreenerAssistantConfig,
  setAddressList,
  getAddressList
} from './configDataKeyValueStore'

/**
 * Unified Executive State Manager
 * 
 * Handles complex executive assistant reconfigurations (reorders, additions, removals)
 * using a state transition approach that eliminates redundant operations and handles
 * cascading dependencies between executive positions and screener positions optimally.
 */

// Core interfaces for state management
export interface ExecutiveConfig {
  address: string
  configData: string
  screenerAddresses: string[]
  screenerConfigData: string[]
  useANDLogic: boolean
  addressListNames: string[]
  addressListData: { [listName: string]: string[] }  // listName → addresses
}

export interface KeyStateMap {
  typeConfig: Map<string, string[]>              // typeId → executive addresses
  executiveConfigs: Map<string, string>          // key → encoded config data
  screenerRelatedKeys: Map<string, string>       // key → value (screeners, logic, configs, names)
  addressLists: Map<string, string[]>            // listName → addresses
}

export interface StateTransition {
  keys: string[]
  values: string[]
  operationCount: number
  keyCategories: {
    typeConfig: number
    executiveConfigs: number  
    screenerRelatedKeys: number
    addressLists: number
  }
}

export class UnifiedExecutiveStateManager {
  private erc725UAP: ERC725
  private upContract: any
  private typeId: string

  constructor(erc725UAP: ERC725, upContract: any, typeId: string) {
    this.erc725UAP = erc725UAP
    this.upContract = upContract
    this.typeId = typeId
  }

  /**
   * Analyzes current blockchain state for all keys related to executives and screeners
   * for the given transaction type.
   */
  async analyzeCurrentState(existingExecutives: string[]): Promise<KeyStateMap> {
    const state: KeyStateMap = {
      typeConfig: new Map(),
      executiveConfigs: new Map(),
      screenerRelatedKeys: new Map(),
      addressLists: new Map()
    }

    try {
      // Analyze type configuration
      const typeConfigKey = generateUAPTypeConfigKey(this.erc725UAP, this.typeId)
      state.typeConfig.set(this.typeId, existingExecutives)

      // Analyze each existing executive's configuration
      for (let execOrder = 0; execOrder < existingExecutives.length; execOrder++) {
        const executiveAddress = existingExecutives[execOrder]
        
        await this.analyzeExecutiveState(executiveAddress, execOrder, state)
      }

      return state
    } catch (error) {
      console.error('Error analyzing current state:', error)
      throw error
    }
  }

  /**
   * Analyzes state for a single executive at a given execution order.
   */
  private async analyzeExecutiveState(
    executiveAddress: string, 
    execOrder: number, 
    state: KeyStateMap
  ): Promise<void> {
    // Executive configuration key
    const execConfigKey = generateUAPExecutiveConfigKey(this.erc725UAP, this.typeId, execOrder)
    try {
      const execConfigValue = await this.upContract.getData(execConfigKey)
      if (execConfigValue && execConfigValue !== '0x') {
        state.executiveConfigs.set(execConfigKey, execConfigValue)
      }
    } catch (error) {
      console.warn(`Could not fetch executive config for ${executiveAddress} at order ${execOrder}`)
    }

    // Screener-related keys
    try {
      const screenerConfig = await fetchScreenerAssistantConfig(
        this.erc725UAP,
        this.upContract,
        executiveAddress,
        this.typeId,
        execOrder
      )

      if (screenerConfig.screenerAddresses.length > 0) {
        // Executive screeners key
        const screenersKey = generateUAPExecutiveScreenersKey(this.erc725UAP, this.typeId, execOrder)
        const encodedScreeners = this.erc725UAP.encodeValueType('address[]', screenerConfig.screenerAddresses)
        state.screenerRelatedKeys.set(screenersKey, encodedScreeners)

        // Executive screeners AND logic key
        const logicKey = generateUAPExecutiveScreenersANDLogicKey(this.erc725UAP, this.typeId, execOrder)
        const encodedLogic = encodeBoolValue(screenerConfig.useANDLogic)
        state.screenerRelatedKeys.set(logicKey, encodedLogic)

        // Individual screener configuration keys
        for (let i = 0; i < screenerConfig.screenerAddresses.length; i++) {
          const screenerOrder = calculateScreenerOrder(execOrder, i)
          
          // Screener config key
          const screenerConfigKey = generateUAPScreenerConfigKey(this.erc725UAP, this.typeId, screenerOrder)
          const screenerConfigValue = screenerConfig.screenerConfigData[i] || '0x'
          if (screenerConfigValue !== '0x') {
            // Manual byte packing: executive address + screener address + config data
            const executiveBytes = executiveAddress.toLowerCase().replace('0x', '')
            const screenerBytes = screenerConfig.screenerAddresses[i].toLowerCase().replace('0x', '')
            const configBytes = screenerConfigValue.replace('0x', '')
            const packedValue = '0x' + executiveBytes + screenerBytes + configBytes
            state.screenerRelatedKeys.set(screenerConfigKey, packedValue)
          }

          // Address list name key (if provided)
          if (screenerConfig.addressListNames[i]) {
            const listNameKey = generateUAPAddressListNameKey(this.erc725UAP, this.typeId, screenerOrder)
            const encodedName = this.erc725UAP.encodeValueType('string', screenerConfig.addressListNames[i])
            state.screenerRelatedKeys.set(listNameKey, encodedName)
            
            // Also analyze the actual address list
            const listName = screenerConfig.addressListNames[i]
            if (listName && typeof listName === 'string' && listName.trim() !== '') {
              try {
                const addresses = await getAddressList(this.erc725UAP, this.upContract, listName)
                state.addressLists.set(listName, addresses || [])
              } catch (addressListError) {
                console.warn(`Could not fetch address list ${listName}:`, addressListError)
                state.addressLists.set(listName, [])
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Could not fetch screener config for ${executiveAddress} at order ${execOrder}:`, error)
    }
  }

  /**
   * Calculates the target state based on the desired executive configuration.
   */
  async calculateTargetState(targetExecutives: ExecutiveConfig[]): Promise<KeyStateMap> {
    const targetState: KeyStateMap = {
      typeConfig: new Map(),
      executiveConfigs: new Map(),
      screenerRelatedKeys: new Map(),
      addressLists: new Map()
    }

    // Target type configuration
    const targetAddresses = targetExecutives.map(exec => exec.address)
    targetState.typeConfig.set(this.typeId, targetAddresses)

    // Target executive and screener configurations
    for (let execOrder = 0; execOrder < targetExecutives.length; execOrder++) {
      const executive = targetExecutives[execOrder]
      
      // Executive configuration
      const execConfigKey = generateUAPExecutiveConfigKey(this.erc725UAP, this.typeId, execOrder)
      const execData = encodeTupleKeyValue(
        '(Address,Bytes)',
        '(address,bytes)',
        [executive.address, executive.configData]
      )
      targetState.executiveConfigs.set(execConfigKey, execData)

      // Screener configurations (if any)
      if (executive.screenerAddresses.length > 0) {
        // Executive screeners key
        const screenersKey = generateUAPExecutiveScreenersKey(this.erc725UAP, this.typeId, execOrder)
        const encodedScreeners = this.erc725UAP.encodeValueType('address[]', executive.screenerAddresses)
        targetState.screenerRelatedKeys.set(screenersKey, encodedScreeners)

        // Executive screeners AND logic key
        const logicKey = generateUAPExecutiveScreenersANDLogicKey(this.erc725UAP, this.typeId, execOrder)
        const encodedLogic = encodeBoolValue(executive.useANDLogic)
        targetState.screenerRelatedKeys.set(logicKey, encodedLogic)

        // Individual screener configuration keys
        for (let i = 0; i < executive.screenerAddresses.length; i++) {
          const screenerOrder = calculateScreenerOrder(execOrder, i)
          
          // Screener config key
          const screenerConfigKey = generateUAPScreenerConfigKey(this.erc725UAP, this.typeId, screenerOrder)
          const executiveBytes = executive.address.toLowerCase().replace('0x', '')
          const screenerBytes = executive.screenerAddresses[i].toLowerCase().replace('0x', '')
          const configBytes = executive.screenerConfigData[i].replace('0x', '')
          const packedValue = '0x' + executiveBytes + screenerBytes + configBytes
          targetState.screenerRelatedKeys.set(screenerConfigKey, packedValue)

          // Address list name key (if provided)
          if (executive.addressListNames[i]) {
            const listNameKey = generateUAPAddressListNameKey(this.erc725UAP, this.typeId, screenerOrder)
            const encodedName = this.erc725UAP.encodeValueType('string', executive.addressListNames[i])
            targetState.screenerRelatedKeys.set(listNameKey, encodedName)
            
            // Add the address list data to target state
            const listName = executive.addressListNames[i]
            if (listName && executive.addressListData && executive.addressListData[listName]) {
              targetState.addressLists.set(listName, executive.addressListData[listName])
            }
          }
        }
      }
    }

    return targetState
  }

  /**
   * Calculates the optimal transition from current state to target state,
   * eliminating redundant operations and handling dependencies correctly.
   */
  async calculateOptimalTransition(
    currentState: KeyStateMap, 
    targetState: KeyStateMap
  ): Promise<StateTransition> {
    const keys: string[] = []
    const values: string[] = []
    const categories = {
      typeConfig: 0,
      executiveConfigs: 0,
      screenerRelatedKeys: 0,
      addressLists: 0
    }

    // Step 1: Handle type configuration changes
    this.processTypeConfigChanges(currentState, targetState, keys, values, categories)

    // Step 2: Handle executive configuration changes
    this.processExecutiveConfigChanges(currentState, targetState, keys, values, categories)

    // Step 3: Handle screener-related key changes
    this.processScreenerRelatedChanges(currentState, targetState, keys, values, categories)

    // Step 4: Handle address list changes
    await this.processAddressListChanges(currentState, targetState, keys, values, categories)

    return {
      keys,
      values,
      operationCount: keys.length,
      keyCategories: categories
    }
  }

  /**
   * Processes changes to type configuration keys.
   */
  private processTypeConfigChanges(
    currentState: KeyStateMap,
    targetState: KeyStateMap,
    keys: string[],
    values: string[],
    categories: { typeConfig: number; executiveConfigs: number; screenerRelatedKeys: number; addressLists: number }
  ): void {
    // Type configuration always needs updating in reorder scenarios
    const typeConfigKey = generateUAPTypeConfigKey(this.erc725UAP, this.typeId)
    const targetAddresses = targetState.typeConfig.get(this.typeId) || []
    const encodedAddresses = this.erc725UAP.encodeValueType('address[]', targetAddresses)
    
    keys.push(typeConfigKey)
    values.push(encodedAddresses)
    categories.typeConfig++
  }

  /**
   * Processes changes to executive configuration keys.
   */
  private processExecutiveConfigChanges(
    currentState: KeyStateMap,
    targetState: KeyStateMap,
    keys: string[],
    values: string[],
    categories: { typeConfig: number; executiveConfigs: number; screenerRelatedKeys: number; addressLists: number }
  ): void {
    // Collect all executive config keys that exist in either current or target state
    const allExecutiveKeys = new Set<string>()
    
    Array.from(currentState.executiveConfigs.keys()).forEach(key => {
      allExecutiveKeys.add(key)
    })
    Array.from(targetState.executiveConfigs.keys()).forEach(key => {
      allExecutiveKeys.add(key)
    })

    // Process each key to determine if it needs updating or clearing
    Array.from(allExecutiveKeys).forEach(key => {
      const currentValue = currentState.executiveConfigs.get(key)
      const targetValue = targetState.executiveConfigs.get(key)

      if (!targetValue) {
        // Key should be cleared (executive position no longer exists)
        keys.push(key)
        values.push('0x')
        categories.executiveConfigs++
      } else if (currentValue !== targetValue) {
        // Key needs to be updated (different value or new key)
        keys.push(key)
        values.push(targetValue)
        categories.executiveConfigs++
      }
      // If currentValue === targetValue, no operation needed
    })
  }

  /**
   * Processes changes to screener-related keys (screeners, logic, configs, names).
   */
  private processScreenerRelatedChanges(
    currentState: KeyStateMap,
    targetState: KeyStateMap,
    keys: string[],
    values: string[],
    categories: { typeConfig: number; executiveConfigs: number; screenerRelatedKeys: number; addressLists: number }
  ): void {
    // Collect all screener-related keys that exist in either current or target state
    const allScreenerKeys = new Set<string>()
    
    Array.from(currentState.screenerRelatedKeys.keys()).forEach(key => {
      allScreenerKeys.add(key)
    })
    Array.from(targetState.screenerRelatedKeys.keys()).forEach(key => {
      allScreenerKeys.add(key)
    })

    // Process each key to determine if it needs updating or clearing
    Array.from(allScreenerKeys).forEach(key => {
      const currentValue = currentState.screenerRelatedKeys.get(key)
      const targetValue = targetState.screenerRelatedKeys.get(key)

      if (!targetValue) {
        // Key should be cleared (screener position no longer exists)
        keys.push(key)
        values.push('0x')
        categories.screenerRelatedKeys++
      } else if (currentValue !== targetValue) {
        // Key needs to be updated (different value or new key)
        keys.push(key)
        values.push(targetValue)
        categories.screenerRelatedKeys++
      }
      // If currentValue === targetValue, no operation needed
    })
  }

  /**
   * Processes changes to address lists.
   */
  private async processAddressListChanges(
    currentState: KeyStateMap,
    targetState: KeyStateMap,
    keys: string[],
    values: string[],
    categories: { typeConfig: number; executiveConfigs: number; screenerRelatedKeys: number; addressLists: number }
  ): Promise<void> {
    // Collect all address lists that exist in either current or target state
    const allListNames = new Set<string>()
    
    Array.from(currentState.addressLists.keys()).forEach(listName => {
      allListNames.add(listName)
    })
    Array.from(targetState.addressLists.keys()).forEach(listName => {
      allListNames.add(listName)
    })

    // Process each address list to determine if it needs updating
    for (const listName of Array.from(allListNames)) {
      const currentAddresses = currentState.addressLists.get(listName) || []
      const targetAddresses = targetState.addressLists.get(listName) || []

      // Compare address arrays (order matters)
      const addressesEqual = currentAddresses.length === targetAddresses.length &&
        currentAddresses.every((addr, index) => addr.toLowerCase() === targetAddresses[index]?.toLowerCase())

      if (!addressesEqual) {
        // Address list needs to be updated
        const addressListResult = await setAddressList(this.erc725UAP, listName, targetAddresses)
        keys.push(...addressListResult.keys)
        values.push(...addressListResult.values)
        categories.addressLists += addressListResult.keys.length
      }
    }
  }

  /**
   * Main entry point: performs optimal executive reconfiguration.
   * Handles any combination of reorders, additions, and removals.
   */
  async performOptimalReconfiguration(
    currentExecutives: string[],
    targetExecutives: ExecutiveConfig[]
  ): Promise<StateTransition> {
    // Step 1: Analyze current state
    const currentState = await this.analyzeCurrentState(currentExecutives)
    
    // Step 2: Calculate target state
    const targetState = await this.calculateTargetState(targetExecutives)
    
    // Step 3: Calculate optimal transition
    const transition = await this.calculateOptimalTransition(currentState, targetState)
    
    return transition
  }
}