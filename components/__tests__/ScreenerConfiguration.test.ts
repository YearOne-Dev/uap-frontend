import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Unit tests for screener configuration business logic focusing on:
 * 1. Screener instance ID generation and management
 * 2. Screener configuration validation
 * 3. Address list screener specific logic
 * 4. Community gate screener specific logic
 * 5. Screener removal and cleanup logic
 * 6. Type-specific screener state isolation
 */

interface ScreenerConfig {
  // Address List Screener
  addresses?: string[]
  returnValueWhenInList?: boolean
  
  // Curated List Screener  
  curatedListAddress?: string
  returnValueWhenCurated?: boolean
  useBlocklist?: boolean
  blocklistAddresses?: string[]
}

interface ScreenerAssistant {
  name: string
  address: string
  description: string
  configParams: { name: string; type: string; defaultValue?: any }[]
}

class ScreenerConfigurationManager {
  private selectedScreeners: string[] = []
  private screenerConfigs: { [instanceId: string]: ScreenerConfig } = {}
  private useANDLogic: boolean = true
  private enableScreeners: boolean = false

  // Instance ID management
  generateInstanceId(screenerAddress: string, timestamp?: number): string {
    const ts = timestamp || Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${screenerAddress}_${ts}_${random}`
  }

  generateLoadedInstanceId(screenerAddress: string, typeId: string, index: number, timestamp?: number): string {
    const ts = timestamp || Date.now()
    return `${screenerAddress}_loaded_${typeId}_${index}_${ts}`
  }

  extractScreenerAddress(instanceId: string): string {
    return instanceId.split('_')[0]
  }

  isLoadedFromBlockchain(instanceId: string): boolean {
    return instanceId.includes('_loaded_')
  }

  // Screener management
  addScreener(screenerAddress: string, screener: ScreenerAssistant): string {
    const instanceId = this.generateInstanceId(screenerAddress)
    this.selectedScreeners.push(instanceId)
    
    // Initialize default config
    const defaultConfig: ScreenerConfig = {}
    screener.configParams.forEach(param => {
      if (param.defaultValue !== undefined) {
        ;(defaultConfig as any)[param.name] = param.defaultValue === 'true' ? true : 
                                               param.defaultValue === 'false' ? false : 
                                               param.defaultValue
      }
    })
    
    this.screenerConfigs[instanceId] = defaultConfig
    return instanceId
  }

  removeScreener(instanceId: string): void {
    this.selectedScreeners = this.selectedScreeners.filter(id => id !== instanceId)
    delete this.screenerConfigs[instanceId]
  }

  updateScreenerConfig(instanceId: string, config: Partial<ScreenerConfig>): void {
    this.screenerConfigs[instanceId] = {
      ...this.screenerConfigs[instanceId],
      ...config
    }
  }

  // Validation logic
  validateAddressListScreener(config: ScreenerConfig): { isValid: boolean; error?: string } {
    if (!config.addresses || config.addresses.length === 0) {
      return { isValid: false, error: 'Please add at least one address to the screener' }
    }
    
    // Validate Ethereum addresses
    for (const address of config.addresses) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { isValid: false, error: `Invalid Ethereum address: ${address}` }
      }
    }
    
    return { isValid: true }
  }

  validateCommunityGateScreener(config: ScreenerConfig): { isValid: boolean; error?: string } {
    if (!config.curatedListAddress || config.curatedListAddress.trim() === '') {
      return { isValid: false, error: 'Please enter a curated list contract address' }
    }
    
    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.curatedListAddress)) {
      return { isValid: false, error: 'Invalid contract address format' }
    }
    
    // Validate blocklist addresses if enabled
    if (config.useBlocklist && config.blocklistAddresses) {
      for (const address of config.blocklistAddresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          return { isValid: false, error: `Invalid blocklist address: ${address}` }
        }
      }
    }
    
    return { isValid: true }
  }

  validateAllScreeners(screeners: { [address: string]: ScreenerAssistant }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    for (const instanceId of this.selectedScreeners) {
      const screenerAddress = this.extractScreenerAddress(instanceId)
      const screener = screeners[screenerAddress.toLowerCase()]
      const config = this.screenerConfigs[instanceId]
      
      if (!screener || !config) {
        errors.push(`Missing configuration for screener ${instanceId}`)
        continue
      }
      
      if (screener.name === 'Address List Screener') {
        const validation = this.validateAddressListScreener(config)
        if (!validation.isValid) {
          errors.push(`${screener.name}: ${validation.error}`)
        }
      } else if (screener.name === 'Curated List') {
        const validation = this.validateCommunityGateScreener(config)
        if (!validation.isValid) {
          errors.push(`${screener.name}: ${validation.error}`)
        }
      }
    }
    
    return { isValid: errors.length === 0, errors }
  }

  // Logic management
  setLogic(useAND: boolean): void {
    this.useANDLogic = useAND
  }

  toggleScreeners(enabled: boolean): void {
    this.enableScreeners = enabled
    if (!enabled) {
      // Clear all screeners when disabled
      this.selectedScreeners = []
      this.screenerConfigs = {}
    }
  }

  // State management
  getState() {
    return {
      enableScreeners: this.enableScreeners,
      selectedScreeners: [...this.selectedScreeners],
      screenerConfigs: { ...this.screenerConfigs },
      useANDLogic: this.useANDLogic
    }
  }

  setState(state: {
    enableScreeners?: boolean
    selectedScreeners?: string[]
    screenerConfigs?: { [instanceId: string]: ScreenerConfig }
    useANDLogic?: boolean
  }): void {
    if (state.enableScreeners !== undefined) this.enableScreeners = state.enableScreeners
    if (state.selectedScreeners !== undefined) this.selectedScreeners = [...state.selectedScreeners]
    if (state.screenerConfigs !== undefined) this.screenerConfigs = { ...state.screenerConfigs }
    if (state.useANDLogic !== undefined) this.useANDLogic = state.useANDLogic
  }

  // Change detection
  hasChanges(originalState: any): boolean {
    const currentState = this.getState()
    return JSON.stringify(currentState) !== JSON.stringify(originalState)
  }

  // Utility methods for testing
  getScreenerCount(): number {
    return this.selectedScreeners.length
  }

  getConfiguredScreenerCount(): number {
    return this.selectedScreeners.filter(instanceId => {
      const config = this.screenerConfigs[instanceId]
      if (!config) return false
      
      // Check if properly configured
      return (config.addresses && config.addresses.length > 0) ||
             (config.curatedListAddress && config.curatedListAddress.trim() !== '')
    }).length
  }
}

describe('Screener Configuration Management', () => {
  let manager: ScreenerConfigurationManager
  const mockScreeners = {
    '0x31c7ab87662132f5901f190032d49e0abe9fabec': {
      name: 'Address List Screener',
      address: '0x31c7ab87662132f5901f190032d49e0abe9fabec',
      description: 'Screen transactions by sender address',
      configParams: [
        { name: 'returnValueWhenInList', type: 'bool', defaultValue: true }
      ]
    },
    '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1': {
      name: 'Curated List',
      address: '0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1',
      description: 'Screen by community membership',
      configParams: [
        { name: 'curatedListAddress', type: 'address' },
        { name: 'returnValueWhenCurated', type: 'bool', defaultValue: true }
      ]
    }
  }

  beforeEach(() => {
    manager = new ScreenerConfigurationManager()
  })

  describe('Instance ID Management', () => {
    it('should generate unique instance IDs for new screeners', () => {
      const id1 = manager.generateInstanceId('0x123', 1000000)
      const id2 = manager.generateInstanceId('0x123', 1000001)
      
      expect(id1).toMatch(/^0x123_1000000_[a-z0-9]{6}$/)
      expect(id2).toMatch(/^0x123_1000001_[a-z0-9]{6}$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate loaded instance IDs with correct format', () => {
      const id = manager.generateLoadedInstanceId('0x123', 'type1', 0, 1000000)
      expect(id).toBe('0x123_loaded_type1_0_1000000')
    })

    it('should extract screener address from instance ID', () => {
      const address = manager.extractScreenerAddress('0x123_loaded_type1_0_1000000')
      expect(address).toBe('0x123')
    })

    it('should identify loaded vs new screeners', () => {
      expect(manager.isLoadedFromBlockchain('0x123_loaded_type1_0_1000000')).toBe(true)
      expect(manager.isLoadedFromBlockchain('0x123_1000000_abc123')).toBe(false)
    })
  })

  describe('Screener Addition and Removal', () => {
    it('should add screener with default configuration', () => {
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const instanceId = manager.addScreener(screener.address, screener)
      
      expect(manager.getScreenerCount()).toBe(1)
      expect(instanceId).toMatch(/^0x31c7ab87662132f5901f190032d49e0abe9fabec_\d+_[a-z0-9]{6}$/)
      
      const state = manager.getState()
      expect(state.screenerConfigs[instanceId]).toEqual({
        returnValueWhenInList: true
      })
    })

    it('should remove screener and its configuration', () => {
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const instanceId = manager.addScreener(screener.address, screener)
      
      expect(manager.getScreenerCount()).toBe(1)
      
      manager.removeScreener(instanceId)
      
      expect(manager.getScreenerCount()).toBe(0)
      const state = manager.getState()
      expect(state.screenerConfigs[instanceId]).toBeUndefined()
    })

    it('should handle multiple screeners independently', () => {
      const screener1 = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const screener2 = mockScreeners['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1']
      
      const id1 = manager.addScreener(screener1.address, screener1)
      const id2 = manager.addScreener(screener2.address, screener2)
      
      expect(manager.getScreenerCount()).toBe(2)
      
      manager.removeScreener(id1)
      
      expect(manager.getScreenerCount()).toBe(1)
      const state = manager.getState()
      expect(state.selectedScreeners).toEqual([id2])
      expect(state.screenerConfigs[id1]).toBeUndefined()
      expect(state.screenerConfigs[id2]).toBeDefined()
    })
  })

  describe('Configuration Updates', () => {
    it('should update screener configuration', () => {
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const instanceId = manager.addScreener(screener.address, screener)
      
      manager.updateScreenerConfig(instanceId, {
        addresses: ['0x1111111111111111111111111111111111111111']
      })
      
      const state = manager.getState()
      expect(state.screenerConfigs[instanceId]).toEqual({
        returnValueWhenInList: true,
        addresses: ['0x1111111111111111111111111111111111111111']
      })
    })

    it('should preserve existing configuration when updating', () => {
      const screener = mockScreeners['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1']
      const instanceId = manager.addScreener(screener.address, screener)
      
      manager.updateScreenerConfig(instanceId, {
        curatedListAddress: '0x2222222222222222222222222222222222222222'
      })
      
      manager.updateScreenerConfig(instanceId, {
        useBlocklist: true
      })
      
      const state = manager.getState()
      expect(state.screenerConfigs[instanceId]).toEqual({
        returnValueWhenCurated: true,
        curatedListAddress: '0x2222222222222222222222222222222222222222',
        useBlocklist: true
      })
    })
  })

  describe('Address List Screener Validation', () => {
    it('should validate properly configured address list screener', () => {
      const config = {
        addresses: ['0x1111111111111111111111111111111111111111'],
        returnValueWhenInList: true
      }
      
      const result = manager.validateAddressListScreener(config)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail validation for empty address list', () => {
      const config = {
        addresses: [],
        returnValueWhenInList: true
      }
      
      const result = manager.validateAddressListScreener(config)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please add at least one address to the screener')
    })

    it('should fail validation for invalid Ethereum addresses', () => {
      const config = {
        addresses: ['0xinvalid', '0x1111111111111111111111111111111111111111'],
        returnValueWhenInList: true
      }
      
      const result = manager.validateAddressListScreener(config)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid Ethereum address: 0xinvalid')
    })

    it('should handle multiple valid addresses', () => {
      const config = {
        addresses: [
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333'
        ],
        returnValueWhenInList: false
      }
      
      const result = manager.validateAddressListScreener(config)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Curated List Screener Validation', () => {
    it('should validate properly configured community gate screener', () => {
      const config = {
        curatedListAddress: '0x1111111111111111111111111111111111111111',
        returnValueWhenCurated: true
      }
      
      const result = manager.validateCommunityGateScreener(config)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail validation for empty contract address', () => {
      const config = {
        curatedListAddress: '',
        returnValueWhenCurated: true
      }
      
      const result = manager.validateCommunityGateScreener(config)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please enter a curated list contract address')
    })

    it('should fail validation for invalid contract address format', () => {
      const config = {
        curatedListAddress: '0xinvalid',
        returnValueWhenCurated: true
      }
      
      const result = manager.validateCommunityGateScreener(config)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid contract address format')
    })

    it('should validate blocklist addresses when enabled', () => {
      const config = {
        curatedListAddress: '0x1111111111111111111111111111111111111111',
        returnValueWhenCurated: true,
        useBlocklist: true,
        blocklistAddresses: ['0x2222222222222222222222222222222222222222']
      }
      
      const result = manager.validateCommunityGateScreener(config)
      expect(result.isValid).toBe(true)
    })

    it('should fail validation for invalid blocklist addresses', () => {
      const config = {
        curatedListAddress: '0x1111111111111111111111111111111111111111',
        returnValueWhenCurated: true,
        useBlocklist: true,
        blocklistAddresses: ['0xinvalid']
      }
      
      const result = manager.validateCommunityGateScreener(config)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid blocklist address: 0xinvalid')
    })
  })

  describe('Complete Configuration Validation', () => {
    it('should validate all screeners and return errors', () => {
      // Add two screeners, one valid one invalid
      const screener1 = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const screener2 = mockScreeners['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1']
      
      const id1 = manager.addScreener(screener1.address, screener1)
      const id2 = manager.addScreener(screener2.address, screener2)
      
      // Configure first screener properly
      manager.updateScreenerConfig(id1, {
        addresses: ['0x1111111111111111111111111111111111111111']
      })
      
      // Leave second screener unconfigured (empty contract address)
      
      const result = manager.validateAllScreeners(mockScreeners)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Curated List')
      expect(result.errors[0]).toContain('Please enter a curated list contract address')
    })

    it('should validate successfully when all screeners are configured', () => {
      const screener1 = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const screener2 = mockScreeners['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1']
      
      const id1 = manager.addScreener(screener1.address, screener1)
      const id2 = manager.addScreener(screener2.address, screener2)
      
      manager.updateScreenerConfig(id1, {
        addresses: ['0x1111111111111111111111111111111111111111']
      })
      
      manager.updateScreenerConfig(id2, {
        curatedListAddress: '0x2222222222222222222222222222222222222222'
      })
      
      const result = manager.validateAllScreeners(mockScreeners)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Logic and State Management', () => {
    it('should toggle between AND and OR logic', () => {
      expect(manager.getState().useANDLogic).toBe(true)
      
      manager.setLogic(false)
      expect(manager.getState().useANDLogic).toBe(false)
      
      manager.setLogic(true)
      expect(manager.getState().useANDLogic).toBe(true)
    })

    it('should clear all screeners when disabled', () => {
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      manager.addScreener(screener.address, screener)
      
      expect(manager.getScreenerCount()).toBe(1)
      
      manager.toggleScreeners(false)
      
      expect(manager.getScreenerCount()).toBe(0)
      expect(manager.getState().enableScreeners).toBe(false)
    })

    it('should preserve screeners when enabled', () => {
      manager.toggleScreeners(true)
      
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      manager.addScreener(screener.address, screener)
      
      expect(manager.getScreenerCount()).toBe(1)
      expect(manager.getState().enableScreeners).toBe(true)
    })
  })

  describe('Change Detection', () => {
    it('should detect no changes when state is identical', () => {
      const originalState = manager.getState()
      expect(manager.hasChanges(originalState)).toBe(false)
    })

    it('should detect changes when screeners are added', () => {
      const originalState = manager.getState()
      
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      manager.addScreener(screener.address, screener)
      
      expect(manager.hasChanges(originalState)).toBe(true)
    })

    it('should detect changes when configuration is updated', () => {
      const screener = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const instanceId = manager.addScreener(screener.address, screener)
      
      const originalState = manager.getState()
      
      manager.updateScreenerConfig(instanceId, {
        addresses: ['0x1111111111111111111111111111111111111111']
      })
      
      expect(manager.hasChanges(originalState)).toBe(true)
    })

    it('should detect changes when logic is modified', () => {
      const originalState = manager.getState()
      
      manager.setLogic(false)
      
      expect(manager.hasChanges(originalState)).toBe(true)
    })
  })

  describe('Configuration Counting', () => {
    it('should count configured vs unconfigured screeners', () => {
      const screener1 = mockScreeners['0x31c7ab87662132f5901f190032d49e0abe9fabec']
      const screener2 = mockScreeners['0xd2e14d15bbd13a0b71a52b57fd7e7f758e073ff1']
      
      const id1 = manager.addScreener(screener1.address, screener1)
      const id2 = manager.addScreener(screener2.address, screener2)
      
      expect(manager.getScreenerCount()).toBe(2)
      expect(manager.getConfiguredScreenerCount()).toBe(0) // Neither configured yet
      
      // Configure first screener
      manager.updateScreenerConfig(id1, {
        addresses: ['0x1111111111111111111111111111111111111111']
      })
      
      expect(manager.getConfiguredScreenerCount()).toBe(1)
      
      // Configure second screener
      manager.updateScreenerConfig(id2, {
        curatedListAddress: '0x2222222222222222222222222222222222222222'
      })
      
      expect(manager.getConfiguredScreenerCount()).toBe(2)
    })
  })
})