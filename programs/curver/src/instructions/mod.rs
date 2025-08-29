use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

pub mod admin;
pub mod buy;
pub mod create;
pub mod sell;

pub fn transfer_tokens<'info>(
    token_program: &Program<'info, Token>,
    from: &Account<'info, TokenAccount>,
    to: &Account<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let cpi_ctx = if signer_seeds.is_empty() {
        CpiContext::new(
            token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        )
    } else {
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: from.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
            signer_seeds,
        )
    };
    anchor_spl::token::transfer(cpi_ctx, amount)
}
