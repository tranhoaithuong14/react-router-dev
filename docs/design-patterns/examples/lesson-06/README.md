# Code Examples - Lesson 6

Complete DataSource Factory implementation

## 📁 Files

- `datasource-factory.ts` - Full implementation with REST, LocalStorage, Memory

## 🚀 Chạy example

```bash
npm run lesson-06
```

## 📚 Features

### DataSource Interface
- `fetch()` - Get all items
- `fetchOne(id)` - Get single item
- `create(data)` - Create new item
- `update(id, data)` - Update item  
- `delete(id)` - Delete item

### Implementations
1. **REST** - API calls (mocked)
2. **LocalStorage** - Browser storage (simulated)
3. **Memory** - In-memory storage

### Factory Method
```typescript
createDataSource<T extends Entity>(config): DataSource<T>
```

Type-safe với discriminated union types!

[← Lesson 6: Build Your Own Factory](../06-build-your-own-factory.md)
