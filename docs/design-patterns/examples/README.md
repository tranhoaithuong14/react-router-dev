# Factory Method Pattern - Code Examples

Runnable TypeScript examples cho tất cả các lessons

## 📚 Available Examples

### ✅ Lesson 1: Factory Method Basics
```bash
npm run lesson-01-bad      # Without factory
npm run lesson-01-good     # With factory
npm run lesson-01-exercise # SlackNotification
```
[📂 Lesson 1 Examples](./lesson-01/)

### ✅ Lesson 2: TypeScript for Factory Method
```bash
npm run lesson-02-generic  # Generic types
npm run lesson-02-union    # Union types
npm run lesson-02-exercise # Data Fetcher
```
[📂 Lesson 2 Examples](./lesson-02/)

### ✅ Lesson 6: Build Your Own Factory
```bash
npm run lesson-06          # Complete DataSource
```
[📂 Lesson 6 Examples](./lesson-06/)

## 🚀 Quick Start

### 1. Setup (chỉ 1 lần)
```bash
cd docs/design-patterns/examples
npm install
```

### 2. Chạy bất kỳ example nào
```bash
# Chọn lesson bạn muốn
npm run lesson-01-good
npm run lesson-02-generic
npm run lesson-06
```

### 3. Hoặc dùng tsx trực tiếp
```bash
npx tsx lesson-01/02-with-factory.ts
npx tsx lesson-02/01-generic-factory.ts
npx tsx lesson-06/datasource-factory.ts
```

## 📝 Note về Lessons 3-5

Lessons 3-5 phân tích React Router code thực tế, không có standalone examples.
Để xem React Router code:

```bash
# Lesson 3: Session Storage
cat ../../packages/react-router/lib/server-runtime/sessions.ts

# Lesson 4: History  
cat ../../packages/react-router/lib/router/history.ts

# Lesson 5: Router
cat ../../packages/react-router/lib/dom/lib.tsx
```

## 🎯 Learning Path

1. **Lesson 1** - Hiểu vấn đề và giải pháp cơ bản
2. **Lesson 2** - TypeScript type safety
3. **Lessons 3-5** - Phân tích React Router (đọc code)
4. **Lesson 6** - Tự build factory (hands-on)
5. **Lesson 7** - Decision framework (theory)

## 💡 Tips

- Chạy bad example trước để thấy vấn đề
- So sánh với good example
- Modify code và chạy lại để học
- Thử add new types vào factories

Happy coding! 🚀
