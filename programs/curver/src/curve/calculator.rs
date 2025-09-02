use super::fees::Fees;
use crate::errors::CurverError;
use crate::state::config::GlobalConfigState;
use anchor_lang::prelude::*;

#[derive(Debug)]
pub struct SwapResult {
    pub tokens_out: u128,
    pub sol_out: u128,
    pub protocol_fee: u128,
    pub creator_fee: u128,
    pub owner_fee: u128,
}

pub struct CurveCalculator {}

impl CurveCalculator {
    pub fn validate_supply(token_reserve: u128, sol_reserve: u128) -> Result<()> {
        if token_reserve == 0 {
            return Err(CurverError::InvalidReserves.into());
        }
        if sol_reserve == 0 {
            return Err(CurverError::InvalidReserves.into());
        }
        Ok(())
    }

    pub fn swap_base_input(
        input_amount: u128,
        input_reserve: u128,
        output_reserve: u128,
    ) -> Option<u128> {
        // k = x * y
        let numerator = input_amount.checked_mul(output_reserve)?;
        let denominator = input_reserve.checked_add(input_amount)?;
        Some(numerator.checked_div(denominator)?)
    }

    pub fn swap_base_output(
        output_amount: u128,
        input_reserve: u128,
        output_reserve: u128,
    ) -> Option<u128> {
        // k = x * y
        let numerator = input_reserve.checked_mul(output_amount)?;
        let denominator = output_reserve.checked_sub(output_amount)?;
        Some(numerator.checked_div(denominator)?)
    }

    pub fn sol_to_tokens(
        sol_amount: u128,
        sol_reserve: u128,
        token_reserve: u128,
        buy_fee_basis_points: u128,
        protocol_fee_basis_points: u128,
        creator_fee_basis_points: u128,
    ) -> Option<SwapResult> {
        let tokens_out = Self::swap_base_input(sol_amount, sol_reserve, token_reserve)?;

        let protocol_fee = Fees::protocol_fee(sol_amount, protocol_fee_basis_points)?;
        let creator_fee = Fees::creator_fee(sol_amount, creator_fee_basis_points)?;
        let owner_fee = Fees::owner_fee(sol_amount, buy_fee_basis_points)?;

        Some(SwapResult {
            tokens_out,
            sol_out: 0,
            protocol_fee,
            creator_fee,
            owner_fee,
        })
    }

    pub fn tokens_to_sol(
        token_amount: u128,
        sol_reserve: u128,
        token_reserve: u128,
        sell_fee_basis_points: u128,
        protocol_fee_basis_points: u128,
        creator_fee_basis_points: u128,
    ) -> Option<SwapResult> {
        let sol_out_gross = Self::swap_base_input(token_amount, token_reserve, sol_reserve)?;

        let protocol_fee = Fees::protocol_fee(sol_out_gross, protocol_fee_basis_points)?;
        let creator_fee = Fees::creator_fee(sol_out_gross, creator_fee_basis_points)?;
        let owner_fee = Fees::owner_fee(sol_out_gross, sell_fee_basis_points)?;

        let total_fees = protocol_fee
            .checked_add(creator_fee)?
            .checked_add(owner_fee)?;
        let sol_out = sol_out_gross.checked_sub(total_fees)?;

        Some(SwapResult {
            tokens_out: 0,
            sol_out,
            protocol_fee,
            creator_fee,
            owner_fee,
        })
    }

    pub fn calculate_swap(
        input_amount: u128,
        input_reserve: u128,
        output_reserve: u128,
        config: &GlobalConfigState,
    ) -> Option<SwapResult> {
        let fees = Fees::calculate_fees(
            input_amount,
            config.protocol_fee_basis_points as u128,
            config.creator_fee_basis_points as u128,
            config.token_owner_fee_basis_points as u128,
        )?;

        let total_fee = fees.total()?;
        let input_amount_less_fees = input_amount.checked_sub(total_fee)?;

        // x * y = k
        let output_amount =
            Self::swap_base_input(input_amount_less_fees, input_reserve, output_reserve)?;

        Some(SwapResult {
            tokens_out: output_amount,
            sol_out: 0,
            protocol_fee: fees.protocol_fee,
            creator_fee: fees.creator_fee,
            owner_fee: fees.owner_fee,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_swap_calculation() {
        let input_amount: u128 = 100;
        let input_reserve: u128 = 1000;
        let output_reserve: u128 = 1000;

        let config = GlobalConfigState {
            protocol_owner: Pubkey::default(),
            protocol_fee_basis_points: 50,     // 0.5%
            creator_fee_basis_points: 200,     // 2%
            token_owner_fee_basis_points: 100, // 1%
        };

        let result =
            CurveCalculator::calculate_swap(input_amount, input_reserve, output_reserve, &config)
                .unwrap();

        assert!(result.tokens_out > 0);
        assert_eq!(result.protocol_fee, 1); // 0.5% 100
        assert_eq!(result.creator_fee, 2); // 2%  100
        assert_eq!(result.owner_fee, 1); // 1%  100
    }
}
