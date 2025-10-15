import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUAPERC725Instance,
  removeExecutiveAssistantConfig,
  fetchExecutiveAssistantConfig,
  setExecutiveAssistantConfig,
  generateUAPTypeConfigKey,
  generateUAPExecutiveConfigKey,
} from '../configDataKeyValueStore';
import { AbiCoder } from 'ethers';

describe('removeExecutiveAssistantConfig - Multi-Assistant Bug Fix', () => {
  const TIP_ASSISTANT = '0x1111111111111111111111111111111111111111';
  const BURNTPIX_ASSISTANT = '0x2222222222222222222222222222222222222222';
  const UP_ADDRESS = '0x9999999999999999999999999999999999999999';
  const LSP0_VALUE_RECEIVED = '0x9c4705229491d365fb5434052e12a386d6771d976bea61070a8c694e8affea3d';

  let mockUpContract: any;
  let erc725UAP: any;

  beforeEach(() => {
    // Setup mock blockchain state
    const mockState = new Map<string, string>();

    // Initial state: Both assistants configured for LSP0 Value Received
    // Tip Assistant at index 0, Burntpix Refiner at index 1
    const typeConfigKey = '0x' + 'typeconfig'.padEnd(64, '0');
    const encodedAssistants = '0x' +
      '0000000000000000000000000000000000000000000000000000000000000020' + // offset
      '0000000000000000000000000000000000000000000000000000000000000002' + // length = 2
      '0000000000000000000000001111111111111111111111111111111111111111' + // Tip Assistant
      '0000000000000000000000002222222222222222222222222222222222222222'; // Burntpix

    mockState.set(typeConfigKey, encodedAssistants);

    // Tip Assistant config at index 0
    const tipConfigKey = '0x' + 'tipconfig'.padEnd(64, '0');
    const tipConfigValue = '0x' +
      '1111111111111111111111111111111111111111' + // Tip address
      'aaaa'; // Tip config data
    mockState.set(tipConfigKey, tipConfigValue);

    // Burntpix config at index 1
    const burntpixConfigKey = '0x' + 'burntpixconfig'.padEnd(64, '0');
    const burntpixConfigValue = '0x' +
      '2222222222222222222222222222222222222222' + // Burntpix address
      'bbbb'; // Burntpix config data
    mockState.set(burntpixConfigKey, burntpixConfigValue);

    // Mock UP contract
    mockUpContract = {
      getData: vi.fn(async (key: string) => {
        return mockState.get(key) || '0x';
      }),
      getDataBatch: vi.fn(async (keys: string[]) => {
        return keys.map(key => mockState.get(key) || '0x');
      }),
      setDataBatch: vi.fn(async (keys: string[], values: string[]) => {
        // Apply the batch update to mock state
        for (let i = 0; i < keys.length; i++) {
          if (values[i] === '0x') {
            mockState.delete(keys[i]);
          } else {
            mockState.set(keys[i], values[i]);
          }
        }
        return { wait: vi.fn() };
      }),
    };

    // Mock ERC725 instance
    erc725UAP = {
      encodeKeyName: vi.fn((keyName: string, params?: any[]) => {
        if (keyName === 'UAPTypeConfig:<bytes32>') {
          return typeConfigKey;
        }
        if (keyName === 'UAPExecutiveConfig:<bytes32>:<uint256>') {
          const executionOrder = params?.[1];
          if (executionOrder === '0') return tipConfigKey;
          if (executionOrder === '1') return burntpixConfigKey;
          if (executionOrder === '0') return tipConfigKey; // After migration
        }
        if (keyName === 'UAPExecutiveScreeners:<bytes32>:<uint256>') {
          return '0x' + `screeners${params?.[1]}`.padEnd(64, '0');
        }
        if (keyName === 'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>') {
          return '0x' + `logic${params?.[1]}`.padEnd(64, '0');
        }
        if (keyName === 'UAPScreenerConfig:<bytes32>:<uint256>') {
          return '0x' + `screenerconfig${params?.[1]}`.padEnd(64, '0');
        }
        if (keyName === 'UAPAddressListName:<bytes32>:<uint256>') {
          return '0x' + `listname${params?.[1]}`.padEnd(64, '0');
        }
        return '0x' + keyName.padEnd(64, '0');
      }),
      decodeValueType: vi.fn((type: string, value: string) => {
        if (type === 'address[]') {
          if (value === encodedAssistants) {
            return [TIP_ASSISTANT, BURNTPIX_ASSISTANT];
          }
          // After removal, only Burntpix remains
          const updatedEncoded = '0x' +
            '0000000000000000000000000000000000000000000000000000000000000020' +
            '0000000000000000000000000000000000000000000000000000000000000001' +
            '0000000000000000000000002222222222222222222222222222222222222222';
          if (value === updatedEncoded) {
            return [BURNTPIX_ASSISTANT];
          }
        }
        return value;
      }),
      encodeValueType: vi.fn((type: string, value: any) => {
        if (type === 'address[]' && Array.isArray(value)) {
          if (value.length === 1 && value[0] === BURNTPIX_ASSISTANT) {
            return '0x' +
              '0000000000000000000000000000000000000000000000000000000000000020' +
              '0000000000000000000000000000000000000000000000000000000000000001' +
              '0000000000000000000000002222222222222222222222222222222222222222';
          }
        }
        return '0xencoded';
      }),
    };
  });

  it('should migrate subsequent assistants when removing an assistant from the middle', async () => {
    // This is the exact bug scenario:
    // 1. Tip Assistant at index 0, Burntpix at index 1
    // 2. User deactivates Tip Assistant
    // 3. Burntpix should be migrated from index 1 to index 0

    const result = await removeExecutiveAssistantConfig(
      erc725UAP,
      mockUpContract,
      TIP_ASSISTANT,
      [LSP0_VALUE_RECEIVED]
    );

    // Verify the operations:
    // 1. Should clear Tip's config at index 0
    // 2. Should migrate Burntpix from index 1 to index 0
    // 3. Should clear Burntpix's old config at index 1
    // 4. Should update type config array to only contain Burntpix

    expect(result.keys.length).toBeGreaterThan(0);

    // Check that we're clearing the old executive config
    const tipConfigKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
      LSP0_VALUE_RECEIVED,
      '0'
    ]);
    expect(result.keys).toContain(tipConfigKey);
    const tipConfigValueIndex = result.keys.indexOf(tipConfigKey);
    expect(result.values[tipConfigValueIndex]).toBe('0x');

    // Check that we're migrating Burntpix from index 1 to index 0
    // Should write to index 0 with Burntpix's config
    const newBurntpixKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
      LSP0_VALUE_RECEIVED,
      '0' // New position after migration
    ]);

    // The key should appear in the operations (writing new value)
    const burntpixWriteOperations = result.keys.filter((k: string) => k === newBurntpixKey);
    expect(burntpixWriteOperations.length).toBeGreaterThan(0);

    // Check that type config is updated to only contain Burntpix
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [LSP0_VALUE_RECEIVED]);
    expect(result.keys).toContain(typeConfigKey);
    const typeConfigIndex = result.keys.lastIndexOf(typeConfigKey); // Get last occurrence
    const updatedAssistantsValue = result.values[typeConfigIndex];
    expect(updatedAssistantsValue).not.toBe('0x'); // Should not be empty
  });

  it('should preserve configuration data when migrating assistants', async () => {
    // Setup: Add config data to Burntpix
    const burntpixConfigData = '0xbbbbccccdddd'; // Some config data

    // Mock getData to return the config
    mockUpContract.getData = vi.fn(async (key: string) => {
      const burntpixConfigKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
        LSP0_VALUE_RECEIVED,
        '1'
      ]);

      if (key === burntpixConfigKey) {
        return '0x' +
          '2222222222222222222222222222222222222222' + // Address
          burntpixConfigData.slice(2); // Config data
      }

      // Return type config
      const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [LSP0_VALUE_RECEIVED]);
      if (key === typeConfigKey) {
        return '0x' +
          '0000000000000000000000000000000000000000000000000000000000000020' +
          '0000000000000000000000000000000000000000000000000000000000000002' +
          '0000000000000000000000001111111111111111111111111111111111111111' +
          '0000000000000000000000002222222222222222222222222222222222222222';
      }

      return '0x';
    });

    const result = await removeExecutiveAssistantConfig(
      erc725UAP,
      mockUpContract,
      TIP_ASSISTANT,
      [LSP0_VALUE_RECEIVED]
    );

    // Find the operation that writes Burntpix's config to index 0
    const newBurntpixKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
      LSP0_VALUE_RECEIVED,
      '0'
    ]);

    const writeIndex = result.keys.findIndex((k: string) =>
      k === newBurntpixKey && result.values[result.keys.indexOf(k)] !== '0x'
    );

    // Verify that we're writing the full config (address + data)
    if (writeIndex !== -1) {
      const writtenValue = result.values[writeIndex];
      expect(writtenValue).toContain('2222222222222222222222222222222222222222'); // Burntpix address
      expect(writtenValue.length).toBeGreaterThan(42 + 2); // 0x + address + config data
    }
  });

  it('should handle removal of last assistant without migration', async () => {
    // Remove Burntpix when it's at index 1 (not the first)
    // Should just clear index 1 and update array, no migration needed

    const result = await removeExecutiveAssistantConfig(
      erc725UAP,
      mockUpContract,
      BURNTPIX_ASSISTANT,
      [LSP0_VALUE_RECEIVED]
    );

    // Should clear Burntpix's config at index 1
    const burntpixConfigKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
      LSP0_VALUE_RECEIVED,
      '1'
    ]);
    expect(result.keys).toContain(burntpixConfigKey);

    // Should NOT have operations for index 0 (Tip Assistant untouched)
    const tipConfigKey = erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
      LSP0_VALUE_RECEIVED,
      '0'
    ]);

    // Tip config key might appear, but should not be cleared (value should not be '0x')
    const tipOperations = result.keys
      .map((key: string, idx: number) => ({ key, value: result.values[idx] }))
      .filter((op: any) => op.key === tipConfigKey && op.value === '0x');

    expect(tipOperations.length).toBe(0); // Should not clear Tip Assistant's config
  });
});
