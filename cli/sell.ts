import { Program, BN } from "@coral-xyz/anchor";

import * as anchor from "@coral-xyz/anchor";
import {
    Connection,
    ConfirmOptions,
    PublicKey,
    Keypair,
    Signer,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Curver } from "../target/types/curver";


export async function sell(
    program: Program<Curver>,
    user: Signer,
    mint: PublicKey,
    amount: BN,
    confirmOptions?: ConfirmOptions
) {

    const [global] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId
    );

    const [globalConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_config_state")],
        program.programId
    );

    const [bondingCurve] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding_curve"), mint.toBuffer()],
        program.programId
    );

    const [solVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol_vault"), mint.toBuffer()],
        program.programId
    );

    const userTokenAccount = getAssociatedTokenAddressSync(
        mint,
        user.publicKey
    );


    const userTokenAccountInfo = await program.provider.connection.getAccountInfo(userTokenAccount);

    if (!userTokenAccountInfo) {
        throw new Error("У пользователя нет token account для этого токена. Сначала купите токены.");
    }


    const globalData = await program.account.global.fetch(global);
    const globalConfigData = await program.account.globalConfigState.fetch(globalConfig);

    const tx = await program.methods
        .sell(amount)
        .accounts({
            user: user.publicKey,
            mint,
            bondingCurve,
            solVault,
            userTokenAccount,
            global,
            globalConfig,
            protocolOwner: globalConfigData.protocolOwner,
            tokenCreator: globalData.tokenCreator,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        } as any)
        .rpc(confirmOptions);

    return tx;
}