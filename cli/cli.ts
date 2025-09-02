#!/usr/bin/env ts-node

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Curver } from "../target/types/curver";
import { initialize } from "./initialize";
import { create } from "./create";
import { updateConfig } from "./update_config";
import { buy } from "./buy";
import { sell } from "./sell";
import * as fs from "fs";
import * as path from "path";

// Program ID from Anchor.toml
const PROGRAM_ID = new PublicKey("Bw42ZPFART722nwPfVk5egiECYRxBCTqo1LpRtAA5mxr");

// Load owner keypair
function loadKeypair(filepath: string): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

// Setup connection and program
function setupProgram(): { connection: Connection; program: anchor.Program<Curver>; owner: Keypair } {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const owner = loadKeypair(path.join(__dirname, "..", "keys", "owner.json"));

    const provider = new anchor.AnchorProvider(
        connection,
        new anchor.Wallet(owner),
        { commitment: "confirmed" }
    );

    anchor.setProvider(provider);
    const program = new anchor.Program<Curver>(
        require("../target/idl/curver.json"),
        provider
    );

    return { connection, program, owner };
}

// Create command
async function createCommand() {
    try {
        console.log("Creating token with Curver program...");

        const { program, owner } = setupProgram();

        // Load configuration from JSON
        const configPath = path.join(__dirname, "setup_cfg", "create.json");
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Generate new mint keypair
        const mintKeypair = Keypair.generate();

        console.log(`Owner: ${owner.publicKey.toString()}`);
        console.log(`Program ID: ${PROGRAM_ID.toString()}`);
        console.log(`New Mint: ${mintKeypair.publicKey.toString()}`);
        console.log(`Token Name: ${config.name}`);
        console.log(`Token Symbol: ${config.symbol}`);

        // Create mint account first (like in tests)
        const { connection } = setupProgram();
        const lamports = await connection.getMinimumBalanceForRentExemption(82);
        const { TOKEN_PROGRAM_ID, createInitializeMintInstruction } = await import("@solana/spl-token");
        const { Transaction, SystemProgram } = await import("@solana/web3.js");

        const createMintTx = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: owner.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: 82,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                9,
                owner.publicKey,
                owner.publicKey
            )
        );

        await program.provider.sendAndConfirm(createMintTx, [mintKeypair]);
        console.log("Mint account created and initialized");

        const result = await create(
            program,
            owner,
            mintKeypair.publicKey,
            {
                name: config.name,
                symbol: config.symbol,
                uri: config.uri
            }
        );

        console.log("\nToken creation successful!");
        console.log(`Transaction: ${result.tx}`);
        console.log(`Bonding Curve: ${result.bondingCurve.toString()}`);
        console.log(`Associated Bonding Curve: ${result.associatedBondingCurve.toString()}`);

    } catch (error) {
        console.error("Token creation failed:", error);
        process.exit(1);
    }
}

// Update config command
async function updateConfigCommand() {
    try {
        console.log("Updating Curver program configuration...");

        const { program, owner } = setupProgram();

        // Load configuration from JSON
        const configPath = path.join(__dirname, "setup_cfg", "update_config.json");
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`Authority: ${owner.publicKey.toString()}`);
        console.log(`Program ID: ${PROGRAM_ID.toString()}`);
        console.log(`Fee Recipient Basis Points: ${config.feeRecipientBasisPoints}`);
        console.log(`Creator Fee Basis Points: ${config.creatorFeeBasisPoints}`);
        console.log(`Protocol Fee Basis Points: ${config.protocolFeeBasisPoints}`);

        const result = await updateConfig(
            program,
            owner,
            config.feeRecipientBasisPoints,
            config.creatorFeeBasisPoints,
            config.protocolFeeBasisPoints
        );

        console.log("\nConfiguration update successful!");
        console.log(`Transaction: ${result.tx}`);
        console.log(`Global PDA: ${result.global.toString()}`);
        console.log(`Global Config PDA: ${result.globalConfig.toString()}`);

    } catch (error) {
        console.error("Configuration update failed:", error);
        process.exit(1);
    }
}

// Initialize command
async function initializeCommand() {
    try {
        console.log("Initializing Curver program...");

        const { program, owner } = setupProgram();

        console.log(`Owner: ${owner.publicKey.toString()}`);
        console.log(`Program ID: ${PROGRAM_ID.toString()}`);

        const result = await initialize(program, owner);

        console.log("\nInitialization successful!");
        console.log(`Transaction: ${result.tx}`);
        console.log(`Global PDA: ${result.global.toString()}`);
        console.log(`Global Config PDA: ${result.globalConfig.toString()}`);

    } catch (error) {
        console.error("Initialization failed:", error);
        process.exit(1);
    }
}

// List available tokens command
async function listCommand() {
    try {
        console.log("Получение списка доступных токенов...");

        const { program } = setupProgram();

        // Получаем все bonding curves
        const allCurves = await program.account.bondingCurveState.all();

        if (allCurves.length === 0) {
            console.log("Нет доступных токенов. Сначала создайте токен командой 'create'.");
            return;
        }

        console.log(`\nНайдено ${allCurves.length} токенов:\n`);

        for (let i = 0; i < allCurves.length; i++) {
            const curve = allCurves[i];
            console.log(`${i + 1}. Mint: ${curve.account.vtokenMint.toBase58()}`);
            console.log(`   SOL резерв: ${curve.account.vsolReserve.toString()} lamports`);
            console.log(`   Token резерв: ${curve.account.vtokenReserve.toString()}`);
            console.log(`   Общий запас: ${curve.account.totalSupply.toString()}`);
            console.log("");
        }

    } catch (error) {
        console.error("Ошибка при получении списка токенов:", error);
        process.exit(1);
    }
}

// Buy command
async function buyCommand() {
    const args = process.argv.slice(3); // Skip 'ts-node', 'cli.ts', 'buy'

    if (args.length < 2) {
        console.log("Usage: ts-node cli.ts buy <mint_address> <amount_in_sol>");
        console.log("Example: ts-node cli.ts buy 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM 0.1");
        console.log("\nДля получения списка доступных токенов используйте: ts-node cli.ts list");
        return;
    }

    const mintAddress = args[0];
    const amount = parseFloat(args[1]);

    if (isNaN(amount) || amount <= 0) {
        console.error("Amount must be a positive number");
        return;
    }

    try {
        console.log(`Покупка ${amount} SOL токенов для mint: ${mintAddress}`);

        const { program, owner } = setupProgram();
        const mint = new PublicKey(mintAddress);

        // Проверяем, что mint существует и является токеном
        const mintInfo = await program.provider.connection.getAccountInfo(mint);
        if (!mintInfo) {
            console.error("Ошибка: Mint аккаунт не найден");
            console.log("Используйте команду 'list' для получения списка доступных токенов");
            return;
        }

        if (!mintInfo.owner.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))) {
            console.error("Ошибка: Указанный адрес не является токеном SPL");
            console.log("Используйте команду 'list' для получения списка доступных токенов");
            return;
        }

        const amountBN = new anchor.BN(amount * 1e9); // Convert SOL to lamports

        const tx = await buy(program, owner, mint, amountBN);
        console.log(`Покупка успешна! Транзакция: ${tx}`);
    } catch (error) {
        console.error("Ошибка при покупке:", error);
        if (error.toString().includes("AccountOwnedByWrongProgram")) {
            console.log("\nСовет: Убедитесь, что вы используете правильный адрес mint токена.");
            console.log("Используйте команду 'list' для получения списка доступных токенов.");
        }
        process.exit(1);
    }
}

// Sell command
async function sellCommand() {
    const args = process.argv.slice(3); // Skip 'ts-node', 'cli.ts', 'sell'

    if (args.length < 2) {
        console.log("Usage: ts-node cli.ts sell <mint_address> <token_amount>");
        console.log("Example: ts-node cli.ts sell 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM 1000000");
        console.log("\nДля получения списка доступных токенов используйте: ts-node cli.ts list");
        return;
    }

    const mintAddress = args[0];
    const amount = parseFloat(args[1]);

    if (isNaN(amount) || amount <= 0) {
        console.error("Amount must be a positive number");
        return;
    }

    try {
        console.log(`Продажа ${amount} токенов для mint: ${mintAddress}`);

        const { program, owner } = setupProgram();
        const mint = new PublicKey(mintAddress);

        // Проверяем, что mint существует и является токеном
        const mintInfo = await program.provider.connection.getAccountInfo(mint);
        if (!mintInfo) {
            console.error("Ошибка: Mint аккаунт не найден");
            console.log("Используйте команду 'list' для получения списка доступных токенов");
            return;
        }

        if (!mintInfo.owner.equals(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))) {
            console.error("Ошибка: Указанный адрес не является токеном SPL");
            console.log("Используйте команду 'list' для получения списка доступных токенов");
            return;
        }

        const amountBN = new anchor.BN(amount); // Token amount (not SOL)

        const tx = await sell(program, owner, mint, amountBN);
        console.log(`Продажа успешна! Транзакция: ${tx}`);
    } catch (error) {
        console.error("Ошибка при продаже:", error);
        if (error.toString().includes("У пользователя нет token account")) {
            console.log("\nСовет: Сначала купите токены, чтобы их можно было продать.");
        }
        process.exit(1);
    }
}

// Main CLI function
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("Curver CLI - Bonding Curve Token Management");
        console.log("");
        console.log("Usage: ts-node cli.ts <command> [options]");
        console.log("");
        console.log("Commands:");
        console.log("  init                          Initialize the Curver program");
        console.log("  create                        Create a new token using config from setup_cfg/create.json");
        console.log("  update-config                 Update program configuration using setup_cfg/update_config.json");
        console.log("  list                          List available tokens");
        console.log("  buy <mint> <amount>           Buy tokens with SOL");
        console.log("  sell <mint> <amount>          Sell tokens for SOL");
        console.log("  help                          Show this help message");
        console.log("");
        console.log("Examples:");
        console.log("  ts-node cli.ts create");
        console.log("  ts-node cli.ts list");
        console.log("  ts-node cli.ts buy 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM 0.1");
        console.log("  ts-node cli.ts sell 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM 1000000");
        return;
    }

    const command = args[0];

    switch (command) {
        case "init":
            await initializeCommand();
            break;
        case "create":
            await createCommand();
            break;
        case "update-config":
            await updateConfigCommand();
            break;
        case "list":
            await listCommand();
            break;
        case "buy":
            await buyCommand();
            break;
        case "sell":
            await sellCommand();
            break;
        default:
            console.log(`Unknown command: ${command}`);
            console.log("Available commands: init, create, update-config, list, buy, sell");
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}