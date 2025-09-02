use anchor_lang::prelude::*;

pub mod curve;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::{
    admin::{inititalize::*, update_config::*, update_global::*},
    buy::*,
    create::*,
    sell::*,
};

declare_id!("Bw42ZPFART722nwPfVk5egiECYRxBCTqo1LpRtAA5mxr");

#[program]
pub mod curver {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::admin::inititalize::handler(ctx)
    }

    pub fn create(ctx: Context<Create>, args: CreateArgs) -> Result<()> {
        instructions::create::handler(ctx, args)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        fee_recipient_basis_points: u64,
        creator_fee_basis_points: u64,
        protocol_fee_basis_points: u64,
    ) -> Result<()> {
        instructions::admin::update_config::handler(
            ctx,
            fee_recipient_basis_points,
            creator_fee_basis_points,
            protocol_fee_basis_points,
        )
    }

    pub fn update_global(
        ctx: Context<UpdateGlobal>,
        new_token_owner: Option<Pubkey>,
    ) -> Result<()> {
        instructions::admin::update_global::handler(ctx, new_token_owner)
    }

    pub fn buy(ctx: Context<Buy>, amount: u64) -> Result<()> {
        instructions::buy::handler(ctx, amount)
    }

    pub fn sell(ctx: Context<Sell>, amount: u64) -> Result<()> {
        instructions::sell::handler(ctx, amount)
    }
}
