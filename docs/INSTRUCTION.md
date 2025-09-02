# Curver Setup and Deployment Instructions

This guide provides step-by-step instructions for setting up, building, and deploying the Curver bonding curve protocol.

## Prerequisites

### System Requirements

- **Node.js**: Version 16 or higher
- **Rust**: Latest stable version
- **Solana CLI**: Version 1.16 or higher
- **Anchor CLI**: Version 0.31.1 or higher
- **Git**: For version control

### Installation Commands

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
export PATH="~/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1

# Verify installations
node --version
rustc --version
solana --version
anchor --version
```

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd curver

# Install Node.js dependencies
yarn install

# Or using npm
npm install
```

### 2. Configure Solana Environment

```bash
# Set cluster (devnet for testing)
solana config set --url devnet

# Generate a new keypair (if you don't have one)
solana-keygen new --outfile keys/owner.json

# Check your wallet address
solana address -k keys/owner.json

# Request devnet SOL (for testing)
solana airdrop 2 keys/owner.json

# Verify balance
solana balance keys/owner.json
```

### 3. Configure Anchor

```bash
# Set Anchor provider
anchor config set provider.cluster devnet
anchor config set provider.wallet keys/owner.json
```

## Building the Program

### 1. Build the Rust Program

```bash
# Clean previous builds
anchor clean

# Build the program
anchor build
```

**Note**: If you encounter the "String is the wrong size" error, ensure the program ID in `programs/curver/src/lib.rs` matches the one in `Anchor.toml`.

### 2. Generate Program Keypair

```bash
# Generate new program keypair
solana-keygen new --outfile target/deploy/curver-keypair.json

# Get the program ID
solana address -k target/deploy/curver-keypair.json
```

### 3. Update Program ID

Update the program ID in the following files:

**`Anchor.toml`**:

```toml
[programs.localnet]
curver = "YOUR_PROGRAM_ID_HERE"
```

**`programs/curver/src/lib.rs`**:

```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**`cli/cli.ts`**:

```typescript
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

### 4. Rebuild After ID Update

```bash
# Rebuild with correct program ID
anchor build
```

## Deployment

### 1. Deploy to Devnet

```bash
# Deploy the program
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show YOUR_PROGRAM_ID --url devnet
```

### 2. Initialize the Protocol

```bash
# Initialize global configuration
yarn cli init
```

This creates the global configuration and state accounts required for the protocol to function.

### 3. Verify Deployment

```bash
# Check program account
solana account YOUR_PROGRAM_ID --url devnet

# Test CLI functionality
yarn cli list
```

## Testing

### 1. Run Unit Tests

```bash
# Run all tests
anchor test

# Run specific test files
anchor test --skip-local-validator tests/create.test.ts
anchor test --skip-local-validator tests/swap.test.ts
anchor test --skip-local-validator tests/update.test.ts
```

### 2. Manual Testing

```bash
# Create a test token
yarn cli create

# Buy some tokens
yarn cli buy

# Sell tokens
yarn cli sell

# List all tokens
yarn cli list
```

## Production Deployment

### 1. Mainnet Preparation

```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Ensure you have sufficient SOL for deployment
solana balance keys/owner.json

# Generate production keypair
solana-keygen new --outfile keys/mainnet-owner.json
```

### 2. Security Checklist

- [ ] Audit smart contract code
- [ ] Test thoroughly on devnet
- [ ] Secure wallet keypairs
- [ ] Set appropriate fee levels
- [ ] Configure proper access controls
- [ ] Plan upgrade strategy
- [ ] Set up monitoring

### 3. Deploy to Mainnet

```bash
# Update Anchor.toml for mainnet
[provider]
cluster = "mainnet-beta"
wallet = "keys/mainnet-owner.json"

# Deploy
anchor deploy --provider.cluster mainnet-beta

# Initialize protocol
yarn cli init
```

## Configuration Management

### Environment Variables

Create a `.env` file for environment-specific settings:

```bash
# .env
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=keys/owner.json
PROGRAM_ID=YOUR_PROGRAM_ID_HERE
```

### Network-Specific Configs

**Devnet Configuration**:

```toml
# Anchor.toml
[provider]
cluster = "devnet"
wallet = "keys/owner.json"

[programs.devnet]
curver = "YOUR_DEVNET_PROGRAM_ID"
```

**Mainnet Configuration**:

```toml
# Anchor.toml
[provider]
cluster = "mainnet-beta"
wallet = "keys/mainnet-owner.json"

[programs.mainnet]
curver = "YOUR_MAINNET_PROGRAM_ID"
```

## Troubleshooting

### Common Build Issues

1. **"String is the wrong size" Error**

   ```bash
   # Ensure program IDs match in all files
   grep -r "declare_id" programs/
   grep -r "curver =" Anchor.toml
   ```

2. **"Program not found" Error**

   ```bash
   # Verify program is deployed
   solana program show YOUR_PROGRAM_ID

   # Check if program ID is correct
   solana address -k target/deploy/curver-keypair.json
   ```

3. **"Insufficient funds" Error**

   ```bash
   # Check wallet balance
   solana balance keys/owner.json

   # Request more SOL (devnet only)
   solana airdrop 2 keys/owner.json
   ```

### Build Optimization

```bash
# Clean build cache
anchor clean
rm -rf target/
rm -rf node_modules/

# Reinstall and rebuild
yarn install
anchor build
```

### Network Issues

```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' https://api.devnet.solana.com

# Switch RPC endpoint
solana config set --url https://api.devnet.solana.com
```

## Monitoring and Maintenance

### 1. Set Up Monitoring

```bash
# Monitor program logs
solana logs YOUR_PROGRAM_ID

# Watch account changes
solana account YOUR_PROGRAM_ID --lamports --output json-compact
```

### 2. Regular Maintenance

- Monitor transaction success rates
- Check fee collection
- Verify curve calculations
- Update dependencies regularly
- Backup important keypairs

### 3. Upgrade Process

```bash
# Build new version
anchor build

# Deploy upgrade (if program is upgradeable)
anchor upgrade target/deploy/curver.so --program-id YOUR_PROGRAM_ID

# Verify upgrade
solana program show YOUR_PROGRAM_ID
```

## Development Workflow

### 1. Local Development

```bash
# Start local validator
solana-test-validator

# In another terminal, deploy locally
anchor deploy --provider.cluster localnet

# Run tests
anchor test --skip-local-validator
```

### 2. Code Changes

```bash
# Make changes to Rust code
# Rebuild
anchor build

# Test changes
anchor test

# Deploy to devnet for integration testing
anchor deploy --provider.cluster devnet
```

### 3. Version Control

```bash
# Commit changes
git add .
git commit -m "feat: add new functionality"

# Tag releases
git tag v1.0.0
git push origin v1.0.0
```

## Support and Resources

- **Anchor Documentation**: https://anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Solana Discord**: https://discord.gg/solana
- **Anchor Discord**: https://discord.gg/anchor

## Security Best Practices

1. **Never commit private keys to version control**
2. **Use hardware wallets for mainnet deployments**
3. **Implement proper access controls**
4. **Audit code before mainnet deployment**
5. **Monitor for unusual activity**
6. **Keep dependencies updated**
7. **Use multi-signature for critical operations**
8. **Implement circuit breakers for emergency stops**
