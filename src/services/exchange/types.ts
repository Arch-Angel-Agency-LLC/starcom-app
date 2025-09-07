// MarketExchange v0 types
export type LicenseType = 'CC-BY' | 'CC0' | 'PROPRIETARY' | 'OPEN';

export interface PackageManifest {
  id: string;
  name: string;
  version: string; // semver
  description: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  createdAt: string; // ISO
  author: string;
  license: LicenseType;
  reports: Array<{ id: string; title: string; checksum: string; path?: string }>; 
  intel: Array<{ id: string; title?: string; checksum: string; path?: string }>; 
  assets: Array<{ filename: string; checksum: string; size: number }>; 
  metadata: Record<string, unknown>;
}

export interface ComposeInput {
  name: string;
  description: string;
  classification: PackageManifest['classification'];
  license: LicenseType;
  author: string;
  reports: Array<{ id: string; title: string; content: string }>;
  intel: Array<{ id: string; title?: string; content: string }>;
  assets?: Array<{ filename: string; content: string | Uint8Array }>;
  analysisDeepLink?: string; // optional provenance
  redaction?: {
    stripDeepLink?: boolean;
    maskEmails?: boolean;
    maskNumbers?: boolean; // mask sequences of digits (>= 9)
  };
  signing?: {
    enabled: boolean;
    privateKeyHex?: string; // user-provided for local signing
  };
}

export interface ComposeResult {
  manifest: PackageManifest;
  blob: Blob; // zipped package (future); for now, JSON blob of manifest
}
