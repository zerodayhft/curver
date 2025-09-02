# Curver - Solana Bonding Curve Token Platform

Curver is a Solana-based decentralized platform for creating and trading tokens using bonding curve mechanics. It enables fair token launches with automated market making through mathematical pricing curves.

## Overview

Curver implements a bonding curve mechanism where token prices are determined algorithmically based on supply and demand. As more tokens are purchased, the price increases along a predetermined curve, ensuring fair price discovery and preventing front-running.

### Key Features

- **Bonding Curve Trading**: Automated market making with mathematical price curves
- **Fair Token Launches**: No pre-sales or insider advantages
- **Configurable Fees**: Protocol, creator, and token owner fee structures
- **Migration Ready**: Tokens can migrate to traditional AMMs when conditions are met
- **CLI Interface**: Command-line tools for easy interaction

## Architecture

### Core Components

1. **Global Configuration**: System-wide settings and fee structures
2. **Bonding Curve State**: Individual token curve parameters and reserves
3. **Token Creation**: Automated token minting with metadata
4. **Buy/Sell Operations**: Curve-based trading mechanics
5. **Fee Distribution**: Automated fee collection and distribution

### Program Instructions

- `initialize`: Set up global configuration
- `create`: Launch new token with bonding curve
- `buy`: Purchase tokens from the curve
- `sell`: Sell tokens back to the curve
- `update_config`: Modify fee parameters (admin only)
- `update_global`: Update global settings (admin only)

## Getting Started

### Prerequisites

- Node.js 16+
- Solana CLI tools
- Anchor framework
- TypeScript

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd curver

# Install dependencies
yarn install

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Configuration

1. Update `Anchor.toml` with your program ID
2. Configure wallet in `keys/owner.json`
3. Set cluster endpoint in configuration

## Usage

### CLI Commands

The project includes a comprehensive CLI for interacting with the protocol:

```bash
# Initialize the protocol
yarn cli init

# Create a new token
yarn cli create

# Buy tokens
yarn cli buy

# Sell tokens
yarn cli sell

# List available tokens
yarn cli list

# Update configuration (admin only)
yarn cli update-config
```

### Programmatic Usage

```typescript
import { Program } from "@coral-xyz/anchor";
import { Curver } from "./target/types/curver";

// Initialize program
const program = anchor.workspace.Curver as Program<Curver>;

// Create a new token
const createArgs = {
  name: "My Token",
  symbol: "MTK",
  uri: "https://example.com/metadata.json",
};

const tx = await program.methods
  .create(createArgs)
  .accounts({
    // ... account configuration
  })
  .rpc();
```

## Bonding Curve Mechanics

### Price Calculation

The bonding curve uses a constant product formula similar to Uniswap:

```
Price = vSOL_reserve / vToken_reserve
```

### Default Parameters

- **Initial Virtual Token Reserve**: 1,073,000,000
- **Initial Virtual SOL Reserve**: 30,000,000
- **Total Supply**: 1,000,000,000
- **Migration Threshold**: 800,000,000 tokens

### Fee Structure

- **Protocol Fee**: 0.5% (50 basis points)
- **Creator Fee**: 2% (200 basis points)
- **Token Owner Fee**: 1% (100 basis points)

## Security Considerations

- All operations are validated on-chain
- Fee calculations prevent overflow/underflow
- Access controls for administrative functions
- Slippage protection for trades

## Testing

```bash
# Run all tests
anchor test

# Run specific test suites
yarn test:create
yarn test:swap
yarn test:update
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Support

For questions and support, please refer to the documentation or open an issue in the repository.
