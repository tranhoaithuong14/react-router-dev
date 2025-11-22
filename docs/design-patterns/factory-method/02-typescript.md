# Lesson 2: TypeScript cho Factory Method

## 🎯 Mục tiêu

Sau khi học xong lesson này, bạn sẽ:
- ✅ Hiểu cách dùng TypeScript interfaces với Factory Method
- ✅ Sử dụng Generic types `<T>` cho factories linh hoạt
- ✅ Viết type-safe factory methods
- ✅ Hiểu optional parameters và configuration objects
- ✅ Chuẩn bị cho việc đọc React Router code

## 📚 Kiến thức nền

Bạn đã hoàn thành:
- ✅ Lesson 1: Factory Method Basics

---

## 1. Ôn tập: Factory từ Lesson 1

Từ Lesson 1, chúng ta có:

```typescript
interface Notification {
  send(message: string): void;
}

function createNotification(type: string): Notification {
  // ... implementation
}
```

**Vấn đề:** Type này còn đơn giản, chưa tận dụng sức mạnh của TypeScript!

---

## 2. Generic Types - Tại sao cần thiết?

### Vấn đề: Factory trả về nhiều loại data khác nhau

Giả sử factory cần trả về data kèm theo notification:

```typescript
// ❌ Cách này mất type information!
function createNotification(type: string): any {
  if (type === "email") {
    return new EmailNotification(); // Trả về EmailNotification
  }
  // TypeScript không biết chính xác type nào!
}

const notification = createNotification("email");
notification.send("Hi"); // ❓ TypeScript không suggest được methods!
```

### ✅ Giải pháp: Generic Types

```typescript
// Generic type T - placeholder cho type thực tế
interface Notification<TData = any> {
  send(message: string): void;
  getData(): TData; // TData sẽ được specify sau
}

// EmailData type cụ thể
interface EmailData {
  to: string;
  subject: string;
  body: string;
}

// SMSData type cụ thể
interface SMSData {
  phoneNumber: string;
  message: string;
}

// Concrete implementations với specific types
class EmailNotification implements Notification<EmailData> {
  private data: EmailData;
  
  constructor(data: EmailData) {
    this.data = data;
  }
  
  send(message: string): void {
    console.log(`📧 Email to ${this.data.to}: ${message}`);
  }
  
  getData(): EmailData {
    return this.data;
  }
}

class SMSNotification implements Notification<SMSData> {
  private data: SMSData;
  
  constructor(data: SMSData) {
    this.data = data;
  }
  
  send(message: string): void {
    console.log(`📱 SMS to ${this.data.phoneNumber}: ${message}`);
  }
  
  getData(): SMSData {
    return this.data;
  }
}
```

### Sử dụng:

```typescript
const emailNotif: Notification<EmailData> = new EmailNotification({
  to: "user@example.com",
  subject: "Welcome",
  body: "Hello!"
});

// ✅ TypeScript biết chính xác getData() trả về EmailData!
const emailData = emailNotif.getData();
console.log(emailData.to);      // ✅ Autocomplete!
console.log(emailData.subject); // ✅ Type-safe!
```

---

## 3. Generic Factory Methods

### Basic Generic Factory

```typescript
// Generic factory function
function createNotification<T>(
  type: string,
  data: T
): Notification<T> {
  // Factory tạo notification với type T cụ thể
  switch (type) {
    case "email":
      return new EmailNotification(data as EmailData) as Notification<T>;
    case "sms":
      return new SMSNotification(data as SMSData) as Notification<T>;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// ✅ Type inference hoạt động!
const email = createNotification("email", {
  to: "user@example.com",
  subject: "Test",
  body: "Hello"
});
// TypeScript tự suy ra: Notification<{ to: string; subject: string; body: string }>
```

### Typed Factory với Union Types

Cách tốt hơn - dùng union types:

```typescript
// Union type cho tất cả notification types
type NotificationType = "email" | "sms" | "push";

// Type mapping
type NotificationDataMap = {
  email: EmailData;
  sms: SMSData;
  push: PushData;
};

// ✅ Type-safe factory!
function createTypedNotification<T extends NotificationType>(
  type: T,
  data: NotificationDataMap[T]
): Notification<NotificationDataMap[T]> {
  switch (type) {
    case "email":
      return new EmailNotification(data as EmailData) as any;
    case "sms":
      return new SMSNotification(data as SMSData) as any;
    case "push":
      return new PushNotification(data as PushData) as any;
  }
}

// ✅ Usage - TypeScript kiểm tra type!
const email = createTypedNotification("email", {
  to: "user@example.com",  // ✅ Must have 'to'
  subject: "Test",         // ✅ Must have 'subject'
  body: "Hello"            // ✅ Must have 'body'
});

// ❌ ERROR - type mismatch!
const wrongEmail = createTypedNotification("email", {
  phoneNumber: "123" // ❌ Wrong data type for 'email'!
});
```

---

## 4. Optional Parameters & Configuration

### Factory với Options Object

```typescript
// Options interface
interface NotificationOptions {
  priority?: "high" | "medium" | "low"; // Optional
  retryCount?: number;                   // Optional
  timeout?: number;                      // Optional
}

// Updated Notification interface
interface Notification<TData = any> {
  send(message: string, options?: NotificationOptions): void;
  getData(): TData;
}

// Factory với default options
function createNotificationWithOptions<T extends NotificationType>(
  type: T,
  data: NotificationDataMap[T],
  options: NotificationOptions = {} // Default value
): Notification<NotificationDataMap[T]> {
  const defaultOptions: NotificationOptions = {
    priority: "medium",
    retryCount: 3,
    timeout: 5000
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // Create notification với merged options
  // ... implementation
}

// ✅ Usage với options
const urgentEmail = createNotificationWithOptions(
  "email",
  { to: "admin@example.com", subject: "Alert", body: "Error!" },
  { priority: "high", retryCount: 5 } // timeout sẽ dùng default
);
```

---

## 5. Type Guards và Discriminated Unions

### Type Guards - Kiểm tra type runtime

```typescript
// Type guard function
function isEmailNotification(
  notification: Notification<any>
): notification is Notification<EmailData> {
  const data = notification.getData();
  return "to" in data && "subject" in data;
}

// Sử dụng type guard
function handleNotification(notification: Notification<any>) {
  if (isEmailNotification(notification)) {
    // ✅ TypeScript biết đây là EmailNotification!
    const data = notification.getData();
    console.log(data.to);      // ✅ OK
    console.log(data.subject); // ✅ OK
  }
}
```

### Discriminated Unions

```typescript
// Base type với discriminator
interface BaseNotificationData {
  kind: string; // Discriminator field
}

interface EmailData extends BaseNotificationData {
  kind: "email";
  to: string;
  subject: string;
  body: string;
}

interface SMSData extends BaseNotificationData {
  kind: "sms";
  phoneNumber: string;
  message: string;
}

type NotificationData = EmailData | SMSData;

// Factory sử dụng discriminated union
function createNotificationFromData(
  data: NotificationData
): Notification<NotificationData> {
  // ✅ TypeScript narrow type dựa trên 'kind'
  switch (data.kind) {
    case "email":
      // data.to ✅ available!
      return new EmailNotification(data);
    case "sms":
      // data.phoneNumber ✅ available!
      return new SMSNotification(data);
  }
}

// Usage
const emailData: EmailData = {
  kind: "email",
  to: "user@example.com",
  subject: "Test",
  body: "Hello"
};

const notification = createNotificationFromData(emailData);
```

---

## 6. React Router Pattern: SessionStorage Example

Hãy xem cách React Router sử dụng TypeScript trong factories:

```typescript
// Từ React Router - simplified version
interface SessionData {
  [key: string]: any;
}

interface SessionStorage<Data = SessionData, FlashData = Data> {
  getSession(cookieHeader?: string | null): Promise<Session<Data, FlashData>>;
  commitSession(session: Session<Data, FlashData>): Promise<string>;
  destroySession(session: Session<Data, FlashData>): Promise<string>;
}

// Generic factory với 2 type parameters!
function createSessionStorage<Data = SessionData, FlashData = Data>(
  { cookie, createData, readData, updateData, deleteData }: SessionIdStorageStrategy<Data, FlashData>
): SessionStorage<Data, FlashData> {
  return {
    async getSession(cookieHeader) {
      // ... implementation
    },
    async commitSession(session) {
      // ... implementation
    },
    async destroySession(session) {
      // ... implementation
    }
  };
}

// ✅ Sử dụng với custom types
interface MyUserData {
  userId: string;
  username: string;
  role: string;
}

interface MyFlashData {
  error?: string;
  success?: string;
}

const storage = createSessionStorage<MyUserData, MyFlashData>({
  cookie: myCookie,
  createData: async (data) => { /* ... */ },
  readData: async (id) => { /* ... */ },
  updateData: async (id, data) => { /* ... */ },
  deleteData: async (id) => { /* ... */ }
});

// ✅ TypeScript biết chính xác types!
const session = await storage.getSession();
// session.get("userId")   ✅ Returns string
// session.get("username") ✅ Returns string
// session.flash("error")  ✅ Accepts string
```

---

## 7. Best Practices

### ✅ DO: Dùng Generic khi cần flexibility

```typescript
// ✅ Good - flexible với different data types
function createStorage<T>(config: StorageConfig): Storage<T> {
  // ...
}
```

### ✅ DO: Dùng default generic types

```typescript
// ✅ Good - có default để dễ sử dụng
interface Storage<T = any> {
  get(): T;
  set(value: T): void;
}
```

### ✅ DO: Constrain generics khi cần

```typescript
// ✅ Good - T phải extend BaseData
function createStorage<T extends BaseData>(config: Config): Storage<T> {
  // ...
}
```

### ❌ DON'T: Over-engineer với quá nhiều generics

```typescript
// ❌ Bad - quá phức tạp!
function createThing<T, U, V, W, X>(a: T, b: U, c: V, d: W): X {
  // Ai đọc được đây?
}
```

### ❌ DON'T: Dùng `any` khi có thể dùng generic

```typescript
// ❌ Bad - mất type safety
function createStorage(data: any): any {
  // ...
}

// ✅ Good
function createStorage<T>(data: T): Storage<T> {
  // ...
}
```

---

## 8. Hands-on Exercise

### Bài tập: Tạo Generic Data Fetcher Factory

**Yêu cầu:**

1. Tạo interface `DataFetcher<T>` với methods:
   - `fetch(): Promise<T>`
   - `cache(data: T): void`
   - `clear(): void`

2. Implement 2 concrete fetchers:
   - `ApiDataFetcher<T>` - fetch từ API
   - `LocalDataFetcher<T>` - fetch từ localStorage

3. Tạo factory `createDataFetcher<T>(type, config)` 

4. Test với 2 data types:
   - `UserData = { id: number; name: string }`
   - `PostData = { id: number; title: string; content: string }`

### Code starter:

```typescript
// TODO: Define DataFetcher interface
interface DataFetcher<T> {
  // Your code here
}

// TODO: Implement ApiDataFetcher
class ApiDataFetcher<T> implements DataFetcher<T> {
  constructor(private url: string) {}
  
  async fetch(): Promise<T> {
    // Your code here
  }
  
  cache(data: T): void {
    // Your code here
  }
  
  clear(): void {
    // Your code here
  }
}

// TODO: Implement LocalDataFetcher
class LocalDataFetcher<T> implements DataFetcher<T> {
  constructor(private key: string) {}
  
  // Your implementation
}

// TODO: Create factory
type FetcherType = "api" | "local";

interface FetcherConfig {
  api?: { url: string };
  local?: { key: string };
}

function createDataFetcher<T>(
  type: FetcherType,
  config: FetcherConfig
): DataFetcher<T> {
  // Your code here
}

// TODO: Test
interface UserData {
  id: number;
  name: string;
}

const userFetcher = createDataFetcher<UserData>("api", {
  api: { url: "/api/users" }
});

userFetcher.fetch().then(data => {
  console.log(data.name); // Should be type-safe!
});
```

<details>
<summary>Xem giải pháp</summary>

```typescript
interface DataFetcher<T> {
  fetch(): Promise<T>;
  cache(data: T): void;
  clear(): void;
}

class ApiDataFetcher<T> implements DataFetcher<T> {
  private cachedData: T | null = null;
  
  constructor(private url: string) {}
  
  async fetch(): Promise<T> {
    if (this.cachedData) {
      return this.cachedData;
    }
    
    const response = await fetch(this.url);
    const data = await response.json() as T;
    this.cachedData = data;
    return data;
  }
  
  cache(data: T): void {
    this.cachedData = data;
  }
  
  clear(): void {
    this.cachedData = null;
  }
}

class LocalDataFetcher<T> implements DataFetcher<T> {
  constructor(private key: string) {}
  
  async fetch(): Promise<T> {
    const data = localStorage.getItem(this.key);
    if (!data) {
      throw new Error(`No data found for key: ${this.key}`);
    }
    return JSON.parse(data) as T;
  }
  
  cache(data: T): void {
    localStorage.setItem(this.key, JSON.stringify(data));
  }
  
  clear(): void {
    localStorage.removeItem(this.key);
  }
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
```

</details>

---

## 📝 Tóm tắt (Key Takeaways)

1. **Generic types `<T>`** cho phép factories hoạt động với nhiều data types
2. **Type inference** giúp TypeScript tự động suy ra types
3. **Union types** và **discriminated unions** tăng type safety
4. **Optional parameters** với default values giúp APIs dễ sử dụng
5. **Type guards** giúp narrow types tại runtime
6. React Router sử dụng generics rộng rãi trong factories
7. Cân bằng giữa **flexibility** và **simplicity**

---

## ❓ Câu hỏi ôn tập

1. Generic type `<T>` là gì? Tại sao cần nó?
2. Discriminated union khác gì với union type bình thường?
3. Khi nào nên dùng default generic type (`<T = any>`)?
4. Type guard là gì? Cho ví dụ.
5. Ưu điểm của `NotificationOptions?` (optional) so với `NotificationOptions`?

<details>
<summary>Xem đáp án</summary>

1. Generic type là placeholder cho type thực tế, giúp viết code reusable mà vẫn type-safe
2. Discriminated union có field chung (discriminator) để TypeScript narrow type
3. Khi muốn interface dễ dùng (không bắt buộc specify type) nhưng vẫn cho phép custom
4. Type guard là function kiểm tra type runtime, ví dụ: `is notification is EmailNotification`
5. Optional cho phép parameter không bắt buộc, dễ sử dụng và có thể có default value

</details>

---

## 🚀 Tiếp theo

Trong **Lesson 3**, chúng ta sẽ:
- Phân tích **Session Storage factories** trong React Router
- Đọc code thực tế với TypeScript generics
- Hiểu async factory methods
- So sánh implementations khác nhau

**Ready for real code?** → [`03-session-storage-deep-dive.md`](./03-session-storage-deep-dive.md)
