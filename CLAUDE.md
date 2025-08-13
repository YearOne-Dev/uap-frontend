# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check for code issues
- `npm run format` - Format code with Prettier
- `npm run format-check` - Check if code is properly formatted

### TypeScript & Smart Contracts

- `npm run typechain` - Generate TypeScript types from smart contract ABIs (located in node_modules/@lukso/lsp-smart-contracts/artifacts/)

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: Chakra UI with custom theme
- **Blockchain**: LUKSO Network (mainnet chain ID 42, testnet chain ID 4201)
- **Web3 Integration**: ethers.js v6, ERC725.js for Universal Profile interactions
- **Authentication**: SIWE (Sign-In with Ethereum) for Universal Profile authentication

### Key Architectural Components

#### Universal Profile Integration

This is a LUKSO blockchain application that works with Universal Profiles (UP) - a blockchain identity standard. The app:

- Connects to UP Browser Extension (window.lukso provider)
- Uses ERC725.js to interact with Universal Profile metadata and assets
- Implements SIWE authentication for secure profile access
- Supports both LUKSO mainnet and testnet

#### Network Configuration

- Multi-network support with chain-specific configurations in `constants/supportedNetworks.ts`
- Network switching capabilities with automatic profile re-fetching
- Protocol addresses and assistant configurations are network-specific

#### Assistant Protocol System

The app manages "Executive Assistants" - smart contracts that can be triggered by specific blockchain events:

- Assistant types defined by LSP1 (LUKSO Standard Proposal 1) type IDs
- Assistants can respond to token transfers, ownership changes, value reception, etc.
- Configuration stored on-chain and managed through the UI

#### State Management Architecture

- **ProfileProvider**: Central context for Universal Profile state, authentication, and blockchain interactions
- **Local Storage**: Persistent session management for profile data
- **Real-time Updates**: Automatic re-fetching on network/account changes

#### Component Structure

- **App Router**: File-based routing with dynamic network and profile pages
- **Responsive Design**: Mobile-first approach with Chakra UI breakpoints
- **Reusable Components**: Assistant cards, configuration forms, transaction displays

### Important File Locations

#### Core Configuration

- `constants/supportedNetworks.ts` - Network configurations and protocol addresses
- `constants/assistantTypes.ts` - LSP1 type ID mappings for assistant triggers
- `constants/assistantsConfig.ts` - Pre-configured assistant definitions
- `app/providers.tsx` - Application-wide providers setup

#### Key Utilities

- `contexts/ProfileProvider.tsx` - Universal Profile state management and Web3 interactions
- `utils/universalProfile.ts` - Helper functions for profile data fetching
- `utils/ipfs.ts` - IPFS content retrieval utilities

#### Smart Contract Integration

- `types/` directory contains TypeChain-generated types for ERC725 contracts
- `abis/` directory contains contract ABIs

### Environment Variables Required

- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID for wallet connections

### Development Notes

- Uses TypeChain for type-safe smart contract interactions
- IPFS integration for decentralized metadata storage
- The app requires the UP Browser Extension for full functionality
- Session persistence through localStorage with automatic restoration
- Network switching triggers complete profile data refresh

### UAP Protocol Integration

This frontend works with the Universal Assistant Protocol (UAP) v2.0+ which uses a new configuration format:

- **UAP Schema**: Located in `schemas/UAP.json` - defines the ERC725 key structure for the new protocol
- **Executive Assistants**: Use `UAPExecutiveConfig:<bytes32>:<uint256>` keys where bytes32 is the transaction type ID and uint256 is the execution order
- **Configuration Format**: Stored as `(address, bytes)` tuples using `encodeTupleKeyValue` from erc725.js
- **Type Configuration**: `UAPTypeConfig:<bytes32>` maps transaction types to arrays of assistant addresses
- **Execution Order**: Assistants are executed in the order they appear in the type configuration array

Key utility functions for UAP integration:
- `createUAPERC725Instance()` - Creates ERC725 instance with UAP schema
- `setExecutiveAssistantConfig()` - Configures assistants with new format
- `fetchExecutiveAssistantConfig()` - Retrieves assistant configurations
- `removeExecutiveAssistantConfig()` - Removes assistant configurations

The frontend currently supports executive assistants only. Screener assistant support is planned for future implementation.
