use anchor_lang::prelude::*;

// Program ID placeholder - will be replaced when deployed
declare_id!("PLACEHOLDER_PROGRAM_ID");

#[program]
pub mod intel_market {
    use super::*;

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
}

#[derive(Accounts)]
pub struct CreateIntelReport<'info> {
    #[account(init, payer = author, space = 8 + 256 + 1024 + 64 + 8 + 8 + 8 + 32)]
    pub intel_report: Account<'info, IntelReport>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

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
