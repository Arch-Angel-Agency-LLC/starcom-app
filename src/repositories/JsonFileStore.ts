import { promises as fs } from 'fs';
import path from 'path';

export class JsonFileStore<T extends { id: string }> {
  private filePath: string;
  private cache: Map<string, T> = new Map();
  private loaded = false;

  constructor(filename: string = 'data_store.json') {
    this.filePath = path.join(process.cwd(), '.data', filename);
  }

  private async ensureLoaded() {
    if (this.loaded) return;
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const arr: T[] = JSON.parse(data);
      arr.forEach(item => this.cache.set(item.id, item));
    } catch {
      // Ignore missing file
    }
    this.loaded = true;
  }

  private async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const arr = Array.from(this.cache.values());
    await fs.writeFile(this.filePath, JSON.stringify(arr, null, 2), 'utf-8');
  }

  async all(): Promise<T[]> {
    await this.ensureLoaded();
    return Array.from(this.cache.values());
  }

  async get(id: string): Promise<T | undefined> {
    await this.ensureLoaded();
    return this.cache.get(id);
  }

  async put(obj: T): Promise<void> {
    await this.ensureLoaded();
    this.cache.set(obj.id, obj);
    await this.persist();
  }

  // Test utility: replace all records atomically
  async replaceAll(objs: T[]): Promise<void> {
    await this.ensureLoaded();
    this.cache.clear();
    objs.forEach(o => this.cache.set(o.id, o));
    await this.persist();
  }
}
