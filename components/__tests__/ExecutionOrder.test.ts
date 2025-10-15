import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Unit tests for execution order calculation and display logic.
 * 
 * Tests cover:
 * 1. Single assistant configuration scenarios
 * 2. Multiple assistants on same transaction type 
 * 3. Cross-transaction type scenarios
 * 4. Predicted execution order calculation
 * 5. Display formatting (0-indexed internal vs 1-indexed display)
 * 6. Assistant reordering scenarios
 * 7. Edge cases with assistant removal/addition
 */

interface Assistant {
  address: string
  name: string
}

interface ExecutionOrders {
  [typeId: string]: number
}

interface AllAssistantsForTypes {
  [typeId: string]: Assistant[]
}

class ExecutionOrderManager {
  private executionOrders: ExecutionOrders = {}
  private allAssistantsForTypes: AllAssistantsForTypes = {}
  private selectedConfigTypes: string[] = []
  private assistantAddress: string = ''

  setExecutionOrders(orders: ExecutionOrders) {
    this.executionOrders = { ...orders }
  }

  setAllAssistantsForTypes(assistants: AllAssistantsForTypes) {
    this.allAssistantsForTypes = { ...assistants }
  }

  setSelectedConfigTypes(types: string[]) {
    this.selectedConfigTypes = [...types]
  }

  setAssistantAddress(address: string) {
    this.assistantAddress = address
  }

  // Core business logic from SetupAssistant.tsx
  calculatePredictedExecutionOrders(): { [typeId: string]: number } {
    const newPredictedOrders: { [typeId: string]: number } = {}
    
    this.selectedConfigTypes.forEach(typeId => {
      // If assistant is already configured for this type, don't predict
      if (this.executionOrders[typeId] !== undefined) {
        return
      }
      
      // Calculate what the execution order would be for this assistant
      const currentAssistants = this.allAssistantsForTypes[typeId] || []
      const assistantAlreadyInList = currentAssistants.some(
        assistant => assistant.address.toLowerCase() === this.assistantAddress.toLowerCase()
      )
      
      if (!assistantAlreadyInList) {
        // New assistant would be added at the end
        newPredictedOrders[typeId] = currentAssistants.length
      } else {
        // Assistant exists, find its current position
        const existingIndex = currentAssistants.findIndex(
          assistant => assistant.address.toLowerCase() === this.assistantAddress.toLowerCase()
        )
        newPredictedOrders[typeId] = existingIndex
      }
    })
    
    return newPredictedOrders
  }

  // Display logic from SetupAssistant.tsx
  getDisplayExecutionOrder(typeId: string, predictedOrders: { [typeId: string]: number }): {
    order: number
    isPending: boolean
  } | null {
    const hasConfirmedOrder = this.executionOrders[typeId] !== undefined
    const hasPredictedOrder = predictedOrders[typeId] !== undefined
    
    if (!hasConfirmedOrder && !hasPredictedOrder) {
      return null
    }
    
    return {
      order: hasConfirmedOrder 
        ? this.executionOrders[typeId] + 1  // Convert 0-indexed to 1-indexed
        : predictedOrders[typeId] + 1,      // Convert 0-indexed to 1-indexed
      isPending: !hasConfirmedOrder && hasPredictedOrder
    }
  }

  // Simulate adding an assistant to the type configuration
  addAssistantToType(typeId: string, assistant: Assistant) {
    if (!this.allAssistantsForTypes[typeId]) {
      this.allAssistantsForTypes[typeId] = []
    }
    this.allAssistantsForTypes[typeId].push(assistant)
  }

  // Simulate configuring an assistant for a type (saving it)
  configureAssistantForType(typeId: string, executionOrder: number) {
    this.executionOrders[typeId] = executionOrder
  }

  // Get current state for testing
  getState() {
    return {
      executionOrders: { ...this.executionOrders },
      allAssistantsForTypes: { ...this.allAssistantsForTypes },
      selectedConfigTypes: [...this.selectedConfigTypes],
      assistantAddress: this.assistantAddress
    }
  }
}

describe('Execution Order Logic', () => {
  let manager: ExecutionOrderManager
  
  const tipAssistant: Assistant = {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Tip Assistant'
  }
  
  const burntPixAssistant: Assistant = {
    address: '0x2222222222222222222222222222222222222222', 
    name: 'Burnt Pix Assistant'
  }
  
  const donationAssistant: Assistant = {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Donation Assistant'
  }

  beforeEach(() => {
    manager = new ExecutionOrderManager()
  })

  describe('Single Assistant Scenarios', () => {
    it('should predict execution order 0 for first assistant on empty type', () => {
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [] // No existing assistants
      })
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(0)
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 1, // 0 + 1 = 1 (user-friendly display)
        isPending: true
      })
    })

    it('should not predict when assistant is already configured', () => {
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      manager.setExecutionOrders({ 'LSP0ValueReceived': 0 }) // Already configured
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant]
      })
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBeUndefined()
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 1, // 0 + 1 = 1 (confirmed order)
        isPending: false
      })
    })
  })

  describe('Multiple Assistants Same Type', () => {
    it('should predict execution order 1 for second assistant', () => {
      // Setup: Tip assistant is already configured at order 0
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant]
      })
      
      // Test: Setting up Burnt Pix assistant
      manager.setAssistantAddress(burntPixAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(1)
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 2, // 1 + 1 = 2 (user-friendly display)
        isPending: true
      })
    })

    it('should predict execution order 2 for third assistant', () => {
      // Setup: Two assistants already configured
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant, burntPixAssistant]
      })
      
      // Test: Setting up third assistant (Donation)
      manager.setAssistantAddress(donationAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(2)
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 3, // 2 + 1 = 3 (user-friendly display)
        isPending: true
      })
    })

    it('should find existing position for assistant already in list', () => {
      // Setup: Tip assistant is already configured at order 0
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant, burntPixAssistant]
      })
      manager.setExecutionOrders({ 'LSP0ValueReceived': 0 })
      
      // Test: Re-configuring tip assistant (should find existing position)
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBeUndefined() // Already configured
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 1, // 0 + 1 = 1 (existing confirmed order)
        isPending: false
      })
    })
  })

  describe('Cross-Transaction Type Scenarios', () => {
    it('should handle different execution orders across types', () => {
      // Setup: Complex scenario with multiple types and assistants
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant], // Tip assistant at position 0
        'LSP7Tokens_RecipientNotification': [] // No assistants yet
      })
      
      // Tip assistant is configured for LSP0ValueReceived but not LSP7
      manager.setExecutionOrders({ 'LSP0ValueReceived': 0 })
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived', 'LSP7Tokens_RecipientNotification'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      
      // Should not predict for LSP0ValueReceived (already configured)
      expect(predicted['LSP0ValueReceived']).toBeUndefined()
      
      // Should predict order 0 for LSP7 (new type, no existing assistants)
      expect(predicted['LSP7Tokens_RecipientNotification']).toBe(0)
      
      // Check display orders
      const lsp0Display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      const lsp7Display = manager.getDisplayExecutionOrder('LSP7Tokens_RecipientNotification', predicted)
      
      expect(lsp0Display).toEqual({
        order: 1, // Confirmed order 0 + 1
        isPending: false
      })
      
      expect(lsp7Display).toEqual({
        order: 1, // Predicted order 0 + 1  
        isPending: true
      })
    })

    it('should handle assistant configured for one type, adding to another with existing assistants', () => {
      // Setup: Complex scenario
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant], // Tip assistant configured here
        'LSP7Tokens_RecipientNotification': [burntPixAssistant, donationAssistant] // Two other assistants
      })
      
      manager.setExecutionOrders({ 'LSP0ValueReceived': 0 })
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived', 'LSP7Tokens_RecipientNotification'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      
      // No prediction for LSP0ValueReceived (already configured)
      expect(predicted['LSP0ValueReceived']).toBeUndefined()
      
      // Should predict order 2 for LSP7 (would be added after 2 existing assistants)
      expect(predicted['LSP7Tokens_RecipientNotification']).toBe(2)
      
      const lsp7Display = manager.getDisplayExecutionOrder('LSP7Tokens_RecipientNotification', predicted)
      expect(lsp7Display).toEqual({
        order: 3, // 2 + 1 = 3
        isPending: true
      })
    })
  })

  describe('Reordering Scenarios', () => {
    it('should handle execution order changes after reordering', () => {
      // Setup: Three assistants configured in specific order
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant, burntPixAssistant, donationAssistant]
      })
      
      // Tip assistant was initially at order 0, but got moved to order 2
      manager.setExecutionOrders({ 'LSP0ValueReceived': 2 })
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBeUndefined() // Already configured
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 3, // 2 + 1 = 3 (after reordering)
        isPending: false
      })
    })
  })

  describe('Edge Cases', () => {
    it('should return null when no execution order available', () => {
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes([]) // No types selected
      
      const predicted = manager.calculatePredictedExecutionOrders()
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      
      expect(display).toBeNull()
    })

    it('should handle empty assistant list correctly', () => {
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      manager.setAllAssistantsForTypes({}) // No assistants data
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(0) // Empty list length = 0
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 1, // 0 + 1 = 1
        isPending: true
      })
    })

    it('should handle case-insensitive address matching', () => {
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [
          { ...tipAssistant, address: tipAssistant.address.toUpperCase() }
        ]
      })
      
      manager.setAssistantAddress(tipAssistant.address.toLowerCase())
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(0) // Should find existing assistant
    })
  })

  describe('Bug Reproduction Tests', () => {
    it('should reproduce the reported bug: Burnt Pix showing order 1 instead of 2', () => {
      // Exact scenario from bug report:
      // 1. Tip assistant is set up for receiving LYX (LSP0ValueReceived)
      // 2. Setting up Burnt Pix assistant for same type
      // 3. Should show "Execution Order: 2 (pending activation)" but shows "1"
      
      // Setup: Tip assistant already configured (exists in allAssistants but executionOrders is for current assistant only)
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant] // 1 existing assistant (tip assistant)
      })
      // NOTE: executionOrders represents the current assistant being configured (Burnt Pix)
      // Since Burnt Pix is not yet configured, executionOrders should be empty
      manager.setExecutionOrders({}) // Burnt Pix is not yet configured
      
      // Test: Setting up Burnt Pix assistant
      manager.setAssistantAddress(burntPixAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      
      // Burnt Pix should get predicted order 1 (after tip assistant at order 0)
      expect(predicted['LSP0ValueReceived']).toBe(1)
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      
      // BUG: User expects to see "Execution Order: 2 (pending activation)"
      // This should be order 2 (1 + 1), not order 1
      expect(display).toEqual({
        order: 2, // This is what SHOULD be displayed (1 + 1 = 2)
        isPending: true
      })
    })

    it('should verify tip assistant shows correct confirmed order', () => {
      // Verify that the tip assistant (when configured) shows the correct order
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': [tipAssistant]
      })
      manager.setExecutionOrders({ 'LSP0ValueReceived': 0 })
      manager.setAssistantAddress(tipAssistant.address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      
      expect(display).toEqual({
        order: 1, // 0 + 1 = 1 (tip assistant is first)
        isPending: false
      })
    })
  })

  describe('Complex Multi-Assistant Scenarios', () => {
    it('should handle 5 assistants with various configurations', () => {
      const assistants = [
        { address: '0x1111111111111111111111111111111111111111', name: 'Assistant 1' },
        { address: '0x2222222222222222222222222222222222222222', name: 'Assistant 2' },
        { address: '0x3333333333333333333333333333333333333333', name: 'Assistant 3' },
        { address: '0x4444444444444444444444444444444444444444', name: 'Assistant 4' },
        { address: '0x5555555555555555555555555555555555555555', name: 'Assistant 5' }
      ]
      
      // Setup: 4 assistants already configured
      manager.setAllAssistantsForTypes({
        'LSP0ValueReceived': assistants.slice(0, 4) // First 4 assistants
      })
      
      // Test: Adding 5th assistant
      manager.setAssistantAddress(assistants[4].address)
      manager.setSelectedConfigTypes(['LSP0ValueReceived'])
      
      const predicted = manager.calculatePredictedExecutionOrders()
      expect(predicted['LSP0ValueReceived']).toBe(4) // Should be at position 4 (5th assistant)
      
      const display = manager.getDisplayExecutionOrder('LSP0ValueReceived', predicted)
      expect(display).toEqual({
        order: 5, // 4 + 1 = 5 (5th in execution order)
        isPending: true
      })
    })
  })
})