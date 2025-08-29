use anchor_lang::prelude::*;

/// Vault аккаунт для хранения SOL
/// Это простой системный аккаунт, контролируемый bonding curve PDA
#[account]
pub struct SolVault {
    /// Pubkey mint токена, для которого создан этот vault
    pub token_mint: Pubkey,
    /// Bump seed для PDA
    pub bump: u8,
    /// Накопленные комиссии протокола в lamports
    pub accumulated_protocol_fees: u64,
    /// Накопленные комиссии создателя токена в lamports  
    pub accumulated_creator_fees: u64,
    /// Накопленные комиссии владельца токена в lamports
    pub accumulated_owner_fees: u64,
}

impl SolVault {
    pub const SEED: &'static [u8] = b"sol_vault";

    /// Размер аккаунта: discriminator + token_mint + bump + 3 fee counters
    pub const SIZE: usize = 8 + 32 + 1 + 8 + 8 + 8; // = 65 bytes

    /// Создает новый vault для указанного токена
    pub fn new(token_mint: Pubkey, bump: u8) -> Self {
        Self {
            token_mint,
            bump,
            accumulated_protocol_fees: 0,
            accumulated_creator_fees: 0,
            accumulated_owner_fees: 0,
        }
    }

    /// Добавляет комиссии протокола
    pub fn add_protocol_fee(&mut self, amount: u64) -> Result<()> {
        self.accumulated_protocol_fees = self
            .accumulated_protocol_fees
            .checked_add(amount)
            .ok_or_else(|| error!(crate::errors::CurverError::CalculationError))?;
        Ok(())
    }

    /// Добавляет комиссии создателя
    pub fn add_creator_fee(&mut self, amount: u64) -> Result<()> {
        self.accumulated_creator_fees = self
            .accumulated_creator_fees
            .checked_add(amount)
            .ok_or_else(|| error!(crate::errors::CurverError::CalculationError))?;
        Ok(())
    }

    /// Добавляет комиссии владельца
    pub fn add_owner_fee(&mut self, amount: u64) -> Result<()> {
        self.accumulated_owner_fees = self
            .accumulated_owner_fees
            .checked_add(amount)
            .ok_or_else(|| error!(crate::errors::CurverError::CalculationError))?;
        Ok(())
    }

    /// Сбрасывает накопленные комиссии протокола (после вывода)
    pub fn reset_protocol_fees(&mut self) {
        self.accumulated_protocol_fees = 0;
    }

    /// Сбрасывает накопленные комиссии создателя (после вывода)
    pub fn reset_creator_fees(&mut self) {
        self.accumulated_creator_fees = 0;
    }

    /// Сбрасывает накопленные комиссии владельца (после вывода)
    pub fn reset_owner_fees(&mut self) {
        self.accumulated_owner_fees = 0;
    }

    /// Возвращает общую сумму накопленных комиссий
    pub fn total_accumulated_fees(&self) -> Result<u64> {
        let total = self
            .accumulated_protocol_fees
            .checked_add(self.accumulated_creator_fees)
            .and_then(|v| v.checked_add(self.accumulated_owner_fees))
            .ok_or_else(|| error!(crate::errors::CurverError::CalculationError))?;
        Ok(total)
    }
}
