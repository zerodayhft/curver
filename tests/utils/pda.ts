import * as anchor from "@coral-xyz/anchor";

export async function findGlobalConfigPDA(programId: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("global_config_state")],
        programId
    );
}

export async function findGlobalPDA(programId: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("global")],
        programId
    );
}

export async function findBondingCurvePDA(programId: anchor.web3.PublicKey, mint: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("bonding_curve"), mint.toBuffer()],
        programId
    );
}

export async function findSolVaultPDA(programId: anchor.web3.PublicKey, mint: anchor.web3.PublicKey) {
    return anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("sol_vault"), mint.toBuffer()],
        programId
    );
}
