use crate::{
    curve::CurveCalculator,
    errors::CurverError,
    state::{config::GlobalConfigState, curve::BondingCurveState, global::Global, vault::SolVault},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [BondingCurveState::SEED, mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurveState>,

    #[account(
        mut,
        seeds = [SolVault::SEED, mint.key().as_ref()],
        bump = sol_vault.bump
    )]
    pub sol_vault: Account<'info, SolVault>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [Global::SEED],
        bump
    )]
    pub global: Account<'info, Global>,

    #[account(
        seeds = [GlobalConfigState::SEED],
        bump
    )]
    pub global_config: Account<'info, GlobalConfigState>,

    /// CHECK: Validated through constraints
    #[account(
        mut,
        address = global_config.protocol_owner @ CurverError::InvalidProtocolOwner
    )]
    pub protocol_owner: UncheckedAccount<'info>,

    /// CHECK: Validated through constraints
    #[account(
        mut,
        address = global.token_creator @ CurverError::InvalidCreatorAddress
    )]
    pub token_creator: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Sell>, token_amount: u64) -> Result<()> {
    sell(ctx, token_amount)
}

pub fn sell(ctx: Context<Sell>, token_amount: u64) -> Result<()> {
    require!(token_amount > 0, CurverError::InvalidAmount);
    require!(
        ctx.accounts.user_token_account.amount >= token_amount,
        CurverError::InsufficientTokens
    );

    let config = &ctx.accounts.global_config;

    let vsol_reserve = ctx.accounts.bonding_curve.vsol_reserve;
    let vtoken_reserve = ctx.accounts.bonding_curve.vtoken_reserve;

    let swap_result = CurveCalculator::tokens_to_sol(
        token_amount as u128,
        vsol_reserve as u128,
        vtoken_reserve as u128,
        config.token_owner_fee_basis_points as u128,
        config.protocol_fee_basis_points as u128,
        config.creator_fee_basis_points as u128,
    )
    .ok_or(CurverError::CalculationError)?;

    let total_sol_needed = swap_result
        .sol_out
        .checked_add(swap_result.protocol_fee)
        .and_then(|v| v.checked_add(swap_result.creator_fee))
        .ok_or(CurverError::CalculationError)?;

    require!(
        total_sol_needed <= vsol_reserve as u128,
        CurverError::InsufficientLiquidity
    );

    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );

    token::burn(burn_ctx, token_amount)?;

    let net_sol_out = swap_result.sol_out as u64;
    let protocol_fee = swap_result.protocol_fee as u64;
    let creator_fee = swap_result.creator_fee as u64;

    require!(net_sol_out > 0, CurverError::InvalidAmount);

    **ctx
        .accounts
        .sol_vault
        .to_account_info()
        .try_borrow_mut_lamports()? -= net_sol_out;
    **ctx
        .accounts
        .user
        .to_account_info()
        .try_borrow_mut_lamports()? += net_sol_out;

    if protocol_fee > 0 {
        **ctx
            .accounts
            .sol_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= protocol_fee;
        **ctx
            .accounts
            .protocol_owner
            .to_account_info()
            .try_borrow_mut_lamports()? += protocol_fee;
    }

    if creator_fee > 0 {
        **ctx
            .accounts
            .sol_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= creator_fee;
        **ctx
            .accounts
            .token_creator
            .to_account_info()
            .try_borrow_mut_lamports()? += creator_fee;
    }

    let bonding_curve = &mut ctx.accounts.bonding_curve;

    let total_sol_deducted = net_sol_out
        .checked_add(protocol_fee)
        .and_then(|v| v.checked_add(creator_fee))
        .ok_or(CurverError::CalculationError)?;

    bonding_curve.vsol_reserve = bonding_curve
        .vsol_reserve
        .checked_sub(total_sol_deducted)
        .ok_or(CurverError::CalculationError)?;

    bonding_curve.vtoken_reserve = bonding_curve
        .vtoken_reserve
        .checked_add(token_amount)
        .ok_or(CurverError::CalculationError)?;

    msg!(
        "Sell completed: {} tokens -> {} SOL, new reserves: SOL={}, tokens={}",
        token_amount,
        net_sol_out,
        bonding_curve.vsol_reserve,
        bonding_curve.vtoken_reserve
    );

    Ok(())
}
