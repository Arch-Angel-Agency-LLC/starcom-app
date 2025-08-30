# Future Extensions (Roadmap Placeholders)

This file enumerates planned features beyond MVP with brief design intent.

## Drift Detection
- Structural signature comparison of feeds & (later) HTML extracts.
- Alerts emitted with type=DRIFT when signature similarity < threshold.

## Variant Sampling
- Multiple fetches per article with different headers to detect A/B differences.
- Compute variantConsensus field (samples, disagreements).

## Provenance Layers
- extractionLayers[] array capturing { field, layer, valueHash, weight }.
- Confidence then computed from combined weights.

## IPFS Publishing
- Post-commit step pushes snapshot to IPFS; CID recorded in separate pointer file.
- Optional ENS text record updated out-of-band.

## Snapshot Signing
- Single-signer (Ed25519 or secp256k1) signature over canonical JSON hash.
- Later multi-signer quorum (m-of-n) with aggregated signature proofs.

## Language Detection
- Lightweight detection (e.g., compact models) to populate detectedLanguage.

## Additional Adapters
- Substack, Dev.to, Mirror.xyz, custom JSON sources.

## Adaptive Retry & Backoff
- Retry transient network errors with exponential backoff (max 2 tries).

## Historical Snapshot Rotation
- Maintain last N snapshots; prune older.

## Analytics Dashboard
- Visual diff of metrics across snapshots.

## P2P Distribution
- Gossip layer for distributing snapshot metadata over libp2p, verifying signatures.

## Summarization
- Add meta.extensions.summary (extractive / abstractive) with provenance tags.

## Differential Snapshots
- Provide delta files referencing previous snapshot ids to reduce bandwidth.

## Compression
- Provide gzipped variant; advertise file size savings.

---
Each future feature requires updating relevant spec docs before implementation.
