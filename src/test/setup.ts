import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.lukso for browser provider tests
Object.defineProperty(window, 'lukso', {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
})

// Mock global fetch for IPFS tests
global.fetch = vi.fn()