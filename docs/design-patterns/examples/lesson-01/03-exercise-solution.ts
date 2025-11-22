// Exercise Solution: Thêm SlackNotification

// Product interface
interface Notification {
  send(message: string): void;
}

// Existing implementations
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

// ✅ NEW: SlackNotification implementation
class SlackNotification implements Notification {
  send(message: string): void {
    console.log(`💬 Sending Slack message: ${message}`);
  }
}

// Updated factory method
function createNotification(type: string): Notification {
  switch (type) {
    case "email":
      return new EmailNotification();
    case "sms":
      return new SMSNotification();
    case "push":
      return new PushNotification();
    case "slack": // ✅ Added slack case
      return new SlackNotification();
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

// Client code (UNCHANGED!)
function sendNotification(type: string, message: string): void {
  try {
    const notification = createNotification(type);
    notification.send(message);
  } catch (error) {
    console.error((error as Error).message);
  }
}

// Test
console.log("=== 🎯 EXERCISE SOLUTION: SlackNotification ===\n");

sendNotification("email", "Welcome!");
sendNotification("sms", "Code: 123456");
sendNotification("push", "New message");
sendNotification("slack", "Hello from Slack!"); // ✅ NEW!

console.log("\n🎉 Success!");
console.log("- Added SlackNotification class");
console.log("- Updated factory method");
console.log("- Client code unchanged!");
console.log("- That's the power of Factory Method!");
