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
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Curver } from "../target/types/curver";


export async function initialize(
    program: Program<Curver>,
    authority: Signer,
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

    const tx = await program.methods
        .initialize()
        .accounts({
            authority: authority.publicKey,
            globalConfig,
            global,
            systemProgram: SystemProgram.programId,
        } as any)
        .rpc(confirmOptions);

    return { tx, global, globalConfig };
}