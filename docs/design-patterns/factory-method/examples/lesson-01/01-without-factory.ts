// ❌ BAD EXAMPLE: Without Factory Method
// Vấn đề: Nhiều IF-ELSE, tight coupling, khó maintain

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

// ❌ RẤT TỆ: Client code biết tất cả concrete classes
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
  } else {
    console.error(`Unknown notification type: ${type}`);
  }
}

// Test
console.log("=== BAD EXAMPLE: Without Factory Method ===\n");

sendNotification("email", "Welcome to our app!");
sendNotification("sms", "Your code is 123456");
sendNotification("push", "You have a new message");
sendNotification("slack", "This won't work"); // ❌ No error handling

console.log("\n❌ Problems:");
console.log("- Too many IF-ELSE statements");
console.log("- Client knows about all concrete classes");
console.log("- Hard to add new notification types");
console.log("- No type safety");
