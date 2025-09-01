#[derive(Debug)]
pub struct FeeResult {
    pub protocol_fee: u128,
    pub creator_fee: u128,
    pub owner_fee: u128,
}

impl FeeResult {
    pub fn total(&self) -> Option<u128> {
        self.protocol_fee
            .checked_add(self.creator_fee)?
            .checked_add(self.owner_fee)
    }
}

pub struct Fees {}

impl Fees {
    pub fn protocol_fee(amount: u128, fee_rate: u128) -> Option<u128> {
        amount.checked_mul(fee_rate)?.checked_div(10000)
    }

    pub fn creator_fee(amount: u128, fee_rate: u128) -> Option<u128> {
        amount.checked_mul(fee_rate)?.checked_div(10000)
    }

    pub fn owner_fee(amount: u128, fee_rate: u128) -> Option<u128> {
        amount.checked_mul(fee_rate)?.checked_div(10000)
    }

    pub fn calculate_fees(
        amount: u128,
        protocol_fee_rate: u128,
        creator_fee_rate: u128,
        owner_fee_rate: u128,
    ) -> Option<FeeResult> {
        let protocol_fee = Self::protocol_fee(amount, protocol_fee_rate)?;
        let creator_fee = Self::creator_fee(amount, creator_fee_rate)?;
        let owner_fee = Self::owner_fee(amount, owner_fee_rate)?;

        Some(FeeResult {
            protocol_fee,
            creator_fee,
            owner_fee,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fee_calculation() {
        let amount: u128 = 1000;
        let protocol_fee_rate: u128 = 50; // 0.5%
        let creator_fee_rate: u128 = 200; // 2%
        let owner_fee_rate: u128 = 100; // 1%

        let fees =
            Fees::calculate_fees(amount, protocol_fee_rate, creator_fee_rate, owner_fee_rate)
                .unwrap();

        assert_eq!(fees.protocol_fee, 5); // 0.5% 1000
        assert_eq!(fees.creator_fee, 20); // 2% 1000
        assert_eq!(fees.owner_fee, 10); // 1% 1000

        let total_fee = fees.total().unwrap();
        assert_eq!(total_fee, 35); // 3.5% 1000
    }
}
