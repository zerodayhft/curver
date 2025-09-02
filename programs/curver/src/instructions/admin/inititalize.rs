use crate::state::{config::GlobalConfigState, global::Global};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = GlobalConfigState::SIZE,
        seeds = [GlobalConfigState::SEED],
        bump
    )]
    pub global_config: Account<'info, GlobalConfigState>,

    #[account(
        init,
        payer = authority,
        space = Global::SIZE,
        seeds = [Global::SEED],
        bump
    )]
    pub global: Account<'info, Global>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;
    let global = &mut ctx.accounts.global;

    global_config.protocol_owner = ctx.accounts.authority.key();
    global_config.protocol_fee_basis_points = GlobalConfigState::DEFAULT_PROTOCOL_FEE;
    global_config.creator_fee_basis_points = GlobalConfigState::DEFAULT_CREATOR_FEE;
    global_config.token_owner_fee_basis_points = GlobalConfigState::DEFAULT_OWNER_FEE;

    let new_global = Global::new(
        ctx.accounts.authority.key(),
        Pubkey::default(),
        Pubkey::default(),
        global_config.key(),
        1_000_000_000,
        30_000_000,
        800_000_000,
        1_000_000_000,
    );

    **global = new_global;
    global.validate()?;

    msg!("Program initialized successfully");
    Ok(())
}
