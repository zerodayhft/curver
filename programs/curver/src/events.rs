use anchor_lang::prelude::*;

#[event]
pub struct CurveCreated {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub initial_vtoken_reserve: u64,
    pub initial_vsol_reserve: u64,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensBuy {
    pub mint: Pubkey,
    pub buyer: Pubkey,
    pub sol_amount: u64,
    pub tokens_received: u64,
    pub protocol_fee: u64,
    pub creator_fee: u64,
    pub vtoken_reserve_after: u64,
    pub vsol_reserve_after: u64,
    pub current_price: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensSell {
    pub mint: Pubkey,
    pub seller: Pubkey,
    pub tokens_sold: u64,
    pub sol_received: u64,
    pub protocol_fee: u64,
    pub creator_fee: u64,
    pub vtoken_reserve_after: u64,
    pub vsol_reserve_after: u64,
    pub current_price: u64,
    pub timestamp: i64,
}

#[event]
pub struct ReservesUpdated {
    pub mint: Pubkey,
    pub old_vtoken_reserve: u64,
    pub new_vtoken_reserve: u64,
    pub old_vsol_reserve: u64,
    pub new_vsol_reserve: u64,
    pub timestamp: i64,
}
