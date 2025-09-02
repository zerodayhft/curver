# Curver CLI Documentation

The Curver CLI provides a command-line interface for interacting with the Curver bonding curve protocol on Solana.

## Installation

```bash
# Install dependencies
yarn install

# Make CLI executable
chmod +x cli/cli.ts
```

## Configuration

### Environment Setup

1. **Wallet Configuration**: Place your wallet keypair in `keys/owner.json`
2. **Network Configuration**: Update `Anchor.toml` for your target network
3. **Program ID**: Ensure the program ID matches your deployment

### Required Files

- `keys/owner.json`: Your wallet keypair (array of 64 numbers)
- `Anchor.toml`: Anchor configuration with program ID and cluster settings

## Available Commands

### 1. Initialize Protocol

```bash
yarn cli init
```

**Description**: Initializes the global protocol configuration. This must be run once before any other operations.

**Requirements**:

- Must be run by the protocol administrator
- Creates global configuration and state accounts

**Example Output**:

```
Initializing protocol...
Transaction: 5KJh7n8Z...
Protocol initialized successfully!
Global Config: 8mF2x9Y...
Global State: 3nR4k1P...
```

### 2. Create Token

```bash
yarn cli create
```

**Description**: Creates a new token with bonding curve mechanics.

**Interactive Prompts**:

- Token name (e.g., "My Awesome Token")
- Token symbol (e.g., "MAT")
- Metadata URI (JSON metadata URL)

**Process**:

1. Creates new token mint
2. Sets up bonding curve state
3. Creates token metadata
4. Initializes SOL vault
5. Mints initial supply to curve

**Example**:

```bash
$ yarn cli create
Enter token name: My Awesome Token
Enter token symbol: MAT
Enter metadata URI: https://example.com/metadata.json

Creating token...
Transaction: 7pL9m2K...
Token created successfully!
Mint: 4qW8x5N...
Bonding Curve: 9tY3r6M...
```

### 3. Buy Tokens

```bash
yarn cli buy
```

**Description**: Purchase tokens from a bonding curve using SOL.

**Interactive Prompts**:

- Token mint address
- Amount of SOL to spend (in SOL, not lamports)

**Process**:

1. Validates token mint and curve existence
2. Calculates expected token output
3. Creates user token account if needed
4. Executes buy transaction
5. Distributes fees to recipients

**Example**:

```bash
$ yarn cli buy
Enter token mint address: 4qW8x5N...
Enter SOL amount to spend: 0.1

Estimated tokens to receive: 1,234.56
Price per token: 0.000081 SOL

Confirm purchase? (y/n): y
Transaction: 2mK9p4L...
Purchased 1,234.56 tokens for 0.1 SOL
```

### 4. Sell Tokens

```bash
yarn cli sell
```

**Description**: Sell tokens back to the bonding curve for SOL.

**Interactive Prompts**:

- Token mint address
- Amount of tokens to sell

**Process**:

1. Validates token balance
2. Calculates expected SOL output
3. Executes sell transaction
4. Transfers SOL to user
5. Burns sold tokens

**Example**:

```bash
$ yarn cli sell
Enter token mint address: 4qW8x5N...
Enter token amount to sell: 500

Estimated SOL to receive: 0.045
Price per token: 0.00009 SOL

Confirm sale? (y/n): y
Transaction: 8nR5k2M...
Sold 500 tokens for 0.045 SOL
```

### 5. List Tokens

```bash
yarn cli list
```

**Description**: Lists all tokens created through the protocol with their current stats.

**Information Displayed**:

- Token mint address
- Token name and symbol
- Current price
- Virtual reserves
- Total supply
- Migration status

**Example Output**:

```
Curver Tokens:

1. My Awesome Token (MAT)
   Mint: 4qW8x5N...
   Price: 0.000085 SOL
   Virtual Token Reserve: 1,072,500,000
   Virtual SOL Reserve: 30,500,000
   Migration Ready: No (75% complete)

2. Another Token (ANT)
   Mint: 7pL9m2K...
   Price: 0.000120 SOL
   Virtual Token Reserve: 900,000,000
   Virtual SOL Reserve: 45,000,000
   Migration Ready: Yes
```

### 6. Update Configuration

```bash
yarn cli update-config
```

**Description**: Updates protocol fee configuration (admin only).

**Interactive Prompts**:

- Protocol fee (basis points)
- Creator fee (basis points)
- Token owner fee (basis points)

**Requirements**:

- Must be run by protocol administrator
- Fees are in basis points (100 = 1%)

**Example**:

```bash
$ yarn cli update-config
Enter protocol fee (basis points): 50
Enter creator fee (basis points): 200
Enter token owner fee (basis points): 100

Updating configuration...
Transaction: 3nR4k1P...
Configuration updated successfully!
```

## Advanced Usage

### Custom RPC Endpoint

```bash
# Set custom RPC in environment
export ANCHOR_PROVIDER_URL="https://api.mainnet-beta.solana.com"
yarn cli <command>
```

### Different Wallet

```bash
# Use different wallet file
cp /path/to/wallet.json keys/owner.json
yarn cli <command>
```

### Batch Operations

```bash
# Create multiple tokens
for i in {1..5}; do
  echo "Token $i" | yarn cli create
done
```

## Error Handling

### Common Errors

1. **"Wallet not found"**

   - Ensure `keys/owner.json` exists and contains valid keypair
   - Check file permissions

2. **"Program not found"**

   - Verify program is deployed to the target cluster
   - Check program ID in `Anchor.toml` matches deployment

3. **"Insufficient funds"**

   - Ensure wallet has enough SOL for transaction fees
   - Check if buying with more SOL than available

4. **"Token not found"**

   - Verify token mint address is correct
   - Ensure token was created through Curver protocol

5. **"Slippage exceeded"**
   - Price moved unfavorably during transaction
   - Try again with adjusted amount

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* yarn cli <command>

# Anchor debug mode
ANCHOR_LOG=true yarn cli <command>
```

## Configuration Files

### Setup Configuration

The CLI uses configuration files in `cli/setup_cfg/`:

- `create.json`: Default parameters for token creation
- `update_config.json`: Default fee configuration

**Example `create.json`**:

```json
{
  "name": "Default Token",
  "symbol": "DFT",
  "uri": "https://example.com/metadata.json"
}
```

**Example `update_config.json`**:

```json
{
  "feeRecipientBasisPoints": 100,
  "creatorFeeBasisPoints": 200,
  "protocolFeeBasisPoints": 50
}
```

## Integration Examples

### Node.js Script

```javascript
const { execSync } = require("child_process");

// Create token programmatically
const result = execSync("yarn cli create", {
  input: "My Token\nMTK\nhttps://example.com/meta.json\n",
  encoding: "utf8",
});

console.log(result);
```

### Shell Script

```bash
#!/bin/bash

# Automated token creation and initial buy
echo "Creating token..."
echo -e "Test Token\nTEST\nhttps://example.com/test.json" | yarn cli create

echo "Buying tokens..."
echo -e "<MINT_ADDRESS>\n0.1" | yarn cli buy
```

## Best Practices

1. **Always test on devnet first**
2. **Keep wallet keys secure**
3. **Verify transaction signatures**
4. **Monitor gas fees**
5. **Use appropriate slippage tolerance**
6. **Backup important keypairs**
7. **Validate input parameters**
8. **Handle errors gracefully**

## Troubleshooting

### Connection Issues

```bash
# Test RPC connection
solana cluster-version

# Check wallet balance
solana balance keys/owner.json
```

### Transaction Failures

```bash
# Check recent transactions
solana transaction-history <WALLET_ADDRESS>

# Verify program deployment
solana program show <PROGRAM_ID>
```

### Account Issues

```bash
# Check account info
solana account <ACCOUNT_ADDRESS>

# Verify PDA derivation
solana address --program-id <PROGRAM_ID> --seed "global"
```
