import { describe, it, expect } from 'vitest'

/**
 * Specific test to debug the exact bug scenario reported by the user.
 * 
 * User scenario:
 * 1. Tip assistant is set up for receiving LYX (LSP0ValueReceived) 
 * 2. When setting up Burnt Pix assistant for the same transaction type
 * 3. UI shows "Execution Order: 1 (pending activation)" 
 * 4. User expects "Execution Order: 2 (pending activation)"
 * 
 * This suggests the predicted execution order is 0 when it should be 1.
 */

// Simplified logic extracted from SetupAssistant.tsx
function calculatePredictedExecutionOrder(
  selectedConfigTypes: string[],
  executionOrders: { [typeId: string]: number },
  allAssistantsForTypes: { [typeId: string]: { address: string }[] },
  assistantAddress: string
): { [typeId: string]: number } {
  const newPredictedOrders: { [typeId: string]: number } = {}
  
  selectedConfigTypes.forEach(typeId => {
    // If assistant is already configured for this type, don't predict
    if (executionOrders[typeId] !== undefined) {
      return
    }
    
    // Calculate what the execution order would be for this assistant
    const currentAssistants = allAssistantsForTypes[typeId] || []
    const assistantAlreadyInList = currentAssistants.some(
      assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
    )
    
    if (!assistantAlreadyInList) {
      // New assistant would be added at the end
      newPredictedOrders[typeId] = currentAssistants.length
    } else {
      // Assistant exists, find its current position
      const existingIndex = currentAssistants.findIndex(
        assistant => assistant.address.toLowerCase() === assistantAddress.toLowerCase()
      )
      newPredictedOrders[typeId] = existingIndex
    }
  })
  
  return newPredictedOrders
}

function getDisplayExecutionOrder(
  typeId: string,
  executionOrders: { [typeId: string]: number },
  predictedOrders: { [typeId: string]: number }
): string {
  const hasConfirmed = executionOrders[typeId] !== undefined
  const hasPredicted = predictedOrders[typeId] !== undefined
  
  if (!hasConfirmed && !hasPredicted) {
    return 'No order'
  }
  
  if (hasConfirmed) {
    return `Execution Order: ${executionOrders[typeId] + 1}`
  } else {
    return `Execution Order: ${predictedOrders[typeId] + 1} (pending activation)`
  }
}

describe('Execution Order Bug Debug', () => {
  const tipAssistant = { address: '0x1111111111111111111111111111111111111111' }
  const burntPixAssistant = { address: '0x2222222222222222222222222222222222222222' }
  
  it('should debug the exact user scenario', () => {
    // Scenario: User has tip assistant configured, setting up burnt pix
    
    // Step 1: Current state after tip assistant is configured
    const allAssistantsForTypes = {
      'LSP0ValueReceived': [tipAssistant] // Tip assistant is in the list
    }
    
    // Step 2: Setting up burnt pix assistant (not yet saved)
    const assistantAddress = burntPixAssistant.address
    const selectedConfigTypes = ['LSP0ValueReceived']
    const executionOrders = {} // Burnt pix is not yet configured
    
    // Step 3: Calculate predicted order
    const predicted = calculatePredictedExecutionOrder(
      selectedConfigTypes,
      executionOrders,
      allAssistantsForTypes,
      assistantAddress
    )
    
    console.log('Predicted execution orders:', predicted)
    console.log('Current assistants for LSP0ValueReceived:', allAssistantsForTypes['LSP0ValueReceived'])
    console.log('Assistants length:', allAssistantsForTypes['LSP0ValueReceived'].length)
    
    // Step 4: Check the display text
    const displayText = getDisplayExecutionOrder('LSP0ValueReceived', executionOrders, predicted)
    
    console.log('Display text:', displayText)
    
    // Expected: "Execution Order: 2 (pending activation)"
    // User sees: "Execution Order: 1 (pending activation)"
    
    expect(predicted['LSP0ValueReceived']).toBe(1) // Should be 1 (after tip assistant at 0)
    expect(displayText).toBe('Execution Order: 2 (pending activation)') // Should show 2 (1 + 1)
  })
  
  it('should test edge case: what if allAssistantsForTypes is stale?', () => {
    // Maybe the bug is that allAssistantsForTypes doesn't include the tip assistant?
    
    const allAssistantsForTypes = {
      'LSP0ValueReceived': [] // Empty - maybe tip assistant is not in the list?
    }
    
    const assistantAddress = burntPixAssistant.address
    const selectedConfigTypes = ['LSP0ValueReceived']
    const executionOrders = {} // Burnt pix is not yet configured
    
    const predicted = calculatePredictedExecutionOrder(
      selectedConfigTypes,
      executionOrders,
      allAssistantsForTypes,
      assistantAddress
    )
    
    const displayText = getDisplayExecutionOrder('LSP0ValueReceived', executionOrders, predicted)
    
    console.log('Edge case - empty assistants list:')
    console.log('Predicted:', predicted)
    console.log('Display:', displayText)
    
    // If allAssistantsForTypes is empty, burnt pix would get order 0, displaying as 1
    // This would match the user's bug report!
    expect(predicted['LSP0ValueReceived']).toBe(0)
    expect(displayText).toBe('Execution Order: 1 (pending activation)')
  })
  
  it('should test if tip assistant executionOrders affects burnt pix prediction', () => {
    // Maybe the bug is related to executionOrders state?
    
    const allAssistantsForTypes = {
      'LSP0ValueReceived': [tipAssistant]
    }
    
    const assistantAddress = burntPixAssistant.address
    const selectedConfigTypes = ['LSP0ValueReceived']
    
    // What if executionOrders contains tip assistant data instead of burnt pix data?
    const executionOrders = { 'LSP0ValueReceived': 0 } // Tip assistant is configured
    
    const predicted = calculatePredictedExecutionOrder(
      selectedConfigTypes,
      executionOrders,
      allAssistantsForTypes,
      assistantAddress
    )
    
    console.log('Edge case - tip assistant in executionOrders:')
    console.log('Predicted:', predicted)
    
    // If executionOrders contains the tip assistant's config, prediction would be skipped
    expect(predicted['LSP0ValueReceived']).toBeUndefined()
  })
  
  it('should test case sensitivity bug', () => {
    // Maybe there's a case sensitivity issue?
    
    const allAssistantsForTypes = {
      'LSP0ValueReceived': [
        { address: tipAssistant.address.toUpperCase() } // Uppercase
      ]
    }
    
    const assistantAddress = burntPixAssistant.address.toLowerCase() // Lowercase
    const selectedConfigTypes = ['LSP0ValueReceived']
    const executionOrders = {}
    
    const predicted = calculatePredictedExecutionOrder(
      selectedConfigTypes,
      executionOrders,
      allAssistantsForTypes,
      assistantAddress
    )
    
    console.log('Case sensitivity test:')
    console.log('Predicted:', predicted)
    
    // Should still work due to toLowerCase() in the logic
    expect(predicted['LSP0ValueReceived']).toBe(1)
  })
  
  it('should test if the issue is in fetchAllAssistantsForTypes timing', () => {
    // Maybe allAssistantsForTypes is fetched asynchronously and not ready yet?
    
    // Case 1: Data not loaded yet
    const allAssistantsForTypes1 = {}
    
    const predicted1 = calculatePredictedExecutionOrder(
      ['LSP0ValueReceived'],
      {},
      allAssistantsForTypes1,
      burntPixAssistant.address
    )
    
    console.log('No data loaded yet:', predicted1)
    expect(predicted1['LSP0ValueReceived']).toBe(0) // Would show as "1 (pending)"
    
    // Case 2: Data loaded but empty
    const allAssistantsForTypes2 = { 'LSP0ValueReceived': undefined }
    
    const predicted2 = calculatePredictedExecutionOrder(
      ['LSP0ValueReceived'],
      {},
      allAssistantsForTypes2,
      burntPixAssistant.address
    )
    
    console.log('Data loaded but undefined:', predicted2)
    expect(predicted2['LSP0ValueReceived']).toBe(0) // undefined || [] = []
  })
})