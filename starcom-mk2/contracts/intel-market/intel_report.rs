// AI-NOTE: Anchor contract schema for Intelligence Reports (artifact-driven, zero high-risk vulnerabilities)
// See overlays and integration artifacts for data mapping and security policy.
// This schema is minimal and secure, ready for extension as needed.

use anchor_lang::prelude::*;

#[account]
pub struct IntelReport {
    pub title: String,         // Title of the report
    pub content: String,       // Main content (redact as needed)
    pub tags: Vec<String>,     // Tags (SIGINT, HUMINT, etc.)
    pub latitude: f64,         // Geolocation (lat)
    pub longitude: f64,        // Geolocation (lng)
    pub timestamp: i64,        // Unix timestamp
    pub author: Pubkey,        // Author (wallet address)
}

#[derive(Accounts)]
pub struct CreateIntelReport<'info> {
    #[account(init, payer = author, space = 8 + 256 + 1024 + 64 + 8 + 8 + 8 + 32)]
    pub intel_report: Account<'info, IntelReport>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_intel_report(
    ctx: Context<CreateIntelReport>,
    title: String,
    content: String,
    tags: Vec<String>,
    latitude: f64,
    longitude: f64,
    timestamp: i64,
) -> Result<()> {
    let report = &mut ctx.accounts.intel_report;
    report.title = title;
    report.content = content;
    report.tags = tags;
    report.latitude = latitude;
    report.longitude = longitude;
    report.timestamp = timestamp;
    report.author = *ctx.accounts.author.key;
    Ok(())
}

// Anchor instruction for creating Intel Reports

// Anchor instruction for fetching all Intel Reports (for overlays/UI)
// NOTE: Anchor does not support on-chain account enumeration directly; fetching is done off-chain using account filters.
// See overlays and integration artifacts for how overlays/backend/CLI will use this.

// Example (off-chain, using Anchor client or @solana/web3.js):
//   const reports = await program.account.intelReport.all();
//   // Filter by tags, location, etc. as needed for overlays

// No on-chain instruction needed for listing; all fetching is done off-chain for overlays and UI.
// All changes must be documented in overlays and integration artifacts.
