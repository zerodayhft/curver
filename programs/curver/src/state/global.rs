use crate::{errors::CurverError, state::config::GlobalConfigState};
use anchor_lang::prelude::*;

#[account]
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

impl Global {
    pub const SEED: &'static [u8] = b"global";

    /// 8 discriminator + 4 * 32 (pubkeys) + 4 * 8 (u64s)
    pub const SIZE: usize = 8 + (32 * 4) + (8 * 4); // = 8 + 128 + 32 = 168

    // Constructor
    pub fn new(
        protocol_owner: Pubkey,
        token_creator: Pubkey,
        token_owner: Pubkey,
        global_config: Pubkey,
        initial_virtual_token_reserves: u64,
        initial_virtual_sol_reserves: u64,
        initial_real_token_reserves: u64,
        token_total_supply: u64,
    ) -> Self {
        Self {
            protocol_owner,
            token_creator,
            token_owner,
            global_config,
            initial_virtual_token_reserves,
            initial_virtual_sol_reserves,
            initial_real_token_reserves,
            token_total_supply,
        }
    }

    // Validation helper
    pub fn validate(&self) -> Result<()> {
        require!(
            self.protocol_owner != Pubkey::default(),
            CurverError::InvalidAuthority
        );
        require!(
            self.global_config != Pubkey::default(),
            CurverError::InvalidConfig
        );
        require!(self.token_total_supply > 0, CurverError::InvalidSupply);
        Ok(())
    }

    pub fn set_token_owner(&mut self, new_owner: Pubkey) {
        self.token_owner = new_owner;
    }

    // Role checks
    pub fn is_protocol_owner(&self, signer: &Signer) -> bool {
        signer.key == &self.protocol_owner
    }

    pub fn is_token_creator(&self, signer: &Signer) -> bool {
        signer.key == &self.token_creator
    }

    pub fn is_token_owner(&self, signer: &Signer) -> bool {
        signer.key == &self.token_owner
    }

    // Getters
    pub fn protocol_owner_key(&self) -> Pubkey {
        self.protocol_owner
    }

    pub fn token_creator_key(&self) -> Pubkey {
        self.token_creator
    }

    pub fn token_owner_key(&self) -> Pubkey {
        self.token_owner
    }

    pub fn global_config_key(&self) -> Pubkey {
        self.global_config
    }

    pub fn initial_virtual_token_reserves(&self) -> u64 {
        self.initial_virtual_token_reserves
    }

    pub fn initial_virtual_sol_reserves(&self) -> u64 {
        self.initial_virtual_sol_reserves
    }

    pub fn initial_real_token_reserves(&self) -> u64 {
        self.initial_real_token_reserves
    }

    pub fn token_total_supply(&self) -> u64 {
        self.token_total_supply
    }

    pub fn protocol_fee_basis_points(&self) -> u64 {
        GlobalConfigState::DEFAULT_PROTOCOL_FEE
    }

    pub fn creator_fee_basis_points(&self) -> u64 {
        GlobalConfigState::DEFAULT_CREATOR_FEE
    }

    pub fn token_owner_fee_basis_points(&self) -> u64 {
        GlobalConfigState::DEFAULT_OWNER_FEE
    }
}
