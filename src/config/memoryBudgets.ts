const MB = 1_000_000;

const toNumber = (value: string | number | undefined, fallback: number) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) && parsed! > 0 ? Number(parsed) : fallback;
};

const toBytes = (valueMb: string | number | undefined, fallbackMb: number) =>
  Math.round(toNumber(valueMb, fallbackMb) * MB);

export interface MemoryBudgetConfig {
  ecoHeapBudgetBytes: number;
  warningBytes: number;
  criticalBytes: number;
  emitDeltaBytes: number;
  checkIntervalMs: number;
}

export const memoryBudgetConfig: MemoryBudgetConfig = {
  ecoHeapBudgetBytes: toBytes(import.meta.env?.VITE_ECO_HEAP_BUDGET_MB, 1024),
  warningBytes: toBytes(import.meta.env?.VITE_MEMORY_WARNING_MB, 768),
  criticalBytes: toBytes(import.meta.env?.VITE_MEMORY_CRITICAL_MB, 960),
  emitDeltaBytes: toBytes(import.meta.env?.VITE_MEMORY_DELTA_MB, 64),
  checkIntervalMs: toNumber(import.meta.env?.VITE_MEMORY_CHECK_INTERVAL_MS, 15_000)
};
