# Lesson 6: Build Your Own Factory

## 🎯 Mục tiêu

- ✅ Tự thiết kế và implement một Factory Method system từ đầu
- ✅ Áp dụng tất cả kiến thức đã học
- ✅ Tạo working code có thể dùng trong dự án thật

## 📚 Prerequisites

- ✅ Completed Lessons 1-5

---

## 🎬 Project: Data Source Factory System

Chúng ta sẽ xây dựng một **DataSource Factory** hỗ trợ nhiều backends:
- REST API
- GraphQL
- LocalStorage
- IndexedDB (bonus)

---

## 1. Design Phase

### Requirements

1. **Product Interface** - `DataSource<T>`
   - `fetch(): Promise<T[]>`
   - `fetchOne(id: string): Promise<T | null>`
   - `create(data: Partial<T>): Promise<T>`
   - `update(id: string, data: Partial<T>): Promise<T>`
   - `delete(id: string): Promise<void>`

2. **Factory Method** - `createDataSource<T>(config)`
   - Support type: `"rest" | "graphql" | "localstorage"`
   - Type-safe configuration
   - Return `DataSource<T>`

3. **Concrete Implementations**
   - `RestDataSource<T>`
   - `GraphQLDataSource<T>`
   - `LocalStorageDataSource<T>`

### Architecture Diagram

```
┌─────────────────────────┐
│  Client Code            │
│  (App Logic)            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Factory Method         │
│  createDataSource(cfg)  │
└───────────┬─────────────┘
            │
      ┌─────┴─────┬─────────┬──────────┐
      ▼           ▼         ▼          ▼
┌──────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
│   REST   │ │ GraphQL │ │ Local  │ │IndexedDB│
│DataSource│ │DataSourc│ │Storage │ │DataSourc│
└──────────┘ └─────────┘ └────────┘ └─────────┘
```

---

## 2. Step 1: Define Product Interface

```typescript
/**
 * Generic DataSource interface
 * T = Type of data entity (e.g., User, Post, Product)
 */
export interface DataSource<T> {
  /**
   * Fetch all items
   */
  fetch(): Promise<T[]>;

  /**
   * Fetch single item by ID
   */
  fetchOne(id: string): Promise<T | null>;

  /**
   * Create new item
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Update existing item
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete item
   */
  delete(id: string): Promise<void>;
}

/**
 * Base entity interface (all entities must have id)
 */
export interface Entity {
  id: string;
}
```

---

## 3. Step 2: Define Configuration Types

```typescript
/**
 * Data source types
 */
export type DataSourceType = "rest" | "graphql" | "localstorage";

/**
 * REST API configuration
 */
export interface RestDataSourceConfig {
  type: "rest";
  baseUrl: string;
  endpoint: string;
  headers?: Record<string, string>;
}

/**
 * GraphQL configuration
 */
export interface GraphQLDataSourceConfig {
  type: "graphql";
  endpoint: string;
  queryName: string;
  mutationNames: {
    create: string;
    update: string;
    delete: string;
  };
}

/**
 * LocalStorage configuration
 */
export interface LocalStorageDataSourceConfig {
  type: "localstorage";
  key: string;
}

/**
 * Union type for all configs
 */
export type DataSourceConfig =
  | RestDataSourceConfig
  | GraphQLDataSourceConfig
  | LocalStorageDataSourceConfig;
```

---

## 4. Step 3: Implement REST DataSource

```typescript
/**
 * REST API implementation
 */
export class RestDataSource<T extends Entity> implements DataSource<T> {
  constructor(private config: RestDataSourceConfig) {}

  private get url(): string {
    return `${this.config.baseUrl}/${this.config.endpoint}`;
  }

  private async fetchAPI(path: string, options?: RequestInit): Promise<Response> {
    const url = `${this.url}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async fetch(): Promise<T[]> {
    const response = await this.fetchAPI("");
    return response.json();
  }

  async fetchOne(id: string): Promise<T | null> {
    try {
      const response = await this.fetchAPI(`/${id}`);
      return response.json();
    } catch (error) {
      return null;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await this.fetchAPI("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await this.fetchAPI(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(id: string): Promise<void> {
    await this.fetchAPI(`/${id}`, { method: "DELETE" });
  }
}
```

---

## 5. Step 4: Implement LocalStorage DataSource

```typescript
/**
 * LocalStorage implementation
 */
export class LocalStorageDataSource<T extends Entity> implements DataSource<T> {
  constructor(private config: LocalStorageDataSourceConfig) {}

  private getData(): T[] {
    const data = localStorage.getItem(this.config.key);
    return data ? JSON.parse(data) : [];
  }

  private setData(data: T[]): void {
    localStorage.setItem(this.config.key, JSON.stringify(data));
  }

  async fetch(): Promise<T[]> {
    return this.getData();
  }

  async fetchOne(id: string): Promise<T | null> {
    const items = this.getData();
    return items.find((item) => item.id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const items = this.getData();
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
    } as T;
    items.push(newItem);
    this.setData(items);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const items = this.getData();
    const index = items.findIndex((item) => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updated = { ...items[index], ...data } as T;
    items[index] = updated;
    this.setData(items);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const items = this.getData();
    const filtered = items.filter((item) => item.id !== id);
    this.setData(filtered);
  }
}
```

---

## 6. Step 5: Implement GraphQL DataSource

```typescript
/**
 * GraphQL implementation
 */
export class GraphQLDataSource<T extends Entity> implements DataSource<T> {
  constructor(private config: GraphQLDataSourceConfig) {}

  private async query(query: string, variables?: any): Promise<any> {
    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  async fetch(): Promise<T[]> {
    const query = `
      query {
        ${this.config.queryName} {
          id
        }
      }
    `;
    const data = await this.query(query);
    return data[this.config.queryName];
  }

  async fetchOne(id: string): Promise<T | null> {
    const query = `
      query GetOne($id: ID!) {
        ${this.config.queryName}(id: $id) {
          id
        }
      }
    `;
    const data = await this.query(query, { id });
    return data[this.config.queryName] || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const mutation = `
      mutation Create($input: CreateInput!) {
        ${this.config.mutationNames.create}(input: $input) {
          id
        }
      }
    `;
    const result = await this.query(mutation, { input: data });
    return result[this.config.mutationNames.create];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const mutation = `
      mutation Update($id: ID!, $input: UpdateInput!) {
        ${this.config.mutationNames.update}(id: $id, input: $input) {
          id
        }
      }
    `;
    const result = await this.query(mutation, { id, input: data });
    return result[this.config.mutationNames.update];
  }

  async delete(id: string): Promise<void> {
    const mutation = `
      mutation Delete($id: ID!) {
        ${this.config.mutationNames.delete}(id: $id)
      }
    `;
    await this.query(mutation, { id });
  }
}
```

---

## 7. Step 6: Create Factory Method

```typescript
/**
 * Factory Method - Creates DataSource based on config
 */
export function createDataSource<T extends Entity>(
  config: DataSourceConfig
): DataSource<T> {
  switch (config.type) {
    case "rest":
      return new RestDataSource<T>(config);
    
    case "graphql":
      return new GraphQLDataSource<T>(config);
    
    case "localstorage":
      return new LocalStorageDataSource<T>(config);
    
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = config;
      throw new Error(`Unknown data source type: ${_exhaustive}`);
  }
}
```

---

## 8. Usage Examples

### Example 1: User Management with REST API

```typescript
interface User extends Entity {
  id: string;
  name: string;
  email: string;
}

const userDataSource = createDataSource<User>({
  type: "rest",
  baseUrl: "https://api.example.com",
  endpoint: "users",
  headers: {
    "Authorization": "Bearer token123",
  },
});

// Usage
const users = await userDataSource.fetch();
const newUser = await userDataSource.create({
  name: "John Doe",
  email: "john@example.com",
});
await userDataSource.update(newUser.id, { name: "Jane Doe" });
await userDataSource.delete(newUser.id);
```

### Example 2: Local Todo List

```typescript
interface Todo extends Entity {
  id: string;
  title: string;
  completed: boolean;
}

const todoDataSource = createDataSource<Todo>({
  type: "localstorage",
  key: "my-todos",
});

const todos = await todoDataSource.fetch();
await todoDataSource.create({
  title: "Learn Factory Pattern",
  completed: false,
});
```

### Example 3: GraphQL Products

```typescript
interface Product extends Entity {
  id: string;
  name: string;
  price: number;
}

const productDataSource = createDataSource<Product>({
  type: "graphql",
  endpoint: "https://api.example.com/graphql",
  queryName: "products",
  mutationNames: {
    create: "createProduct",
    update: "updateProduct",
    delete: "deleteProduct",
  },
});

const products = await productDataSource.fetch();
```

---

## 9. Testing

### Easy to Mock!

```typescript
// Mock data source for testing
class MockDataSource<T extends Entity> implements DataSource<T> {
  private data: T[] = [];

  async fetch(): Promise<T[]> {
    return [...this.data];
  }

  async fetchOne(id: string): Promise<T | null> {
    return this.data.find((item) => item.id === id) || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const item = { ...data, id: "mock-id" } as T;
    this.data.push(item);
    return item;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const index = this.data.findIndex((item) => item.id === id);
    this.data[index] = { ...this.data[index], ...data };
    return this.data[index];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter((item) => item.id !== id);
  }
}

// Use in tests
const mockDataSource = new MockDataSource<User>();
await mockDataSource.create({ name: "Test User" });
```

---

## 10. Extensions & Improvements

### Add Caching Strategy

```typescript
class CachedDataSource<T extends Entity> implements DataSource<T> {
  private cache = new Map<string, T>();

  constructor(private source: DataSource<T>) {}

  async fetch(): Promise<T[]> {
    const items = await this.source.fetch();
    items.forEach((item) => this.cache.set(item.id, item));
    return items;
  }

  async fetchOne(id: string): Promise<T | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const item = await this.source.fetchOne(id);
    if (item) this.cache.set(id, item);
    return item;
  }

  // ... delegate other methods
}

// Usage
const cachedSource = new CachedDataSource(userDataSource);
```

### Add Retry Logic

```typescript
class RetryDataSource<T extends Entity> implements DataSource<T> {
  constructor(
    private source: DataSource<T>,
    private maxRetries = 3
  ) {}

  private async retry<R>(fn: () => Promise<R>): Promise<R> {
    let lastError;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw lastError;
  }

  async fetch(): Promise<T[]> {
    return this.retry(() => this.source.fetch());
  }

  // ... wrap other methods
}
```

---

## 📝 Complete Code

Tất cả code đầy đủ có thể chạy được:

```typescript
// datasource.ts - Full implementation
// [All code from steps above combined]

// Export
export {
  DataSource,
  Entity,
  createDataSource,
  DataSourceConfig,
  RestDataSourceConfig,
  GraphQLDataSourceConfig,
  LocalStorageDataSourceConfig,
};
```

---

## 🎯 Challenge

Thêm **IndexedDB DataSource**:

```typescript
export interface IndexedDBDataSourceConfig {
  type: "indexeddb";
  dbName: string;
  storeName: string;
}

export class IndexedDBDataSource<T extends Entity> implements DataSource<T> {
  // Your implementation here
}
```

---

## 📝 Tóm tắt

Bạn đã học:
1. ✅ Thiết kế Product interface
2. ✅ Define configuration types
3. ✅ Implement multiple concrete products
4. ✅ Create factory method
5. ✅ Use in real scenarios
6. ✅ Test with mocks
7. ✅ Extend with decorators (cache, retry)

---

## 🚀 Tiếp theo

**Lesson 7:** When to Use Factory Method - Decision framework

→ [`07-when-to-use-factory-method.md`](./07-when-to-use-factory-method.md)
