use crate::{
    curve::CurveCalculator,
    errors::CurverError,
    events::TokensBuy,
    state::{config::GlobalConfigState, curve::BondingCurveState, global::Global, vault::SolVault},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct Buy<'info> {
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
    #[account(mut)]
    pub protocol_owner: UncheckedAccount<'info>,

    /// CHECK: Validated through constraints  
    #[account(mut)]
    pub token_creator: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<Buy>, sol_amount: u64) -> Result<()> {
    buy(ctx, sol_amount)
}

pub fn buy(ctx: Context<Buy>, sol_amount: u64) -> Result<()> {
    require!(sol_amount > 0, CurverError::InvalidAmount);

    let config = &ctx.accounts.global_config;

    let vsol_reserve = ctx.accounts.bonding_curve.vsol_reserve;
    let vtoken_reserve = ctx.accounts.bonding_curve.vtoken_reserve;
    let bump = ctx.accounts.bonding_curve.bump;
    let mint_key = ctx.accounts.mint.key();

    let swap_result = CurveCalculator::sol_to_tokens(
        sol_amount as u128,
        vsol_reserve as u128,
        vtoken_reserve as u128,
        config.token_owner_fee_basis_points as u128,
        config.protocol_fee_basis_points as u128,
        config.creator_fee_basis_points as u128,
    )
    .ok_or(CurverError::CalculationError)?;

    require!(
        swap_result.tokens_out <= vtoken_reserve as u128,
        CurverError::InsufficientLiquidity
    );

    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.sol_vault.key(),
        sol_amount,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.sol_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    if swap_result.protocol_fee > 0 {
        **ctx
            .accounts
            .sol_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= swap_result.protocol_fee as u64;
        **ctx
            .accounts
            .protocol_owner
            .to_account_info()
            .try_borrow_mut_lamports()? += swap_result.protocol_fee as u64;
    }

    if swap_result.creator_fee > 0 {
        **ctx
            .accounts
            .sol_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= swap_result.creator_fee as u64;
        **ctx
            .accounts
            .token_creator
            .to_account_info()
            .try_borrow_mut_lamports()? += swap_result.creator_fee as u64;
    }

    let seeds = &[BondingCurveState::SEED, mint_key.as_ref(), &[bump]];
    let signer_seeds = &[&seeds[..]];

    let mint_to_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        },
        signer_seeds,
    );

    token::mint_to(mint_to_ctx, swap_result.tokens_out as u64)?;

    let bonding_curve = &mut ctx.accounts.bonding_curve;

    let net_sol_added = sol_amount
        .checked_sub(swap_result.protocol_fee as u64)
        .and_then(|v| v.checked_sub(swap_result.creator_fee as u64))
        .ok_or(CurverError::CalculationError)?;

    bonding_curve.vsol_reserve = bonding_curve
        .vsol_reserve
        .checked_add(net_sol_added)
        .ok_or(CurverError::CalculationError)?;

    bonding_curve.vtoken_reserve = bonding_curve
        .vtoken_reserve
        .checked_sub(swap_result.tokens_out as u64)
        .ok_or(CurverError::CalculationError)?;

    emit!(TokensBuy {
        mint: ctx.accounts.mint.key(),
        buyer: ctx.accounts.user.key(),
        sol_amount,
        tokens_received: swap_result.tokens_out as u64,
        protocol_fee: swap_result.protocol_fee as u64,
        creator_fee: swap_result.creator_fee as u64,
        vtoken_reserve_after: bonding_curve.vtoken_reserve,
        vsol_reserve_after: bonding_curve.vsol_reserve,
        current_price: bonding_curve.get_price() as u64,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
