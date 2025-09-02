use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfigState {
    pub protocol_owner: Pubkey,
    pub protocol_fee_basis_points: u64,
    pub creator_fee_basis_points: u64,
    pub token_owner_fee_basis_points: u64,
}

impl GlobalConfigState {
    pub const SEED: &'static [u8] = b"global_config_state";
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8;

    pub const DEFAULT_PROTOCOL_FEE: u64 = 50; // 0.5%
    pub const DEFAULT_CREATOR_FEE: u64 = 200; // 2%
    pub const DEFAULT_OWNER_FEE: u64 = 100; // 1%
}
