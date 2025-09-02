use crate::state::{config::GlobalConfigState, global::Global};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GlobalConfigState::SEED],
        bump,
        constraint = global_config.protocol_owner == authority.key()
    )]
    pub global_config: Account<'info, GlobalConfigState>,

    #[account(
        seeds = [Global::SEED],
        bump,
        constraint = global.protocol_owner == authority.key()
    )]
    pub global: Account<'info, Global>,
}

pub fn handler(
    ctx: Context<UpdateConfig>,
    fee_recipient_basis_points: u64,
    creator_fee_basis_points: u64,
    protocol_fee_basis_points: u64,
) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;

    global_config.protocol_fee_basis_points = protocol_fee_basis_points;
    global_config.creator_fee_basis_points = creator_fee_basis_points;
    global_config.token_owner_fee_basis_points = fee_recipient_basis_points;

    msg!("Global config updated successfully");
    Ok(())
}
