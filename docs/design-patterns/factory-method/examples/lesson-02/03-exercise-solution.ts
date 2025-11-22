// Lesson 2 Exercise: Generic Data Fetcher Factory

// DataFetcher interface
interface DataFetcher<T> {
  fetch(): Promise<T>;
  cache(data: T): void;
  clear(): void;
}

// Implementations
class ApiDataFetcher<T> implements DataFetcher<T> {
  private cachedData: T | null = null;
  
  constructor(private url: string) {}
  
  async fetch(): Promise<T> {
    if (this.cachedData) {
      console.log(`💾 Returning cached data from ${this.url}`);
      return this.cachedData;
    }
    
    console.log(`🌐 Fetching from API: ${this.url}`);
    // Simulate API call
    const mockData = { message: `Data from ${this.url}` } as T;
    this.cachedData = mockData;
    return mockData;
  }
  
  cache(data: T): void {
    this.cachedData = data;
    console.log(`💾 Data cached for ${this.url}`);
  }
  
  clear(): void {
    this.cachedData = null;
    console.log(`🗑️  Cache cleared for ${this.url}`);
  }
}

class LocalDataFetcher<T> implements DataFetcher<T> {
  private storage = new Map<string, string>();
  
  constructor(private key: string) {}
  
  async fetch(): Promise<T> {
    const data = this.storage.get(this.key);
    if (!data) {
      throw new Error(`No data found for key: ${this.key}`);
    }
    console.log(`📦 Fetched from local storage: ${this.key}`);
    return JSON.parse(data) as T;
  }
  
  cache(data: T): void {
    this.storage.set(this.key, JSON.stringify(data));
    console.log(`💾 Saved to local storage: ${this.key}`);
  }
  
  clear(): void {
    this.storage.delete(this.key);
    console.log(`🗑️  Removed from local storage: ${this.key}`);
  }
}

// Factory
type FetcherType = "api" | "local";

interface FetcherConfig {
  api?: { url: string };
  local?: { key: string };
}

function createDataFetcher<T>(
  type: FetcherType,
  config: FetcherConfig
): DataFetcher<T> {
  switch (type) {
    case "api":
      if (!config.api?.url) {
        throw new Error("API URL required");
      }
      return new ApiDataFetcher<T>(config.api.url);
    case "local":
      if (!config.local?.key) {
        throw new Error("Local storage key required");
      }
      return new LocalDataFetcher<T>(config.local.key);
    default:
      throw new Error(`Unknown fetcher type: ${type}`);
  }
}

// Demo
interface UserData {
  id: number;
  name: string;
}

async function demo() {
  console.log("=== Generic Data Fetcher Demo ===\n");
  
  // API Fetcher
  const apiFetcher = createDataFetcher<UserData>("api", {
    api: { url: "/api/users" }
  });
  
  await apiFetcher.fetch();
  await apiFetcher.fetch(); // Should use cache
  apiFetcher.clear();
  
  console.log();
  
  // Local Fetcher
  const localFetcher = createDataFetcher<UserData>("local", {
    local: { key: "users" }
  });
  
  localFetcher.cache({ id: 1, name: "John Doe" });
  const user = await localFetcher.fetch();
  console.log(`👤 User: ${user.name}`);
  localFetcher.clear();
  
  console.log("\n✅ Exercise completed!");
}

demo().catch(console.error);
