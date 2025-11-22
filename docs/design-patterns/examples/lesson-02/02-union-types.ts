// Lesson 2: Typed Factory với Union Types
// Example 2: Type-safe factory với discriminated unions

// Union type cho notification types
type NotificationType = "email" | "sms" | "push";

// Type mapping
type NotificationDataMap = {
  email: { to: string; subject: string };
  sms: { phoneNumber: string };
  push: { deviceId: string; title: string };
};

// Notification interface
interface Notification<T> {
  send(message: string): void;
  getData(): T;
}

// Implementations
class EmailNotification implements Notification<NotificationDataMap["email"]> {
  constructor(private data: NotificationDataMap["email"]) {}
  send(message: string) {
    console.log(`📧 Email to ${this.data.to}: ${this.data.subject}`);
  }
  getData() {
    return this.data;
  }
}

class SMSNotification implements Notification<NotificationDataMap["sms"]> {
  constructor(private data: NotificationDataMap["sms"]) {}
  send(message: string) {
    console.log(`📱 SMS to ${this.data.phoneNumber}: ${message}`);
  }
  getData() {
    return this.data;
  }
}

class PushNotification implements Notification<NotificationDataMap["push"]> {
  constructor(private data: NotificationDataMap["push"]) {}
  send(message: string) {
    console.log(`🔔 Push to ${this.data.deviceId}: ${this.data.title}`);
  }
  getData() {
    return this.data;
  }
}

// ✅ Type-safe factory!
function createTypedNotification<T extends NotificationType>(
  type: T,
  data: NotificationDataMap[T]
): Notification<NotificationDataMap[T]> {
  switch (type) {
    case "email":
      return new EmailNotification(data as NotificationDataMap["email"]) as any;
    case "sms":
      return new SMSNotification(data as NotificationDataMap["sms"]) as any;
    case "push":
      return new PushNotification(data as NotificationDataMap["push"]) as any;
  }
}

// Demo
console.log("=== Type-Safe Factory Demo ===\n");

// ✅ TypeScript kiểm tra type!
const email = createTypedNotification("email", {
  to: "user@example.com",
  subject: "Test"
});
email.send("Welcome!");

const sms = createTypedNotification("sms", {
  phoneNumber: "+1234567890"
});
sms.send("Your code is 123");

const push = createTypedNotification("push", {
  deviceId: "device-123",
  title: "New Message"
});
push.send("You have a notification");

// ❌ This would cause TypeScript error if uncommented:
// const wrongEmail = createTypedNotification("email", {
//   phoneNumber: "123" // ❌ Wrong data type for 'email'!
// });

console.log("\n✅ All type checks passed!");
