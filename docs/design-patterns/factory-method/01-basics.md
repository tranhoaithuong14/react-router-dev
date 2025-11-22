# Lesson 1: Factory Method - Khái niệm cơ bản

## 🎯 Mục tiêu

Sau khi học xong lesson này, bạn sẽ:
- ✅ Hiểu Factory Method pattern là gì
- ✅ Biết vấn đề nó giải quyết
- ✅ Phân biệt được code CÓ và KHÔNG có Factory Method
- ✅ Nhận biết các thành phần chính của pattern

## 📚 Kiến thức nền

Bạn cần biết cơ bản về:
- JavaScript/TypeScript
- Class và interface

---

## 1. Factory Method là gì?

> **Factory Method** là một design pattern giúp tạo ra objects mà **KHÔNG cần chỉ định rõ class cụ thể** của object đó.

Nghe có vẻ trừu tượng? Hãy xem ví dụ thực tế!

---

## 2. Vấn đề (The Problem)

### Tình huống: Hệ thống thông báo

Bạn đang xây dựng một app cần gửi thông báo cho users. Ban đầu, app chỉ hỗ trợ **Email**.

```typescript
class EmailNotification {
  send(message: string) {
    console.log(`📧 Sending email: ${message}`);
    // Logic gửi email...
  }
}

// Sử dụng
const notification = new EmailNotification();
notification.send("Welcome!");
```

Mọi thứ hoạt động tốt! ✅

---

### ❌ Vấn đề xuất hiện

Sau vài tháng, khách hàng yêu cầu thêm **SMS** và **Push Notification**. 

Code của bạn trở thành:

```typescript
class EmailNotification {
  send(message: string) {
    console.log(`📧 Sending email: ${message}`);
  }
}

class SMSNotification {
  send(message: string) {
    console.log(`📱 Sending SMS: ${message}`);
  }
}

class PushNotification {
  send(message: string) {
    console.log(`🔔 Sending push: ${message}`);
  }
}

// ❌ Sử dụng - RẤT TỆ!
function sendNotification(type: string, message: string) {
  if (type === "email") {
    const notification = new EmailNotification();
    notification.send(message);
  } else if (type === "sms") {
    const notification = new SMSNotification();
    notification.send(message);
  } else if (type === "push") {
    const notification = new PushNotification();
    notification.send(message);
  }
}

sendNotification("email", "Hello!");
sendNotification("sms", "Hello!");
```

### 🤔 Vấn đề ở đây là gì?

1. **Nhiều IF-ELSE** - Thêm loại thông báo mới = thêm if-else
2. **Hard to maintain** - Code logic trộn lẫn với code tạo objects
3. **Violates Open/Closed Principle** - Phải sửa code hiện tại để thêm feature mới
4. **Tight coupling** - Function biết quá nhiều về các class cụ thể

---

## 3. Giải pháp: Factory Method

### Bước 1: Tạo Interface chung (Product)

```typescript
// Product interface - định nghĩa contract chung
interface Notification {
  send(message: string): void;
}
```

### Bước 2: Implement các Concrete Products

```typescript
// Concrete Product 1
class EmailNotification implements Notification {
  send(message: string): void {
    console.log(`📧 Sending email: ${message}`);
  }
}

// Concrete Product 2
class SMSNotification implements Notification {
  send(message: string): void {
    console.log(`📱 Sending SMS: ${message}`);
  }
}

// Concrete Product 3
class PushNotification implements Notification {
  send(message: string): void {
    console.log(`🔔 Sending push: ${message}`);
  }
}
```

### Bước 3: Tạo Factory Method

```typescript
// Factory Method - TẠO RA objects dựa trên type
function createNotification(type: string): Notification {
  switch (type) {
    case "email":
      return new EmailNotification();
    case "sms":
      return new SMSNotification();
    case "push":
      return new PushNotification();
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}
```

### Bước 4: Sử dụng ✅

```typescript
// Client code - KHÔNG cần biết class cụ thể!
function sendNotification(type: string, message: string) {
  const notification = createNotification(type); // Factory tạo object
  notification.send(message);                     // Dùng interface Notification
}

// Sử dụng
sendNotification("email", "Welcome!");
sendNotification("sms", "Your code is 123456");
sendNotification("push", "New message!");
```

### 🌟 Lợi ích

1. ✅ **Single Responsibility** - Factory chịu trách nhiệm tạo objects
2. ✅ **Open/Closed** - Thêm notification mới không cần sửa client code
3. ✅ **Loose coupling** - Client chỉ biết về interface, không biết class cụ thể
4. ✅ **Dễ test** - Có thể inject mock notification

---

## 4. Các thành phần chính

```
┌─────────────────────────────────────────────┐
│         Factory Method Pattern              │
├─────────────────────────────────────────────┤
│                                             │
│  1. Product (Interface)                     │
│     └─ Notification                         │
│                                             │
│  2. Concrete Products (Implementations)     │
│     ├─ EmailNotification                    │
│     ├─ SMSNotification                      │
│     └─ PushNotification                     │
│                                             │
│  3. Factory Method (Creator)                │
│     └─ createNotification(type)             │
│                                             │
│  4. Client                                  │
│     └─ sendNotification()                   │
│        (dùng factory, không tạo trực tiếp)  │
│                                             │
└─────────────────────────────────────────────┘
```

### Giải thích:

| Thành phần | Vai trò | Ví dụ |
|------------|---------|-------|
| **Product** | Interface định nghĩa contract | `Notification` |
| **Concrete Product** | Class implement Product | `EmailNotification`, `SMSNotification` |
| **Factory Method** | Method tạo ra Product objects | `createNotification()` |
| **Client** | Code sử dụng Product qua Factory | `sendNotification()` |

---

## 5. So sánh: Trước và Sau

### ❌ Trước (Không có Factory Method)

```typescript
// Client phải biết và tạo trực tiếp class cụ thể
if (type === "email") {
  const notification = new EmailNotification(); // Tight coupling!
  notification.send(message);
}
```

**Vấn đề:**
- Client phụ thuộc vào class cụ thể
- Thêm loại mới = sửa nhiều chỗ
- Code phức tạp với nhiều if-else

### ✅ Sau (Có Factory Method)

```typescript
// Client chỉ biết interface
const notification = createNotification(type); // Factory lo việc tạo
notification.send(message);                     // Dùng interface
```

**Lợi ích:**
- Client chỉ phụ thuộc interface
- Thêm loại mới = chỉ sửa factory
- Code đơn giản, rõ ràng

---

## 6. TypeScript Fundamentals cần biết

### Interface

```typescript
// Interface định nghĩa "contract" - những method/property phải có
interface Animal {
  name: string;
  makeSound(): void;
}

// Class implement interface phải có đủ những gì interface yêu cầu
class Dog implements Animal {
  name = "Bobby";
  makeSound() {
    console.log("Woof!");
  }
}
```

### Return Type

```typescript
// Khai báo return type giúp TypeScript kiểm tra
function createAnimal(): Animal {  // Return type là Animal interface
  return new Dog();  // OK - Dog implements Animal
}
```

### Type Safety

```typescript
const animal: Animal = createAnimal();
animal.makeSound();  // ✅ OK - Animal có method này
animal.fly();        // ❌ ERROR - Animal không có method này
```

---

## 7. Hands-on Exercise

### Thử nghiệm:

1. Copy code ví dụ vào một file TypeScript
2. Chạy thử các notification types
3. **Thử thêm một loại notification mới**: `SlackNotification`
   - Tạo class `SlackNotification implements Notification`
   - Thêm case vào factory method
   - Test bằng `sendNotification("slack", "Test")`

### Code starter:

```typescript
// TODO: Thêm SlackNotification class

// TODO: Update factory method
function createNotification(type: string): Notification {
  switch (type) {
    case "email":
      return new EmailNotification();
    case "sms":
      return new SMSNotification();
    case "push":
      return new PushNotification();
    // TODO: Thêm case "slack" ở đây
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// TODO: Test với slack
sendNotification("slack", "Hello from Slack!");
```

---

## 📝 Tóm tắt (Key Takeaways)

1. **Factory Method** tách logic tạo object ra khỏi business logic
2. Client code chỉ biết về **interface**, không biết **class cụ thể**
3. Giúp code **dễ mở rộng** (thêm type mới không cần sửa client)
4. Giảm **coupling** giữa các components
5. Thành phần chính:
   - Product (interface)
   - Concrete Products (implementations)
   - Factory Method (creator)
   - Client (người dùng)

---

## ❓ Câu hỏi ôn tập

Hãy tự trả lời các câu hỏi sau:

1. Factory Method giải quyết vấn đề gì?
2. Sự khác biệt chính giữa `new EmailNotification()` và `createNotification("email")` là gì?
3. Tại sao dùng interface `Notification` thay vì dùng trực tiếp các class?
4. Nếu cần thêm `WhatsAppNotification`, cần sửa những chỗ nào?
5. Client code có cần biết về class `EmailNotification` hay không?

<details>
<summary>Xem đáp án</summary>

1. Giải quyết vấn đề tight coupling, nhiều if-else khi tạo objects
2. `new EmailNotification()` - client biết class cụ thể, `createNotification()` - client chỉ biết interface
3. Để client không phụ thuộc vào implementation, dễ thay đổi và test
4. Chỉ cần: tạo class mới implement Notification, thêm case vào factory
5. Không! Client chỉ cần biết interface Notification

</details>

---

## 🚀 Tiếp theo

Trong **Lesson 2**, chúng ta sẽ học:
- TypeScript Generics cho Factory Methods
- Type safety nâng cao
- Optional parameters và configuration
- Chuẩn bị cho việc phân tích React Router code

**Ready?** → [`02-typescript-for-factory-method.md`](./02-typescript-for-factory-method.md)
