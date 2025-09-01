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
import { Curver } from "./idl/curver";

export async function updateConfig(
    program: Program<Curver>,
    authority: Signer,
    whitelistTokenAddress: PublicKey,
    feeRecipientBasisPoints: number = 100,
    creatorFeeBasisPoints: number = 200,
    protocolFeeBasisPoints: number = 50,
    confirmOptions?: ConfirmOptions
) {
    const [globalConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_config_state")],
        program.programId
    );

    const [global] = PublicKey.findProgramAddressSync(
        [Buffer.from("global")],
        program.programId
    );

    const tx = await program.methods
        .updateConfig(
            whitelistTokenAddress,
            new BN(feeRecipientBasisPoints),
            new BN(creatorFeeBasisPoints),
            new BN(protocolFeeBasisPoints)
        )
        .accounts({
            authority: authority.publicKey,
            globalConfig,
            global,
        } as any)
        .rpc(confirmOptions);

    return { tx, globalConfig, global };
}