// Lesson 6: Build Your Own Factory - Complete DataSource Implementation

// Base types
export interface Entity {
  id: string;
}

export interface DataSource<T extends Entity> {
  fetch(): Promise<T[]>;
  fetchOne(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Configurations
export type DataSourceType = "rest" | "localstorage" | "memory";

export interface RestDataSourceConfig {
  type: "rest";
  baseUrl: string;
  endpoint: string;
}

export interface LocalStorageDataSourceConfig {
  type: "localstorage";
  key: string;
}

export interface MemoryDataSourceConfig {
  type: "memory";
}

export type DataSourceConfig =
  | RestDataSourceConfig
  | LocalStorageDataSourceConfig
  | MemoryDataSourceConfig;

// REST Implementation (Mock)
class RestDataSource<T extends Entity> implements DataSource<T> {
  constructor(private config: RestDataSourceConfig) {}

  async fetch(): Promise<T[]> {
    console.log(`🌐 GET ${this.config.baseUrl}/${this.config.endpoint}`);
    // Mock data
    return [];
  }

  async fetchOne(id: string): Promise<T | null> {
    console.log(`🌐 GET ${this.config.baseUrl}/${this.config.endpoint}/${id}`);
    return null;
  }

  async create(data: Partial<T>): Promise<T> {
    console.log(`🌐 POST ${this.config.baseUrl}/${this.config.endpoint}`, data);
    return { ...data, id: crypto.randomUUID() } as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    console.log(`🌐 PUT ${this.config.baseUrl}/${this.config.endpoint}/${id}`, data);
    return { ...data, id } as T;
  }

  async delete(id: string): Promise<void> {
    console.log(`🌐 DELETE ${this.config.baseUrl}/${this.config.endpoint}/${id}`);
  }
}

// LocalStorage Implementation (Simulated)
class LocalStorageDataSource<T extends Entity> implements DataSource<T> {
  private storage = new Map<string, string>();

  constructor(private config: LocalStorageDataSourceConfig) {}

  private getData(): T[] {
    const data = this.storage.get(this.config.key);
    return data ? JSON.parse(data) : [];
  }

  private setData(data: T[]): void {
    this.storage.set(this.config.key, JSON.stringify(data));
  }

  async fetch(): Promise<T[]> {
    console.log(`📦 Reading from storage: ${this.config.key}`);
    return this.getData();
  }

  async fetchOne(id: string): Promise<T | null> {
    const items = this.getData();
    return items.find((item) => item.id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const items = this.getData();
    const newItem = { ...data, id: crypto.randomUUID() } as T;
    items.push(newItem);
    this.setData(items);
    console.log(`💾 Created in storage: ${this.config.key}`);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const items = this.getData();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);
    
    const updated = { ...items[index], ...data };
    items[index] = updated;
    this.setData(items);
    console.log(`💾 Updated in storage: ${this.config.key}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const items = this.getData();
    const filtered = items.filter((item) => item.id !== id);
    this.setData(filtered);
    console.log(`🗑️  Deleted from storage: ${this.config.key}`);
  }
}

// Memory Implementation
class MemoryDataSource<T extends Entity> implements DataSource<T> {
  private data: T[] = [];

  async fetch(): Promise<T[]> {
    console.log(`🧠 Reading from memory (${this.data.length} items)`);
    return [...this.data];
  }

  async fetchOne(id: string): Promise<T | null> {
    return this.data.find((item) => item.id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const item = { ...data, id: crypto.randomUUID() } as T;
    this.data.push(item);
    console.log(`💾 Created in memory`);
    return item;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);
    
    this.data[index] = { ...this.data[index], ...data };
    console.log(`💾 Updated in memory`);
    return this.data[index];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter((item) => item.id !== id);
    console.log(`🗑️  Deleted from memory`);
  }
}

// Factory Method
export function createDataSource<T extends Entity>(
  config: DataSourceConfig
): DataSource<T> {
  switch (config.type) {
    case "rest":
      return new RestDataSource<T>(config);
    case "localstorage":
      return new LocalStorageDataSource<T>(config);
    case "memory":
      return new MemoryDataSource<T>(config);
    default:
      const _exhaustive: never = config;
      throw new Error(`Unknown type: ${_exhaustive}`);
  }
}

// Demo
interface User extends Entity {
  name: string;
  email: string;
}

async function demo() {
  console.log("=== DataSource Factory Demo ===\n");

  // Memory data source
  console.log("--- Memory DataSource ---");
  const memorySource = createDataSource<User>({ type: "memory" });
  
  const user1 = await memorySource.create({ name: "Alice", email: "alice@example.com" });
  const user2 = await memorySource.create({ name: "Bob", email: "bob@example.com" });
  
  const users = await memorySource.fetch();
  console.log(`📊 Users: ${users.map(u => u.name).join(", ")}\n`);

  // LocalStorage data source
  console.log("--- LocalStorage DataSource ---");
  const storageSource = createDataSource<User>({
    type: "localstorage",
    key: "users"
  });
  
  await storageSource.create({ name: "Charlie", email: "charlie@example.com" });
  await storageSource.fetch();
  console.log();

  // REST data source
  console.log("--- REST DataSource ---");
  const restSource = createDataSource<User>({
    type: "rest",
    baseUrl: "https://api.example.com",
    endpoint: "users"
  });
  
  await restSource.create({ name: "Dave", email: "dave@example.com" });
  
  console.log("\n✅ Factory Method works with all implementations!");
}

demo().catch(console.error);
