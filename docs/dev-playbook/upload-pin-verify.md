# Upload → Pin → Verify Checklist

1) Prepare
- Ensure orchestrator routes to RelayNode if available, else fallback
- Set team context if needed

2) Upload
- Call storeContent(data, options)
- Capture returned hash/CID and size

3) Pin
- If RelayNode: pin via /api/ipfs/pin/<hash>
- Else: pin with provider (serverless API) or Helia-connected node

4) Verify
- Download by hash and compare checksums
- Validate availability from at least one public gateway if public content

5) Log
- Record CID, source (relay/fallback), timestamp, and verification result
