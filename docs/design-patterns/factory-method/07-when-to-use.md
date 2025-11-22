# Lesson 7: Khi nào dùng Factory Method?

## 🎯 Mục tiêu

- ✅ Biết khi nào NÊN dùng Factory Method
- ✅ Biết khi nào KHÔNG NÊN dùng
- ✅ So sánh với các patterns khác
- ✅ Decision framework cho dự án thật

## 📚 Prerequisites

- ✅ Completed Lessons 1-6

---

## 1. Khi nào NÊN dùng Factory Method? ✅

### Scenario 1: Multiple Implementations của Same Interface

**Ví dụ:** Payment gateways

```typescript
interface PaymentGateway {
  charge(amount: number): Promise<PaymentResult>;
}

// ✅ GOOD USE: Nhiều implementations
function createPaymentGateway(type: "stripe" | "paypal" | "square"): PaymentGateway {
  switch (type) {
    case "stripe": return new StripeGateway();
    case "paypal": return new PayPalGateway();
    case "square": return new SquareGateway();
  }
}
```

**Khi nào:** Khi có ≥2 implementations của cùng interface

---

### Scenario 2: Environment-Specific Implementations

**Ví dụ:** Storage backends

```typescript
function createStorage(): Storage {
  if (typeof window !== "undefined") {
    return new BrowserLocalStorage();
  } else if (process.env.NODE_ENV === "production") {
    return new RedisStorage();
  } else {
    return new InMemoryStorage();
  }
}
```

**Khi nào:** Implementation thay đổi theo môi trường (dev/prod, browser/server)

---

### Scenario 3: Complex Object Creation Logic

**Ví dụ:** Database connection

```typescript
function createDatabaseConnection(config: DbConfig): Database {
  // Complex setup logic
  const connection = new Database(config);
  connection.setPoolSize(config.poolSize || 10);
  connection.enableLogging(config.debug);
  connection.setTimeout(config.timeout || 30000);
  
  // Add interceptors
  connection.addInterceptor(new RetryInterceptor());
  connection.addInterceptor(new LoggingInterceptor());
  
  return connection;
}
```

**Khi nào:** Object creation phức tạp, nhiều bước

---

### Scenario 4: Decoupling Client từ Concrete Classes

**Ví dụ:** Notification system

```typescript
// ✅ Client không biết về concrete classes
const notification = createNotification(config.notificationType);
notification.send("Hello");

// ❌ Without factory - tight coupling
if (config.notificationType === "email") {
  const notification = new EmailNotification(config.email);
  notification.send("Hello");
} else if (...) {
  // ...
}
```

**Khi nào:** Muốn giảm coupling giữa client code và implementations

---

### Scenario 5: Testing với Mock Implementations

**Ví dụ:** API client

```typescript
// Production
const apiClient = createApiClient({
  type: "http",
  baseUrl: "https://api.example.com"
});

// Testing
const apiClient = createApiClient({
  type: "mock",
  mockData: testData
});
```

**Khi nào:** Cần dễ dàng swap implementations cho testing

---

## 2. Khi nào KHÔNG NÊN dùng? ❌

### Anti-pattern 1: Single Implementation

```typescript
// ❌ BAD: Chỉ có 1 implementation, không cần factory
function createUser(name: string): User {
  return new User(name);
}

// ✅ GOOD: Dùng trực tiếp
const user = new User(name);
```

**Tại sao:** Over-engineering, không có lý do để abstract

---

### Anti-pattern 2: Simple Object Creation

```typescript
// ❌ BAD: Quá đơn giản cho factory
function createPoint(x: number, y: number): Point {
  return { x, y };
}

// ✅ GOOD: Object literal hoặc constructor
const point = { x: 10, y: 20 };
// hoặc
const point = new Point(10, 20);
```

**Tại sao:** Factory thêm complexity không cần thiết

---

### Anti-pattern 3: Static Data

```typescript
// ❌ BAD: Data không thay đổi
function createConfig(): Config {
  return {
    appName: "MyApp",
    version: "1.0.0"
  };
}

// ✅ GOOD: Const object
const CONFIG = {
  appName: "MyApp",
  version: "1.0.0"
};
```

**Tại sao:** Không cần function cho static data

---

### Anti-pattern 4: Premature Abstraction

```typescript
// ❌ BAD: "Maybe I'll need this later..."
function createLogger(type: "console"): Logger {
  // Chỉ có console.log, nhưng "maybe" cần file logger sau
  return new ConsoleLogger();
}

// ✅ GOOD: Implement khi thực sự cần
class Logger {
  log(msg: string) {
    console.log(msg);
  }
}
```

**Tại sao:** YAGNI (You Aren't Gonna Need It)

---

## 3. So sánh với Patterns khác

### vs. Simple Factory (Static Factory)

```typescript
// Simple Factory (not a pattern, just a function)
class NotificationFactory {
  static create(type: string): Notification {
    // ...
  }
}

// Factory Method (design pattern)
function createNotification(type: string): Notification {
  // ...
}
```

| Aspect | Simple Factory | Factory Method |
|--------|---------------|----------------|
| Inheritance | ❌ | ✅ Can be overridden |
| Flexibility | ⚡ | ⚡⚡ |
| Use case | Simple | Complex |

**Khi nào dùng Simple Factory:** Khi không cần inheritance/override

---

### vs. Abstract Factory

```typescript
// Factory Method - creates ONE product
createNotification(type): Notification

// Abstract Factory - creates FAMILY of products
createUIFactory(platform): {
  createButton(): Button,
  createInput(): Input,
  createDialog(): Dialog
}
```

| Pattern | Creates | Example |
|---------|---------|---------|
| Factory Method | Single product | `createStorage()` |
| Abstract Factory | Family of products | `createUIKit()` |

**Khi nào dùng Abstract Factory:** Khi cần tạo nhiều related products cùng lúc

---

### vs. Builder Pattern

```typescript
// Factory Method - creates in one step
const user = createUser({ name: "John", email: "..." });

// Builder - creates step by step
const user = new UserBuilder()
  .setName("John")
  .setEmail("...")
  .setAge(30)
  .build();
```

| Pattern | Style | Best for |
|---------|-------|----------|
| Factory Method | One-shot | Simple/medium objects |
| Builder | Step-by-step | Complex objects |

**Khi nào dùng Builder:** Khi object có nhiều optional parameters

---

### vs. Dependency Injection

```typescript
// Factory Method
function createService() {
  const db = createDatabase();
  return new UserService(db);
}

// Dependency Injection
class UserService {
  constructor(private db: Database) {} // Injected
}

const db = createDatabase();
const service = new UserService(db); // DI container handles this
```

| Pattern | Who creates deps | Coupling |
|---------|-----------------|----------|
| Factory | Factory itself | Medium |
| DI | External container | Low |

**Khi nào dùng DI:** Large apps, nhiều dependencies

---

## 4. Decision Framework

### Flowchart

```
START
  │
  ├─ Có ≥2 implementations? ───NO──→ Don't use Factory
  │                   │
  │                  YES
  │                   │
  ├─ Implementation thay đổi theo runtime? ───NO──→ Consider Simple Factory
  │                   │
  │                  YES
  │                   │
  ├─ Cần testing với mocks? ───NO──→ Maybe not needed
  │                   │
  │                  YES
  │                   │
  ├─ Object creation phức tạp? ───YES──→ Use Factory Method ✅
  │                   │
  │                  NO
  │                   │
  └─────────────────→ Consider alternatives
```

---

## 5. Real-World Scenarios

### Scenario 1: Multi-tenant SaaS App

```typescript
// Different database per tenant
function createTenantDatabase(tenantId: string): Database {
  const tenant = getTenantConfig(tenantId);
  
  switch (tenant.dbType) {
    case "postgres":
      return new PostgresDatabase(tenant.dbConfig);
    case "mysql":
      return new MySQLDatabase(tenant.dbConfig);
    case "mongodb":
      return new MongoDatabase(tenant.dbConfig);
  }
}
```

**✅ Good use:** Different implementations per tenant

---

### Scenario 2: Feature Flags

```typescript
function createAnalyticsService(): AnalyticsService {
  if (featureFlags.newAnalytics) {
    return new NewAnalyticsService();
  } else {
    return new LegacyAnalyticsService();
  }
}
```

**✅ Good use:** A/B testing, gradual rollouts

---

### Scenario 3: Platform-Specific Code

```typescript
function createFileSystem(): FileSystem {
  if (process.platform === "win32") {
    return new WindowsFileSystem();
  } else {
    return new UnixFileSystem();
  }
}
```

**✅ Good use:** Cross-platform apps

---

### Scenario 4: Authentication Strategies

```typescript
function createAuthProvider(type: AuthType): AuthProvider {
  switch (type) {
    case "oauth": return new OAuthProvider();
    case "saml": return new SAMLProvider();
    case "ldap": return new LDAPProvider();
    case "local": return new LocalAuthProvider();
  }
}
```

**✅ Good use:** Multiple auth methods

---

## 6. Checklist Before Using

Hỏi bản thân:

- [ ] Có ít nhất 2 implementations khác nhau?
- [ ] Implementation có thể thay đổi runtime?
- [ ] Object creation có phức tạp?
- [ ] Muốn giảm coupling với concrete classes?
- [ ] Cần dễ dàng testing với mocks?
- [ ] Pattern giúp code dễ maintain hơn?

**≥3 câu YES** → ✅ Use Factory Method

**<3 câu YES** → ❌ Consider simpler approach

---

## 7. Migration Path

### From Direct Instantiation

```typescript
// Before
const storage = new LocalStorage(config);

// After (if adding more types)
const storage = createStorage({ type: "local", config });
```

### Adding Factory Gradually

```typescript
// Phase 1: Wrap existing code
function createStorage(type: string) {
  if (type === "local") {
    return new LocalStorage(); // Existing class
  }
  throw new Error("Not implemented");
}

// Phase 2: Add new implementations
function createStorage(type: string) {
  if (type === "local") return new LocalStorage();
  if (type === "redis") return new RedisStorage(); // New!
  // ...
}
```

---

## 📝 Tóm tắt

### ✅ USE Factory Method when:
1. Multiple implementations of same interface
2. Implementation varies by environment/config
3. Complex object creation
4. Need to decouple client from concrete classes
5. Testing with mocks is important

### ❌ DON'T USE when:
1. Only one implementation
2. Simple object creation
3. Static data
4. Premature abstraction

### 🔄 Alternatives:
- Simple Factory (no inheritance needed)
- Abstract Factory (families of products)
- Builder (complex object with many optionals)
- Dependency Injection (large apps)

### 🎯 Key Principle:
> "Use Factory Method to hide **which** class is instantiated, not **how**."

---

## 🎉 Congratulations!

Bạn đã hoàn thành toàn bộ Factory Method Learning Series!

### Bạn đã học:
1. ✅ Factory Method basics
2. ✅ TypeScript for factories
3. ✅ React Router Session Storage analysis
4. ✅ React Router History factories analysis
5. ✅ React Router Router factories analysis
6. ✅ Build your own factory
7. ✅ When to use Factory Method

### Next Steps:
- Apply Factory Method in your projects
- Study other related patterns
- Explore more React Router code
- Share your knowledge!

---

**Happy Coding!** 🚀
