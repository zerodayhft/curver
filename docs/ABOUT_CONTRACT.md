# Curver Smart Contract Documentation

## Contract Overview

Curver is a Solana program that implements a bonding curve mechanism for token creation and trading. The contract enables fair token launches with automated market making through mathematical pricing curves.

**Program ID**: `Bw42ZPFART722nwPfVk5egiECYRxBCTqo1LpRtAA5mxr`

## Core Concepts

### Bonding Curves

A bonding curve is a mathematical function that determines token price based on supply. As more tokens are minted, the price increases along the curve, ensuring:

- Fair price discovery
- No front-running opportunities
- Automated liquidity provision
- Predictable pricing mechanics

### Virtual Reserves

The contract uses virtual reserves to bootstrap liquidity:

- **Virtual Token Reserve**: Starting at 1,073,000,000 tokens
- **Virtual SOL Reserve**: Starting at 30,000,000 lamports

These virtual reserves create initial liquidity without requiring actual token deposits.

## State Structures

### GlobalConfigState

Stores system-wide configuration:

```rust
pub struct GlobalConfigState {
    pub protocol_owner: Pubkey,           // Protocol administrator
    pub protocol_fee_basis_points: u64,   // Protocol fee (50 = 0.5%)
    pub creator_fee_basis_points: u64,    // Creator fee (200 = 2%)
    pub token_owner_fee_basis_points: u64, // Owner fee (100 = 1%)
}
```

### BondingCurveState

Tracks individual token curve parameters:

```rust
pub struct BondingCurveState {
    pub vtoken_reserve: u64,          // Virtual token reserve
    pub vtoken_mint: Pubkey,          // Token mint address
    pub vsol_reserve: u64,            // Virtual SOL reserve
    pub total_supply: u64,            // Total token supply
    pub allocation_at_migration: u64, // Migration threshold
    pub bump: u8,                     // PDA bump seed
}
```

### Global

Stores global protocol state:

```rust
pub struct Global {
    pub protocol_owner: Pubkey,
    pub token_creator: Pubkey,
    pub token_owner: Pubkey,
    pub global_config: Pubkey,
    pub initial_virtual_token_reserves: u64,
    pub initial_virtual_sol_reserves: u64,
    pub initial_real_token_reserves: u64,
    pub token_total_supply: u64,
}
```

## Instructions

### 1. Initialize

Sets up the global protocol configuration.

**Accounts:**

- `authority`: Protocol administrator (signer)
- `global_config`: Global configuration PDA (writable)
- `global`: Global state PDA (writable)
- `system_program`: Solana system program

**Parameters:** None

### 2. Create

Launches a new token with bonding curve.

**Accounts:**

- `creator`: Token creator (signer, fee payer)
- `mint`: New token mint (writable)
- `bonding_curve`: Curve state PDA (writable)
- `associated_bonding_curve`: Creator's token account (writable)
- `global`: Global state PDA
- `metadata`: Token metadata account (writable)
- `sol_vault`: SOL vault PDA (writable)
- Various system programs

**Parameters:**

```rust
pub struct CreateArgs {
    pub name: String,        // Token name
    pub symbol: String,      // Token symbol
    pub uri: String,         // Metadata URI
}
```

### 3. Buy

Purchases tokens from the bonding curve.

**Accounts:**

- `user`: Buyer (signer, fee payer)
- `mint`: Token mint
- `bonding_curve`: Curve state PDA (writable)
- `associated_bonding_curve`: Protocol token account (writable)
- `associated_user`: User token account (writable)
- `sol_vault`: SOL vault PDA (writable)
- `global`: Global state PDA
- `global_config`: Global configuration PDA
- Fee recipient accounts

**Parameters:**

- `amount`: Amount of SOL to spend (in lamports)

### 4. Sell

Sells tokens back to the bonding curve.

**Accounts:** Similar to buy instruction

**Parameters:**

- `amount`: Amount of tokens to sell

### 5. Update Config

Updates fee configuration (admin only).

**Parameters:**

- `fee_recipient_basis_points`: Fee recipient percentage
- `creator_fee_basis_points`: Creator fee percentage
- `protocol_fee_basis_points`: Protocol fee percentage

### 6. Update Global

Updates global protocol settings (admin only).

**Parameters:**

- `new_token_owner`: Optional new token owner

## Price Calculation

### Buying Tokens

When buying tokens with SOL:

1. Add SOL input to virtual SOL reserve
2. Calculate new virtual token reserve using constant product formula:
   ```
   new_vtoken_reserve = (old_vtoken_reserve * old_vsol_reserve) / new_vsol_reserve
   ```
3. Tokens received = `old_vtoken_reserve - new_vtoken_reserve`
4. Deduct fees from the transaction

### Selling Tokens

When selling tokens for SOL:

1. Add token input to virtual token reserve
2. Calculate new virtual SOL reserve:
   ```
   new_vsol_reserve = (old_vtoken_reserve * old_vsol_reserve) / new_vtoken_reserve
   ```
3. SOL received = `old_vsol_reserve - new_vsol_reserve`
4. Deduct fees from the transaction

## Fee Distribution

Fees are automatically distributed during each transaction:

- **Protocol Fee**: Goes to protocol treasury
- **Creator Fee**: Goes to token creator
- **Token Owner Fee**: Goes to designated token owner

Fees are calculated as basis points (1 basis point = 0.01%).

## Migration Mechanism

Tokens can migrate to traditional AMMs when:

- Virtual token reserve reaches the migration threshold (800M tokens by default)
- Migration conditions are met
- Sufficient liquidity exists

## Error Handling

The contract includes comprehensive error handling:

```rust
pub enum CurverError {
    InvalidReserves,        // Invalid reserve configuration
    InvalidMint,           // Invalid mint address
    InvalidSupply,         // Invalid total supply
    InvalidAuthority,      // Invalid authority
    InvalidConfig,         // Invalid config address
    InvalidAmount,         // Invalid swap amount
    InsufficientFunds,     // Insufficient curve funds
    CalculationError,      // Math calculation error
    InsufficientLiquidity, // Insufficient liquidity
    InsufficientTokens,    // Insufficient tokens
    InvalidProtocolOwner,  // Invalid protocol owner
    InvalidCreatorAddress, // Invalid creator address
}
```

## Security Features

1. **Access Controls**: Admin functions restricted to authorized accounts
2. **Overflow Protection**: Safe math operations prevent overflow/underflow
3. **Validation**: Input validation on all parameters
4. **PDA Security**: Program Derived Addresses prevent unauthorized access
5. **Fee Limits**: Reasonable limits on fee percentages

## Integration Guidelines

### Frontend Integration

1. Use the provided TypeScript SDK
2. Handle transaction confirmations properly
3. Implement slippage protection
4. Display accurate price estimates

### Backend Integration

1. Monitor curve events for price updates
2. Implement proper error handling
3. Cache frequently accessed data
4. Use connection pooling for RPC calls

## Deployment Considerations

1. **Program ID**: Must match across all environments
2. **Authority Keys**: Secure storage of admin keys
3. **Fee Configuration**: Set appropriate fee levels
4. **Monitoring**: Implement transaction monitoring
5. **Upgrades**: Plan for program upgrades if needed
