# Unified Graph Schema (Draft)

Purpose
A canonical schema for nodes/edges used across CyberCommand, IntelWeb, IntelDashboard, Analyzer, NetRunner outputs, and MarketExchange packaging.

Node
- id: string (stable, globally unique)
- kind: report | entity | location | event | source | evidence | account | infrastructure | indicator
- title: string
- classification: UNCLASSIFIED | CONFIDENTIAL | SECRET | TOP_SECRET
- confidence: 0..1
- timestamps: { createdAt?: string; updatedAt?: string; observedAt?: string; validFrom?: string; validTo?: string }
- geo?: { lat: number; lng: number; alt?: number }
- tags?: string[]
- aliases?: string[]
- provenance?: { sourceIds?: string[]; method?: string }
- metadata: Record<string, unknown>

Edge
- id: string
- source: node id
- target: node id
- predicate: owns | communicates_with | transfers_to | located_at | member_of | alias_of | same_as | co_occurs | cites | supports | contradicts | observed_with | related
- confidence: 0..1
- classification: as above
- evidenceIds?: string[]
- timestamps?: { observedAt?: string; validFrom?: string; validTo?: string }
- provenance?: { sourceIds?: string[]; method?: string }
- metadata: Record<string, unknown>

Notes
- alias_of/same_as power entity resolution.
- evidence nodes capture documents, screenshots, hashes, URLs, etc.
- Map to STIX where feasible for interoperability.
