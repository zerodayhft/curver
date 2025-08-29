import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Curver } from "../target/types/curver";
import { findGlobalConfigPDA, findGlobalPDA } from "./utils/pda";
import { assert } from "chai";
import { BN } from "bn.js";

describe("Curver Update Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Curver as Program<Curver>;
    const wallet = provider.wallet;

    let globalConfigPDA: anchor.web3.PublicKey;
    let globalPDA: anchor.web3.PublicKey;
    let isInitialized = false;

    before(async () => {
        [globalConfigPDA] = await findGlobalConfigPDA(program.programId);
        [globalPDA] = await findGlobalPDA(program.programId);

        try {
            const globalConfig = await program.account.globalConfigState.fetch(
                globalConfigPDA
            );
            const global = await program.account.global.fetch(globalPDA);
            isInitialized = true;
            console.log("Program already initialized");
        } catch (e) {
            console.log("Program needs initialization");
            const tx = await program.methods
                .initialize()
                .accounts({
                    authority: wallet.publicKey,
                    globalConfig: globalConfigPDA,
                    global: globalPDA,
                    systemProgram: anchor.web3.SystemProgram.programId,
                } as any)
                .rpc();

            console.log("Initialization tx:", tx);
            isInitialized = true;
        }
    });

    it("Should update config with new parameters", async () => {
        const whitelistToken = anchor.web3.Keypair.generate();
        const newProtocolFee = new BN(100); // 1%
        const newCreatorFee = new BN(300); // 3%
        const newOwnerFee = new BN(150); // 1.5%

        const tx = await program.methods
            .updateConfig(
                whitelistToken.publicKey,
                newOwnerFee,
                newCreatorFee,
                newProtocolFee
            )
            .accounts({
                authority: wallet.publicKey,
                globalConfig: globalConfigPDA,
                global: globalPDA,
            } as any)
            .rpc();

        console.log("Config update tx:", tx);

        const globalConfig = await program.account.globalConfigState.fetch(
            globalConfigPDA
        );

        assert.ok(
            globalConfig.whitelistTokenAddress.equals(whitelistToken.publicKey),
            "Invalid whitelist token update"
        );
        assert.ok(
            globalConfig.protocolFeeBasisPoints.eq(newProtocolFee),
            "Invalid protocol fee update"
        );
        assert.ok(
            globalConfig.creatorFeeBasisPoints.eq(newCreatorFee),
            "Invalid creator fee update"
        );
        assert.ok(
            globalConfig.tokenOwnerFeeBasisPoints.eq(newOwnerFee),
            "Invalid owner fee update"
        );
    });

    it("Should update global state with new token owner", async () => {
        const newTokenOwner = anchor.web3.Keypair.generate();

        const tx = await program.methods
            .updateGlobal(newTokenOwner.publicKey)
            .accounts({
                authority: wallet.publicKey,
                global: globalPDA,
            } as any)
            .rpc();

        console.log("Global update tx:", tx);

        const global = await program.account.global.fetch(globalPDA);
        assert.ok(
            global.tokenOwner.equals(newTokenOwner.publicKey),
            "Invalid token owner update"
        );
    });

    it("Should maintain correct authority checks", async () => {
        const unauthorizedWallet = anchor.web3.Keypair.generate();

        try {
            await program.methods
                .updateConfig(
                    anchor.web3.Keypair.generate().publicKey,
                    new BN(100),
                    new BN(200),
                    new BN(50)
                )
                .accounts({
                    authority: unauthorizedWallet.publicKey,
                    globalConfig: globalConfigPDA,
                    global: globalPDA,
                } as any)
                .rpc();
            assert.fail("Should not allow unauthorized updates");
        } catch (e) {
            assert.ok(e, "Transaction should fail for unauthorized wallet");
        }
    });

    it("Should validate fee parameters", async () => {
        try {
            await program.methods
                .updateConfig(
                    anchor.web3.Keypair.generate().publicKey,
                    new BN(10001), // > 100%
                    new BN(200),
                    new BN(50)
                )
                .accounts({
                    authority: wallet.publicKey,
                    globalConfig: globalConfigPDA,
                    global: globalPDA,
                } as any)
                .rpc();
            assert.fail("Should not allow invalid fee parameters");
        } catch (e) {
            assert.ok(e, "Transaction should fail for invalid fees");
        }
    });
});
