// src/api/auth.ts
// Backend signature-based authentication API client (scaffold)

export interface BackendSession {
  token: string;
  expiresAt: number;
}

// Replace with your backend API base URL
const BACKEND_API_BASE = '/api';

export async function requestBackendNonce(address: string): Promise<string> {
  const res = await fetch(`${BACKEND_API_BASE}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error('Failed to fetch nonce from backend');
  const data = await res.json();
  return data.nonce;
}

export async function submitBackendSignature(address: string, signature: string): Promise<BackendSession> {
  const res = await fetch(`${BACKEND_API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature }),
  });
  if (!res.ok) throw new Error('Failed to verify signature with backend');
  const data = await res.json();
  return { token: data.token, expiresAt: data.expiresAt };
}
