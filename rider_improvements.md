# Rider Codebase — Improvement Recommendations

A thorough audit of the rider backend (`backend/rider/`) and frontend (`frontend/src/features/rider/`) codebase. Issues are ranked by severity.

---

## 🔴 Critical Bugs

### 1. Dead Code / Unreachable Statements in `getOrderDetails`

**File:** `backend/rider/profile/riderController.js` (lines 397-403)

After the `return res.status(403)` on line 393, there are two more statements that can **never execute** — a second 404 check and a `res.status(200).json()`. This is dead code that indicates a copy-paste leftover.

```js
// Line 393: return res.status(403).json(...)  ← execution stops here
// Line 397-403: UNREACHABLE ↓
if (orderResult.rows.length === 0) { ... }
res.status(200).json({ order: orderResult.rows[0] });
```

**Fix:** Delete lines 397-403.

---

### 2. `updateRiderProfile` — Missing `WHERE` clause on location UPDATE

**File:** `backend/rider/profile/riderController.js` (line 159)

```sql
UPDATE user_locations SET longitude = $1, latitude = $2
```

This updates **ALL** rows in `user_locations` instead of just the rider's row. This is a **data corruption bug**.

**Fix:** Add `WHERE user_id = $3` and pass `userId` as the third parameter.

---

### 3. `riderModel.js` is completely unused

**File:** `backend/rider/profile/riderModel.js`

All 7 functions in `riderModel.js` (`getAvailableOrders`, `getAssignedOrder`, `acceptOrder`, etc.) are **never imported** anywhere. The controller (`riderController.js`) duplicates all the same logic with inline SQL. This violates DRY and defeats the purpose of the model.

**Fix:** Either delete the model file entirely, or refactor the controller to use it.

---

### 4. `acceptOrder` only accepts `ready_for_pickup` orders

**File:** `backend/rider/profile/riderController.js` (line 233)

```sql
WHERE order_id = $2 AND status = 'ready_for_pickup'
```

But the `riderModel.js` version checks for `status = 'pending'`. Meanwhile, the dashboard shows orders with `status = 'pending'` in the deliveries table. This means the "Accept Order" button on the frontend will silently fail for most available orders because the backend rejects anything that isn't `ready_for_pickup`.

**Fix:** Align the status check. If riders should accept orders that are `pending_restaurant_acceptance` or `ready_for_pickup`, update the WHERE clause accordingly.

---

### 5. No rider ownership validation on `updateOrderStatus`

**File:** `backend/rider/profile/riderController.js` (lines 310-349)

Any authenticated rider can update the status of **any** order — even one assigned to a different rider. There's no `WHERE rider_id = $X` check.

**Fix:** Add `AND rider_id = $3` to the UPDATE query and pass `req.user.id`.

---

## 🟠 Important Improvements

### 6. Typo in middleware filename

**File:** `backend/middleware/athorizeRoles.js`

The filename is misspelled as `athorizeRoles` (missing "u"). Every import references this typo. While functional, it's a code smell.

**Fix:** Rename to `authorizeRoles.js` and update all imports.

---

### 7. No transaction wrapping for multi-table writes

**Files:** `riderAuthController.js` (signup), `riderController.js` (acceptOrder, updateOrderStatus)

Signup inserts into `users`, `rider_profiles`, and `user_locations` as 3 separate queries. If the second fails, you get an orphaned user with no profile. Similarly, `acceptOrder` updates `orders`, `deliveries`, and inserts 2 `notifications` without a transaction.

**Fix:** Wrap related writes in `BEGIN`/`COMMIT`/`ROLLBACK` using `pool.connect()` and a client.

---

### 8. `updateOrderStatus` accepts arbitrary status values

**File:** `backend/rider/profile/riderController.js` (line 313)

The `status` value from `req.body` is passed directly to the SQL query with zero validation. A rider could set the status to any arbitrary string.

**Fix:** Whitelist valid status transitions:

```js
const validStatuses = ['out_for_delivery', 'delivered'];
if (!validStatuses.includes(status)) return res.status(400).json(...)
```

---

### 9. Delivery history is too sparse

**File:** `backend/rider/profile/riderController.js` (lines 205-216)

The `getDeliveryHistory` query only returns `order_id`, `status`, `total_amount`, and `delivered_at`. It doesn't return the restaurant name, customer name, delivery fee, or drop-off address — making the history page feel empty.

**Fix:** JOIN with `restaurants`, `users`, and `deliveries` tables to return richer data.

---

### 10. No pagination on delivery history

**File:** `backend/rider/profile/riderController.js` (`getDeliveryHistory`)

Returns ALL delivered orders in one query. As the rider accumulates hundreds of deliveries, this will become slow and the UI will struggle.

**Fix:** Add `LIMIT` / `OFFSET` with page and pageSize query params.

---

### 11. Socket disconnection on every unmount

**File:** `frontend/src/features/rider/pages/HomepageRider.jsx` (line 117)

`socketService.disconnect()` is called in the cleanup of the `useEffect`. If the rider navigates away from the dashboard and back, the socket reconnects. This creates unnecessary churn. Socket lifecycle should be managed at the App level, not the page level.

**Fix:** Move socket connection management to a top-level provider or the App component.

---

### 12. `console.log(res.data)` left in production code

**File:** `frontend/src/features/rider/pages/HomepageRider.jsx` (line 62)

Debug logging left in. Remove or guard behind `process.env.NODE_ENV`.

---

## 🟡 UX / Frontend Improvements

### 13. Notification accept sets wrong key

**File:** `frontend/src/features/rider/pages/HomepageRider.jsx` (line 291)

```js
assignedOrder: order  // singular — but state expects `assignedOrders` (array)
```

This means accepting an order from the notification dropdown **doesn't properly update** the assigned orders section.

**Fix:** Change to `assignedOrders: [...(prevData.assignedOrders || []), { ...order, order_status: 'out_for_delivery' }]`

---

### 14. No "Back to Dashboard" button on most pages

**Files:** `EarningsPage.jsx`, `ProfilePageRider.jsx`

The Earnings and Profile pages have no obvious navigation back to the dashboard. Users must use the browser back button.

**Fix:** Add a back/breadcrumb navigation link at the top of each page.

---

### 15. Delivery history page — empty right column

**File:** `frontend/src/features/rider/pages/DeliveryHistoryPage.jsx` (lines 100-102)

There's an empty `<div className="space-y-3">` in the grid that produces a blank column.

**Fix:** Either add restaurant name / delivery fee data there, or remove the grid layout.

---

### 16. Login page still uses Flowbite placeholder logo

**File:** `frontend/src/features/rider/pages/LoginPageRider.jsx` (line 31)

Uses `https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg` as the logo instead of your own FoodPanda branding.

**Fix:** Replace with your app's logo asset.

---

### 17. No loading/disabled state for "Accept Order" button

**File:** `frontend/src/features/rider/pages/HomepageRider.jsx` (lines 493-523)

The accept button has no loading spinner or disabled state during the API call. Users can double-click and fire multiple requests.

**Fix:** Add an `isAccepting` state that disables the button during the request.

---

### 18. `EarningsPage` — Star rating renders incorrectly for decimal values

**File:** `frontend/src/features/rider/pages/EarningsPage.jsx` (line 246)

```js
i < review.rating ? 'text-yellow-400' : 'text-gray-300'
```

A rating of `4.5` will show 4 filled stars and 1 empty, losing the half star.

**Fix:** Add half-star rendering logic or round to nearest integer.

---

## 🔵 Architecture / Code Quality

### 19. No input validation on signup

**File:** `backend/rider/auth/riderAuthController.js`

The `validinfo` middleware is applied, but there's no validation for:

- Password strength (minimum length, complexity)
- Phone number format
- Vehicle type values (should be enum: bike, car, bicycle)

**Fix:** Add express-validator or Joi schema validation.

---

### 20. `getEarnings` calculates delivery fee using PostGIS every time

**File:** `backend/rider/profile/riderController.js` (lines 410-481)

The earnings calculation runs expensive `ST_Distance` + `ST_MakePoint` calculations on every request. For analytics, these values should be pre-computed and stored when the delivery is completed.

**Fix:** Store `delivery_fee` and `distance_km` on the `deliveries` table at completion time.

---

### 21. No rate limiting on rider auth endpoints

**File:** `backend/rider/auth/riderAuthRoutes.js`

Login and signup have no rate limiting, making them vulnerable to brute-force attacks.

**Fix:** Add `express-rate-limit` middleware to auth routes.

---

### 22. `checkAuthRider` uses deep JSON comparison

**File:** `frontend/src/features/rider/store/riderAuthStore.js` (line 15)

```js
JSON.stringify(state.authrider) !== JSON.stringify({ ...res.data, role: 'rider' })
```

This is fragile (key ordering matters in JSON.stringify) and expensive.

**Fix:** Use a proper shallow comparison or just always set the state (React/Zustand will skip re-renders if the reference is unchanged).

---

## Summary Table

| Priority        | Count | Examples                                                             |
| --------------- | ----- | -------------------------------------------------------------------- |
| 🔴 Critical     | 5     | Missing WHERE clause, dead code, status mismatch, no ownership check |
| 🟠 Important    | 7     | No transactions, no validation, no pagination, socket churn          |
| 🟡 UX           | 6     | Broken notification state, empty columns, no back buttons            |
| 🔵 Architecture | 4     | No rate limiting, expensive analytics queries, fragile auth check    |

**Total: 22 actionable improvements identified.**
