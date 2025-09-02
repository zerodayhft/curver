use anchor_lang::prelude::*;

#[error_code]
pub enum CurverError {
    #[msg("Invalid reserve configuration")]
    InvalidReserves,
    #[msg("Invalid mint address")]
    InvalidMint,
    #[msg("Invalid total supply")]
    InvalidSupply,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid config addr")]
    InvalidConfig,

    #[msg("Invalid amount for swap")]
    InvalidAmount,
    #[msg("Insufficient funds on curve")]
    InsufficientFunds,
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Insufficient tokens")]
    InsufficientTokens,
    #[msg("Invalid protocol owner address")]
    InvalidProtocolOwner,
    #[msg("Invalid creator address")]
    InvalidCreatorAddress,
}
