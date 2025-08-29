use crate::state::global::Global;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateGlobal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [Global::SEED],
        bump,
        constraint = global.protocol_owner == authority.key()
    )]
    pub global: Account<'info, Global>,
}

pub fn handler(ctx: Context<UpdateGlobal>, new_token_owner: Option<Pubkey>) -> Result<()> {
    let global = &mut ctx.accounts.global;

    if let Some(token_owner) = new_token_owner {
        global.set_token_owner(token_owner);
    }

    msg!("Global state updated successfully");
    Ok(())
}
