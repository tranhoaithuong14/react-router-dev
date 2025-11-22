# Code Examples - Lesson 1

Các file TypeScript có thể chạy được cho Lesson 1: Factory Method Basics

## 📁 Files

- `01-without-factory.ts` - ❌ Bad example: Code không dùng Factory Method
- `02-with-factory.ts` - ✅ Good example: Code có dùng Factory Method
- `03-exercise-solution.ts` - 🎯 Exercise solution: Thêm SlackNotification

## 🚀 Cách chạy

### Setup (chỉ cần làm 1 lần)

```bash
cd docs/design-patterns/examples
npm install
```

### Chạy examples

```bash
# Bad example (without factory)
npm run lesson-01-bad

# Good example (with factory)
npm run lesson-01-good

# Exercise solution
npm run lesson-01-exercise
```

### Hoặc chạy trực tiếp với tsx

```bash
npx tsx lesson-01/01-without-factory.ts
npx tsx lesson-01/02-with-factory.ts
npx tsx lesson-01/03-exercise-solution.ts
```

## 📝 So sánh output

### Bad example output:
```
=== BAD EXAMPLE: Without Factory Method ===

📧 Sending email: Welcome to our app!
📱 Sending SMS: Your code is 123456
🔔 Sending push: You have a new message

❌ Problems:
- Too many IF-ELSE statements
- Client knows about all concrete classes
- Hard to add new notification types
- No type safety
```

### Good example output:
```
=== ✅ GOOD EXAMPLE: With Factory Method ===

📧 Sending email: Welcome to our app!
📱 Sending SMS: Your code is 123456
🔔 Sending push: You have a new message
Unknown notification type: slack

✅ Benefits:
- Single responsibility (factory handles creation)
- Client only knows about Notification interface
- Easy to add new types (just update factory)
- Type safe with TypeScript
- Proper error handling
```

## 🎯 Thử nghiệm

1. Mở file `02-with-factory.ts`
2. Thử thêm một notification type mới (ví dụ: `WhatsAppNotification`)
3. Chạy lại để xem kết quả!

## 📚 Quay lại lesson

[← Lesson 1: Factory Method Basics](../01-factory-method-basics.md)
