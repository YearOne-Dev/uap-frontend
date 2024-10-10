import { getAddress, isAddress } from 'ethers';

export function isValidEVMAddress(address: string) {
  if (address.startsWith('0x') && address.length === 42) {
    const hexPart = address.slice(2); // Remove '0x'
    const hexRegex = /^[0-9a-fA-F]{40}$/;
    return hexRegex.test(hexPart);
  }
  return false;
}

export function addressToBytes32(address: string) {
  if (!isValidEVMAddress(address)) {
    throw new Error('Invalid EVM address');
  }
  // Remove the '0x' prefix if present
  if (address.startsWith('0x')) {
    address = address.slice(2);
  }
  // Pad the address with leading zeros to make it 32 bytes (64 hex characters)
  const paddedAddress = '0'.repeat(64 - address.length) + address;
  // Add the '0x' prefix back and return the result
  return '0x' + paddedAddress.toLowerCase();
}

export function bytes32ToAddress(bytes32: string) {
  if (bytes32.startsWith('0x')) {
    bytes32 = bytes32.slice(2);
  }
  // Ensure the bytes32 value is 64 characters long (32 bytes)
  if (bytes32.length !== 64) {
    throw new Error('Invalid bytes32 value');
  }
  // Extract the last 40 characters (20 bytes) as the Ethereum address
  const address = '0x' + bytes32.slice(24);
  if (!isValidEVMAddress(address)) {
    throw new Error('Invalid EVM address');
  }
  return address.toLowerCase();
}

export const getChecksumAddress = (address: string | null) => {
  // Check if the address is valid
  if (!address || !isAddress(address)) {
    // Handle invalid address
    return address;
  }

  // Convert to checksum address
  return getAddress(address);
};
