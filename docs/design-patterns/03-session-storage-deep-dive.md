# Lesson 3: Session Storage Factories - Deep Dive

## 🎯 Mục tiêu

Sau khi học xong lesson này, bạn sẽ:
- ✅ Hiểu cách React Router implement Factory Method cho Session Storage
- ✅ Phân tích `createSessionStorage()` base factory
- ✅ So sánh các implementations: Memory, File, Cookie, KV
- ✅ Hiểu async factory methods
- ✅ Áp dụng pattern cho dự án riêng

## 📚 Kiến thức nền

Bạn đã hoàn thành:
- ✅ Lesson 1: Factory Method Basics
- ✅ Lesson 2: TypeScript for Factory Method

---

## 1. Tổng quan Session Storage Pattern

### Vấn đề React Router cần giải quyết

React Router cần lưu **session data** (thông tin user, cart, preferences, etc.) giữa các HTTP requests. Nhưng có nhiều cách lưu trữ:

- 🗄️ **Memory** - nhanh nhưng mất khi restart
- 💾 **File System** - persistent, phù hợp Node.js
- 🍪 **Cookie** - đơn giản nhưng giới hạn size
- ☁️ **Cloudflare KV** - distributed, cho serverless
- 🗃️ **DynamoDB** - scalable, cho AWS

**Giải pháp:** Dùng Factory Method để tạo `SessionStorage` interface duy nhất, nhưng có nhiều implementations!

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────┐
│          Client Code (App Logic)                   │
│  - Không quan tâm storage backend                  │
│  - Chỉ dùng SessionStorage interface               │
└────────────────┬───────────────────────────────────┘
                 │ uses
                 ▼
┌────────────────────────────────────────────────────┐
│      Product: SessionStorage<Data, FlashData>      │
│      ├─ getSession(cookieHeader)                   │
│      ├─ commitSession(session)                     │
│      └─ destroySession(session)                    │
└────────────────┬───────────────────────────────────┘
                 │ created by
                 ▼
┌────────────────────────────────────────────────────┐
│   Base Factory: createSessionStorage(strategy)     │
│   - Nhận SessionIdStorageStrategy                  │
│   - Trả về SessionStorage object                   │
└────────────────┬───────────────────────────────────┘
                 │ called by
                 ▼
┌────────────────────────────────────────────────────┐
│        Concrete Factory Methods                    │
│  ├─ createMemorySessionStorage(options)            │
│  ├─ createFileSessionStorage(options)              │
│  ├─ createCookieSessionStorage(options)            │
│  ├─ createWorkersKVSessionStorage(options)         │
│  └─ createArcTableSessionStorage(options)          │
└────────────────────────────────────────────────────┘
```

---

## 3. Product Interface: `SessionStorage<Data, FlashData>`

### Định nghĩa từ React Router

```typescript
// File: packages/react-router/lib/server-runtime/sessions.ts

/**
 * SessionStorage lưu session data giữa các HTTP requests
 * và biết cách parse/create cookies.
 */
interface SessionStorage<Data = SessionData, FlashData = Data> {
  /**
   * Parse Cookie header và return Session object
   */
  getSession(
    cookieHeader?: string | null,
    options?: ParseOptions
  ): Promise<Session<Data, FlashData>>;

  /**
   * Commit session data và return Set-Cookie header
   */
  commitSession(
    session: Session<Data, FlashData>,
    options?: SerializeOptions
  ): Promise<string>;

  /**
   * Destroy session và return Set-Cookie header (expired)
   */
  destroySession(
    session: Session<Data, FlashData>,
    options?: SerializeOptions
  ): Promise<string>;
}
```

### Giải thích:

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `getSession()` | Cookie header string | `Session` object | Load session từ cookie ID |
| `commitSession()` | `Session` object | Set-Cookie header | Save session và return cookie |
| `destroySession()` | `Session` object | Set-Cookie header | Xóa session |

**Key point:** Interface này **không nói gì** về cách lưu trữ! Đó là nhiệm vụ của implementations.

---

## 4. Base Factory: `createSessionStorage()`

### Strategy Pattern Interface

Trước khi tạo factory, cần định nghĩa **strategy**:

```typescript
/**
 * Strategy cho việc lưu trữ session data.
 * Session ID lưu trong cookie, data lưu ở "somewhere" (strategy quyết định)
 */
interface SessionIdStorageStrategy<Data = SessionData, FlashData = Data> {
  /**
   * Cookie configuration
   */
  cookie?: Cookie | (CookieOptions & { name?: string });

  /**
   * CREATE: Tạo session data mới, return session ID
   */
  createData(
    data: FlashSessionData<Data, FlashData>,
    expires?: Date
  ): Promise<string>;

  /**
   * READ: Đọc session data từ ID
   */
  readData(
    id: string
  ): Promise<FlashSessionData<Data, FlashData> | null>;

  /**
   * UPDATE: Cập nhật session data
   */
  updateData(
    id: string,
    data: FlashSessionData<Data, FlashData>,
    expires?: Date
  ): Promise<void>;

  /**
   * DELETE: Xóa session data
   */
  deleteData(id: string): Promise<void>;
}
```

### Base Factory Implementation

```typescript
// File: packages/react-router/lib/server-runtime/sessions.ts

export function createSessionStorage<Data = SessionData, FlashData = Data>({
  cookie: cookieArg,
  createData,
  readData,
  updateData,
  deleteData,
}: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<Data, FlashData> {
  
  // Setup cookie (dùng existing hoặc tạo mới)
  let cookie = isCookie(cookieArg)
    ? cookieArg
    : createCookie(cookieArg?.name || "__session", cookieArg);

  warnOnceAboutSigningSessionCookie(cookie);

  // Return SessionStorage implementation
  return {
    // GET SESSION
    async getSession(cookieHeader, options) {
      // 1. Parse cookie để lấy session ID
      let id = cookieHeader && (await cookie.parse(cookieHeader, options));
      
      // 2. Dùng strategy để READ data
      let data = id && (await readData(id));
      
      // 3. Tạo Session object
      return createSession(data || {}, id || "");
    },

    // COMMIT SESSION (Save)
    async commitSession(session, options) {
      let { id, data } = session;
      
      // Calculate expiration
      let expires =
        options?.maxAge != null
          ? new Date(Date.now() + options.maxAge * 1000)
          : options?.expires != null
            ? options.expires
            : cookie.expires;

      // Update hoặc Create data
      if (id) {
        await updateData(id, data, expires);
      } else {
        id = await createData(data, expires);
      }

      // Return Set-Cookie header
      return cookie.serialize(id, options);
    },

    // DESTROY SESSION
    async destroySession(session, options) {
      // Delete data
      await deleteData(session.id);
      
      // Return expired cookie
      return cookie.serialize("", {
        ...options,
        maxAge: undefined,
        expires: new Date(0),
      });
    },
  };
}
```

### Phân tích:

1. **Factory nhận strategy** - CRUD operations được inject
2. **Factory tạo SessionStorage object** - implement interface
3. **Separation of concerns**:
   - Factory lo logic session (parse cookie, handle ID)
   - Strategy lo storage backend (memory, file, database, etc.)

---

## 5. Concrete Factory #1: Memory Storage

### Implementation

```typescript
// File: packages/react-router/lib/server-runtime/sessions/memoryStorage.ts

export function createMemorySessionStorage<
  Data = SessionData,
  FlashData = Data,
>({ cookie }: MemorySessionStorageOptions = {}): SessionStorage<
  Data,
  FlashData
> {
  // Storage backend: In-memory Map
  let map = new Map<
    string,
    { data: FlashSessionData<Data, FlashData>; expires?: Date }
  >();

  // Call base factory với Memory strategy
  return createSessionStorage({
    cookie,
    
    // CREATE
    async createData(data, expires) {
      let id = Math.random().toString(36).substring(2, 10);
      map.set(id, { data, expires });
      return id;
    },
    
    // READ
    async readData(id) {
      if (map.has(id)) {
        let { data, expires } = map.get(id)!;

        // Check expiration
        if (!expires || expires > new Date()) {
          return data;
        }

        // Remove expired
        if (expires) map.delete(id);
      }

      return null;
    },
    
    // UPDATE
    async updateData(id, data, expires) {
      map.set(id, { data, expires });
    },
    
    // DELETE
    async deleteData(id) {
      map.delete(id);
    },
  });
}
```

### Phân tích:

✅ **Pros:**
- Rất nhanh (in-memory)
- Đơn giản, dễ test
- Không cần external dependencies

❌ **Cons:**
- Data mất khi restart server
- Không scale (single process)
- Không phù hợp production

**Use case:** Testing, development, single-server apps

---

## 6. Concrete Factory #2: File Storage

### Implementation

```typescript
// File: packages/react-router-node/sessions/fileStorage.ts

export function createFileSessionStorage<Data = SessionData, FlashData = Data>({
  cookie,
  dir,
}: FileSessionStorageOptions): SessionStorage<Data, FlashData> {
  return createSessionStorage({
    cookie,
    
    // CREATE
    async createData(data, expires) {
      let content = JSON.stringify({ data, expires });

      // Retry loop để tránh collision
      while (true) {
        // Generate random ID
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let id = Buffer.from(randomBytes).toString("hex");

        try {
          let file = getFile(dir, id);
          if (!file) {
            throw new Error("Error generating session");
          }
          
          // Create directories if needed
          await fsp.mkdir(path.dirname(file), { recursive: true });
          
          // Write file (wx = exclusive create, fail if exists)
          await fsp.writeFile(file, content, { encoding: "utf-8", flag: "wx" });
          
          return id;
        } catch (error: any) {
          // If file exists, retry with new ID
          if (error.code !== "EEXIST") throw error;
        }
      }
    },
    
    // READ
    async readData(id) {
      try {
        let file = getFile(dir, id);
        if (!file) return null;
        
        // Read file
        let content = JSON.parse(await fsp.readFile(file, "utf-8"));
        let data = content.data;
        let expires =
          typeof content.expires === "string"
            ? new Date(content.expires)
            : null;

        // Check expiration
        if (!expires || expires > new Date()) {
          return data;
        }

        // Remove expired
        if (expires) await fsp.unlink(file);
        return null;
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
        return null;
      }
    },
    
    // UPDATE
    async updateData(id, data, expires) {
      let content = JSON.stringify({ data, expires });
      let file = getFile(dir, id);
      if (!file) return;
      
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, content, "utf-8");
    },
    
    // DELETE
    async deleteData(id) {
      if (!id) return;
      
      let file = getFile(dir, id);
      if (!file) return;
      
      try {
        await fsp.unlink(file);
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
    },
  });
}

// Helper: Generate file path từ ID
function getFile(dir: string, id: string): string | null {
  // Validate ID format
  if (!/^[0-9a-f]{16}$/i.test(id)) {
    return null;
  }

  // Sharding: Chia ID thành directory structure
  // Ví dụ: ID "abc123def456" → "ab/c123def456"
  // Giảm số file trong 1 directory
  return path.join(dir, id.slice(0, 4), id.slice(4));
}
```

### Phân tích kỹ thuật:

1. **ID Generation với collision handling:**
   ```typescript
   while (true) {
     let id = generateRandomId();
     try {
       await writeFile(id, { flag: "wx" }); // Exclusive create
       return id;
     } catch (error) {
       if (error.code !== "EEXIST") throw error;
       // Retry if file exists
     }
   }
   ```

2. **Directory sharding:**
   ```typescript
   // ID: "abc123def456"
   // Path: dir/ab/c123def456
   // Lợi ích: Giảm số files per directory (performance)
   ```

3. **Error handling:**
   - `EEXIST` - File exists, retry
   - `ENOENT` - File not found, return null (not error)

✅ **Pros:**
- Persistent data
- Không cần database
- Dễ debug (xem file trực tiếp)

❌ **Cons:**
- Slower than memory
- File I/O overhead
- Cần filesystem access

**Use case:** Node.js apps, single-server, moderate traffic

---

## 7. So sánh Implementations

| Feature | Memory | File | Cookie | CloudflareKV | DynamoDB |
|---------|--------|------|--------|--------------|----------|
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| **Persistent** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Scalable** | ❌ | ⚡ | ✅ | ✅ | ✅ |
| **Data Size** | ♾️ | ♾️ | 4KB | 25MB | 400KB |
| **Use Case** | Test/Dev | Node.js | Simple | Serverless | Enterprise |
| **Cost** | Free | Free | Free | $$ | $$$ |

---

## 8. Async Factory Methods - Best Practices

### Tại sao async?

```typescript
// ❌ Synchronous - không thể dùng với I/O
function readData(id: string): SessionData {
  return JSON.parse(fs.readFileSync(file)); // Blocking!
}

// ✅ Asynchronous - non-blocking
async function readData(id: string): Promise<SessionData> {
  const content = await fsp.readFile(file); // Non-blocking!
  return JSON.parse(content);
}
```

### Error handling trong async factories

```typescript
async function readData(id: string): Promise<SessionData | null> {
  try {
    const data = await fetchFromDatabase(id);
    return data;
  } catch (error) {
    // Log error nhưng return null (graceful degradation)
    console.error(`Failed to read session ${id}:`, error);
    return null;
  }
}
```

---

## 9. Hands-on Exercise

### Bài tập: Tạo LocalStorage Session Storage (Browser)

**Yêu cầu:**

Tạo `createLocalStorageSessionStorage()` để lưu sessions trong browser's localStorage.

**Starter code:**

```typescript
interface LocalStorageSessionStorageOptions {
  cookie?: SessionIdStorageStrategy["cookie"];
  keyPrefix?: string; // Prefix cho localStorage keys
}

export function createLocalStorageSessionStorage<
  Data = SessionData,
  FlashData = Data
>({
  cookie,
  keyPrefix = "session:",
}: LocalStorageSessionStorageOptions = {}): SessionStorage<Data, FlashData> {
  // TODO: Implement using createSessionStorage()
  
  return createSessionStorage({
    cookie,
    
    async createData(data, expires) {
      // TODO: Generate ID
      // TODO: Save to localStorage với key = keyPrefix + id
      // TODO: Return ID
    },
    
    async readData(id) {
      // TODO: Read from localStorage
      // TODO: Check expiration
      // TODO: Return data or null
    },
    
    async updateData(id, data, expires) {
      // TODO: Update localStorage
    },
    
    async deleteData(id) {
      // TODO: Remove from localStorage
    },
  });
}

// Test
const storage = createLocalStorageSessionStorage({
  keyPrefix: "myapp:session:"
});

const session = await storage.getSession();
session.set("userId", "123");
await storage.commitSession(session);
```

<details>
<summary>Xem giải pháp</summary>

```typescript
export function createLocalStorageSessionStorage<
  Data = SessionData,
  FlashData = Data
>({
  cookie,
  keyPrefix = "session:",
}: LocalStorageSessionStorageOptions = {}): SessionStorage<Data, FlashData> {
  
  return createSessionStorage({
    cookie,
    
    async createData(data, expires) {
      const id = Math.random().toString(36).substring(2, 10);
      const key = keyPrefix + id;
      
      localStorage.setItem(key, JSON.stringify({
        data,
        expires: expires?.toISOString()
      }));
      
      return id;
    },
    
    async readData(id) {
      const key = keyPrefix + id;
      const item = localStorage.getItem(key);
      
      if (!item) return null;
      
      const { data, expires } = JSON.parse(item);
      const expiresDate = expires ? new Date(expires) : null;
      
      if (!expiresDate || expiresDate > new Date()) {
        return data;
      }
      
      localStorage.removeItem(key);
      return null;
    },
    
    async updateData(id, data, expires) {
      const key = keyPrefix + id;
      localStorage.setItem(key, JSON.stringify({
        data,
        expires: expires?.toISOString()
      }));
    },
    
    async deleteData(id) {
      const key = keyPrefix + id;
      localStorage.removeItem(key);
    },
  });
}
```

</details>

---

## 📝 Tóm tắt (Key Takeaways)

1. **Factory Method + Strategy Pattern** = Powerful combination
2. `createSessionStorage()` là **base factory**, nhận **strategy**
3. Concrete factories (`createMemorySessionStorage`, etc.) provide **different strategies**
4. **Same interface**, **different implementations** = Flexibility
5. **Async factory methods** cho I/O operations
6. **Error handling** quan trọng trong factories
7. React Router có 5+ session storage implementations

---

## ❓ Câu hỏi ôn tập

1. `SessionIdStorageStrategy` là gì? Vai trò của nó?
2. Tại sao `createSessionStorage()` nhận strategy thay vì tự implement storage?
3. So sánh Memory storage vs File storage - khi nào dùng cái nào?
4. Tại sao File storage dùng directory sharding?
5. Async factory methods có lợi ích gì?

<details>
<summary>Xem đáp án</summary>

1. Strategy interface định nghĩa CRUD operations cho session data, cho phép abstract storage backend
2. Separation of concerns - factory lo session logic, strategy lo storage backend
3. Memory: fast, test/dev, không persistent; File: persistent, production-ready, single server
4. Giảm số files trong 1 directory để improve filesystem performance
5. Non-blocking I/O, có thể dùng với database/network/filesystem

</details>

---

## 🚀 Tiếp theo

Trong **Lesson 4**, chúng ta sẽ:
- Phân tích **History factories** (`createBrowserHistory`, `createHashHistory`, `createMemoryHistory`)
- Hiểu Strategy pattern kết hợp với Factory Method
- Browser API integration
- Custom history implementation

**Ready for more?** → [`04-history-factories-analysis.md`](./04-history-factories-analysis.md)
