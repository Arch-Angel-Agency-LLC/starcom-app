/* tslint:disable */
/* eslint-disable */
/**
 * Module initialization
 */
export function main(): void;
/**
 * SOCOM data classification levels
 */
export enum ClassificationLevel {
  Unclassified = 0,
  Confidential = 1,
  Secret = 2,
  TopSecret = 3,
}
/**
 * Cryptographic key pair for hybrid encryption
 */
export class CryptoKeyPair {
  private constructor();
  free(): void;
  readonly public_key: Uint8Array;
  readonly private_key: Uint8Array;
}
/**
 * Encrypted data with metadata
 */
export class EncryptedData {
  private constructor();
  free(): void;
  readonly ciphertext: Uint8Array;
  readonly nonce: Uint8Array;
  readonly classification: ClassificationLevel;
  readonly timestamp: bigint;
  readonly signature: Uint8Array;
}
/**
 * Main cryptographic service
 */
export class SOCOMPQCryptoCore {
  free(): void;
  /**
   * Initialize the cryptographic core
   */
  constructor();
  /**
   * Generate a new cryptographic key pair
   */
  generate_key_pair(): CryptoKeyPair;
  /**
   * Encrypt data with specified classification level
   */
  encrypt(data: Uint8Array, classification: ClassificationLevel): EncryptedData;
  /**
   * Decrypt data and verify classification access
   */
  decrypt(encrypted_data: EncryptedData, user_clearance: ClassificationLevel): Uint8Array;
  /**
   * Generate cryptographic hash with specified algorithm
   */
  hash_data(data: Uint8Array, algorithm: string): Uint8Array;
  /**
   * Get audit log for compliance monitoring
   */
  get_audit_log(): any[];
  /**
   * Clear audit log (authorized personnel only)
   */
  clear_audit_log(): void;
  /**
   * Check if cryptographic core is properly initialized
   */
  is_initialized(): boolean;
  /**
   * Get the version of the crypto core
   */
  version(): string;
  /**
   * Generate secure random bytes
   */
  generate_random_bytes(length: number): Uint8Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_cryptokeypair_free: (a: number, b: number) => void;
  readonly cryptokeypair_public_key: (a: number) => [number, number];
  readonly cryptokeypair_private_key: (a: number) => [number, number];
  readonly __wbg_encrypteddata_free: (a: number, b: number) => void;
  readonly encrypteddata_ciphertext: (a: number) => [number, number];
  readonly encrypteddata_nonce: (a: number) => [number, number];
  readonly encrypteddata_classification: (a: number) => number;
  readonly encrypteddata_timestamp: (a: number) => bigint;
  readonly encrypteddata_signature: (a: number) => [number, number];
  readonly __wbg_socompqcryptocore_free: (a: number, b: number) => void;
  readonly socompqcryptocore_new: () => number;
  readonly socompqcryptocore_generate_key_pair: (a: number) => [number, number, number];
  readonly socompqcryptocore_encrypt: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly socompqcryptocore_decrypt: (a: number, b: number, c: number) => [number, number, number, number];
  readonly socompqcryptocore_hash_data: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly socompqcryptocore_get_audit_log: (a: number) => [number, number];
  readonly socompqcryptocore_clear_audit_log: (a: number) => void;
  readonly socompqcryptocore_is_initialized: (a: number) => number;
  readonly socompqcryptocore_version: (a: number) => [number, number];
  readonly socompqcryptocore_generate_random_bytes: (a: number, b: number) => [number, number, number, number];
  readonly main: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
