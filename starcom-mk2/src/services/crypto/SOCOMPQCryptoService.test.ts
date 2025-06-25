// src/services/crypto/SOCOMPQCryptoService.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { SOCOMPQCryptoService, ClassificationLevel } from './SOCOMPQCryptoService';

describe('SOCOMPQCryptoService', () => {
  let cryptoService: SOCOMPQCryptoService;

  beforeAll(async () => {
    cryptoService = SOCOMPQCryptoService.getInstance();
    await cryptoService.initialize();
  });

  it('should initialize successfully', async () => {
    const status = await cryptoService.getSecurityStatus();
    expect(status.isWasmLoaded).toBe(true);
    expect(status.isSOCOMCompliant).toBe(true);
    expect(status.memorySafe).toBe(true);
  });

  it('should generate key pairs', async () => {
    const keyPair = await cryptoService.generateKEMKeyPair();
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey.length).toBeGreaterThan(0);
    expect(keyPair.privateKey.length).toBeGreaterThan(0);
    expect(keyPair.algorithm).toBe('ML-KEM-768');
  });

  it('should encrypt and decrypt data', async () => {
    const originalData = new TextEncoder().encode('Test message for encryption');
    
    const encrypted = await cryptoService.encryptClassifiedData(
      originalData, 
      ClassificationLevel.Confidential
    );
    
    expect(encrypted.quantumPart).toBeInstanceOf(Uint8Array);
    expect(encrypted.classification).toBe(ClassificationLevel.Confidential);
    expect(encrypted.algorithm).toBe('ML-DSA-65');
    
    const decrypted = await cryptoService.decryptClassifiedData(
      encrypted, 
      ClassificationLevel.Secret
    );
    
    expect(decrypted).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(decrypted)).toBe('Test message for encryption');
  });

  it('should enforce classification access control', async () => {
    const originalData = new TextEncoder().encode('Top Secret Data');
    
    const encrypted = await cryptoService.encryptClassifiedData(
      originalData, 
      ClassificationLevel.TopSecret
    );
    
    // Should fail with insufficient clearance
    await expect(
      cryptoService.decryptClassifiedData(encrypted, ClassificationLevel.Confidential)
    ).rejects.toThrow();
  });

  it('should generate consistent hashes', async () => {
    const testData = new TextEncoder().encode('Test data for hashing');
    
    const hash1 = await cryptoService.hashData(testData, 'BLAKE3');
    const hash2 = await cryptoService.hashData(testData, 'BLAKE3');
    
    expect(hash1).toBeInstanceOf(Uint8Array);
    expect(hash2).toBeInstanceOf(Uint8Array);
    expect(hash1).toEqual(hash2);
  });

  it('should generate random bytes', async () => {
    const randomBytes1 = await cryptoService.generateRandomBytes(32);
    const randomBytes2 = await cryptoService.generateRandomBytes(32);
    
    expect(randomBytes1).toBeInstanceOf(Uint8Array);
    expect(randomBytes2).toBeInstanceOf(Uint8Array);
    expect(randomBytes1.length).toBe(32);
    expect(randomBytes2.length).toBe(32);
    expect(randomBytes1).not.toEqual(randomBytes2); // Should be different
  });

  it('should maintain audit log', async () => {
    const auditLog = await cryptoService.getAuditLog();
    expect(Array.isArray(auditLog)).toBe(true);
    expect(auditLog.length).toBeGreaterThan(0);
  });

  it('should provide version information', async () => {
    const status = await cryptoService.getSecurityStatus();
    expect(typeof status.wasmVersion).toBe('string');
    expect(status.wasmVersion.length).toBeGreaterThan(0);
  });
});
