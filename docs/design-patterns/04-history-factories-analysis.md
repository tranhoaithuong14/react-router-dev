# Lesson 4: History Factories Analysis

## 🎯 Mục tiêu

Sau khi học xong lesson này, bạn sẽ:
- ✅ Hiểu History factories trong React Router
- ✅ Phân biệt BrowserHistory, HashHistory, MemoryHistory
- ✅ Nhận biết Strategy pattern kết hợp với Factory Method
- ✅ Hiểu Browser API integration (window.history, window.location)
- ✅ Tạo custom history implementation

## 📚 Kiến thức nền

Bạn đã hoàn thành:
- ✅ Lessons 1-3

---

## 1. History là gì?

**History** trong React Router là abstraction quản lý navigation history. Nó cung cấp methods để:
- Navigate giữa các pages (`push`, `replace`, `go`)
- Listen to location changes
- Encode/decode URLs

### History Interface

```typescript
interface History {
  readonly action: Action; // "POP" | "PUSH" | "REPLACE"
  readonly location: Location;
  
  createHref(to: To): string;
  push(to: To, state?: any): void;
  replace(to: To, state?: any): void;
  go(delta: number): void;
  back(): void;
  forward(): void;
  listen(listener: Listener): () => void;
}
```

---

## 2. Ba loại History - Factory Products

### Product 1: Browser History
```typescript
interface BrowserHistory extends History {
  // Uses browser's history.pushState API
  // URL: http://example.com/path
}
```

### Product 2: Hash History
```typescript
interface HashHistory extends History {
  // Uses URL hash
  // URL: http://example.com/#/path
}
```

### Product 3: Memory History
```typescript
interface MemoryHistory extends History {
  // Stores in memory (array)
  // No URL change
  readonly index: number;
}
```

---

## 3. Factory #1: `createBrowserHistory()`

### Implementation Analysis

```typescript
// File: packages/react-router/lib/router/history.ts

export function createBrowserHistory(
  options: BrowserHistoryOptions = {},
): BrowserHistory {
  
  // STRATEGY 1: How to create Location from browser state
  function createBrowserLocation(
    window: Window,
    globalHistory: Window["history"],
  ) {
    let { pathname, search, hash } = window.location;
    return createLocation(
      "",
      { pathname, search, hash },
      (globalHistory.state && globalHistory.state.usr) || null,
      (globalHistory.state && globalHistory.state.key) || "default",
    );
  }

  // STRATEGY 2: How to create href
  function createBrowserHref(window: Window, to: To) {
    return typeof to === "string" ? to : createPath(to);
  }

  // Call shared factory với strategies!
  return getUrlBasedHistory(
    createBrowserLocation,
    createBrowserHref,
    null, // No validator needed
    options,
  );
}
```

### Phân tích:

1. **Strategy Functions** - Inject behaviors:
   - `createBrowserLocation` - Read from `window.location`
   - `createBrowserHref` - Simple pathname

2. **Shared Factory** - `getUrlBasedHistory()` sử dụng strategies

3. **Browser APIs**:
   ```typescript
   window.location.pathname  // "/about"
   window.location.search    // "?id=123"
   window.location.hash      // "#section"
   window.history.state      // { usr: {...}, key: "..." }
   ```

---

## 4. Factory #2: `createHashHistory()`

### Implementation Analysis

```typescript
export function createHashHistory(
  options: HashHistoryOptions = {},
): HashHistory {
  
  // STRATEGY 1: Create location from hash
  function createHashLocation(
    window: Window,
    globalHistory: Window["history"],
  ) {
    // Parse hash portion: "#/about?id=123" → "/about?id=123"
    let {
      pathname = "/",
      search = "",
      hash = "",
    } = parsePath(window.location.hash.substring(1));

    // Ensure leading slash
    if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
      pathname = "/" + pathname;
    }

    return createLocation(
      "",
      { pathname, search, hash },
      (globalHistory.state && globalHistory.state.usr) || null,
      (globalHistory.state && globalHistory.state.key) || "default",
    );
  }

  // STRATEGY 2: Create href với hash prefix
  function createHashHref(window: Window, to: To) {
    let base = window.document.querySelector("base");
    let href = "";

    if (base && base.getAttribute("href")) {
      let url = window.location.href;
      let hashIndex = url.indexOf("#");
      href = hashIndex === -1 ? url : url.slice(0, hashIndex);
    }

    return href + "#" + (typeof to === "string" ? to : createPath(to));
  }

  // STRATEGY 3: Validator
  function validateHashLocation(location: Location, to: To) {
    warning(
      location.pathname.charAt(0) === "/",
      `relative pathnames are not supported in hash history.push(${JSON.stringify(to)})`,
    );
  }

  return getUrlBasedHistory(
    createHashLocation,
    createHashHref,
    validateHashLocation,
    options,
  );
}
```

### Key Differences từ Browser History:

| Aspect | Browser | Hash |
|--------|---------|------|
| **URL** | `/about` | `/#/about` |
| **Read from** | `window.location.pathname` | `window.location.hash` |
| **href creation** | Direct | Prefix with `#` |
| **Validation** | None | Check leading `/` |

---

## 5. Shared Factory: `getUrlBasedHistory()`

### Strategy Pattern trong action!

```typescript
function getUrlBasedHistory(
  getLocation: GetLocation,     // Strategy: how to get location
  createHref: CreateHref,        // Strategy: how to create href
  validateLocation: ValidateLocation | null, // Strategy: validation
  options: UrlHistoryOptions = {},
): UrlHistory {
  
  let { window = document.defaultView!, v5Compat = false } = options;
  let globalHistory = window.history;
  let action = Action.Pop;
  let listener: Listener | null = null;

  // Get current location using STRATEGY
  function getNextLocation(): Location {
    return getLocation(window, globalHistory);
  }

  // PUSH implementation
  function push(to: To, state?: any) {
    action = Action.Push;
    let location = createLocation(getNextLocation().pathname, to, state);
    
    // Validate using STRATEGY (if provided)
    validateLocation?.(location, to);

    let historyState = getHistoryState(location);
    let url = createHref(window, to); // Create URL using STRATEGY

    try {
      // Browser API call
      globalHistory.pushState(historyState, "", url);
    } catch (error) {
      window.location.assign(url); // Fallback
    }

    if (v5Compat && listener) {
      listener({ action, location, delta: 1 });
    }
  }

  // REPLACE implementation
  function replace(to: To, state?: any) {
    action = Action.Replace;
    let location = createLocation(getNextLocation().pathname, to, state);
    
    validateLocation?.(location, to);
    
    let historyState = getHistoryState(location);
    let url = createHref(window, to);

    globalHistory.replaceState(historyState, "", url);

    if (v5Compat && listener) {
      listener({ action, location, delta: 0 });
    }
  }

  // GO implementation
  function go(delta: number) {
    globalHistory.go(delta);
  }

  // Return History object
  let history: UrlHistory = {
    get action() {
      return action;
    },
    get location() {
      return getNextLocation();
    },
    listen(fn: Listener) {
      listener = fn;
      return () => {
        listener = null;
      };
    },
    createHref(to) {
      return createHref(window, to);
    },
    push,
    replace,
    go,
    back() {
      go(-1);
    },
    forward() {
      go(1);
    },
  };

  return history;
}
```

### Pattern Recognition:

```
Factories:
├─ createBrowserHistory() ─┐
├─ createHashHistory()     ├─→ Provide strategies
└─ ...                     │
                           ▼
           getUrlBasedHistory(strategies)
                           │
                           ├─→ Use strategies for:
                           │   - Get location
                           │   - Create href
                           │   - Validate
                           ▼
                    Return History object
```

**This is:** Factory Method + Strategy Pattern!

---

## 6. Factory #3: `createMemoryHistory()`

### Completely different implementation!

```typescript
export function createMemoryHistory(
  options: MemoryHistoryOptions = {},
): MemoryHistory {
  let { initialEntries = ["/"], initialIndex, v5Compat = false } = options;
  
  // Storage: In-memory array!
  let entries: Location[];
  entries = initialEntries.map((entry, index) =>
    createMemoryLocation(
      entry,
      typeof entry === "string" ? null : entry.state,
      index === 0 ? "default" : undefined,
    ),
  );
  
  let index = clampIndex(
    initialIndex == null ? entries.length - 1 : initialIndex,
  );
  
  let action = Action.Pop;
  let listener: Listener | null = null;

  function clampIndex(n: number): number {
    return Math.min(Math.max(n, 0), entries.length - 1);
  }

  function getCurrentLocation(): Location {
    return entries[index];
  }

  function createMemoryLocation(
    to: To,
    state: any = null,
    key?: string,
  ): Location {
    let location = createLocation(
      entries ? getCurrentLocation().pathname : "/",
      to,
      state,
      key,
    );
    warning(
      location.pathname.charAt(0) === "/",
      `relative pathnames are not supported in memory history: ${JSON.stringify(to)}`,
    );
    return location;
  }

  // PUSH: Add to array
  function push(to: To, state?: any) {
    action = Action.Push;
    let nextLocation = createMemoryLocation(to, state);
    index += 1;
    entries.splice(index, entries.length, nextLocation);
    if (v5Compat && listener) {
      listener({ action, location: nextLocation, delta: 1 });
    }
  }

  // REPLACE: Update current
  function replace(to: To, state?: any) {
    action = Action.Replace;
    let nextLocation = createMemoryLocation(to, state);
    entries[index] = nextLocation;
    if (v5Compat && listener) {
      listener({ action, location: nextLocation, delta: 0 });
    }
  }

  // GO: Move index
  function go(delta: number) {
    action = Action.Pop;
    let nextIndex = clampIndex(index + delta);
    let nextLocation = entries[nextIndex];
    index = nextIndex;
    if (listener) {
      listener({ action, location: nextLocation, delta });
    }
  }

  let history: MemoryHistory = {
    get index() { return index; },
    get action() { return action; },
    get location() { return getCurrentLocation(); },
    createHref(to) {
      return typeof to === "string" ? to : createPath(to);
    },
    push,
    replace,
    go,
    back() { go(-1); },
    forward() { go(1); },
    listen(fn: Listener) {
      listener = fn;
      return () => { listener = null; };
    },
  };

  return history;
}
```

### Why different?

Memory History **không dùng browser APIs**, nên:
- Không share `getUrlBasedHistory()`
- Implement riêng với in-memory array
- Có thêm property: `index`

**Use cases:**
- Testing (không cần browser)
- React Native (không có window.history)
- Server-side rendering

---

## 7. Browser APIs Deep Dive

### History API

```typescript
window.history.pushState(state, title, url);
// Add new entry to history stack

window.history.replaceState(state, title, url);
// Replace current entry

window.history.go(-1);  // Back
window.history.go(1);   // Forward
window.history.back();  // Same as go(-1)
window.history.forward(); // Same as go(1)

window.history.state;   // Current state object
```

### Location API

```typescript
window.location.pathname;  // "/about"
window.location.search;    // "?id=123"
window.location.hash;      // "#section"
window.location.href;      // "http://example.com/about?id=123#section"

window.location.assign(url);   // Navigate (add to history)
window.location.replace(url);  // Navigate (replace history)
```

---

## 8. Hands-on Exercise

### Bài tập: Create Session Storage-based History

**Requirement:** Tạo history lưu trong sessionStorage (survive page reload nhưng lost khi close tab).

```typescript
interface SessionStorageHistoryOptions {
  storageKey?: string;
  v5Compat?: boolean;
}

function createSessionStorageHistory(
  options: SessionStorageHistoryOptions = {}
): History {
  const { storageKey = "router:history", v5Compat = false } = options;
  
  // TODO: Load initial entries from sessionStorage
  // TODO: Implement push/replace to save to sessionStorage
  // TODO: Implement go to read from sessionStorage
  // TODO: Return History object
}

// Test
const history = createSessionStorageHistory();
history.push("/about");
// Refresh page
// history.location.pathname should still be "/about"
```

<details>
<summary>Hint</summary>

Structure trong sessionStorage:
```json
{
  "entries": [
    { "pathname": "/", "search": "", "hash": "", ... },
    { "pathname": "/about", "search": "", "hash": "", ... }
  ],
  "index": 1
}
```

</details>

---

## 📝 Tóm tắt

1. **3 History factories** cho 3 use cases khác nhau
2. **Browser & Hash** share `getUrlBasedHistory()` với different strategies
3. **Memory** implement riêng (không dùng browser APIs)
4. **Strategy pattern** cho location creation, href generation, validation
5. **Browser APIs**: `window.history`, `window.location`
6. Factory Method cho phép **same interface, different behaviors**

---

## 🚀 Tiếp theo

**Lesson 5:** Router Factories - Composition và Dependency Injection

→ [`05-router-factories-analysis.md`](./05-router-factories-analysis.md)
