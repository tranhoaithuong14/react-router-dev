// ✅ GOOD EXAMPLE: With Factory Method
// Giải pháp: Sử dụng interface + factory method

// Step 1: Product interface
interface Notification {
  send(message: string): void;
}

// Step 2: Concrete Products
class EmailNotification implements Notification {
  send(message: string): void {
    console.log(`📧 Sending email: ${message}`);
  }
}

class SMSNotification implements Notification {
  send(message: string): void {
    console.log(`📱 Sending SMS: ${message}`);
  }
}

class PushNotification implements Notification {
  send(message: string): void {
    console.log(`🔔 Sending push: ${message}`);
  }
}

// Step 3: Factory Method
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

// Step 4: Client code - KHÔNG cần biết concrete classes!
function sendNotification(type: string, message: string): void {
  try {
    const notification = createNotification(type); // Factory tạo object
    notification.send(message);                     // Dùng interface
  } catch (error) {
    console.error((error as Error).message);
  }
}

// Test
console.log("=== ✅ GOOD EXAMPLE: With Factory Method ===\n");

sendNotification("email", "Welcome to our app!");
sendNotification("sms", "Your code is 123456");
sendNotification("push", "You have a new message");
sendNotification("slack", "This will show error"); // ✅ Proper error handling

console.log("\n✅ Benefits:");
console.log("- Single responsibility (factory handles creation)");
console.log("- Client only knows about Notification interface");
console.log("- Easy to add new types (just update factory)");
console.log("- Type safe with TypeScript");
console.log("- Proper error handling");
