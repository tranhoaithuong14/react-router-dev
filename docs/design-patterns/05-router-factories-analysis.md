# Lesson 5: Router Factories Analysis

## 🎯 Mục tiêu

- ✅ Phân tích Router factories trong React Router
- ✅ Hiểu Factory Composition (factory gọi factory)
- ✅ Dependency Injection qua factory parameters
- ✅ Builder pattern elements trong RouterInit

## 📚 Prerequisites

- ✅ Lessons 1-4 completed

---

## 1. Router Factory Overview

### Three Main Router Factories

```typescript
// 1. Browser-based router
createBrowserRouter(routes, options): DataRouter

// 2. Hash-based router
createHashRouter(routes, options): DataRouter

// 3. Static router (SSR)
createStaticRouter(routes, context): StaticRouter
```

---

## 2. Factory #1: `createBrowserRouter()`

### Full Implementation

```typescript
// File: packages/react-router/lib/dom/lib.tsx

export function createBrowserRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  // Factory composition - calls other factories!
  return createRouter({
    basename: opts?.basename,
    getContext: opts?.getContext,
    future: opts?.future,
    
    // 🔑 Dependency Injection: History factory
    history: createBrowserHistory({ window: opts?.window }),
    
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    hydrationRouteProperties,
    dataStrategy: opts?.dataStrategy,
    patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
    window: opts?.window,
    unstable_instrumentations: opts?.unstable_instrumentations,
  }).initialize();
}
```

### Key Patterns:

1. **Factory Composition:**
   ```typescript
   createBrowserRouter() → createRouter() → router.initialize()
                         ↓
                    createBrowserHistory()
   ```

2. **Dependency Injection:**
   ```typescript
   history: createBrowserHistory({ window: opts?.window })
   // Inject history dependency via factory parameter
   ```

3. **Builder-like Options:**
   ```typescript
   interface DOMRouterOpts {
     basename?: string;
     future?: Partial<FutureConfig>;
     hydrationData?: HydrationState;
     dataStrategy?: DataStrategyFunction;
     // ... many optional configurations
   }
   ```

---

## 3. Factory #2: `createHashRouter()`

### Almost identical to Browser Router!

```typescript
export function createHashRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    getContext: opts?.getContext,
    future: opts?.future,
    
    // 🔑 ONLY DIFFERENCE: Different history factory!
    history: createHashHistory({ window: opts?.window }),
    
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    hydrationRouteProperties,
    dataStrategy: opts?.dataStrategy,
    patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
    window: opts?.window,
    unstable_instrumentations: opts?.unstable_instrumentations,
  }).initialize();
}
```

### Pattern Recognition:

```
createBrowserRouter ─┐
                     ├─→ Same structure, different history
createHashRouter ────┘
```

**This is classic Factory Method!**

---

## 4. Base Factory: `createRouter()`

### Signature

```typescript
interface RouterInit {
  routes: AgnosticRouteObject[];
  history: History;
  basename?: string;
  getContext?: () => MaybePromise<RouterContextProvider>;
  future?: Partial<FutureConfig>;
  hydrationData?: HydrationState;
  window?: Window;
  dataStrategy?: DataStrategyFunction;
  patchRoutesOnNavigation?: AgnosticPatchRoutesOnNavigationFunction;
  mapRouteProperties?: MapRoutePropertiesFunction;
  hydrationRouteProperties?: string[];
  unstable_instrumentations?: unstable_ClientInstrumentation[];
}

export function createRouter(init: RouterInit): Router {
  // Complex implementation...
  // Returns Router object
}
```

### Router Interface (Product)

```typescript
interface Router {
  // State
  get basename(): string;
  get state(): RouterState;
  get routes(): AgnosticDataRouteObject[];
  
  // Lifecycle
  initialize(): Router;
  dispose(): void;
  subscribe(fn: RouterSubscriber): () => void;
  
  // Navigation
  navigate(to: To | null, opts?: RouterNavigateOptions): Promise<void>;
  navigate(to: number): Promise<void>;
  
  // Fetchers
  fetch(key: string, routeId: string, href: string | null, opts?: RouterFetchOptions): Promise<void>;
  getFetcher<TData>(key: string): Fetcher<TData>;
  deleteFetcher(key: string): void;
  
  // Blockers
  getBlocker(key: string, fn: BlockerFunction): Blocker;
  deleteBlocker(key: string): void;
  
  // More methods...
}
```

---

## 5. Factory Composition Deep Dive

### Call Chain

```typescript
// Level 1: Client calls
const router = createBrowserRouter(routes, options);

// Level 2: createBrowserRouter internally calls
return createRouter({
  history: createBrowserHistory(), // Level 3: History factory
  routes,
  // ... other deps
}).initialize();

// Level 3: createRouter creates complex Router object
// Level 4: initialize() sets up listeners, loads data
```

### Diagram

```
Client Code
    │
    ├─→ createBrowserRouter(routes, opts)
    │       │
    │       ├─→ createBrowserHistory(opts.window)
    │       │       └─→ getUrlBasedHistory(strategies)
    │       │               └─→ History object
    │       │
    │       └─→ createRouter(init)
    │               ├─→ Setup state
    │               ├─→ Setup navigation
    │               ├─→ Setup data loading
    │               └─→ Router object
    │
    └─→ router.initialize()
            ├─→ Attach event listeners
            ├─→ Load initial data
            └─→ Ready Router
```

---

## 6. Dependency Injection Pattern

### History Injection

```typescript
// ✅ Good: Dependency injected
function createRouter(init: RouterInit): Router {
  const { history } = init; // Injected from outside
  
  // Use injected history
  history.listen(({ location, action }) => {
    // Handle navigation
  });
  
  return router;
}

// Caller provides dependency
createRouter({
  history: createBrowserHistory(), // or createMemoryHistory() for tests
  routes
});
```

### Benefits:

1. **Testability:**
   ```typescript
   // Production
   const router = createRouter({
     history: createBrowserHistory()
   });
   
   // Tests
   const router = createRouter({
     history: createMemoryHistory() // No browser needed!
   });
   ```

2. **Flexibility:**
   ```typescript
   // Can inject custom history
   const customHistory = createCustomHistory();
   const router = createRouter({ history: customHistory });
   ```

---

## 7. Builder Pattern Elements

### Options Object Pattern

```typescript
interface DOMRouterOpts {
  basename?: string;              // Optional
  getContext?: () => MaybePromise<RouterContextProvider>; // Optional
  future?: Partial<FutureConfig>; // Optional
  hydrationData?: HydrationState; // Optional
  dataStrategy?: DataStrategyFunction; // Optional
  // ... many more
}

// Usage
createBrowserRouter(routes, {
  basename: "/app",
  future: { v7_startTransition: true },
  // Only specify what you need!
});
```

### Defaults Handling

```typescript
export function createBrowserRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,  // undefined if not provided
    // ... or with default:
    hydrationData: opts?.hydrationData || parseHydrationData(),
    //                                     ^^^^^^^^^^^^^^^^^^^^^ default
  }).initialize();
}
```

---

## 8. Static Router Factory (SSR)

### Different Product Type!

```typescript
// File: packages/react-router/lib/dom/server.tsx

export function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext,
  opts: {
    future?: Partial<FutureConfig>;
  } = {},
): Router {
  // Returns LIMITED Router (no dynamic navigation)
  const router: Router = {
    get basename() {
      return context.basename;
    },
    get state() {
      return {
        historyAction: Action.Pop,
        location: context.location,
        matches: context.matches,
        // ... from context
      };
    },
    
    // ❌ These throw errors in static router
    navigate() {
      throw new Error("Cannot navigate in static router");
    },
    fetch() {
      throw new Error("Cannot fetch in static router");
    },
    
    // ✅ These work
    initialize() {
      return router;
    },
    subscribe() {
      return () => {};
    },
    
    // ...
  };
  
  return router;
}
```

### Key Difference:

| Feature | Dynamic Routers | Static Router |
|---------|----------------|---------------|
| Navigation | ✅ `navigate()` | ❌ Throws error |
| Data loading | ✅ Dynamic | ❌ Pre-loaded |
| History | ✅ Interactive | ❌ Static snapshot |
| Use case | Browser | SSR |

---

## 9. Hands-on: Simplified Router Factory

### Exercise

Create a simplified router factory system:

```typescript
interface SimpleRoute {
  path: string;
  component: () => string;
}

interface SimpleRouter {
  navigate(path: string): void;
  getCurrentPath(): string;
  render(): string;
}

// TODO: Implement
function createSimpleRouter(
  routes: SimpleRoute[],
  history: History
): SimpleRouter {
  // Your implementation
}

// Usage
const routes = [
  { path: "/", component: () => "Home" },
  { path: "/about", component: () => "About" },
];

const history = createMemoryHistory();
const router = createSimpleRouter(routes, history);

router.navigate("/about");
console.log(router.render()); // "About"
```

<details>
<summary>Solution</summary>

```typescript
function createSimpleRouter(
  routes: SimpleRoute[],
  history: History
): SimpleRouter {
  function matchRoute(path: string): SimpleRoute | undefined {
    return routes.find(r => r.path === path);
  }
  
  return {
    navigate(path: string) {
      history.push(path);
    },
    
    getCurrentPath() {
      return history.location.pathname;
    },
    
    render() {
      const path = this.getCurrentPath();
      const route = matchRoute(path);
      return route ? route.component() : "404 Not Found";
    }
  };
}
```

</details>

---

## 📝 Tóm tắt

1. **Factory Composition**: `createBrowserRouter → createRouter → initialize`
2. **Dependency Injection**: History injected via parameters
3. **Same product interface**: All return `Router` (or compatible)
4. **Builder-like options**: Flexible configuration object
5. **Different implementations**: Browser, Hash, Static routers
6. **Testability**: Easy to inject mock dependencies

---

## 🚀 Tiếp theo

**Lesson 6:** Build Your Own Factory - Hands-on project

→ [`06-build-your-own-factory.md`](./06-build-your-own-factory.md)
