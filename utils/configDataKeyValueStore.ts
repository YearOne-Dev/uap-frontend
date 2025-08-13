// Updated UAP configuration utilities for the new protocol format
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { BrowserProvider, ethers } from 'ethers';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { encodeTupleKeyValue } from '@erc725/erc725.js/build/main/src/lib/utils';
import { getChecksumAddress } from './fieldValidations';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  UAP_CONTROLLER_PERMISSIONS,
} from '@/constants/constants';
import { LSP0ERC725Account__factory } from '@/types';
import { transactionTypeMap } from '@/components/TransactionTypeBlock';
import uapSchema from '@/schemas/UAP.json';

// Initialize UAP ERC725 instance
export const createUAPERC725Instance = (upAddress: string, provider: any): ERC725 => {
  return new ERC725(uapSchema as ERC725JSONSchema[], upAddress, provider);
};

// Utility function to encode boolean values
export const encodeBoolValue = (value: boolean): string => {
  return value ? '0x01' : '0x00';
};

// Custom decoding function matching the Solidity contract's decodeExecDataValue logic
export const decodeExecDataValue = (execDataValue: string): [string, string] => {
  // Remove 0x prefix if present
  const hexData = execDataValue.startsWith('0x') ? execDataValue.slice(2) : execDataValue;
  
  // Must have at least 20 bytes (40 hex chars) for the address
  if (hexData.length < 40) {
    throw new Error('Invalid encoded data: too short');
  }
  
  // First 20 bytes (40 hex chars) = address
  const addressHex = hexData.slice(0, 40);
  const address = ethers.getAddress('0x' + addressHex);
  
  // Remaining bytes = config data
  const configDataHex = hexData.slice(40);
  const configBytes = '0x' + configDataHex;
  
  return [address, configBytes];
};

// Legacy address encoding/decoding functions (still needed for some operations)
export function customEncodeAddresses(addresses: string[]): string {
  if (addresses.length > 65535) {
    throw new Error('Number of addresses exceeds uint16 capacity.');
  }

  const encoded = ethers.solidityPacked(
    ['uint16', ...Array(addresses.length).fill('address')],
    [addresses.length, ...addresses]
  );

  return encoded;
}

export function customDecodeAddresses(encoded: string): string[] {
  const data = encoded.startsWith('0x') ? encoded.substring(2) : encoded;
  const numAddressesHex = data.substring(0, 4);
  const numAddresses = parseInt(numAddressesHex, 16);

  let addresses: string[] = [];
  for (let i = 0; i < numAddresses; i++) {
    const startIdx = 4 + i * 40;
    const addressHex = `0x${data.substring(startIdx, startIdx + 40)}`;
    addresses.push(ethers.getAddress(addressHex));
  }

  return addresses;
}

// NEW: UAP Key Generation Functions
export const generateUAPTypeConfigKey = (erc725UAP: ERC725, typeId: string): string => {
  return erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [typeId]);
};

export const generateUAPExecutiveConfigKey = (
  erc725UAP: ERC725,
  typeId: string,
  executionOrder: number
): string => {
  return erc725UAP.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
    typeId,
    executionOrder.toString(),
  ]);
};

// NEW: Executive Assistant Configuration Functions
export const setExecutiveAssistantConfig = async (
  erc725UAP: ERC725,
  upContract: any,
  assistantAddress: string,
  typeId: string,
  configData: string,
  updateTypeConfig: boolean = true
): Promise<{ keys: string[]; values: string[]; executionOrder: number }> => {
  const keys: string[] = [];
  const values: string[] = [];

  // STEP 1: Get current assistants and calculate execution order (BEFORE modifying the array)
  const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId);
  let currentAssistants: string[] = [];
  let executionOrder: number = 0;
  
  try {
    const currentValue = await upContract.getData(typeConfigKey);
    if (currentValue && currentValue !== '0x') {
      currentAssistants = erc725UAP.decodeValueType('address[]', currentValue) as string[];
    }
  } catch (error) {
    // If no current config, start with empty array
    currentAssistants = [];
  }

  // Calculate execution order based on current array length (BEFORE adding assistant)
  const assistantLower = assistantAddress.toLowerCase();
  const existingIndex = currentAssistants.findIndex(addr => addr.toLowerCase() === assistantLower);
  
  if (existingIndex !== -1) {
    // Assistant already exists, use its current position
    executionOrder = existingIndex;
  } else {
    // Assistant will be added at the end, so execution order = current length
    executionOrder = currentAssistants.length;
  }

  // STEP 2: Configure the executive assistant using the calculated execution order
  const executiveKey = generateUAPExecutiveConfigKey(erc725UAP, typeId, executionOrder);
  const execData = encodeTupleKeyValue(
    '(Address,Bytes)',
    '(address,bytes)',
    [assistantAddress, configData]
  );
  keys.push(executiveKey);
  values.push(execData);

  // STEP 3: Update type config (add assistant to the array) AFTER storing executive config
  if (updateTypeConfig && existingIndex === -1) {
    // Only add if not already present
    currentAssistants.push(assistantAddress);
    const encodedAssistants = erc725UAP.encodeValueType('address[]', currentAssistants);
    keys.push(typeConfigKey);
    values.push(encodedAssistants);
  }

  return { keys, values, executionOrder };
};

// NEW: Fetch executive assistant configuration
export const fetchExecutiveAssistantConfig = async (
  erc725UAP: ERC725,
  upContract: any,
  assistantAddress: string,
  typeIds: string[]
): Promise<{
  configuredTypes: string[];
  executionOrders: { [typeId: string]: number };
  configData: { [typeId: string]: string };
}> => {
  const configuredTypes: string[] = [];
  const executionOrders: { [typeId: string]: number } = {};
  const configData: { [typeId: string]: string } = {};

  for (const typeId of typeIds) {
    // Get the list of assistants for this type
    const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId);
    
    try {
      const typeConfigValue = await upContract.getData(typeConfigKey);
      if (typeConfigValue && typeConfigValue !== '0x') {
        const assistants = erc725UAP.decodeValueType('address[]', typeConfigValue) as string[];
        
        // Find the index (execution order) of our assistant
        const assistantIndex = assistants.findIndex(
          addr => addr.toLowerCase() === assistantAddress.toLowerCase()
        );
        if (assistantIndex !== -1) {
          // Fetch the executive config for this type and execution order
          const executiveKey = generateUAPExecutiveConfigKey(erc725UAP, typeId, assistantIndex);
          const executiveValue = await upContract.getData(executiveKey);
          
          if (executiveValue && executiveValue !== '0x') {
            try {
              // Decode using the same logic as Solidity contract's decodeExecDataValue function
              // Format: 0x + 20 bytes (address) + N bytes (config data)
              const decoded = decodeExecDataValue(executiveValue);
              const [configAddress, configBytes] = decoded;
            
              // Verify this config is for our assistant
              if (configAddress.toLowerCase() === assistantAddress.toLowerCase()) {
                configuredTypes.push(typeId);
                executionOrders[typeId] = assistantIndex;
                configData[typeId] = configBytes;
              }
            } catch (decodeError) {
              console.warn(`Error decoding executive config for ${assistantAddress} on type ${typeId}:`, decodeError);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error fetching config for type ${typeId}:`, error);
    }
  }

  return { configuredTypes, executionOrders, configData };
};

// NEW: Remove executive assistant configuration
export const removeExecutiveAssistantConfig = async (
  erc725UAP: ERC725,
  upContract: any,
  assistantAddress: string,
  typeIds: string[]
): Promise<{ keys: string[]; values: string[] }> => {
  const keys: string[] = [];
  const values: string[] = [];

  for (const typeId of typeIds) {
    // Get current assistants for this type
    const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId);
    
    try {
      const currentValue = await upContract.getData(typeConfigKey);
      if (currentValue && currentValue !== '0x') {
        const currentAssistants = erc725UAP.decodeValueType('address[]', currentValue) as string[];
        
        // Find and remove our assistant
        const assistantIndex = currentAssistants.findIndex(
          addr => addr.toLowerCase() === assistantAddress.toLowerCase()
        );
        
        if (assistantIndex !== -1) {
          // Remove the executive config
          const executiveKey = generateUAPExecutiveConfigKey(erc725UAP, typeId, assistantIndex);
          keys.push(executiveKey);
          values.push('0x');
          
          // Update the type config (remove assistant from array)
          const updatedAssistants = currentAssistants.filter(
            addr => addr.toLowerCase() !== assistantAddress.toLowerCase()
          );
          
          if (updatedAssistants.length === 0) {
            // No assistants left, clear the type config
            keys.push(typeConfigKey);
            values.push('0x');
          } else {
            // Update with remaining assistants
            const encodedAssistants = erc725UAP.encodeValueType('address[]', updatedAssistants);
            keys.push(typeConfigKey);
            values.push(encodedAssistants);
          }
        }
      }
    } catch (error) {
      console.warn(`Error removing config for type ${typeId}:`, error);
    }
  }

  return { keys, values };
};

// Legacy function kept for compatibility - updated to use new format
export const generateMappingKey = (keyName: string, typeId: string): string => {
  const hashedKey = ethers.keccak256(ethers.toUtf8Bytes(keyName));
  const first10Bytes = hashedKey.slice(2, 22);
  const last20Bytes = typeId.slice(2, 42);
  return '0x' + first10Bytes + '0000' + last20Bytes;
};

// Updated subscription function
export const subscribeToUapURD = async (
  provider: BrowserProvider,
  upAccount: string,
  uapURD: string
) => {
  const signer = await provider.getSigner();
  const URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
  const LSP7URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2, 42);
  const LSP8URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2, 42);

  const delegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
  const delegateValues = [uapURD, '0x', '0x'];

  const UP = LSP0ERC725Account__factory.connect(upAccount, provider);
  const upPermissions = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    upAccount,
    window.lukso
  );
  const checksumUapURD = getChecksumAddress(uapURD) as string;

  const currentPermissionsData = await upPermissions.getData();
  const currentControllers = currentPermissionsData[0].value as string[];

  let updatedControllers = currentControllers.filter((controller: string) => {
    return getChecksumAddress(controller) !== checksumUapURD;
  });

  updatedControllers.push(checksumUapURD);

  const uapURDPermissions = upPermissions.encodePermissions({
    SUPER_CALL: true,
    SUPER_TRANSFERVALUE: true,
    ...DEFAULT_UP_URD_PERMISSIONS,
  });

  const permissionsData = upPermissions.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: checksumUapURD,
      value: uapURDPermissions,
    },
    {
      keyName: 'AddressPermissions[]',
      value: updatedControllers,
    },
  ]);

  const allKeys = [...delegateKeys, ...permissionsData.keys];
  const allValues = [...delegateValues, ...permissionsData.values];

  const tx = await UP.connect(signer).setDataBatch(allKeys, allValues);
  return tx.wait();
};

// Updated unsubscription function to use new format
export const unsubscribeFromUapURD = async (
  provider: BrowserProvider,
  upAccount: string,
  uapURD: string,
  defaultURDUP: string
) => {
  const signer = await provider.getSigner();
  const upContract = LSP0ERC725Account__factory.connect(upAccount, signer);
  const erc725UAP = createUAPERC725Instance(upAccount, provider);

  // Get all configured types using new format
  const allTypeIds = Object.values(transactionTypeMap).map(obj => obj.id);
  const removeKeys: string[] = [];
  const removeValues: string[] = [];

  // Remove all type configs and executive configs
  for (const typeId of allTypeIds) {
    const typeConfigKey = generateUAPTypeConfigKey(erc725UAP, typeId);
    
    try {
      const typeConfigValue = await upContract.getData(typeConfigKey);
      if (typeConfigValue && typeConfigValue !== '0x') {
        // Remove the type config
        removeKeys.push(typeConfigKey);
        removeValues.push('0x');
        
        // Get assistants and remove their configs
        const assistants = erc725UAP.decodeValueType('address[]', typeConfigValue) as string[];
        for (let i = 0; i < assistants.length; i++) {
          const executiveKey = generateUAPExecutiveConfigKey(erc725UAP, typeId, i);
          removeKeys.push(executiveKey);
          removeValues.push('0x');
        }
      }
    } catch (error) {
      console.warn(`Error during unsubscribe for type ${typeId}:`, error);
    }
  }

  const upPermissions = new ERC725(LSP6Schema, upAccount, window.lukso);
  const URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
  const delegateKeys = [URDdataKey];
  const delegateValues = [defaultURDUP];

  const checksumUapURD = getChecksumAddress(uapURD) as string;
  const currentPermissionsData = await upPermissions.getData();
  const currentControllers = currentPermissionsData[0].value as string[];
  const updatedControllers = currentControllers.filter(
    (controller: string) => getChecksumAddress(controller) !== checksumUapURD
  );
  const uapURDPermissions = '0x';
  const permissionsData = upPermissions.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: checksumUapURD,
      value: uapURDPermissions,
    },
    {
      keyName: 'AddressPermissions[]',
      value: updatedControllers,
    },
  ]);

  const allKeys = [
    ...removeKeys,
    ...delegateKeys,
    ...permissionsData.keys,
  ];
  const allValues = [
    ...removeValues,
    ...delegateValues,
    ...permissionsData.values,
  ];

  const tx = await upContract.setDataBatch(allKeys, allValues);
  return tx.wait();
};

// Remaining functions stay the same
export const updateBECPermissions = async (
  provider: BrowserProvider,
  account: string,
  mainUPController: string
) => {
  const signer = await provider.getSigner();
  const missingPermissions = await doesControllerHaveMissingPermissions(
    mainUPController,
    account
  );
  if (!missingPermissions.length) {
    return;
  }
  const UP = LSP0ERC725Account__factory.connect(account, provider);

  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    account,
    provider
  );

  const newPermissions = erc725.encodePermissions({
    ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
    ...UAP_CONTROLLER_PERMISSIONS,
  });
  const permissionsData = erc725.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: mainUPController,
      value: newPermissions,
    },
  ]);

  const setDataBatchTx = await UP.connect(signer).setDataBatch(
    permissionsData.keys,
    permissionsData.values
  );
  return await setDataBatchTx.wait();
};

export const doesControllerHaveMissingPermissions = async (
  address: string,
  targetEntity: string
) => {
  const currentPermissions = await getAddressPermissionsOnTarget(
    address,
    targetEntity
  );
  const missingPermissions = getMissingPermissions(currentPermissions, {
    ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
    ...UAP_CONTROLLER_PERMISSIONS,
  });
  return missingPermissions;
};

export const getAddressPermissionsOnTarget = async (
  address: string,
  targetEntity: string
) => {
  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    targetEntity,
    window.lukso
  );
  const addressPermission = await erc725.getData({
    keyName: 'AddressPermissions:Permissions:<address>',
    dynamicKeyParts: address,
  });

  return erc725.decodePermissions(addressPermission.value as `0x${string}`);
};

export const getMissingPermissions = (
  currentPermissions: { [key: string]: boolean },
  requiredPermissions: { [key: string]: boolean }
) => {
  const missingPermissions = [];
  for (const permission in requiredPermissions) {
    if (requiredPermissions[permission] !== currentPermissions[permission]) {
      missingPermissions.push(permission);
    }
  }
  return missingPermissions;
};

export const isUAPInstalled = async (
  provider: any,
  upAddress: string,
  expectedDelegate: string
): Promise<any> => {
  let UPURD: null | string = null;
  try {
    const UPContract = new ethers.Contract(
      upAddress,
      UniversalProfile.abi,
      provider
    );
    UPURD = await UPContract.getData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
  return UPURD?.toLowerCase() === expectedDelegate?.toLowerCase();
};