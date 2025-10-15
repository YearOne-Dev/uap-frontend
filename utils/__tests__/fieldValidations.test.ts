import { describe, it, expect } from 'vitest'
import { 
  isValidEVMAddress, 
  addressToBytes32, 
  bytes32ToAddress, 
  getChecksumAddress 
} from '../fieldValidations'

describe('fieldValidations', () => {
  describe('isValidEVMAddress', () => {
    it('should validate correct EVM addresses', () => {
      expect(isValidEVMAddress('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')).toBe(true)
      expect(isValidEVMAddress('0x0000000000000000000000000000000000000000')).toBe(true)
      expect(isValidEVMAddress('0xffffffffffffffffffffffffffffffffffffffff')).toBe(true)
    })

    it('should reject invalid addresses', () => {
      expect(isValidEVMAddress('')).toBe(false)
      expect(isValidEVMAddress('0x123')).toBe(false)
      expect(isValidEVMAddress('8b80c84b9cd9eb087e6894997ae161d4f9d975b9')).toBe(false) // no 0x
      expect(isValidEVMAddress('0x8b80c84b9cd9eb087e6894997ae161d4f9d975g9')).toBe(false) // invalid hex
      expect(isValidEVMAddress('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b99')).toBe(false) // too long
    })
  })

  describe('addressToBytes32', () => {
    it('should convert valid address to bytes32', () => {
      const address = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const result = addressToBytes32(address)
      expect(result).toBe('0x0000000000000000000000008b80c84b9cd9eb087e6894997ae161d4f9d975b9')
    })

    it('should throw error for address without 0x prefix', () => {
      const address = '8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      expect(() => addressToBytes32(address)).toThrow('Invalid EVM address')
    })

    it('should throw error for invalid address', () => {
      expect(() => addressToBytes32('invalid')).toThrow('Invalid EVM address')
      expect(() => addressToBytes32('0x123')).toThrow('Invalid EVM address')
    })
  })

  describe('bytes32ToAddress', () => {
    it('should convert bytes32 to address', () => {
      const bytes32 = '0x0000000000000000000000008b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const result = bytes32ToAddress(bytes32)
      expect(result).toBe('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')
    })

    it('should handle bytes32 without 0x prefix', () => {
      const bytes32 = '0000000000000000000000008b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const result = bytes32ToAddress(bytes32)
      expect(result).toBe('0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9')
    })

    it('should throw error for invalid bytes32', () => {
      expect(() => bytes32ToAddress('0x123')).toThrow('Invalid bytes32 value')
      expect(() => bytes32ToAddress('0x0000000000000000000000008b80c84b9cd9eb087e6894997ae161d4f9d975')).toThrow('Invalid bytes32 value')
    })

    it('should throw error for bytes32 with invalid address', () => {
      const invalidBytes32 = '0x000000000000000000000000gggggggggggggggggggggggggggggggggggggggg'
      expect(() => bytes32ToAddress(invalidBytes32)).toThrow('Invalid EVM address')
    })
  })

  describe('getChecksumAddress', () => {
    it('should return checksum address for valid address', () => {
      const address = '0x8b80c84b9cd9eb087e6894997ae161d4f9d975b9'
      const result = getChecksumAddress(address)
      expect(result).toBe('0x8b80c84B9Cd9EB087E6894997AE161d4f9d975b9')
    })

    it('should return original value for null/invalid address', () => {
      expect(getChecksumAddress(null)).toBe(null)
      expect(getChecksumAddress('')).toBe('')
      expect(getChecksumAddress('invalid')).toBe('invalid')
    })
  })
})