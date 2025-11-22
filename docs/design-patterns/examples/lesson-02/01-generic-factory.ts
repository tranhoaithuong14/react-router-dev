// Lesson 2: TypeScript for Factory Method
// Example 1: Generic Factory với Type Inference

// Generic notification interface
interface Notification<TData = any> {
  send(message: string): void;
  getData(): TData;
}

// Specific data types
interface EmailData {
  to: string;
  subject: string;
  body: string;
}

interface SMSData {
  phoneNumber: string;
  message: string;
}

// Concrete implementations với specific types
class EmailNotification implements Notification<EmailData> {
  constructor(private data: EmailData) {}
  
  send(message: string): void {
    console.log(`📧 Email to ${this.data.to}`);
    console.log(`   Subject: ${this.data.subject}`);
    console.log(`   Message: ${message}`);
  }
  
  getData(): EmailData {
    return this.data;
  }
}

class SMSNotification implements Notification<SMSData> {
  constructor(private data: SMSData) {}
  
  send(message: string): void {
    console.log(`📱 SMS to ${this.data.phoneNumber}`);
    console.log(`   Message: ${message}`);
  }
  
  getData(): SMSData {
    return this.data;
  }
}

// Generic factory
function createNotification<T>(
  type: string,
  data: T
): Notification<T> {
  switch (type) {
    case "email":
      return new EmailNotification(data as EmailData) as Notification<T>;
    case "sms":
      return new SMSNotification(data as SMSData) as Notification<T>;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

// Demo
console.log("=== Generic Factory Demo ===\n");

const emailNotif = createNotification("email", {
  to: "user@example.com",
  subject: "Welcome",
  body: "Hello!"
});

emailNotif.send("Welcome to our app!");

// ✅ TypeScript biết chính xác getData() trả về EmailData!
const emailData = emailNotif.getData();
console.log(`\n✅ Type-safe access: ${emailData.to}, ${emailData.subject}\n`);

const smsNotif = createNotification("sms", {
  phoneNumber: "+1234567890",
  message: "Your code is 123456"
});

smsNotif.send("Your OTP code");
const smsData = smsNotif.getData();
console.log(`\n✅ Type-safe access: ${smsData.phoneNumber}\n`);
