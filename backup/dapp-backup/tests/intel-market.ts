import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IntelMarket } from "../target/types/intel_market";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert, expect } from "chai";

describe("Intelligence Market Exchange", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.IntelMarket as Program<IntelMarket>;
  const provider = anchor.getProvider();

  let marketplace: PublicKey;
  let marketplaceBump: number;
  let authority: Keypair;
  let creator: Keypair;
  let buyer: Keypair;
  let seller: Keypair;
  let mint: PublicKey;
  let asset: PublicKey;
  let listing: PublicKey;

  before(async () => {
    // Initialize test accounts
    authority = Keypair.generate();
    creator = Keypair.generate();
    buyer = Keypair.generate();
    seller = Keypair.generate();

    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(creator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(buyer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(seller.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      ),
    ]);

    // Find marketplace PDA
    [marketplace, marketplaceBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );

    // Create test mint
    mint = await createMint(
      provider.connection,
      creator,
      creator.publicKey,
      null,
      9
    );
  });

  describe("Marketplace Initialization", () => {
    it("Initializes the marketplace", async () => {
      const tx = await program.methods
        .initializeMarketplace(500, 5) // 5% fee, max classification level 5
        .accounts({
          marketplace,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("Initialize marketplace transaction signature:", tx);

      // Verify marketplace state
      const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
      assert.ok(marketplaceAccount.authority.equals(authority.publicKey));
      assert.equal(marketplaceAccount.feeBasisPoints, 500);
      assert.equal(marketplaceAccount.maxClassificationLevel, 5);
      assert.equal(marketplaceAccount.totalAssets.toNumber(), 0);
      assert.equal(marketplaceAccount.totalVolume.toNumber(), 0);
      assert.isTrue(marketplaceAccount.isActive);
    });
  });

  describe("Asset Creation", () => {
    it("Creates a new intelligence asset", async () => {
      // Find asset PDA
      [asset] = await PublicKey.findProgramAddressSync(
        [Buffer.from("asset"), mint.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .createAsset(
          "SIGINT Report - Operation Phoenix",
          "Detailed signals intelligence from Middle East operations",
          "https://ipfs.io/ipfs/QmTest123...",
          { sigint: {} },
          3, // Classification level
          { primary: {} },
          ["Middle East", "Syria", "SIGINT"],
          new anchor.BN(1000000), // Price in lamports
          ["CLEARANCE_SECRET", "NEED_TO_KNOW"]
        )
        .accounts({
          asset,
          marketplace,
          mint,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      console.log("Create asset transaction signature:", tx);

      // Verify asset state
      const assetAccount = await program.account.asset.fetch(asset);
      assert.ok(assetAccount.mint.equals(mint));
      assert.ok(assetAccount.creator.equals(creator.publicKey));
      assert.equal(assetAccount.title, "SIGINT Report - Operation Phoenix");
      assert.equal(assetAccount.classificationLevel, 3);
      assert.equal(assetAccount.price.toNumber(), 1000000);
      assert.equal(assetAccount.status.active, undefined); // Check enum variant
      assert.isFalse(assetAccount.isVerified);

      // Verify marketplace stats updated
      const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
      assert.equal(marketplaceAccount.totalAssets.toNumber(), 1);
    });

    it("Verifies an asset (admin only)", async () => {
      const tx = await program.methods
        .verifyAsset("Verified by intelligence review board")
        .accounts({
          asset,
          marketplace,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Verify asset transaction signature:", tx);

      // Verify asset is now verified
      const assetAccount = await program.account.asset.fetch(asset);
      assert.isTrue(assetAccount.isVerified);
    });

    it("Fails to verify asset with wrong authority", async () => {
      try {
        await program.methods
          .verifyAsset("Unauthorized verification attempt")
          .accounts({
            asset,
            marketplace,
            authority: creator.publicKey, // Wrong authority
          })
          .signers([creator])
          .rpc();
        
        assert.fail("Should have failed with unauthorized error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Unauthorized");
      }
    });
  });

  describe("Asset Listing", () => {
    before(async () => {
      // Transfer asset ownership to seller for listing
      seller = creator; // For simplicity in this test
    });

    it("Lists an asset for fixed price sale", async () => {
      // Find listing PDA
      [listing] = await PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), asset.toBuffer(), seller.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .listAsset(
          new anchor.BN(2000000), // Price
          false, // Not an auction
          null, // No auction duration
          null  // No min bid increment
        )
        .accounts({
          listing,
          asset,
          seller: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      console.log("List asset transaction signature:", tx);

      // Verify listing state
      const listingAccount = await program.account.listing.fetch(listing);
      assert.ok(listingAccount.asset.equals(asset));
      assert.ok(listingAccount.seller.equals(seller.publicKey));
      assert.equal(listingAccount.price.toNumber(), 2000000);
      assert.isFalse(listingAccount.isAuction);
      assert.equal(listingAccount.status.active, undefined); // Check enum variant

      // Verify asset status updated
      const assetAccount = await program.account.asset.fetch(asset);
      assert.equal(assetAccount.status.listed, undefined); // Check enum variant
    });

    it("Lists an asset for auction", async () => {
      // Create another asset for auction test
      const auctionMint = await createMint(
        provider.connection,
        creator,
        creator.publicKey,
        null,
        9
      );

      const [auctionAsset] = await PublicKey.findProgramAddressSync(
        [Buffer.from("asset"), auctionMint.toBuffer()],
        program.programId
      );

      // Create auction asset
      await program.methods
        .createAsset(
          "HUMINT Report - Auction Test",
          "Human intelligence report for auction",
          "https://ipfs.io/ipfs/QmAuction123...",
          { humint: {} },
          2,
          { secondary: {} },
          ["Europe", "HUMINT"],
          new anchor.BN(500000),
          ["CLEARANCE_CONFIDENTIAL"]
        )
        .accounts({
          asset: auctionAsset,
          marketplace,
          mint: auctionMint,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const [auctionListing] = await PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), auctionAsset.toBuffer(), creator.publicKey.toBuffer()],
        program.programId
      );

      const auctionDuration = 3600; // 1 hour
      const minBidIncrement = new anchor.BN(100000);

      const tx = await program.methods
        .listAsset(
          new anchor.BN(500000), // Starting price
          true, // Is auction
          new anchor.BN(auctionDuration),
          minBidIncrement
        )
        .accounts({
          listing: auctionListing,
          asset: auctionAsset,
          seller: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      console.log("List auction transaction signature:", tx);

      // Verify auction listing
      const auctionListingAccount = await program.account.listing.fetch(auctionListing);
      assert.isTrue(auctionListingAccount.isAuction);
      assert.isNotNull(auctionListingAccount.auctionEnd);
      assert.equal(auctionListingAccount.minBidIncrement.toNumber(), 100000);
    });
  });

  describe("Access Control", () => {
    it("Grants access to an asset", async () => {
      const grantee = Keypair.generate();
      
      const [accessGrant] = await PublicKey.findProgramAddressSync(
        [Buffer.from("access"), asset.toBuffer(), grantee.publicKey.toBuffer()],
        program.programId
      );

      const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const tx = await program.methods
        .grantAccess(
          { view: {} }, // Access level
          new anchor.BN(expiry)
        )
        .accounts({
          accessGrant,
          asset,
          grantor: creator.publicKey,
          grantee: grantee.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      console.log("Grant access transaction signature:", tx);

      // Verify access grant
      const accessGrantAccount = await program.account.accessGrant.fetch(accessGrant);
      assert.ok(accessGrantAccount.asset.equals(asset));
      assert.ok(accessGrantAccount.grantor.equals(creator.publicKey));
      assert.ok(accessGrantAccount.grantee.equals(grantee.publicKey));
      assert.isTrue(accessGrantAccount.isActive);
      assert.equal(accessGrantAccount.expiresAt.toNumber(), expiry);
    });
  });

  describe("Audit Logging", () => {
    it("Creates an audit log entry", async () => {
      const user = creator;
      const timestamp = Math.floor(Date.now() / 1000);
      
      const [auditLog] = await PublicKey.findProgramAddressSync(
        [Buffer.from("audit"), user.publicKey.toBuffer(), Buffer.from(timestamp.toString())],
        program.programId
      );

      const tx = await program.methods
        .createAuditLog(
          "ASSET_VIEW",
          "User viewed classified intelligence asset",
          3 // Classification level
        )
        .accounts({
          auditLog,
          asset,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Create audit log transaction signature:", tx);

      // Verify audit log
      const auditLogAccount = await program.account.auditLog.fetch(auditLog);
      assert.ok(auditLogAccount.user.equals(user.publicKey));
      assert.equal(auditLogAccount.action, "ASSET_VIEW");
      assert.equal(auditLogAccount.classificationLevel, 3);
      assert.isTrue(auditLogAccount.success);
    });
  });

  describe("Error Handling", () => {
    it("Fails to create asset with title too long", async () => {
      const longTitle = "A".repeat(101); // Exceeds 100 character limit
      
      const testMint = await createMint(
        provider.connection,
        creator,
        creator.publicKey,
        null,
        9
      );

      const [testAsset] = await PublicKey.findProgramAddressSync(
        [Buffer.from("asset"), testMint.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createAsset(
            longTitle,
            "Valid description",
            "https://ipfs.io/ipfs/QmTest...",
            { sigint: {} },
            1,
            { primary: {} },
            ["Test"],
            new anchor.BN(1000),
            ["PUBLIC"]
          )
          .accounts({
            asset: testAsset,
            marketplace,
            mint: testMint,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        
        assert.fail("Should have failed with title too long error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Title too long");
      }
    });

    it("Fails to create asset with classification level too high", async () => {
      const testMint = await createMint(
        provider.connection,
        creator,
        creator.publicKey,
        null,
        9
      );

      const [testAsset] = await PublicKey.findProgramAddressSync(
        [Buffer.from("asset"), testMint.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createAsset(
            "Valid title",
            "Valid description",
            "https://ipfs.io/ipfs/QmTest...",
            { sigint: {} },
            10, // Exceeds max classification level of 5
            { primary: {} },
            ["Test"],
            new anchor.BN(1000),
            ["PUBLIC"]
          )
          .accounts({
            asset: testAsset,
            marketplace,
            mint: testMint,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        
        assert.fail("Should have failed with classification too high error");
      } catch (error) {
        expect(error.error.errorMessage).to.include("Classification level exceeds maximum");
      }
    });
  });
});
