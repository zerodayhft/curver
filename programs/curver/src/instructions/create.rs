use crate::{
    errors::CurverError,
    events::CurveCreated,
    state::{config::GlobalConfigState, curve::BondingCurveState, global::Global, vault::SolVault},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_token_metadata::instructions::CreateMetadataAccountV3;

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(
        seeds = [GlobalConfigState::SEED],
        bump,
    )]
    pub global_config: Account<'info, GlobalConfigState>,

    #[account(
        init,
        payer = mint_authority,
        space = BondingCurveState::SIZE,
        seeds = [BondingCurveState::SEED, mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurveState>,

    #[account(
        init,
        payer = mint_authority,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve
    )]
    pub associated_bonding_curve: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = mint_authority,
        space = SolVault::SIZE,
        seeds = [SolVault::SEED, mint.key().as_ref()],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,

    #[account(
        mut,
        seeds = [Global::SEED],
        bump
    )]
    pub global: Account<'info, Global>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metadata program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct CreateArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

pub fn handler(ctx: Context<Create>, args: CreateArgs) -> Result<()> {
    let global = &mut ctx.accounts.global;
    global.token_creator = ctx.accounts.mint_authority.key();
    global.token_owner = ctx.accounts.mint_authority.key();

    let bonding_curve = &mut ctx.accounts.bonding_curve;
    **bonding_curve = BondingCurveState::with_defaults(ctx.accounts.mint.key());
    bonding_curve.bump = ctx.bumps.bonding_curve;

    let sol_vault = &mut ctx.accounts.sol_vault;
    **sol_vault = SolVault::new(ctx.accounts.mint.key(), ctx.bumps.sol_vault);

    bonding_curve.validate()?;

    let metadata_account = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.mint_authority.key(),
        payer: ctx.accounts.mint_authority.key(),
        update_authority: (ctx.accounts.mint_authority.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let args = mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
        data: mpl_token_metadata::types::DataV2 {
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: None,
    };

    let create_metadata_ix = metadata_account.instruction(args.clone());

    anchor_lang::solana_program::program::invoke(
        &create_metadata_ix,
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    let amount = BondingCurveState::INITIAL_VTOKEN;
    anchor_spl::token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.associated_bonding_curve.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        ),
        amount,
    )?;

    anchor_spl::token::set_authority(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::SetAuthority {
                current_authority: ctx.accounts.mint_authority.to_account_info(),
                account_or_mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
        Some(ctx.accounts.bonding_curve.key()),
    )?;

    emit!(CurveCreated {
        mint: ctx.accounts.mint.key(),
        creator: ctx.accounts.mint_authority.key(),
        name: args.data.name.clone(),
        symbol: args.data.symbol.clone(),
        uri: args.data.uri.clone(),
        initial_vtoken_reserve: ctx.accounts.bonding_curve.vtoken_reserve,
        initial_vsol_reserve: ctx.accounts.bonding_curve.vsol_reserve,
        total_supply: ctx.accounts.bonding_curve.total_supply,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
