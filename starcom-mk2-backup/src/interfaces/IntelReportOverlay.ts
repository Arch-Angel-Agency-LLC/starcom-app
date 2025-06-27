// AI-NOTE: Artifact-driven interface for Intel Report overlays and market data.
// See overlays, integration, and code audit artifacts for requirements and mapping.
// This interface is used by overlays, GlobeEngine, and UI components.

export interface IntelReportOverlayMarker {
  pubkey: string; // Solana account pubkey (base58)
  title: string;
  content: string;
  tags: string[]; // e.g., ['SIGINT', 'HUMINT']
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
  author: string; // Wallet address (base58)
}

// Example: overlays and GlobeEngine should use this interface for all live data.
// All changes must be documented in overlays artifact and referenced in code.
