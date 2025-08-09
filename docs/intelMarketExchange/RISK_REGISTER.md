# Intelligence Market Exchange – Risk Register

| Risk ID | Category | Description | Impact | Likelihood | Current Mitigation | Future Mitigation |
|---------|----------|-------------|--------|------------|--------------------|-------------------|
| R1 | Integrity | Listings tampering (central JSON store) | Medium | High | Feature flag; non-prod disclaimers | On-chain anchor + signature verification |
| R2 | Economic | Fake purchase receipts (no payment verification) | High | High | Transitional only; not exposed when flag off | Integrate on-chain payment & deterministic key release |
| R3 | Access Control | Unauthorized data access (no encryption) | High | Medium | Only sample data used | Implement encryption + envelope keys |
| R4 | Abuse | /api/pin rate abuse (in-memory limiter) | Medium | Medium | Basic rate limit & size cap | Durable distributed rate limiting / edge worker |
| R5 | Key Management | Local Ed25519 keypair compromise (localStorage) | Medium | Medium | MVP; not production | Wallet-based signing + hardware/secure enclave |
| R6 | Privacy | Sensitive metadata leakage (unencrypted manifest) | Medium | Low | No sensitive prod data stored | Classify & redact / encrypted fields |
| R7 | Availability | Single serverless persistence file corruption | Low | Low | Non-critical transitional | Remove endpoint after decentralization |
| R8 | Legal/Compliance | Using transitional endpoints in production by mistake | High | Low | Feature flag gating | CI policy check forbidding flag=true in prod |

## Notes
- Impact/likelihood qualitative (Low/Medium/High) for quick triage.
- Update this file before resuming implementation phases.
