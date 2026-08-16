# MealMate Backend — Industry-Standard Architecture Overhaul

Making the MealMate backend production-grade through security hardening, architectural consistency, and code quality improvements. No new features — purely backend infrastructure.

---

## Current Architecture Overview

| Layer          | Tech                                          | Key Files                                       |
| -------------- | --------------------------------------------- | ----------------------------------------------- |
| **Frontend**   | React 19 + Vite + TailwindCSS 4 + Zustand     | `frontend/src/App.jsx`                          |
| **Backend**    | Express 5 + Node.js (ESM) + Socket.IO          | `backend/index.js`                              |
| **Database**   | PostgreSQL + PostGIS (Docker)                   | `prisma/schema.prisma`                          |
| **ORM**        | Prisma (schema exists, migration in progress)   | `backend/prismaClient.js`                       |
| **Payment**    | SSLCommerz                                      | `backend/customer/payment/paymentController.js` |
| **Media**      | Cloudinary                                      | `backend/utils/cloudinary.js`                   |
| **Auth**       | JWT (cookie + header)                           | `backend/middleware/authorization.js`           |
| **Cache**      | Redis                                           | `backend/utils/redisClient.js`                  |
| **Monitoring** | Prometheus + Grafana + Loki + Sentry            | `backend/utils/metrics.js`                      |
| **Logging**    | Winston (partially adopted)                     | `backend/utils/logger.js`                       |

**3 User Roles:** Customer, Restaurant (Partner), Rider

---

## Decisions Made

| Decision        | Choice                                                              |
| --------------- | ------------------------------------------------------------------- |
| ORM             | Prisma (full migration from raw `pg`)                               |
| Validation      | Zod on all mutation endpoints                                       |
| Rate Limiting   | `express-rate-limit` with in-memory store                           |
| Error Handling  | Full refactor — `AppError` + global middleware                      |
| Architecture    | Service layer for all modules                                       |
| Logging         | Winston everywhere (replace all `console.log`)                      |
| Pagination      | Offset-based for all endpoints                                      |
| JWT             | Keep 1-day token, strengthen secret (no refresh tokens for now)     |
| CORS            | Shared `CORS_ORIGINS` env var                                       |
| Migrations      | Prisma Migrate + `prisma/seed.js`                                   |

---

---

## 🔴 Phase 1: Critical Security Fixes

---

### Fix 1: Input Validation with Zod (🔴 Critical)

**The problem:**

No real validation exists. The only middleware is `backend/middleware/validinfo.js` which only checks if email/name/password exist. Every other endpoint accepts raw `req.body`.

**Critical vulnerability:** `total_amount` in `paymentController.js` (line 10) is taken directly from the frontend request body. A malicious user can modify this via browser DevTools to pay Tk 1 for any order:

```js
// paymentController.js line 10 — DANGEROUS
const { cartItems, customerInfo, total_amount, paymentMethod, specialInstructions } = req.body;
// total_amount comes from the CLIENT with zero server-side verification
```

Additionally, `orderController.js` (lines 28-29) calculates `totalAmount` from client-sent `item.price` — another manipulation vector.

**The fix:**

Install `zod` and create a centralized validation middleware:

```js
// backend/middleware/validate.js
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      errors: result.error.flatten().fieldErrors
    });
  }
  req.body = result.data;
  next();
};
```

Create Zod schemas for **all mutation endpoints** (POST, PUT, PATCH, DELETE):
- Auth: signup, login, change password, update profile
- Orders: create order (COD)
- Payment: initiate payment — **remove `total_amount` from client input, recalculate server-side from DB prices**
- Cart: add to cart, delete cart item
- Reviews: submit restaurant review, submit rider review
- Menu: create/update category, create/update/delete menu item
- Restaurant: update order status

**Files affected:**

| Action   | File                                |
| -------- | ----------------------------------- |
| [NEW]    | `backend/middleware/validate.js`    |
| [NEW]    | `backend/schemas/` (per module)     |
| [MODIFY] | All route files                     |

---

### Fix 2: Rate Limiting (🔴 Critical)

**The problem:**

`backend/index.js` has zero rate limiting. Auth routes (`/api/customer/login`, `/api/rider/login`) can be brute-forced.

**The fix:**

```js
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login attempts per 15 min per IP
  message: { success: false, message: 'Too many login attempts. Try again later.' }
});

app.use(globalLimiter);
app.use('/api/customer/login', authLimiter);
app.use('/api/customer/register', authLimiter);
app.use('/api/rider/login', authLimiter);
```

Using in-memory store (simple, fine for single-server). Can swap to Redis store later if scaling horizontally.

**Files affected:**

| Action   | File               |
| -------- | ------------------ |
| [MODIFY] | `backend/index.js` |

---

### Fix 3: Security Headers with Helmet (🔴 Critical)

**The problem:**

No security headers middleware. Missing `X-Content-Type-Options`, `X-Frame-Options`, HSTS, CSP, etc.

**The fix:**

```js
import helmet from 'helmet';
app.use(helmet());
```

Single line, significant security improvement.

**Files affected:**

| Action   | File               |
| -------- | ------------------ |
| [MODIFY] | `backend/index.js` |

---

### Fix 4: IDOR Vulnerability Fixes (🔴 Critical)

**The problem:**

Several endpoints have **Insecure Direct Object Reference** vulnerabilities — they don't verify that the resource belongs to the requesting user:

1. **`deleteCartItem`** (`cartController.js` L60-72) — deletes any cart item by ID without verifying it belongs to the requesting user
2. **`getOrderDetails`** (`orderController.js` L242-255) — any authenticated user can view any order's details by guessing the `orderId`
3. **Payment callbacks** (`/success`, `/fail`, `/cancel`) use `router.all()` with no auth — anyone can call these with a crafted `tran_id`

**The fix:**

- Add ownership verification queries before performing cart/order operations
- Verify `tran_id` belongs to an actual order before processing callbacks

**Files affected:**

| Action   | File                                          |
| -------- | --------------------------------------------- |
| [MODIFY] | `backend/customer/cart/cartController.js`     |
| [MODIFY] | `backend/customer/order/orderController.js`   |

---

### Fix 5: Socket.IO Authentication (🔴 Critical)

**The problem:**

`socket.js` has no authentication. Any client can:
1. Connect without any authentication
2. Join **any room** (e.g., `restaurant_5`) by simply emitting `join_room`
3. Listen to all order events for any restaurant or customer

A malicious user could join `restaurant_*` rooms and see all incoming orders for any restaurant.

**The fix:**

- Add JWT verification middleware on Socket.IO `connection` event
- Validate room access: users can only join their own rooms (`customer_<id>`, `restaurant_<id>`, `rider_<id>`)
- Reject unauthorized connections

```js
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.cookie;
  // verify JWT, attach user to socket
  // reject if invalid
});

socket.on('join_room', (room) => {
  // verify socket.user is authorized for this room
});
```

**Files affected:**

| Action   | File                |
| -------- | ------------------- |
| [MODIFY] | `backend/socket.js` |

---

### Fix 6: Secret Hardening & Password Logging (🔴 Critical)

**The problem:**

1. `JWT_SECRET=riyo` — only 4 characters, trivially guessable. Must be 32+ random characters.
2. Sentry DSN hardcoded in `instrument.js` instead of coming from `.env`
3. **`validinfo.js` line 3: `console.log(email, name, password)`** — logs raw passwords to stdout!
4. `authController.js` line 74: `console.log(req.body)` — logs full request body including password
5. `paymentController.js` line 12: `console.log(req.body)` — logs full payment data

**The fix:**

- Remove all password/sensitive data logging
- Move Sentry DSN to `.env`
- Create `.env.example` with strong `JWT_SECRET` guidance

**Files affected:**

| Action   | File                                          |
| -------- | --------------------------------------------- |
| [MODIFY] | `backend/instrument.js`                       |
| [MODIFY] | `backend/middleware/validinfo.js`              |
| [MODIFY] | `backend/customer/auth/authController.js`     |
| [MODIFY] | `backend/customer/payment/paymentController.js` |
| [NEW]    | `backend/.env.example`                        |

---

---

## 🟡 Phase 2: Architecture Standardization

---

### Fix 7: Full Prisma Migration (🟡 High Priority)

**The problem:**

Both raw `pg` (Pool) queries and Prisma are installed. Every controller uses raw SQL via `pool.query()` while Prisma sits unused except for the schema file. This is inconsistent and error-prone.

**The fix:**

Migrate all `pool.query()` calls to Prisma Client. PostGIS queries use `prisma.$queryRaw`.

**Migration order (dependency-aware):**

1. `db.js` → remove (replaced by `prismaClient.js`)
2. Auth controllers (customer, rider, restaurant)
3. Cart controller
4. Order controllers (customer + restaurant)
5. Payment controller
6. Review controller
7. Notification controller
8. Chat controller
9. Menu model + controller
10. Restaurant profile controller
11. Stats controller
12. Socket handlers
13. AI controller

**Files affected:**

| Action   | File                              |
| -------- | --------------------------------- |
| [MODIFY] | All controller files (~15 files)  |
| [DELETE] | `backend/db.js` (after migration) |
| [MODIFY] | `backend/prismaClient.js`         |

---

### Fix 8: Service Layer Pattern (🟡 High Priority)

**The problem:**

Controllers have business logic and database queries mixed together. `paymentController.js` handles HTTP parsing, business logic, database queries, socket events, and notification creation in a single 100+ line function. Only `menuModel.js` has any separation.

**The fix:**

Introduce service layer for **all modules** for consistency:

```
Controller  →  parses request, validates, calls service, sends response
Service     →  business logic, orchestrates Prisma calls, socket events
Prisma      →  data access (replaces model files)
```

**Target structure:**

```
backend/
├── customer/
│   ├── auth/
│   │   ├── authRoutes.js
│   │   ├── authController.js
│   │   └── authService.js
│   ├── cart/
│   │   ├── cartRoutes.js
│   │   ├── cartController.js
│   │   └── cartService.js
│   ├── order/
│   │   ├── orderRoutes.js
│   │   ├── orderController.js
│   │   └── orderService.js
│   ├── payment/
│   │   ├── paymentRoutes.js
│   │   ├── paymentController.js
│   │   └── paymentService.js
│   └── restaurant/
│       ├── restaurantRoutes.js
│       ├── restaurantController.js
│       └── restaurantService.js
├── restaurants/
│   ├── menu/
│   │   ├── menuRoutes.js
│   │   ├── menuController.js
│   │   └── menuService.js          ← replaces menuModel.js
│   ├── order/ ...
│   ├── profile/ ...
│   └── stats/ ...
├── rider/
│   ├── auth/ ...
│   └── profile/ ...
├── shared/
│   ├── reviews/  → reviewService.js
│   ├── notifications/ → notificationService.js
│   ├── chats/ → chatService.js
│   └── ai/ → aiService.js
```

**Files affected:**

| Action   | File                                              |
| -------- | ------------------------------------------------- |
| [NEW]    | ~15 service files                                 |
| [DELETE] | `backend/restaurants/menu/menuModel.js`           |

---

### Fix 9: Centralized Error Handling (🟡 High Priority)

**The problem:**

Every controller has its own try/catch with inconsistent responses:

```js
// orderController.js
res.status(500).send("Server error");           // plain string

// authController.js
res.status(500).json({ message: "server error" }); // object

// paymentController.js
res.status(500).json({ message: "Internal server error", error: error.message }); // leaks stack
```

**The fix:**

```js
// backend/middleware/errorHandler.js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR] ${req.method} ${req.originalUrl}:`, { stack: err.stack });

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Don't leak internal errors to client
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.'
  });
};
```

Register as the **last middleware** in `index.js` before `server.listen()`. Refactor all controllers to use `next(new AppError(...))` or wrap with async error catcher.

**Files affected:**

| Action   | File                                 |
| -------- | ------------------------------------ |
| [NEW]    | `backend/middleware/errorHandler.js`  |
| [MODIFY] | `backend/index.js`                   |
| [MODIFY] | All controller files                 |

---

### Fix 10: Standardize Logging with Winston (🟡 Medium)

**The problem:**

Winston is set up (`utils/logger.js`) with structured JSON logging for Promtail/Loki, but it's only used in the request timing middleware in `index.js` (lines 42-59). Every controller uses raw `console.log()` / `console.error()` producing unstructured output that Grafana/Loki can't parse properly.

**The fix:**

Replace all `console.log()` / `console.error()` with `logger.info()` / `logger.error()` / `logger.warn()` across every file (~25 files).

**Files affected:**

| Action   | File                                       |
| -------- | ------------------------------------------ |
| [MODIFY] | All controller, middleware, utility files   |

---

---

## 🟢 Phase 3: Code Quality & Cleanup

---

### Fix 11: Dead Code Removal (🟢 Low)

**The problem:**

- `paymentController.js` lines 119-248: **130 lines** of commented-out old implementation
- `cartController.js` lines 19-57: `addItemToCart` function is dead code — never imported by any route (only `addToCart` is used in `cartRoutes.js`)
- Scattered commented-out `console.log` lines throughout controllers

**The fix:**

Remove all dead/commented-out code. Git history preserves it if ever needed.

---

### Fix 12: Dependency Cleanup (🟢 Low)

**The problem:**

`package.json` has duplicate and unused packages:

| Package                  | Issue                                    |
| ------------------------ | ---------------------------------------- |
| `pg`                     | Replaced by Prisma after migration       |
| `postgres`               | Second PG driver — never used            |
| `sslcommerz`             | Duplicate — `sslcommerz-lts` is used     |
| `@supabase/supabase-js`  | Unused — no Supabase code in codebase    |
| `nodemon`                | In `dependencies` instead of `devDeps`   |

**The fix:**

| Action           | Package                  |
| ---------------- | ------------------------ |
| Remove           | `pg`                     |
| Remove           | `postgres`               |
| Remove           | `sslcommerz`             |
| Remove           | `@supabase/supabase-js`  |
| Move to devDeps  | `nodemon`                |
| Add              | `zod`                    |
| Add              | `express-rate-limit`     |
| Add              | `helmet`                 |

---

### Fix 13: CORS Configuration (🟢 Low)

**The problem:**

CORS origins are duplicated between `index.js` (lines 61-66) and `socket.js` (lines 7-12) with overlapping but not identical hardcoded arrays.

**The fix:**

- Create shared `CORS_ORIGINS` env var
- Use in both Express and Socket.IO from a single config source
- Remove hardcoded localhost URLs

```env
# backend/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:5175
```

```js
// shared config
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
```

**Files affected:**

| Action   | File                |
| -------- | ------------------- |
| [MODIFY] | `backend/index.js`  |
| [MODIFY] | `backend/socket.js` |

---

### Fix 14: Review Pagination (🟢 Low)

**The problem:**

`getRestaurantReviews` and `getRiderReviews` in `reviewController.js` fetch ALL reviews with no limit. A restaurant with thousands of reviews returns everything in one query.

**The fix:**

Add offset-based pagination (same pattern as `getOrders` and `getNotifications`):

```js
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 10, 50);
const offset = (page - 1) * limit;
// ... LIMIT $X OFFSET $Y
```

**Files affected:**

| Action   | File                                         |
| -------- | -------------------------------------------- |
| [MODIFY] | `backend/shared/reviews/reviewController.js` |

---

### Fix 15: Typo Fixes (🟢 Low)

| File                              | Typo                                        | Fix                                       |
| --------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `middleware/authorization.js` L11 | `"not athorize. no token provided"`         | `"Not authorized. No token provided."`    |
| `customer/auth/authController.js` L203 | `"varified user"`                      | `"Verified user"`                         |
| `index.js` L23                    | Variable: `restaurnatStat`                  | `restaurantStat`                          |

---

### Fix 16: Prisma Migrate + Seeding (🟢 Low)

**The problem:**

Schema is managed via raw `.sql` files. No versioned migrations.

**The fix:**

- Adopt Prisma Migrate for schema versioning
- Create `prisma/seed.js` that reuses existing `populate.sql` seed data via `prisma.$executeRawUnsafe()`
- Add `prisma.seed` config to `package.json`

**Files affected:**

| Action   | File                  |
| -------- | --------------------- |
| [NEW]    | `prisma/seed.js`      |
| [MODIFY] | `backend/package.json` |

---

### Fix 17: `.env.example` (🟢 Low)

Create environment template with all required variables and placeholder values for developer onboarding.

```env
# backend/.env.example
JWT_SECRET=your-secret-key-min-32-chars-here
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5434/mealmate?schema=public"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SSLCommerz
SSL_COMMERZ_STORE_ID=your_store_id
SSL_COMMERZ_STORE_PASSWORD=your_store_password
SSL_COMMERZ_IS_LIVE=false

# Google
GOOGLE_API_KEY=your_google_api_key

# Sentry
SENTRY_DSN=your_sentry_dsn

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5175

# Redis
REDIS_URL=redis://127.0.0.1:6379
```

**Files affected:**

| Action | File                    |
| ------ | ----------------------- |
| [NEW]  | `backend/.env.example`  |

---

---

## 📊 Priority Matrix

| Priority | Item                                            | Type        | Effort  | Impact          |
| -------- | ----------------------------------------------- | ----------- | ------- | --------------- |
| 🔴 P0    | Fix 1 — Zod validation + server-side pricing    | Security    | Medium  | Critical        |
| 🔴 P0    | Fix 2 — Rate limiting                           | Security    | Low     | Critical        |
| 🔴 P0    | Fix 3 — Helmet security headers                 | Security    | Low     | Critical        |
| 🔴 P0    | Fix 4 — IDOR vulnerability fixes                | Security    | Low     | Critical        |
| 🔴 P0    | Fix 5 — Socket.IO authentication                | Security    | Medium  | Critical        |
| 🔴 P0    | Fix 6 — Secret hardening + password logging     | Security    | Low     | Critical        |
| 🟡 P1    | Fix 7 — Full Prisma migration                   | Architecture| High    | High            |
| 🟡 P1    | Fix 8 — Service layer pattern                   | Architecture| High    | High            |
| 🟡 P1    | Fix 9 — Centralized error handling              | Stability   | Medium  | High            |
| 🟡 P1    | Fix 10 — Winston logging standardization        | Observability| Medium | Medium          |
| 🟢 P2    | Fix 11 — Dead code removal                      | Quality     | Low     | Low             |
| 🟢 P2    | Fix 12 — Dependency cleanup                     | Maintenance | Low     | Low             |
| 🟢 P2    | Fix 13 — CORS configuration                     | DevOps      | Low     | Deployability   |
| 🟢 P2    | Fix 14 — Review pagination                      | Performance | Low     | Medium          |
| 🟢 P2    | Fix 15 — Typo fixes                             | Quality     | Low     | Polish          |
| 🟢 P2    | Fix 16 — Prisma Migrate + seeding               | DevOps      | Medium  | Maintainability |
| 🟢 P2    | Fix 17 — `.env.example`                         | DX          | Low     | Onboarding      |

---

## Suggested Implementation Phases

| Phase                            | Items                                                                     | Time Estimate |
| -------------------------------- | ------------------------------------------------------------------------- | ------------- |
| **Phase 1 — Security**          | Fix 1-6 (validation, rate limit, helmet, IDOR, socket auth, secrets)      | 2–3 days      |
| **Phase 2 — Architecture**      | Fix 7-10 (Prisma, services, error handler, logging)                       | 4–5 days      |
| **Phase 3 — Cleanup & Polish**  | Fix 11-17 (dead code, deps, CORS, pagination, typos, migrations, .env)    | 1–2 days      |
| **Total**                        |                                                                           | **7–10 days** |

> **Note:** Phase 2 (Prisma migration + service layer) is the most labor-intensive. The incremental approach means the app stays functional throughout — old `pool.query()` code works alongside Prisma during transition.
