use crate::errors::CurverError;
use anchor_lang::prelude::*;

#[account]
pub struct BondingCurveState {
    pub vtoken_reserve: u64,          // 8
    pub vtoken_mint: Pubkey,          // 32
    pub vsol_reserve: u64,            // 8
    pub total_supply: u64,            // 8
    pub allocation_at_migration: u64, // 8
    pub bump: u8,                     // 1
}

impl BondingCurveState {
    pub const SEED: &'static [u8] = b"bonding_curve";

    pub const INITIAL_VTOKEN: u64 = 1_073_000_000;
    pub const INITIAL_VSOL: u64 = 30_000_000;
    pub const TOTAL_SUPPLY_DEFAULT: u64 = 1_000_000_000;
    pub const ALLOCATION_AT_MIGRATION_DEFAULT: u64 = 800_000_000;

    pub const SIZE: usize = 8 + 8 + 32 + 8 + 8 + 8 + 1;

    pub fn with_defaults(vtoken_mint: Pubkey) -> Self {
        Self {
            vtoken_reserve: Self::INITIAL_VTOKEN,
            vtoken_mint,
            vsol_reserve: Self::INITIAL_VSOL,
            total_supply: Self::TOTAL_SUPPLY_DEFAULT,
            allocation_at_migration: Self::ALLOCATION_AT_MIGRATION_DEFAULT,
            bump: 0,
        }
    }

    pub fn validate(&self) -> Result<()> {
        require!(self.vtoken_reserve > 0, CurverError::InvalidReserves);
        require!(self.vsol_reserve > 0, CurverError::InvalidReserves);
        require!(
            self.vtoken_mint != Pubkey::default(),
            CurverError::InvalidMint
        );
        require!(self.total_supply > 0, CurverError::InvalidSupply);
        Ok(())
    }

    pub fn update_reserves(&mut self, vtoken: u64, vsol: u64) {
        self.vtoken_reserve = vtoken;
        self.vsol_reserve = vsol;
    }

    pub fn is_ready_for_migration(&self) -> bool {
        self.vtoken_reserve >= self.allocation_at_migration
    }

    /// Current price: vSOL / vToken
    pub fn get_price(&self) -> f64 {
        self.vsol_reserve as f64 / self.vtoken_reserve as f64
    }

    /// Estimate tokens received for a given vSOL input (buying)
    pub fn estimate_tokens_for_vsol_in(&self, vsol_in: u64) -> u64 {
        let new_vsol = self.vsol_reserve + vsol_in;
        let new_vtoken = self.vtoken_reserve * self.vsol_reserve / new_vsol;
        self.vtoken_reserve - new_vtoken
    }

    /// Estimate vSOL received for a given token input (selling)
    pub fn estimate_vsol_for_tokens_out(&self, tokens_in: u64) -> u64 {
        let new_vtoken = self.vtoken_reserve + tokens_in;
        let new_vsol = self.vtoken_reserve * self.vsol_reserve / new_vtoken;
        self.vsol_reserve - new_vsol
    }
}
