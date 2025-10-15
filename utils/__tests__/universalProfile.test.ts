import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUrlNameByChainId, getChainIdByUrlName } from '../universalProfile'

// Mock the supportedNetworks constant
vi.mock('@/constants/supportedNetworks', () => ({
  supportedNetworks: {
    42: {
      chainId: 42,
      name: 'LUKSO Mainnet',
      urlName: 'lukso',
      rpcUrl: 'https://rpc.mainnet.lukso.network'
    },
    4201: {
      chainId: 4201,
      name: 'LUKSO Testnet',
      urlName: 'lukso-testnet',
      rpcUrl: 'https://rpc.testnet.lukso.network'
    }
  }
}))

describe('universalProfile', () => {
  describe('getUrlNameByChainId', () => {
    it('should return URL name for mainnet', () => {
      expect(getUrlNameByChainId(42)).toBe('lukso')
    })

    it('should return URL name for testnet', () => {
      expect(getUrlNameByChainId(4201)).toBe('lukso-testnet')
    })

    it('should throw error for unsupported chain ID', () => {
      expect(() => getUrlNameByChainId(999)).toThrow()
    })
  })

  describe('getChainIdByUrlName', () => {
    it('should return chain ID for mainnet URL name', () => {
      expect(getChainIdByUrlName('lukso')).toBe(42)
    })

    it('should return chain ID for testnet URL name', () => {
      expect(getChainIdByUrlName('lukso-testnet')).toBe(4201)
    })

    it('should return default chain ID (42) for unknown URL name', () => {
      expect(getChainIdByUrlName('unknown')).toBe(42)
    })

    it('should return default chain ID for empty string', () => {
      expect(getChainIdByUrlName('')).toBe(42)
    })
  })
})