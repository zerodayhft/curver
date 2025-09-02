import { Program, BN } from "@coral-xyz/anchor";
import { Curver } from "../../target/types/curver";
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

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

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

export async function create(
    program: Program<Curver>,
    mintAuthority: Signer,
    mint: PublicKey,
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
        [Buffer.from("bonding_curve")],
        program.programId
    );



    const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
        [bondingCurve.toBuffer(), Buffer.from([/* seed bytes */]), mint.toBuffer()],
        program.programId
    );

    const metadata = await getMetadataAddress(mint);

    const tx = await program.methods
        .create(args)
        .accounts({
            mint,
            mintAuthority: mintAuthority.publicKey,
            globalConfig,

            bondingCurve,
            associatedBondingCurve,
            global,
            metadata,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
        } as any)
        .rpc(confirmOptions);

    return { tx, bondingCurve, associatedBondingCurve };
}

export async function buy(
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
        [Buffer.from("bonding_curve")],
        program.programId
    );

    const [curveTokenAccount] = PublicKey.findProgramAddressSync(
        [bondingCurve.toBuffer(), Buffer.from([/* seed bytes */]), mint.toBuffer()],
        program.programId
    );

    const userTokenAccount = getAssociatedTokenAddressSync(
        mint,
        user.publicKey
    );

    const tx = await program.methods
        .buy(amount)
        .accounts({
            user: user.publicKey,
            mint,
            bondingCurve,
            curveTokenAccount,
            userTokenAccount,
            global,
            globalConfig,
            protocolOwner: new PublicKey("..."), // Нужно указать адрес
            tokenCreator: new PublicKey("..."), // Нужно указать адрес  
            tokenOwner: new PublicKey("..."), // Нужно указать адрес
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        } as any)
        .rpc(confirmOptions);

    return tx;
}

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
        [Buffer.from("bonding_curve")],
        program.programId
    );

    const [curveTokenAccount] = PublicKey.findProgramAddressSync(
        [bondingCurve.toBuffer(), Buffer.from([/* seed bytes */]), mint.toBuffer()],
        program.programId
    );

    const userTokenAccount = getAssociatedTokenAddressSync(
        mint,
        user.publicKey
    );

    const tx = await program.methods
        .sell(amount)
        .accounts({
            user: user.publicKey,
            mint,
            bondingCurve,
            curveTokenAccount,
            userTokenAccount,
            global,
            globalConfig,
            protocolOwner: new PublicKey("..."), // Нужно указать адрес
            tokenCreator: new PublicKey("..."), // Нужно указать адрес
            tokenOwner: new PublicKey("..."), // Нужно указать адрес
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
        } as any)
        .rpc(confirmOptions);

    return tx;
}

// Вспомогательные функции

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