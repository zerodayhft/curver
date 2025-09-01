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
import { Curver } from "./idl/curver";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export async function create(
    program: Program<Curver>,
    mintAuthority: Signer,
    mint: PublicKey,
    whitelistMint: PublicKey,
    args: {
        name: string,
        symbol: string,
        uri: string
    },
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

    const whitelistTokenAccount = getAssociatedTokenAddressSync(
        whitelistMint,
        mintAuthority.publicKey
    );

    const [solVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol_vault"), mint.toBuffer()],
        program.programId
    );

    const associatedBondingCurve = getAssociatedTokenAddressSync(
        mint,
        bondingCurve,
        true // allowOwnerOffCurve = true для PDA
    );

    const metadata = await getMetadataAddress(mint);

    const tx = await program.methods
        .create(args)
        .accounts({
            mint: mint,
            mintAuthority: mintAuthority.publicKey,
            globalConfig,
            whitelistMint,
            whitelistTokenAccount,
            bondingCurve,
            associatedBondingCurve,
            solVault,
            global,
            metadata,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        } as any)
        .signers([])
        .rpc(confirmOptions);

    return { tx, bondingCurve, associatedBondingCurve };
}


async function getMetadataAddress(mint: PublicKey): Promise<PublicKey> {
    const [address] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );
    return address;
}