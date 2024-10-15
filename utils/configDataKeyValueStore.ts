// Function to encode an array of addresses
import { ERC725YDataKeys, LSP1_TYPE_IDS } from "@lukso/lsp-smart-contracts";
import { BrowserProvider, ethers } from "ethers";
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import ERC725, { ERC725JSONSchema } from "@erc725/erc725.js";
import { getChecksumAddress } from "./fieldValidations";
import { DEFAULT_UP_CONTROLLER_PERMISSIONS, DEFAULT_UP_URD_PERMISSIONS, UAP_CONTROLLER_PERMISSIONS } from "@/constants/constants";
import { ERC725__factory } from "@/types";

export function customEncodeAddresses(addresses: string[]): string {
  if (addresses.length > 65535) {
    throw new Error("Number of addresses exceeds uint16 capacity.");
  }

  // Use ethers v6 `solidityPacked` to encode the length and addresses
  const encoded = ethers.solidityPacked(
    ["uint16", ...Array(addresses.length).fill("address")],
    [addresses.length, ...addresses]
  );

  return encoded;
}

// Function to decode the encoded addresses
export function customDecodeAddresses(encoded: string): string[] {
  // Remove "0x" prefix for easier handling
  const data = encoded.startsWith("0x") ? encoded.substring(2) : encoded;

  // Decode the number of addresses (first 4 characters represent 2 bytes)
  const numAddressesHex = data.substring(0, 4);
  const numAddresses = parseInt(numAddressesHex, 16);

  // Extract each 20-byte address
  let addresses: string[] = [];
  for (let i = 0; i < numAddresses; i++) {
    const startIdx = 4 + i * 40; // 4 hex chars for length, then 40 hex chars per address (20 bytes)
    const addressHex = `0x${data.substring(startIdx, startIdx + 40)}`;
    addresses.push(ethers.getAddress(addressHex)); // Normalize address
  }

  return addresses;
}

export const generateMappingKey = (keyName: string, typeId: string): string => {
  const hashedKey = ethers.keccak256(ethers.toUtf8Bytes(keyName));
  const first10Bytes = hashedKey.slice(2, 22);
  const last20Bytes = typeId.slice(2, 42);
  return '0x' + first10Bytes + '0000' + last20Bytes;
};

export const toggleUniveralAssistantsSubscribe = async (
    provider: BrowserProvider,
    upAccount: string,
    assistantsURD: string,
    defaultURDUP: string,
    isUsingAssistants: boolean
  ) => {
    const signer = await provider.getSigner();
    // 1. Prepare keys and values for setting the Forwarder as the delegate for LSP7 and LSP8
    const URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
    const LSP7URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
    const lspDelegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
    const lspDelegateValues = isUsingAssistants
      ? [defaultURDUP, '0x', '0x']
      : [assistantsURD, '0x', '0x'];
  
    // 2. Prepare keys and values for granting the forwarder the necessary permissions on the UP
    const UP = ERC725__factory.connect(upAccount, provider);
    const upPermissions = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAccount,
      window.lukso
    );
    const checkSumAssistantsURDAddress = getChecksumAddress(
        assistantsURD
    ) as string;
    const currentPermissionsData = await upPermissions.getData();
    const currentControllers = currentPermissionsData[0].value as string[];
    let newControllers = [] as string[];
    const assistantsURDPermissions = !isUsingAssistants
      ? upPermissions.encodePermissions({
          SUPER_CALL: true,
          ...DEFAULT_UP_URD_PERMISSIONS,
        })
      : '0x';
  
    // Remove all instance of the forwarder address from the list of UP controllers
    // and then add it to the end of the list, use checksum address to avoid issues with casing sensitivity
    newControllers = currentControllers.filter((controller: any) => {
      return getChecksumAddress(controller) !== checkSumAssistantsURDAddress;
    });
    !isUsingAssistants && newControllers.push(checkSumAssistantsURDAddress);
  
    const assistantsURDPermissionsData = upPermissions.encodeData([
      // the permission of the beneficiary address
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: checkSumAssistantsURDAddress,
        value: assistantsURDPermissions,
      },
      // the new list controllers addresses (= addresses with permissions set on the UP)
      // + or -  1 in the `AddressPermissions[]` array length
      {
        keyName: 'AddressPermissions[]',
        value: newControllers,
      },
    ]);
  
    // 3. Set the data on the UP
    const setDataBatchTx = await UP.connect(signer).setDataBatch(
      [...lspDelegateKeys, ...assistantsURDPermissionsData.keys],
      [...lspDelegateValues, ...assistantsURDPermissionsData.values]
    );
    return await setDataBatchTx.wait();
  };

  /**
 * Function to update the permissions of the Browser Extension controller.
 */
export const updateBECPermissions = async (
    provider: BrowserProvider,
    account: string,
    mainUPController: string
  ) => {
    const signer = await provider.getSigner();
    // check if we need to update permissions
    console.log('updateBECPermissions signer',signer);
    const missingPermissions = await doesControllerHaveMissingPermissions(
      mainUPController,
      account
    );
    console.log('missingPermissions', missingPermissions);
    if (!missingPermissions.length) {
      console.log('exiting updateBECPermissions');
      return;
    }
    const UP = ERC725__factory.connect(account, provider);
  
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
    console.log('permissionsData', permissionsData);
  
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
    // check if we need to update permissions
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
    console.log("targetEntity",  targetEntity);
    console.log("address",  address);
    const addressPermission = await erc725.getData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: address,
    });
    console.log("addressPermission",  addressPermission);
  
    return erc725.decodePermissions(addressPermission.value as string);
  };

  export const getMissingPermissions = (
    currentPermissions: { [key: string]: boolean },
    requiredPermissions: { [key: string]: boolean }
  ) => {
    const missingPermissions = [];
    for (const permission in requiredPermissions) {
      // check if the permission exists in the required permissions and if it is different from the current permissions
      if (requiredPermissions[permission] !== currentPermissions[permission]) {
        missingPermissions.push(permission);
      }
    }
    return missingPermissions;
  };
  