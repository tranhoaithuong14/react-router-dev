# Factory Method Pattern trong React Router

## Tổng quan

Dự án **React Router** có sử dụng **Factory Method pattern** ở nhiều nơi. Pattern này được áp dụng để tạo ra các đối tượng khác nhau dựa trên cấu hình hoặc môi trường, cho phép subclasses hoặc các implementation khác nhau có thể cung cấp các loại đối tượng khác nhau.

---

## 1. Router Factory Methods

### 📍 Vị trí:
- [`packages/react-router/lib/dom/lib.tsx`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/dom/lib.tsx)
- [`packages/react-router/lib/router/router.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/router.ts)

### 💡 Mô tả:

React Router cung cấp các **factory methods** để tạo ra các loại router khác nhau tùy theo nhu cầu:

#### Factory Method: `createRouter()`
- Đây là **base factory method** tạo ra đối tượng `Router`
- Định nghĩa tại: [router.ts:L861](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/router.ts#L861)

#### Concrete Factory Methods:

1. **`createBrowserRouter()`** - [lib.tsx:L779-817](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/dom/lib.tsx#L779-L817)
   - Tạo router sử dụng Browser History API (`pushState`, `replaceState`)
   - Phù hợp cho các web app thông thường

2. **`createHashRouter()`** - [lib.tsx:L819-856](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/dom/lib.tsx#L819-L856)
   - Tạo router sử dụng URL hash (`#`)
   - Phù hợp khi không muốn gửi location đến server

3. **`createStaticRouter()`** - [dom/server.tsx](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/dom/server.tsx)
   - Tạo router cho server-side rendering
   - Không có khả năng navigate động

### 🔧 Cách hoạt động:

```typescript
// Các concrete factory methods đều gọi đến base factory method
export function createBrowserRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    history: createBrowserHistory({ window: opts?.window }), // Strategy pattern!
    routes,
    // ... other config
  }).initialize();
}

export function createHashRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    history: createHashHistory({ window: opts?.window }), // Different strategy!
    routes,
    // ... other config
  }).initialize();
}
```

### ✅ Đặc điểm Factory Method:
- ✓ **Interface chung**: Tất cả trả về `DataRouter` interface
- ✓ **Factory methods**: `createBrowserRouter()`, `createHashRouter()`, `createStaticRouter()`
- ✓ **Base factory**: `createRouter()` là base implementation
- ✓ **Polymorphism**: Client code có thể dùng bất kỳ router nào thông qua cùng một interface

---

## 2. History Factory Methods

### 📍 Vị trí:
- [`packages/react-router/lib/router/history.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/history.ts)

### 💡 Mô tả:

Các factory methods tạo ra các loại History object khác nhau:

1. **`createBrowserHistory()`** - [history.ts:L359-386](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/history.ts#L359-L386)
   - Tạo history sử dụng browser's history API
   - Lưu location trong URL thông thường

2. **`createHashHistory()`** - [history.ts:L408-476](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/history.ts#L408-L476)
   - Tạo history sử dụng hash portion của URL
   - Location không được gửi đến server

3. **`createMemoryHistory()`** - [history.ts:L225-334](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/router/history.ts#L225-L334)
   - Tạo history lưu location trong memory
   - Phù hợp cho testing và React Native

### 🔧 Cách hoạt động:

```typescript
// Mỗi factory method tạo ra một implementation khác nhau của History interface
export function createBrowserHistory(
  options: BrowserHistoryOptions = {},
): BrowserHistory {
  function createBrowserLocation(window, globalHistory) { /* ... */ }
  function createBrowserHref(window, to) { /* ... */ }
  
  return getUrlBasedHistory(
    createBrowserLocation,
    createBrowserHref,
    null,
    options,
  );
}

export function createHashHistory(
  options: HashHistoryOptions = {},
): HashHistory {
  function createHashLocation(window, globalHistory) { /* ... */ }
  function createHashHref(window, to) { /* ... */ }
  
  return getUrlBasedHistory(
    createHashLocation,
    createHashHref,
    validateHashLocation,
    options,
  );
}
```

### ✅ Đặc điểm Factory Method:
- ✓ **Interface chung**: `History` interface
- ✓ **Multiple implementations**: `BrowserHistory`, `HashHistory`, `MemoryHistory`
- ✓ **Encapsulation**: Logic tạo object được đóng gói trong factory methods
- ✓ **Flexibility**: Dễ dàng thêm loại history mới

---

## 3. Session Storage Factory Methods ⭐ (Rất rõ ràng)

### 📍 Vị trí:
- Base factory: [`packages/react-router/lib/server-runtime/sessions.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/server-runtime/sessions.ts)
- Concrete implementations:
  - [`packages/react-router-node/sessions/fileStorage.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router-node/sessions/fileStorage.ts)
  - [`packages/react-router/lib/server-runtime/sessions/memoryStorage.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/server-runtime/sessions/memoryStorage.ts)
  - [`packages/react-router/lib/server-runtime/sessions/cookieStorage.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/server-runtime/sessions/cookieStorage.ts)
  - [`packages/react-router-cloudflare/sessions/workersKVStorage.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router-cloudflare/sessions/workersKVStorage.ts)
  - [`packages/react-router-architect/sessions/arcTableSessionStorage.ts`](file:///Users/ttran/Projects/react-router-dev/packages/react-router-architect/sessions/arcTableSessionStorage.ts)

### 💡 Mô tả:

Đây là ví dụ **XUẤT SẮC** của Factory Method pattern! React Router cung cấp:

#### Base Factory Method:
- **`createSessionStorage()`** - [sessions.ts:L246-297](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/server-runtime/sessions.ts#L246-L297)
  - Nhận vào một `SessionIdStorageStrategy`
  - Trả về `SessionStorage` object

#### Concrete Factory Methods:

1. **`createMemorySessionStorage()`** - [memoryStorage.ts:L24-64](file:///Users/ttran/Projects/react-router-dev/packages/react-router/lib/server-runtime/sessions/memoryStorage.ts#L24-L64)
   - Lưu session data trong memory (Map)
   - Dùng cho testing

2. **`createFileSessionStorage()`** - [fileStorage.ts:L31-113](file:///Users/ttran/Projects/react-router-dev/packages/react-router-node/sessions/fileStorage.ts#L31-L113)
   - Lưu session data trong filesystem
   - Dùng cho Node.js apps

3. **`createCookieSessionStorage()`**
   - Lưu toàn bộ session data trong cookie
   - Đơn giản nhưng giới hạn dung lượng

4. **`createWorkersKVSessionStorage()`**
   - Lưu session trong Cloudflare KV Store
   - Dùng cho Cloudflare Workers

5. **`createArcTableSessionStorage()`**
   - Lưu session trong DynamoDB (via Architect)
   - Dùng cho AWS serverless apps

### 🔧 Cách hoạt động:

```typescript
// Base factory method định nghĩa interface
export function createSessionStorage<Data, FlashData>({
  cookie,
  createData,
  readData,
  updateData,
  deleteData,
}: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<Data, FlashData> {
  return {
    async getSession(cookieHeader, options) { /* ... */ },
    async commitSession(session, options) { /* ... */ },
    async destroySession(session, options) { /* ... */ },
  };
}

// Concrete factory: File Storage
export function createFileSessionStorage<Data, FlashData>({
  cookie,
  dir,
}: FileSessionStorageOptions): SessionStorage<Data, FlashData> {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // Lưu vào file system
      let id = generateId();
      await fsp.writeFile(getFile(dir, id), JSON.stringify({ data, expires }));
      return id;
    },
    async readData(id) {
      // Đọc từ file system
      let content = await fsp.readFile(getFile(dir, id));
      return JSON.parse(content).data;
    },
    // ... implementations khác
  });
}

// Concrete factory: Memory Storage
export function createMemorySessionStorage<Data, FlashData>({
  cookie,
}: MemorySessionStorageOptions): SessionStorage<Data, FlashData> {
  let map = new Map();
  
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      // Lưu vào Map
      let id = Math.random().toString(36);
      map.set(id, { data, expires });
      return id;
    },
    async readData(id) {
      // Đọc từ Map
      return map.get(id)?.data || null;
    },
    // ... implementations khác
  });
}
```

### ✅ Đặc điểm Factory Method:
- ✓ **Common product interface**: `SessionStorage<Data, FlashData>`
- ✓ **Base factory method**: `createSessionStorage()`
- ✓ **Multiple concrete factories**: 5+ implementations khác nhau
- ✓ **Strategy pattern**: Mỗi implementation cung cấp strategy riêng cho CRUD operations
- ✓ **Extensibility**: Dễ dàng thêm storage backend mới (e.g., Redis, MongoDB)
- ✓ **Separation of concerns**: Logic tạo session được tách khỏi logic lưu trữ

---

## So sánh với định nghĩa Factory Method Pattern

Theo [refactoring.guru](https://refactoring.guru/design-patterns/factory-method):

> **Factory Method** is a creational design pattern that provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created.

### ✅ Các đặc điểm trong React Router:

| Đặc điểm Factory Method | React Router Implementation |
|-------------------------|----------------------------|
| **Product Interface** | `Router`, `History`, `SessionStorage` |
| **Concrete Products** | `BrowserRouter`, `HashRouter`, `MemoryHistory`, `FileSessionStorage`, etc. |
| **Creator/Base Factory** | `createRouter()`, `createSessionStorage()` |
| **Concrete Factories** | `createBrowserRouter()`, `createFileSessionStorage()`, etc. |
| **Common Interface** | ✅ Tất cả products implement cùng interface |
| **Encapsulation** | ✅ Logic tạo object được đóng gói trong factory methods |
| **Flexibility** | ✅ Dễ dàng thêm implementation mới |

---

## Kết luận

React Router **CÓ SỬ DỤNG** Factory Method pattern một cách rộng rãi và rất hiệu quả:

### 🎯 Các nơi sử dụng rõ ràng nhất:

1. **Session Storage Factories** ⭐⭐⭐
   - Đây là ví dụ XUẤT SẮC nhất của Factory Method pattern
   - Có base factory (`createSessionStorage`) và nhiều concrete factories
   - Mỗi factory tạo ra cùng product type nhưng với implementation khác nhau

2. **Router Factories** ⭐⭐
   - `createBrowserRouter()`, `createHashRouter()`, `createStaticRouter()`
   - Tất cả tạo ra `Router` objects nhưng với các behaviors khác nhau

3. **History Factories** ⭐⭐
   - `createBrowserHistory()`, `createHashHistory()`, `createMemoryHistory()`
   - Tạo ra các `History` implementations khác nhau cho các môi trường khác nhau

### 💡 Lợi ích của việc sử dụng pattern này:

- **Flexibility**: Dễ dàng switch giữa các implementations
- **Extensibility**: Thêm implementation mới không cần sửa code hiện tại
- **Testability**: Có thể dùng memory-based implementations cho testing
- **Environment-specific**: Có thể chọn implementation phù hợp với môi trường (browser, server, cloud, etc.)

---

## Tài liệu tham khảo

- [Factory Method Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- [React Router Documentation](https://reactrouter.com/)
