// Client loader for content snapshots (MVP)
import type { Snapshot } from '../../../scripts/snapshot/core/schema';

export async function loadLatestSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch('/content-snapshots/latest.json', { signal, headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Failed to load snapshot (${res.status})`);
  return res.json();
}
