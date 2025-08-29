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
    getAccount,
    createAssociatedTokenAccount,
} from "@solana/spl-token";

describe("Curver Swap Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Curver as Program<Curver>;
    const wallet = provider.wallet as anchor.Wallet;

    let globalConfigPDA: anchor.web3.PublicKey;
    let globalPDA: anchor.web3.PublicKey;
    let bondingCurvePDA: anchor.web3.PublicKey;
    let solVaultPDA: anchor.web3.PublicKey;
    let tokenMint: anchor.web3.PublicKey;
    let bondingCurveTokenAccount: anchor.web3.PublicKey;
    let userTokenAccount: anchor.web3.PublicKey;
    let globalState: any;

    before(async () => {
        console.log("\n=== Starting Swap Tests Setup ===");

        // Получаем PDA
        [globalConfigPDA] = await findGlobalConfigPDA(program.programId);
        [globalPDA] = await findGlobalPDA(program.programId);

        // Получаем состояние
        globalState = await program.account.global.fetch(globalPDA);
        console.log("Global state fetched");

        // Получаем существующую кривую - ищем по всем возможным токенам
        const allCurves = await program.account.bondingCurveState.all();
        if (allCurves.length === 0) {
            throw new Error("No bonding curves found. Run create tests first.");
        }

        const bondingCurve = allCurves[0];
        tokenMint = bondingCurve.account.vtokenMint;
        console.log("Using existing token mint:", tokenMint.toBase58());

        // Теперь получаем правильный PDA для этого токена
        [bondingCurvePDA] = await findBondingCurvePDA(program.programId, tokenMint);
        [solVaultPDA] = await findSolVaultPDA(program.programId, tokenMint);

        console.log("Bonding curve PDA:", bondingCurvePDA.toBase58());
        console.log("Initial reserves - SOL:", bondingCurve.account.vsolReserve.toString(), "Token:", bondingCurve.account.vtokenReserve.toString());

        // Получаем ATA
        userTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            wallet.publicKey
        );
        bondingCurveTokenAccount = await getAssociatedTokenAddress(
            tokenMint,
            bondingCurvePDA,
            true
        );
    });

    it("Should buy tokens successfully", async () => {
        console.log("\n=== Testing Buy Swap ===");
        try {
            // Создаем user token account если не существует
            try {
                await getAccount(provider.connection, userTokenAccount);
                console.log("User token account exists");
            } catch (error) {
                console.log("Creating user token account...");
                await createAssociatedTokenAccount(
                    provider.connection,
                    wallet.payer,
                    tokenMint,
                    wallet.publicKey
                );
                console.log("User token account created");
            }

            const solAmount = new BN(10_000_000); // 0.01 SOL для тестирования

            // Проверяем состояние кривой перед операцией
            const bondingCurveBefore = await program.account.bondingCurveState.fetch(bondingCurvePDA);
            console.log("Before buy - SOL reserve:", bondingCurveBefore.vsolReserve.toString());
            console.log("Before buy - Token reserve:", bondingCurveBefore.vtokenReserve.toString());

            const tx = await program.methods
                .buy(solAmount)
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePDA,
                    solVault: solVaultPDA,
                    userTokenAccount: userTokenAccount,
                    global: globalPDA,
                    globalConfig: globalConfigPDA,
                    protocolOwner: globalState.protocolOwner,
                    tokenCreator: globalState.tokenCreator,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Buy transaction signature:", tx);
            await provider.connection.confirmTransaction(tx);

            // Проверяем что токены получены
            const userAccount = await getAccount(provider.connection, userTokenAccount);
            assert(new BN(userAccount.amount.toString()).gt(new BN(0)), "User did not receive tokens");
            console.log("User received tokens:", userAccount.amount.toString());

            // Проверяем обновление резервов кривой
            const bondingCurveAfter = await program.account.bondingCurveState.fetch(bondingCurvePDA);
            console.log("After buy - SOL reserve:", bondingCurveAfter.vsolReserve.toString());
            console.log("After buy - Token reserve:", bondingCurveAfter.vtokenReserve.toString());

            // Резерв SOL должен увеличиться, резерв токенов - уменьшиться
            assert(bondingCurveAfter.vsolReserve.gt(bondingCurveBefore.vsolReserve), "SOL reserve should increase");
            assert(bondingCurveAfter.vtokenReserve.lt(bondingCurveBefore.vtokenReserve), "Token reserve should decrease");

        } catch (error) {
            console.error("Error during buy:", error);
            throw error;
        }
    });

    it("Should sell tokens successfully", async () => {
        console.log("\n=== Testing Sell Swap ===");
        try {
            // Проверяем что у пользователя есть токены для продажи
            let userAccount;
            try {
                userAccount = await getAccount(provider.connection, userTokenAccount);
            } catch (error) {
                console.log("User token account doesn't exist, skipping sell test");
                return;
            }

            const userBalance = new BN(userAccount.amount.toString());
            assert(userBalance.gt(new BN(0)), "User needs tokens to perform sell swap");

            const tokenAmount = userBalance.div(new BN(2)); // Продаем половину баланса
            console.log("Selling token amount:", tokenAmount.toString());

            // Проверяем состояние кривой перед операцией
            const bondingCurveBefore = await program.account.bondingCurveState.fetch(bondingCurvePDA);
            console.log("Before sell - SOL reserve:", bondingCurveBefore.vsolReserve.toString());
            console.log("Before sell - Token reserve:", bondingCurveBefore.vtokenReserve.toString());

            const tx = await program.methods
                .sell(tokenAmount)
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePDA,
                    solVault: solVaultPDA,
                    userTokenAccount: userTokenAccount,
                    global: globalPDA,
                    globalConfig: globalConfigPDA,
                    protocolOwner: globalState.protocolOwner,
                    tokenCreator: globalState.tokenCreator,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("Sell transaction signature:", tx);
            await provider.connection.confirmTransaction(tx);

            // Проверяем что токены списаны
            const finalUserAccount = await getAccount(provider.connection, userTokenAccount);
            assert(new BN(finalUserAccount.amount.toString()).lt(userBalance), "Tokens were not spent");
            console.log("Tokens sold:", userBalance.sub(new BN(finalUserAccount.amount.toString())).toString());

            // Проверяем обновление резервов кривой
            const bondingCurveAfter = await program.account.bondingCurveState.fetch(bondingCurvePDA);
            console.log("After sell - SOL reserve:", bondingCurveAfter.vsolReserve.toString());
            console.log("After sell - Token reserve:", bondingCurveAfter.vtokenReserve.toString());

            // Резерв токенов должен увеличиться, резерв SOL - уменьшиться
            assert(bondingCurveAfter.vtokenReserve.gt(bondingCurveBefore.vtokenReserve), "Token reserve should increase");
            assert(bondingCurveAfter.vsolReserve.lt(bondingCurveBefore.vsolReserve), "SOL reserve should decrease");

        } catch (error) {
            console.error("Error during sell:", error);
            throw error;
        }
    });

    it("Should fail when trying to sell more tokens than owned", async () => {
        console.log("\n=== Testing Sell Failure ===");

        let userAccount;
        try {
            userAccount = await getAccount(provider.connection, userTokenAccount);
        } catch (error) {
            console.log("User token account doesn't exist, skipping sell failure test");
            return;
        }

        const largeAmount = new BN(userAccount.amount.toString()).mul(new BN(2)); // Пытаемся продать в 2 раза больше чем есть

        try {
            await program.methods
                .sell(largeAmount)
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePDA,
                    solVault: solVaultPDA,
                    userTokenAccount: userTokenAccount,
                    global: globalPDA,
                    globalConfig: globalConfigPDA,
                    protocolOwner: globalState.protocolOwner,
                    tokenCreator: globalState.tokenCreator,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();
            assert.fail("Should have failed");
        } catch (error) {
            console.log("Expected error occurred:", error.message);
            // Проверяем что ошибка связана с недостатком средств
            const errorMessage = error.toString().toLowerCase();
            assert(
                errorMessage.includes("insufficient funds") ||
                errorMessage.includes("insufficient") ||
                errorMessage.includes("amount"),
                "Expected insufficient funds error"
            );
        }
    });

    it("Should fail when trying to buy with zero amount", async () => {
        console.log("\n=== Testing Buy with Zero Amount ===");

        try {
            await program.methods
                .buy(new BN(0))
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePDA,
                    solVault: solVaultPDA,
                    userTokenAccount: userTokenAccount,
                    global: globalPDA,
                    globalConfig: globalConfigPDA,
                    protocolOwner: globalState.protocolOwner,
                    tokenCreator: globalState.tokenCreator,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .rpc();
            assert.fail("Should have failed");
        } catch (error) {
            console.log("Expected error occurred:", error.message);
            const errorMessage = error.toString().toLowerCase();
            assert(
                errorMessage.includes("invalid amount"),
                "Expected invalid amount error"
            );
        }
    });
});