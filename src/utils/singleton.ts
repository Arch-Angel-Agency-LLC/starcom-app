export interface SingletonOptions<T> {
  warnOnReuse?: boolean;
  onReuse?: (key: string, existing: T) => void;
}

type Registry = Map<string, unknown>;

const getRegistry = (): Registry => {
  const globalKey = '__STARCOM_SINGLETONS__';
  const globalAny = globalThis as Record<string, unknown>;
  if (!globalAny[globalKey]) {
    globalAny[globalKey] = new Map<string, unknown>();
  }
  return globalAny[globalKey] as Registry;
};

const reuseWarned = new Set<string>();

export function getSingleton<T>(key: string, factory: () => T, options?: SingletonOptions<T>): T {
  const registry = getRegistry();
  if (registry.has(key)) {
    const existing = registry.get(key) as T;
    if (options?.warnOnReuse && !reuseWarned.has(key)) {
      console.warn(`[singleton] Reusing existing instance for key=${key}`);
      reuseWarned.add(key);
    }
    options?.onReuse?.(key, existing);
    return existing;
  }
  const instance = factory();
  registry.set(key, instance);
  return instance;
}

export function resetSingleton(key: string): void {
  const registry = getRegistry();
  registry.delete(key);
  reuseWarned.delete(key);
}

export function useSingleton<T>(key: string, factory: () => T, options?: SingletonOptions<T>): T {
  return getSingleton(key, factory, options);
}
