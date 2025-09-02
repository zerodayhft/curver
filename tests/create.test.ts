import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Curver } from "../target/types/curver";
import {
    findGlobalConfigPDA,
    findGlobalPDA,
    findBondingCurvePDA,
    findSolVaultPDA,
} from "./utils/pda";
import { assert } from "chai";
import { BN } from "bn.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createMint,
    createAssociatedTokenAccount,
    mintTo,
} from "@solana/spl-token";

describe("Curver Create Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Curver as Program<Curver>;
    const wallet = provider.wallet as anchor.Wallet;

    let globalConfigPDA: anchor.web3.PublicKey;
    let globalPDA: anchor.web3.PublicKey;

    let tokenMint: anchor.web3.PublicKey;
    let bondingCurvePDA: anchor.web3.PublicKey;
    let solVaultPDA: anchor.web3.PublicKey;

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    before(async () => {
        // ---------------------------------------------------------------------------
        // Setup PDAs
        // ---------------------------------------------------------------------------
        [globalConfigPDA] = await findGlobalConfigPDA(program.programId);
        [globalPDA] = await findGlobalPDA(program.programId);

        // ---------------------------------------------------------------------------
        // Initialize Program if needed
        // ---------------------------------------------------------------------------
        const globalConfigInfo = await provider.connection.getAccountInfo(
            globalConfigPDA
        );
        if (!globalConfigInfo) {
            console.log("Initializing program state...");
            await program.methods
                .initialize()
                .accounts({
                    authority: wallet.publicKey,
                    globalConfig: globalConfigPDA,
                    global: globalPDA,
                    systemProgram: anchor.web3.SystemProgram.programId,
                } as any)
                .rpc();
            console.log("Initialization complete.");
        } else {
            console.log("Program already initialized.");
        }

        // ---------------------------------------------------------------------------
        // Setup Mints
        // ---------------------------------------------------------------------------
        const tokenMintKeypair = anchor.web3.Keypair.generate();
        tokenMint = tokenMintKeypair.publicKey;

        // We need to create the mint account via a transaction
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(82);
        const createMintTx = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: tokenMint,
                space: 82,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            await (await import("@solana/spl-token")).createInitializeMintInstruction(
                tokenMint,
                9,
                wallet.publicKey,
                wallet.publicKey
            )
        );
        await provider.sendAndConfirm(createMintTx, [tokenMintKeypair]);
        console.log("Token mint created:", tokenMint.toBase58());

        // Теперь можем создать bonding curve PDA для этого токена
        [bondingCurvePDA] = await findBondingCurvePDA(program.programId, tokenMint);
        [solVaultPDA] = await findSolVaultPDA(program.programId, tokenMint);
    });



    it("Should create a new token with a bonding curve", async () => {
        // ---------------------------------------------------------------------------
        // Setup for the specific test
        // ---------------------------------------------------------------------------

        // Derive associated accounts
        const bondingCurveTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            bondingCurvePDA,
            true // allowOwnerOffCurve
        );

        const [metadataAddress] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                tokenMint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // ---------------------------------------------------------------------------
        // Execute the create instruction
        // ---------------------------------------------------------------------------
        const createArgs = {
            name: "Test Token",
            symbol: "TEST",
            uri: "https://test.com/metadata.json",
        };

        console.log("Executing create instruction...");
        const tx = await program.methods
            .create(createArgs)
            .accounts({
                mint: tokenMint,
                mintAuthority: wallet.publicKey,
                bondingCurve: bondingCurvePDA,
                associatedBondingCurve: bondingCurveTokenAccount,
                solVault: solVaultPDA,
                global: globalPDA,
                metadata: metadataAddress,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            } as any)
            .rpc();

        console.log("Create token transaction signature:", tx);

        // ---------------------------------------------------------------------------
        // Assertions
        // ---------------------------------------------------------------------------
        // 1. Check Bonding Curve State
        const bondingCurve = await program.account.bondingCurveState.fetch(
            bondingCurvePDA
        );
        assert.ok(
            bondingCurve.vtokenMint.equals(tokenMint),
            "Bonding curve has incorrect token mint"
        );
        // These values are based on the constants in `bonding_curve.rs`
        assert.equal(
            bondingCurve.vtokenReserve.toString(),
            "1073000000",
            "Incorrect virtual token reserve"
        );
        assert.equal(
            bondingCurve.vsolReserve.toString(),
            "30000000", // Updated to match new constant
            "Incorrect virtual sol reserve"
        );
        assert.equal(
            bondingCurve.totalSupply.toString(),
            "1000000000",
            "Incorrect total supply"
        );

        // 2. Check Global State
        const globalState = await program.account.global.fetch(globalPDA);
        assert.ok(
            globalState.tokenCreator.equals(wallet.publicKey),
            "Global state has incorrect token creator"
        );
        assert.ok(
            globalState.tokenOwner.equals(wallet.publicKey),
            "Global state has incorrect token owner"
        );

        // 3. Check Token Balance of Bonding Curve
        const curveTokenAccountInfo =
            await provider.connection.getTokenAccountBalance(bondingCurveTokenAccount);
        assert.equal(
            curveTokenAccountInfo.value.amount,
            "1073000000",
            "Bonding curve has incorrect token balance"
        );

        // 4. Check Metadata Account
        const metadataAccount = await provider.connection.getAccountInfo(
            metadataAddress
        );
        assert.isNotNull(
            metadataAccount,
            "Metadata account was not created"
        );
    });
});
