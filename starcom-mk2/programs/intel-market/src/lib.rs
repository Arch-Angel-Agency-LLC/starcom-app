use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

// Program ID - will be updated when deployed
declare_id!("FXn5YEF4QoRXnoyAYNxWhByLkRNSgDsowZSSbFrCKW3c");

#[program]
pub mod intel_market {
    use super::*;

    /// Initialize the marketplace with admin authority
    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        fee_basis_points: u16,
        max_classification_level: u8,
    ) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.authority = *ctx.accounts.authority.key;
        marketplace.fee_basis_points = fee_basis_points;
        marketplace.max_classification_level = max_classification_level;
        marketplace.total_assets = 0;
        marketplace.total_volume = 0;
        marketplace.is_active = true;
        marketplace.created_at = Clock::get()?.unix_timestamp;
        
        emit!(MarketplaceInitialized {
            authority: marketplace.authority,
            fee_basis_points,
            max_classification_level,
        });
        
        Ok(())
    }

    /// Create a new intelligence asset NFT
    pub fn create_asset(
        ctx: Context<CreateAsset>,
        title: String,
        description: String,
        metadata_uri: String,
        asset_type: AssetType,
        classification_level: u8,
        source_type: SourceType,
        geographical_tags: Vec<String>,
        price: u64,
        access_requirements: Vec<String>,
    ) -> Result<()> {
        require!(title.len() <= 100, MarketplaceError::TitleTooLong);
        require!(description.len() <= 500, MarketplaceError::DescriptionTooLong);
        require!(metadata_uri.len() <= 200, MarketplaceError::UriTooLong);
        require!(
            classification_level <= ctx.accounts.marketplace.max_classification_level,
            MarketplaceError::ClassificationTooHigh
        );

        let asset = &mut ctx.accounts.asset;
        let clock = Clock::get()?;
        
        asset.mint = ctx.accounts.mint.key();
        asset.creator = *ctx.accounts.creator.key;
        asset.title = title.clone();
        asset.description = description.clone();
        asset.metadata_uri = metadata_uri.clone();
        asset.asset_type = asset_type;
        asset.classification_level = classification_level;
        asset.source_type = source_type;
        asset.geographical_tags = geographical_tags;
        asset.price = price;
        asset.access_requirements = access_requirements;
        asset.status = AssetStatus::Active;
        asset.created_at = clock.unix_timestamp;
        asset.updated_at = clock.unix_timestamp;
        asset.total_views = 0;
        asset.total_downloads = 0;
        asset.is_verified = false;

        // Update marketplace stats
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.total_assets += 1;

        emit!(AssetCreated {
            asset_id: asset.key(),
            mint: asset.mint,
            creator: asset.creator,
            title,
            asset_type,
            classification_level,
            price,
        });

        Ok(())
    }

    /// List an asset for sale
    pub fn list_asset(
        ctx: Context<ListAsset>,
        price: u64,
        is_auction: bool,
        auction_duration: Option<i64>,
        min_bid_increment: Option<u64>,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;
        
        listing.asset = ctx.accounts.asset.key();
        listing.seller = *ctx.accounts.seller.key;
        listing.price = price;
        listing.is_auction = is_auction;
        listing.status = ListingStatus::Active;
        listing.created_at = clock.unix_timestamp;
        listing.updated_at = clock.unix_timestamp;
        
        if is_auction {
            require!(auction_duration.is_some(), MarketplaceError::InvalidAuctionParams);
            require!(min_bid_increment.is_some(), MarketplaceError::InvalidAuctionParams);
            
            listing.auction_end = Some(clock.unix_timestamp + auction_duration.unwrap());
            listing.min_bid_increment = min_bid_increment;
            listing.highest_bid = 0;
            listing.highest_bidder = None;
        }

        // Update asset status
        let asset = &mut ctx.accounts.asset;
        asset.status = AssetStatus::Listed;
        asset.updated_at = clock.unix_timestamp;

        emit!(AssetListed {
            listing_id: listing.key(),
            asset_id: asset.key(),
            seller: listing.seller,
            price,
            is_auction,
        });

        Ok(())
    }

    /// Place a bid on an auction
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        bid_amount: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;
        
        require!(listing.is_auction, MarketplaceError::NotAnAuction);
        require!(listing.status == ListingStatus::Active, MarketplaceError::ListingNotActive);
        require!(
            listing.auction_end.unwrap() > clock.unix_timestamp,
            MarketplaceError::AuctionEnded
        );
        
        let min_bid = if listing.highest_bid == 0 {
            listing.price
        } else {
            listing.highest_bid + listing.min_bid_increment.unwrap_or(0)
        };
        
        require!(bid_amount >= min_bid, MarketplaceError::BidTooLow);

        // Transfer bid amount to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.bidder_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.bidder.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, bid_amount)?;

        // Update listing with new highest bid
        listing.highest_bid = bid_amount;
        listing.highest_bidder = Some(*ctx.accounts.bidder.key);
        listing.updated_at = clock.unix_timestamp;

        emit!(BidPlaced {
            listing_id: listing.key(),
            bidder: *ctx.accounts.bidder.key,
            bid_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Execute a direct purchase
    pub fn purchase_asset(
        ctx: Context<PurchaseAsset>,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let marketplace = &ctx.accounts.marketplace;
        
        require!(!listing.is_auction, MarketplaceError::CannotPurchaseAuction);
        require!(listing.status == ListingStatus::Active, MarketplaceError::ListingNotActive);

        let price = listing.price;
        let fee_amount = (price * marketplace.fee_basis_points as u64) / 10000;
        let seller_amount = price - fee_amount;

        // Transfer payment to seller
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, seller_amount)?;

        // Transfer fee to marketplace
        if fee_amount > 0 {
            let fee_cpi_accounts = Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.marketplace_fee_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            };
            let fee_cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), fee_cpi_accounts);
            token::transfer(fee_cpi_ctx, fee_amount)?;
        }

        // Update listing status
        listing.status = ListingStatus::Sold;
        listing.buyer = Some(*ctx.accounts.buyer.key);
        listing.sold_at = Some(Clock::get()?.unix_timestamp);

        // Update asset status
        let asset = &mut ctx.accounts.asset;
        asset.status = AssetStatus::Sold;
        asset.updated_at = Clock::get()?.unix_timestamp;

        // Update marketplace volume
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.total_volume += price;

        emit!(AssetPurchased {
            listing_id: listing.key(),
            asset_id: asset.key(),
            buyer: *ctx.accounts.buyer.key,
            seller: listing.seller,
            price,
            fee_amount,
        });

        Ok(())
    }

    /// Grant access to an asset
    pub fn grant_access(
        ctx: Context<GrantAccess>,
        access_level: AccessLevel,
        expiry: Option<i64>,
    ) -> Result<()> {
        let access_grant = &mut ctx.accounts.access_grant;
        let clock = Clock::get()?;
        
        access_grant.asset = ctx.accounts.asset.key();
        access_grant.grantor = *ctx.accounts.grantor.key;
        access_grant.grantee = ctx.accounts.grantee.key();
        access_grant.access_level = access_level;
        access_grant.granted_at = clock.unix_timestamp;
        access_grant.expires_at = expiry;
        access_grant.is_active = true;

        emit!(AccessGranted {
            asset_id: access_grant.asset,
            grantor: access_grant.grantor,
            grantee: access_grant.grantee,
            access_level,
            expires_at: expiry,
        });

        Ok(())
    }

    /// Create an audit log entry
    pub fn create_audit_log(
        ctx: Context<CreateAuditLog>,
        action: String,
        details: String,
        classification_level: u8,
    ) -> Result<()> {
        let audit_log = &mut ctx.accounts.audit_log;
        let clock = Clock::get()?;
        
        audit_log.user = *ctx.accounts.user.key;
        audit_log.action = action.clone();
        audit_log.details = details.clone();
        audit_log.asset = ctx.accounts.asset.map(|a| a.key());
        audit_log.classification_level = classification_level;
        audit_log.timestamp = clock.unix_timestamp;
        audit_log.ip_hash = [0u8; 32]; // Would be set by client
        audit_log.success = true;

        emit!(AuditLogCreated {
            user: audit_log.user,
            action,
            timestamp: audit_log.timestamp,
            classification_level,
        });

        Ok(())
    }

    /// Verify an asset (admin only)
    pub fn verify_asset(
        ctx: Context<VerifyAsset>,
        verification_notes: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key == &ctx.accounts.marketplace.authority,
            MarketplaceError::Unauthorized
        );

        let asset = &mut ctx.accounts.asset;
        asset.is_verified = true;
        asset.updated_at = Clock::get()?.unix_timestamp;

        emit!(AssetVerified {
            asset_id: asset.key(),
            verifier: *ctx.accounts.authority.key,
            notes: verification_notes,
        });

        Ok(())
    }
}

// ============================================================================
// Account Context Definitions
// ============================================================================

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Marketplace::LEN,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAsset<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Asset::LEN,
        seeds = [b"asset", mint.key().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListAsset<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Listing::LEN,
        seeds = [b"listing", asset.key().as_ref(), seller.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    #[account(mut)]
    pub bidder_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PurchaseAsset<'info> {
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub marketplace_fee_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GrantAccess<'info> {
    #[account(
        init,
        payer = grantor,
        space = 8 + AccessGrant::LEN,
        seeds = [b"access", asset.key().as_ref(), grantee.key().as_ref()],
        bump
    )]
    pub access_grant: Account<'info, AccessGrant>,
    pub asset: Account<'info, Asset>,
    #[account(mut)]
    pub grantor: Signer<'info>,
    /// CHECK: This is the grantee's public key
    pub grantee: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAuditLog<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + AuditLog::LEN,
        seeds = [b"audit", user.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub audit_log: Account<'info, AuditLog>,
    pub asset: Option<Account<'info, Asset>>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyAsset<'info> {
    #[account(mut)]
    pub asset: Account<'info, Asset>,
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// Account Data Structures
// ============================================================================

#[account]
pub struct Marketplace {
    pub authority: Pubkey,              // 32
    pub fee_basis_points: u16,          // 2
    pub max_classification_level: u8,    // 1
    pub total_assets: u64,              // 8
    pub total_volume: u64,              // 8
    pub is_active: bool,                // 1
    pub created_at: i64,                // 8
}

impl Marketplace {
    pub const LEN: usize = 32 + 2 + 1 + 8 + 8 + 1 + 8;
}

#[account]
pub struct Asset {
    pub mint: Pubkey,                   // 32
    pub creator: Pubkey,                // 32
    pub title: String,                  // 4 + 100
    pub description: String,            // 4 + 500
    pub metadata_uri: String,           // 4 + 200
    pub asset_type: AssetType,          // 1
    pub classification_level: u8,        // 1
    pub source_type: SourceType,        // 1
    pub geographical_tags: Vec<String>, // 4 + (4 + 50) * 10 = 544
    pub price: u64,                     // 8
    pub access_requirements: Vec<String>, // 4 + (4 + 100) * 5 = 524
    pub status: AssetStatus,            // 1
    pub created_at: i64,                // 8
    pub updated_at: i64,                // 8
    pub total_views: u64,               // 8
    pub total_downloads: u64,           // 8
    pub is_verified: bool,              // 1
}

impl Asset {
    pub const LEN: usize = 32 + 32 + 104 + 504 + 204 + 1 + 1 + 1 + 544 + 8 + 524 + 1 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Listing {
    pub asset: Pubkey,                  // 32
    pub seller: Pubkey,                 // 32
    pub price: u64,                     // 8
    pub is_auction: bool,               // 1
    pub auction_end: Option<i64>,       // 1 + 8
    pub min_bid_increment: Option<u64>, // 1 + 8
    pub highest_bid: u64,               // 8
    pub highest_bidder: Option<Pubkey>, // 1 + 32
    pub status: ListingStatus,          // 1
    pub buyer: Option<Pubkey>,          // 1 + 32
    pub created_at: i64,                // 8
    pub updated_at: i64,                // 8
    pub sold_at: Option<i64>,           // 1 + 8
}

impl Listing {
    pub const LEN: usize = 32 + 32 + 8 + 1 + 9 + 9 + 8 + 33 + 1 + 33 + 8 + 8 + 9;
}

#[account]
pub struct AccessGrant {
    pub asset: Pubkey,                  // 32
    pub grantor: Pubkey,                // 32
    pub grantee: Pubkey,                // 32
    pub access_level: AccessLevel,      // 1
    pub granted_at: i64,                // 8
    pub expires_at: Option<i64>,        // 1 + 8
    pub is_active: bool,                // 1
}

impl AccessGrant {
    pub const LEN: usize = 32 + 32 + 32 + 1 + 8 + 9 + 1;
}

#[account]
pub struct AuditLog {
    pub user: Pubkey,                   // 32
    pub action: String,                 // 4 + 100
    pub details: String,                // 4 + 500
    pub asset: Option<Pubkey>,          // 1 + 32
    pub classification_level: u8,        // 1
    pub timestamp: i64,                 // 8
    pub ip_hash: [u8; 32],              // 32
    pub success: bool,                  // 1
}

impl AuditLog {
    pub const LEN: usize = 32 + 104 + 504 + 33 + 1 + 8 + 32 + 1;
}

// ============================================================================
// Enums and Types
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetType {
    SIGINT,     // Signals Intelligence
    HUMINT,     // Human Intelligence  
    GEOINT,     // Geospatial Intelligence
    MASINT,     // Measurement and Signature Intelligence
    OSINT,      // Open Source Intelligence
    TECHINT,    // Technical Intelligence
    FININT,     // Financial Intelligence
    CYBINT,     // Cyber Intelligence
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SourceType {
    Primary,    // First-hand source
    Secondary,  // Analyzed/processed
    Synthetic,  // AI-generated/enhanced
    Composite,  // Multiple sources combined
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetStatus {
    Draft,      // Being created
    Active,     // Available for listing
    Listed,     // Currently listed for sale
    Sold,       // Sold/transferred
    Archived,   // No longer active
    Restricted, // Access restricted
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ListingStatus {
    Active,     // Available for purchase
    Sold,       // Successfully sold
    Cancelled,  // Cancelled by seller
    Expired,    // Auction expired
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AccessLevel {
    View,       // Can view metadata only
    Preview,    // Can view limited content
    Full,       // Full access to content
    Download,   // Can download asset
    Modify,     // Can modify asset
    Admin,      // Administrative access
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct MarketplaceInitialized {
    pub authority: Pubkey,
    pub fee_basis_points: u16,
    pub max_classification_level: u8,
}

#[event]
pub struct AssetCreated {
    pub asset_id: Pubkey,
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub title: String,
    pub asset_type: AssetType,
    pub classification_level: u8,
    pub price: u64,
}

#[event]
pub struct AssetListed {
    pub listing_id: Pubkey,
    pub asset_id: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub is_auction: bool,
}

#[event]
pub struct BidPlaced {
    pub listing_id: Pubkey,
    pub bidder: Pubkey,
    pub bid_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AssetPurchased {
    pub listing_id: Pubkey,
    pub asset_id: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub fee_amount: u64,
}

#[event]
pub struct AccessGranted {
    pub asset_id: Pubkey,
    pub grantor: Pubkey,
    pub grantee: Pubkey,
    pub access_level: AccessLevel,
    pub expires_at: Option<i64>,
}

#[event]
pub struct AuditLogCreated {
    pub user: Pubkey,
    pub action: String,
    pub timestamp: i64,
    pub classification_level: u8,
}

#[event]
pub struct AssetVerified {
    pub asset_id: Pubkey,
    pub verifier: Pubkey,
    pub notes: String,
}

// ============================================================================
// Error Definitions
// ============================================================================

#[error_code]
pub enum MarketplaceError {
    #[msg("Title too long (max 100 characters)")]
    TitleTooLong,
    #[msg("Description too long (max 500 characters)")]
    DescriptionTooLong,
    #[msg("URI too long (max 200 characters)")]
    UriTooLong,
    #[msg("Classification level exceeds maximum allowed")]
    ClassificationTooHigh,
    #[msg("Not an auction listing")]
    NotAnAuction,
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Auction has ended")]
    AuctionEnded,
    #[msg("Bid amount too low")]
    BidTooLow,
    #[msg("Cannot purchase auction items directly")]
    CannotPurchaseAuction,
    #[msg("Invalid auction parameters")]
    InvalidAuctionParams,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Asset not found")]
    AssetNotFound,
    #[msg("Insufficient access permissions")]
    InsufficientAccess,
    #[msg("Asset already verified")]
    AssetAlreadyVerified,
    #[msg("Invalid classification level")]
    InvalidClassificationLevel,
    #[msg("Marketplace not active")]
    MarketplaceNotActive,
    #[msg("Asset not available for listing")]
    AssetNotAvailable,
}
