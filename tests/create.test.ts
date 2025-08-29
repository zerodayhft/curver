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
    let whitelistMint: anchor.web3.PublicKey;
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
                })
                .rpc();
            console.log("Initialization complete.");
        } else {
            console.log("Program already initialized.");
        }

        // ---------------------------------------------------------------------------
        // Setup Mints
        // ---------------------------------------------------------------------------
        whitelistMint = await createMint(
            provider.connection,
            wallet.payer,
            wallet.publicKey,
            null,
            0 // 0 decimals for an NFT-like whitelist token
        );
        console.log("Whitelist mint created:", whitelistMint.toBase58());

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

        // ---------------------------------------------------------------------------
        // Configure Whitelist
        // ---------------------------------------------------------------------------
        console.log("Updating config with whitelist token...");
        await program.methods
            .updateConfig(
                whitelistMint,
                new BN(100), // owner fee
                new BN(200), // creator fee
                new BN(50) // protocol fee
            )
            .accounts({
                authority: wallet.publicKey,
                globalConfig: globalConfigPDA,
                global: globalPDA,
            })
            .rpc();
        console.log("Whitelist token configured.");

        const config = await program.account.globalConfigState.fetch(
            globalConfigPDA
        );
        assert.ok(
            config.whitelistTokenAddress.equals(whitelistMint),
            "Whitelist token address was not set correctly in the config"
        );
    });

    it("Should fail if the creator does not have the whitelist token", async () => {
        // This test runs first to ensure the bonding curve account doesn't exist yet.

        // A new wallet that does not own the whitelist token
        const unauthorizedWallet = anchor.web3.Keypair.generate();
        const sig = await provider.connection.requestAirdrop(unauthorizedWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(sig);

        const newTokenMintKeypair = anchor.web3.Keypair.generate();

        // We need to create the mint account via a transaction for the unauthorized user
        const lamports = await provider.connection.getMinimumBalanceForRentExemption(82);
        const createMintTx = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: wallet.publicKey, // main wallet pays
                newAccountPubkey: newTokenMintKeypair.publicKey,
                space: 82,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            await (await import("@solana/spl-token")).createInitializeMintInstruction(
                newTokenMintKeypair.publicKey,
                9,
                unauthorizedWallet.publicKey, // unauthorized wallet is mint authority
                unauthorizedWallet.publicKey
            )
        );
        // sign with the wallet that pays and the keypair for the mint
        await provider.sendAndConfirm(createMintTx, [wallet.payer, newTokenMintKeypair]);

        // Create bonding curve PDA for the new token
        const [newBondingCurvePDA] = await findBondingCurvePDA(program.programId, newTokenMintKeypair.publicKey);
        const [newSolVaultPDA] = await findSolVaultPDA(program.programId, newTokenMintKeypair.publicKey);

        // Associated accounts for the new mint
        const newBondingCurveTokenAccount = await getAssociatedTokenAddress(
            newTokenMintKeypair.publicKey,
            newBondingCurvePDA,
            true
        );
        const [newMetadataAddress] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                newTokenMintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // The unauthorized user needs an ATA for the whitelist mint, even if it's empty.
        const unauthorizedWhitelistATA = await createAssociatedTokenAccount(
            provider.connection,
            unauthorizedWallet, // unauthorized user is the payer and owner
            whitelistMint,
            unauthorizedWallet.publicKey
        );

        try {
            await program.methods
                .create({
                    name: "Fail Token",
                    symbol: "FAIL",
                    uri: "http://fail.com",
                })
                .accounts({
                    mint: newTokenMintKeypair.publicKey,
                    mintAuthority: unauthorizedWallet.publicKey,
                    globalConfig: globalConfigPDA,
                    whitelistMint: whitelistMint,
                    whitelistTokenAccount: unauthorizedWhitelistATA, // The empty account
                    bondingCurve: newBondingCurvePDA,
                    associatedBondingCurve: newBondingCurveTokenAccount,
                    solVault: newSolVaultPDA,
                    global: globalPDA,
                    metadata: newMetadataAddress,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([unauthorizedWallet])
                .rpc();
            assert.fail("Transaction should have failed due to missing whitelist token");
        } catch (err) {
            assert.isTrue(err instanceof anchor.AnchorError, "Error should be an AnchorError");
            assert.equal((err as anchor.AnchorError).error.errorCode.code, "InvalidWhitelistToken");
            console.log("Successfully caught expected error: InvalidWhitelistToken");
        }
    });

    it("Should create a new token with a bonding curve", async () => {
        // ---------------------------------------------------------------------------
        // Setup for the specific test
        // ---------------------------------------------------------------------------
        // Create and mint the whitelist token to the creator
        const whitelistTokenAccount = await createAssociatedTokenAccount(
            provider.connection,
            wallet.payer,
            whitelistMint,
            wallet.publicKey
        );

        await mintTo(
            provider.connection,
            wallet.payer,
            whitelistMint,
            whitelistTokenAccount,
            wallet.payer,
            1
        );
        console.log("Whitelist token minted to creator.");

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
                globalConfig: globalConfigPDA,
                whitelistMint: whitelistMint,
                whitelistTokenAccount: whitelistTokenAccount,
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
            })
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
