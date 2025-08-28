import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Unit tests for status badge logic and terminology changes:
 * 1. New status terminology (Unsaved Changes, Deactivated, etc.)
 * 2. Status badge color schemes
 * 3. Status transitions based on state changes
 * 4. Individual screener status logic
 * 5. Complex status scenarios with mixed states
 */

interface StatusBadge {
  text: string
  colorScheme: string
}

interface AssistantState {
  isUPSubscribedToAssistant: boolean
  executionOrders: { [typeId: string]: number }
  selectedConfigTypes: string[]
  fieldValues: Record<string, string>
  originalFieldValues: Record<string, string>
  screenerStateByType: { [typeId: string]: any }
  originalScreenerStateByType: { [typeId: string]: any }
}

interface ScreenerStatusContext {
  isLoadedFromBlockchain: boolean
  config: any
  originalConfig?: any
  screenerType: 'Address List Screener' | 'Community Gate' | 'Other'
}

class StatusBadgeManager {
  private state: AssistantState = {
    isUPSubscribedToAssistant: false,
    executionOrders: {},
    selectedConfigTypes: [],
    fieldValues: {},
    originalFieldValues: {},
    screenerStateByType: {},
    originalScreenerStateByType: {}
  }

  updateState(updates: Partial<AssistantState>): void {
    this.state = { ...this.state, ...updates }
  }

  setState(newState: AssistantState): void {
    this.state = { ...newState }
  }

  getState(): AssistantState {
    return { ...this.state }
  }

  // Field value change detection
  hasFieldChanges(): boolean {
    const fieldNames = [...new Set([
      ...Object.keys(this.state.fieldValues),
      ...Object.keys(this.state.originalFieldValues)
    ])]

    return fieldNames.some(name => {
      const currentValue = this.state.fieldValues[name] || ''
      const originalValue = this.state.originalFieldValues[name] || ''
      return currentValue !== originalValue
    })
  }

  // Transaction type change detection
  hasTypeChanges(): boolean {
    const currentlySavedTypes = Object.keys(this.state.executionOrders)
    return this.state.selectedConfigTypes.length !== currentlySavedTypes.length ||
           this.state.selectedConfigTypes.some(type => !currentlySavedTypes.includes(type)) ||
           currentlySavedTypes.some(type => !this.state.selectedConfigTypes.includes(type))
  }

  // Screener change detection
  hasScreenerChanges(): boolean {
    for (const typeId of this.state.selectedConfigTypes) {
      const currentTypeState = this.state.screenerStateByType[typeId]
      const originalTypeState = this.state.originalScreenerStateByType[typeId]
      
      if (!currentTypeState) continue
      
      // If no original state, check if current state has configured screeners
      if (!originalTypeState) {
        if (currentTypeState.enableScreeners && currentTypeState.selectedScreeners?.length > 0) {
          const hasConfiguredScreeners = currentTypeState.selectedScreeners.some((instanceId: string) => {
            const config = currentTypeState.screenerConfigs?.[instanceId]
            if (!config) return false
            return (config.addresses && config.addresses.length > 0) ||
                   (config.curatedListAddress && config.curatedListAddress.trim() !== '')
          })
          if (hasConfiguredScreeners) return true
        }
        continue
      }

      // Compare states
      if (currentTypeState.enableScreeners !== originalTypeState.enableScreeners) return true
      if (currentTypeState.useANDLogic !== originalTypeState.useANDLogic) return true
      if (currentTypeState.selectedScreeners?.length !== originalTypeState.selectedScreeners?.length) return true
      
      // Check individual screener configurations
      if (currentTypeState.selectedScreeners) {
        for (const instanceId of currentTypeState.selectedScreeners) {
          const currentConfig = currentTypeState.screenerConfigs?.[instanceId]
          const originalConfig = originalTypeState.screenerConfigs?.[instanceId]
          
          if (!originalConfig && currentConfig) {
            // New screener - check if configured
            if ((currentConfig.addresses && currentConfig.addresses.length > 0) ||
                (currentConfig.curatedListAddress && currentConfig.curatedListAddress.trim() !== '')) {
              return true
            }
          } else if (originalConfig && currentConfig) {
            // Existing screener - check if modified
            if (JSON.stringify(currentConfig) !== JSON.stringify(originalConfig)) {
              return true
            }
          }
        }
      }
      
      // Check for removed screeners
      if (originalTypeState.selectedScreeners) {
        for (const originalInstanceId of originalTypeState.selectedScreeners) {
          if (!currentTypeState.selectedScreeners?.includes(originalInstanceId)) {
            return true
          }
        }
      }
    }
    
    return false
  }

  // Main change detection
  hasPendingChanges(): boolean {
    if (this.hasFieldChanges()) return true
    if (this.hasTypeChanges() && this.state.selectedConfigTypes.length > 0) return true
    if (this.hasScreenerChanges()) return true
    return false
  }

  // Main assistant status badge logic
  getAssistantStatus(): StatusBadge {
    const hasChanges = this.hasPendingChanges()
    const wasEverSaved = Object.keys(this.state.executionOrders).length > 0
    
    if (this.state.isUPSubscribedToAssistant) {
      // Assistant is currently active
      if (hasChanges) {
        return { text: 'UNSAVED CHANGES', colorScheme: 'orange' }
      } else {
        return { text: 'ASSISTANT IS ACTIVE', colorScheme: 'green' }
      }
    } else {
      // Assistant is not currently active
      if (hasChanges) {
        // Has changes - could be new assistant or modifications to deactivated one
        if (wasEverSaved) {
          return { text: 'UNSAVED CHANGES', colorScheme: 'orange' }
        } else {
          return { text: 'PENDING ACTIVATION', colorScheme: 'orange' }
        }
      } else {
        // No changes
        if (wasEverSaved) {
          return { text: 'DEACTIVATED', colorScheme: 'gray' }
        } else {
          return { text: 'NOT CONFIGURED', colorScheme: 'yellow' }
        }
      }
    }
  }

  // Individual screener status logic
  getScreenerStatus(context: ScreenerStatusContext): StatusBadge {
    const { isLoadedFromBlockchain, config, originalConfig, screenerType } = context
    
    // Check if screener is properly configured
    let isConfigured = false
    
    if (screenerType === 'Address List Screener') {
      isConfigured = config?.addresses && config.addresses.length > 0
    } else if (screenerType === 'Community Gate') {
      isConfigured = config?.curatedListAddress && config.curatedListAddress.trim() !== ''
    }

    if (isLoadedFromBlockchain) {
      // Check if loaded screener has been modified
      if (originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig)) {
        return { text: 'Unsaved Changes', colorScheme: 'orange' }
      }
      return { text: 'Active', colorScheme: 'green' }
    }

    // For newly added screeners
    if (isConfigured) {
      return { text: 'Pending Activation', colorScheme: 'orange' }
    } else {
      return { text: 'Configure Required', colorScheme: 'yellow' }
    }
  }
}

describe('Status Badge Logic', () => {
  let statusManager: StatusBadgeManager

  beforeEach(() => {
    statusManager = new StatusBadgeManager()
  })

  describe('New Status Terminology', () => {
    it('should show "NOT CONFIGURED" for completely new assistant', () => {
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'NOT CONFIGURED', colorScheme: 'yellow' })
    })

    it('should show "PENDING ACTIVATION" for new assistant with changes', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'PENDING ACTIVATION', colorScheme: 'orange' })
    })

    it('should show "ASSISTANT IS ACTIVE" for active assistant without changes', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: true,
        executionOrders: { 'type1': 1 },
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '100' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'ASSISTANT IS ACTIVE', colorScheme: 'green' })
    })

    it('should show "UNSAVED CHANGES" for active assistant with modifications', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: true,
        executionOrders: { 'type1': 1 },
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'UNSAVED CHANGES', colorScheme: 'orange' })
    })

    it('should show "DEACTIVATED" for previously saved but now inactive assistant', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: false,
        executionOrders: { 'type1': 1 }, // Was previously saved
        selectedConfigTypes: [], // Now deactivated
        fieldValues: { tipAmount: '100' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'DEACTIVATED', colorScheme: 'gray' })
    })

    it('should show "UNSAVED CHANGES" for deactivated assistant with new modifications', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: false,
        executionOrders: { 'type1': 1 }, // Was previously saved
        selectedConfigTypes: [], // Now deactivated
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' } // But has field changes
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'UNSAVED CHANGES', colorScheme: 'orange' })
    })
  })

  describe('Field Value Change Detection', () => {
    it('should detect field value changes correctly', () => {
      statusManager.updateState({
        fieldValues: { tipAmount: '200', recipient: '0x123' },
        originalFieldValues: { tipAmount: '100', recipient: '0x123' }
      })
      
      expect(statusManager.hasFieldChanges()).toBe(true)
    })

    it('should not detect changes when values are identical', () => {
      statusManager.updateState({
        fieldValues: { tipAmount: '100', recipient: '0x123' },
        originalFieldValues: { tipAmount: '100', recipient: '0x123' }
      })
      
      expect(statusManager.hasFieldChanges()).toBe(false)
    })

    it('should handle empty and undefined values correctly', () => {
      statusManager.updateState({
        fieldValues: { tipAmount: '100' },
        originalFieldValues: { tipAmount: '100', recipient: '' }
      })
      
      expect(statusManager.hasFieldChanges()).toBe(false)
    })
  })

  describe('Transaction Type Change Detection', () => {
    it('should detect when types are added', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1', 'type2'],
        executionOrders: { 'type1': 1 }
      })
      
      expect(statusManager.hasTypeChanges()).toBe(true)
    })

    it('should detect when types are removed', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        executionOrders: { 'type1': 1, 'type2': 2 }
      })
      
      expect(statusManager.hasTypeChanges()).toBe(true)
    })

    it('should not detect changes when types match', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1', 'type2'],
        executionOrders: { 'type1': 1, 'type2': 2 }
      })
      
      expect(statusManager.hasTypeChanges()).toBe(false)
    })
  })

  describe('Screener Change Detection', () => {
    it('should detect when screeners are enabled with configuration', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        screenerStateByType: {
          'type1': {
            enableScreeners: true,
            selectedScreeners: ['screener1'],
            screenerConfigs: {
              'screener1': { addresses: ['0x123'] }
            }
          }
        },
        originalScreenerStateByType: {}
      })
      
      expect(statusManager.hasScreenerChanges()).toBe(true)
    })

    it('should detect when screener configuration is modified', () => {
      const originalState = {
        enableScreeners: true,
        selectedScreeners: ['screener1'],
        screenerConfigs: {
          'screener1': { addresses: ['0x123'] }
        }
      }
      
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        screenerStateByType: {
          'type1': {
            ...originalState,
            screenerConfigs: {
              'screener1': { addresses: ['0x123', '0x456'] }
            }
          }
        },
        originalScreenerStateByType: {
          'type1': originalState
        }
      })
      
      expect(statusManager.hasScreenerChanges()).toBe(true)
    })

    it('should detect when screeners are disabled', () => {
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        screenerStateByType: {
          'type1': {
            enableScreeners: false,
            selectedScreeners: [],
            screenerConfigs: {}
          }
        },
        originalScreenerStateByType: {
          'type1': {
            enableScreeners: true,
            selectedScreeners: ['screener1'],
            screenerConfigs: {
              'screener1': { addresses: ['0x123'] }
            }
          }
        }
      })
      
      expect(statusManager.hasScreenerChanges()).toBe(true)
    })
  })

  describe('Individual Screener Status Logic', () => {
    it('should show "Configure Required" for unconfigured new screener', () => {
      const context: ScreenerStatusContext = {
        isLoadedFromBlockchain: false,
        config: {},
        screenerType: 'Address List Screener'
      }
      
      const status = statusManager.getScreenerStatus(context)
      expect(status).toEqual({ text: 'Configure Required', colorScheme: 'yellow' })
    })

    it('should show "Pending Activation" for configured new screener', () => {
      const context: ScreenerStatusContext = {
        isLoadedFromBlockchain: false,
        config: { addresses: ['0x123'] },
        screenerType: 'Address List Screener'
      }
      
      const status = statusManager.getScreenerStatus(context)
      expect(status).toEqual({ text: 'Pending Activation', colorScheme: 'orange' })
    })

    it('should show "Active" for loaded screener with no changes', () => {
      const config = { addresses: ['0x123'] }
      const context: ScreenerStatusContext = {
        isLoadedFromBlockchain: true,
        config,
        originalConfig: config,
        screenerType: 'Address List Screener'
      }
      
      const status = statusManager.getScreenerStatus(context)
      expect(status).toEqual({ text: 'Active', colorScheme: 'green' })
    })

    it('should show "Unsaved Changes" for loaded screener with modifications', () => {
      const context: ScreenerStatusContext = {
        isLoadedFromBlockchain: true,
        config: { addresses: ['0x123', '0x456'] },
        originalConfig: { addresses: ['0x123'] },
        screenerType: 'Address List Screener'
      }
      
      const status = statusManager.getScreenerStatus(context)
      expect(status).toEqual({ text: 'Unsaved Changes', colorScheme: 'orange' })
    })

    it('should handle Community Gate screener configuration', () => {
      const context: ScreenerStatusContext = {
        isLoadedFromBlockchain: false,
        config: { curatedListAddress: '0x123' },
        screenerType: 'Community Gate'
      }
      
      const status = statusManager.getScreenerStatus(context)
      expect(status).toEqual({ text: 'Pending Activation', colorScheme: 'orange' })
    })
  })

  describe('Complex Status Scenarios', () => {
    it('should prioritize field changes over other changes', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: true,
        executionOrders: { 'type1': 1 },
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' },
        screenerStateByType: {
          'type1': { enableScreeners: false }
        },
        originalScreenerStateByType: {
          'type1': { enableScreeners: false }
        }
      })
      
      expect(statusManager.hasPendingChanges()).toBe(true)
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'UNSAVED CHANGES', colorScheme: 'orange' })
    })

    it('should handle mixed field and screener changes', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: true,
        executionOrders: { 'type1': 1 },
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' },
        screenerStateByType: {
          'type1': {
            enableScreeners: true,
            selectedScreeners: ['screener1'],
            screenerConfigs: { 'screener1': { addresses: ['0x123'] } }
          }
        },
        originalScreenerStateByType: {
          'type1': { enableScreeners: false }
        }
      })
      
      expect(statusManager.hasFieldChanges()).toBe(true)
      expect(statusManager.hasScreenerChanges()).toBe(true)
      expect(statusManager.hasPendingChanges()).toBe(true)
    })

    it('should handle assistant reactivation with changes', () => {
      statusManager.updateState({
        isUPSubscribedToAssistant: false,
        executionOrders: { 'type1': 1 }, // Was previously saved
        selectedConfigTypes: ['type1'], // Now reactivated
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      const status = statusManager.getAssistantStatus()
      expect(status).toEqual({ text: 'UNSAVED CHANGES', colorScheme: 'orange' })
    })

    it('should handle complete assistant lifecycle', () => {
      // 1. New assistant
      let status = statusManager.getAssistantStatus()
      expect(status.text).toBe('NOT CONFIGURED')
      
      // 2. User makes changes
      statusManager.updateState({
        selectedConfigTypes: ['type1'],
        fieldValues: { tipAmount: '200' },
        originalFieldValues: { tipAmount: '100' }
      })
      
      status = statusManager.getAssistantStatus()
      expect(status.text).toBe('PENDING ACTIVATION')
      
      // 3. Assistant is saved and activated
      statusManager.updateState({
        isUPSubscribedToAssistant: true,
        executionOrders: { 'type1': 1 },
        originalFieldValues: { tipAmount: '200' } // Sync after save
      })
      
      status = statusManager.getAssistantStatus()
      expect(status.text).toBe('ASSISTANT IS ACTIVE')
      
      // 4. User makes new changes
      statusManager.updateState({
        fieldValues: { tipAmount: '300' }
      })
      
      status = statusManager.getAssistantStatus()
      expect(status.text).toBe('UNSAVED CHANGES')
      
      // 5. Assistant is deactivated
      statusManager.updateState({
        isUPSubscribedToAssistant: false,
        selectedConfigTypes: []
      })
      
      status = statusManager.getAssistantStatus()
      expect(status.text).toBe('UNSAVED CHANGES') // Still has field changes
      
      // 6. Changes are saved (deactivation)
      statusManager.updateState({
        originalFieldValues: { tipAmount: '300' }
      })
      
      status = statusManager.getAssistantStatus()
      expect(status.text).toBe('DEACTIVATED')
    })
  })
})