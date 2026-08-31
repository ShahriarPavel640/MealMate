# Frontend TypeScript Migration Plan

Migrate the entire MealMate React frontend (96 `.js`/`.jsx` files) from JavaScript to strict TypeScript.

---

## Scope & Inventory

| Category                        | Files                                 | Location                                |
| ------------------------------- | ------------------------------------- | --------------------------------------- |
| **App Root**              | `main.jsx`, `App.jsx`             | `src/`                                |
| **Shared Libs**           | `axios.js`, `utils.js`            | `src/lib/`                            |
| **Services**              | `socketService.js`                  | `src/services/`                       |
| **Hooks**                 | `use-mobie.jsx`, `use-toast.js`   | `src/hooks/`                          |
| **Shared Components**     | `ChatButton.jsx`, `ChatModal.jsx` | `src/Components/`                     |
| **Customer Stores**       | 5 files                               | `src/features/customer/store/`        |
| **Customer Components**   | 15 files (+5 sub-components)          | `src/features/customer/components/`   |
| **Customer Pages**        | 14 files                              | `src/features/customer/pages/`        |
| **Restaurant Store**      | 1 file                                | `src/features/restaurant/store/`      |
| **Restaurant Components** | 11 domain + 20 UI primitives          | `src/features/restaurant/components/` |
| **Restaurant Pages**      | 3 files                               | `src/features/restaurant/pages/`      |
| **Restaurant Lib**        | `utils.js`                          | `src/features/restaurant/lib/`        |
| **Rider Store**           | 1 file                                | `src/features/rider/store/`           |
| **Rider Components**      | 1 file (`RiderLayout.jsx`)          | `src/features/rider/components/`      |
| **Rider Pages**           | 7 files                               | `src/features/rider/pages/`           |
| **Vite Config**           | `vite.config.js`                    | root                                    |

**Total: ~96 files to rename and type**

---

## Phase 0: TypeScript Infrastructure

> **Goal:** Make TypeScript compile alongside existing `.jsx` files with zero breaking changes.

### 0.1 Install Dependencies

```bash
cd frontend
npm install -D typescript @types/node
```

> [!NOTE]
> `@types/react` and `@types/react-dom` are already installed in `devDependencies`.

### 0.2 Create `tsconfig.json` and `tsconfig.app.json`

#### [NEW] `tsconfig.json`

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

#### [NEW] `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 0.3 Add Vite Client Types

#### [NEW] `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 0.4 Rename Vite Config

#### [RENAME] `vite.config.js` → `vite.config.ts`

- Add `import { fileURLToPath } from 'url'` for `__dirname` replacement.
- Update `path.resolve` to use `fileURLToPath(import.meta.url)`.

### 0.5 Add Type-Check Script to `package.json`

```diff
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
+   "type-check": "tsc -b --noEmit",
    "lint": "eslint .",
    "preview": "vite preview",
    "test:e2e": "playwright test"
  }
```

### 0.6 Verification Gate

```bash
npm run type-check   # Must pass with zero errors
npm run build        # Must produce valid dist/
```

---

## Phase 1: Shared Types & Core Infrastructure

> **Goal:** Define all shared TypeScript interfaces/types and migrate foundational non-React files.

### 1.1 Create Shared Type Definitions

#### [NEW] `src/types/models.ts`

Central type definitions matching backend Prisma models:

```ts
// User / Customer
export interface User {
  user_id: number;
  name: string;
  email: string;
  phone_number?: string;
  profile_pic?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  role?: 'customer';
}

// Restaurant
export interface Restaurant {
  restaurant_id: number;
  name: string;
  email: string;
  phone_number?: string;
  description?: string;
  image?: string;
  logo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  opening_hours?: string;
  avg_rating?: number;
  is_open?: boolean;
  is_favorite?: boolean;
  distance?: number;
  role?: 'restaurant';
}

// Rider
export interface Rider {
  rider_id: number;
  name: string;
  email: string;
  phone_number?: string;
  vehicle_type?: string;
  is_available?: boolean;
  latitude?: number;
  longitude?: number;
  role?: 'rider';
}

// Menu
export interface MenuItem {
  menu_item_id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  is_available: boolean;
}

// Cart
export interface CartItem {
  cart_item_id: number;
  menu_item_id: number;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  restaurant_id?: number;
  restaurant_name?: string;
}

// Order
export interface Order {
  order_id: number;
  user_id: number;
  restaurant_id: number;
  rider_id?: number;
  status: OrderStatus;
  total_price: number;
  delivery_fee?: number;
  delivery_address?: string;
  special_instructions?: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  restaurant?: Restaurant;
  rider?: Rider;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'restaurant_rejected';

export interface OrderItem {
  order_item_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name?: string;
}

// Notification
export interface Notification {
  notification_id?: number;
  type?: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

// Chat
export interface ChatMessage {
  message_id?: number;
  order_id: number;
  sender_id: number;
  sender_type: string;
  message: string;
  created_at?: string;
}

// Review
export interface Review {
  review_id: number;
  user_id: number;
  restaurant_id?: number;
  rider_id?: number;
  order_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// API Response Wrappers
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

// Auth User Union (used in App.tsx for currentAuthUser)
export type AuthUser =
  | (User & { role: 'customer' })
  | (Restaurant & { role: 'restaurant' })
  | (Rider & { role: 'rider' });
```

### 1.2 Migrate Core Libs

#### [RENAME] `src/lib/axios.js` → `src/lib/axios.ts`

- Type the Axios interceptors, `originalRequest._retry` via module augmentation.

#### [RENAME] `src/lib/utils.js` → `src/lib/utils.ts`

- Add parameter/return types.

#### [RENAME] `src/features/restaurant/lib/utils.js` → `src/features/restaurant/lib/utils.ts`

- Add parameter/return types.

### 1.3 Migrate Services

#### [RENAME] `src/services/socketService.js` → `src/services/socketService.ts`

- Type the `SocketService` class with `Socket` from `socket.io-client`.
- Type `roomQueue: string[]`, `connecting: boolean`.
- Type `emit(event: string, data?: unknown)`, `on/off` callbacks.

### 1.4 Migrate Hooks

#### [RENAME] `src/hooks/use-mobie.jsx` → `src/hooks/use-mobile.tsx`

- Return type `boolean`.

#### [RENAME] `src/hooks/use-toast.js` → `src/hooks/use-toast.ts`

- Type the toast state and action interfaces.

### 1.5 Verification Gate

```bash
npm run type-check
```

---

## Phase 2: Zustand Stores (All Domains)

> **Goal:** Fully type every Zustand store with explicit state and action interfaces.

### 2.1 Customer Stores (5 files)

#### [RENAME] `store/userAuthStore.js` → `store/userAuthStore.ts`

```ts
interface UserAuthState {
  authUser: (User & { role: 'customer' }) | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  // Actions
  checkAuth: () => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: (showToast?: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

#### [RENAME] `store/cartStore.js` → `store/cartStore.ts`

- Type with `CartItem` interface and `CartState`.

#### [RENAME] `store/chatStore.js` → `store/chatStore.ts`

- Type `chatOrderId: number | null`.

#### [RENAME] `store/notificationStore.js` → `store/notificationStore.ts`

- Type with `Notification` interface.

#### [RENAME] `store/useRestaurantStore.js` → `store/useRestaurantStore.ts`

- Type with `Restaurant` interface, `PaginatedResponse`.

### 2.2 Restaurant Store (1 file)

#### [RENAME] `store/restaurantAuthStore.js` → `store/restaurantAuthStore.ts`

- Type with `Restaurant` and `MenuItem` interfaces.

### 2.3 Rider Store (1 file)

#### [RENAME] `store/riderAuthStore.js` → `store/riderAuthStore.ts`

- Type with `Rider` interface.

### 2.4 Verification Gate

```bash
npm run type-check
```

---

## Phase 3: Customer Domain (Components & Pages)

> **Goal:** Migrate all 34 customer `.jsx` files to `.tsx`.

### 3.1 Customer Components (20 files)

All renames from `.jsx` → `.tsx` with typed props interfaces:

| File                                       | Key Props to Type                                          |
| ------------------------------------------ | ---------------------------------------------------------- |
| `Header.jsx`                             | Auth state, navigation                                     |
| `HeroSection.jsx`                        | Search handlers                                            |
| `FeaturedRestaurants.jsx`                | `Restaurant[]`                                           |
| `FeaturedCategory.jsx`                   | Category data                                              |
| `FeaturesSection.jsx`                    | Static content                                             |
| `CTASection.jsx`                         | Static content                                             |
| `LocationPickerModal.jsx`                | `isOpen`, `onClose`, `onSelect`, `initialLocation` |
| `LiveTrackingModal.jsx`                  | `order: Order`, map coords                               |
| `RatingModal.jsx`                        | `order: Order`, `onSubmit`                             |
| `skeleton/Navbar.jsx`                    | Auth state from stores                                     |
| `cards/FoodMenuCard.jsx`                 | `MenuItem` props                                         |
| `cards/RestaurantCard.jsx`               | `Restaurant` props                                       |
| `restaurantprofile/CartSidebar.jsx`      | `CartItem[]`                                             |
| `restaurantprofile/FoodFilter.jsx`       | Filter state                                               |
| `restaurantprofile/FoodItem.jsx`         | `MenuItem` props                                         |
| `restaurantprofile/MenuCategories.jsx`   | Category strings                                           |
| `restaurantprofile/RestaurantHeader.jsx` | `Restaurant` props                                       |

### 3.2 Customer Pages (14 files)

All renames from `.jsx` → `.tsx`:

- `HomePage.jsx`, `LoginPage.jsx`, `SignupPage.jsx`, `ProfilePage.jsx`
- `RestaurantPage.jsx`, `RestaurantProfile.jsx`, `RestaurantReviewsPage.jsx`
- `CheckoutPage.jsx`, `OrderHistoryPage.jsx`
- `PaymentSuccessPage.jsx`, `PaymentFailedPage.jsx`, `PaymentCancelledPage.jsx`
- `SimulatePaymentGateway.jsx`, `NotFound.jsx`

### 3.3 Verification Gate

```bash
npm run type-check
```

---

## Phase 4: Restaurant Domain (Components & Pages)

> **Goal:** Migrate all 34 restaurant `.jsx` files to `.tsx`.

### 4.1 Restaurant Domain Components (11 files)

| File                              | Key Props to Type      |
| --------------------------------- | ---------------------- |
| `DashboardRest.jsx`             | Order stats, charts    |
| `OrderManagementRest.jsx`       | `Order[]`            |
| `MenuManagementRest.jsx`        | `MenuItem[]`         |
| `AddMenuItemRest.jsx`           | Form handlers          |
| `EditMenuItemRest.jsx`          | `MenuItem` + form    |
| `AnalyticsRest.jsx`             | Chart data             |
| `RestaurantProfile.jsx`         | `Restaurant` profile |
| `RestaurantReviewDashboard.jsx` | `Review[]`           |
| `HeaderRest.jsx`                | Auth state             |
| `SidebarRest.jsx`               | Navigation state       |
| `LoginPageRest.jsx` (component) | Login form             |

### 4.2 Restaurant UI Primitives (20 files)

Rename all `components/ui/*.jsx` → `components/ui/*.tsx`:

`accordion`, `alert`, `alert-dialog`, `badge`, `button`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `input`, `label`, `radio-group`, `separator`, `sheet`, `slider`, `switch`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `toggle-group`, `tooltip`

> [!TIP]
> These are mostly Radix UI wrappers using `React.forwardRef`. The main work is adding `React.ComponentPropsWithoutRef<typeof Primitive>` and `React.ComponentRef<typeof Primitive>` generics.

### 4.3 Restaurant Pages (3 files)

- `HomepageRest.jsx` → `.tsx`
- `LoginPageRest.jsx` → `.tsx`
- `SignupPageRest.jsx` → `.tsx`

### 4.4 Verification Gate

```bash
npm run type-check
```

---

## Phase 5: Rider Domain (Components & Pages)

> **Goal:** Migrate all 8 rider `.jsx` files to `.tsx`.

### 5.1 Rider Components (1 file)

- `RiderLayout.jsx` → `.tsx` — Type children prop and sidebar navigation state.

### 5.2 Rider Pages (7 files)

- `HomepageRider.jsx`, `LoginPageRider.jsx`, `SignupPageRider.jsx`
- `ProfilePageRider.jsx`, `DeliveryHistoryPage.jsx`
- `OrderDetailsPage.jsx`, `EarningsPage.jsx`

### 5.3 Verification Gate

```bash
npm run type-check
```

---

## Phase 6: Shared Components & App Root

> **Goal:** Migrate the final shared files and app entry point.

### 6.1 Shared Components (2 files)

#### [RENAME] `src/Components/ChatButton.jsx` → `src/Components/ChatButton.tsx`

#### [RENAME] `src/Components/ChatModal.jsx` → `src/Components/ChatModal.tsx`

- Type props: `isOpen`, `onClose`, `orderId`, `currentAuthUser: AuthUser`.

### 6.2 App Root (2 files)

#### [RENAME] `src/App.jsx` → `src/App.tsx`

- Type socket event handlers (`handleOrderAccepted`, `handleOrderStatusUpdated`).
- Type `currentAuthUser` as `AuthUser | null`.

#### [RENAME] `src/main.jsx` → `src/main.tsx`

- Update `index.html` to reference `src/main.tsx`.

### 6.3 Verification Gate

```bash
npm run type-check
npm run build
npm run test:e2e
```

---

## Phase 7: Final Hardening & CI Update

### 7.1 Strict Mode Audit

- Run `grep -r "as any" src/` and eliminate all escape hatches.
- Ensure `noUnusedLocals` and `noUnusedParameters` are clean.

### 7.2 Update CI Pipeline

```diff
  # In .github/workflows/ci.yml → frontend-checks job
  - name: Type Check
    working-directory: ./frontend
    run: npm run type-check
```

### 7.3 Update ESLint

- Add `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`.
- Update `eslint.config.js` to include TypeScript rules.

### 7.4 Final Verification

```bash
npm run type-check    # Zero errors
npm run lint          # Zero warnings
npm run build         # Clean production build
npm run test:e2e      # 5/5 Playwright tests pass
```

---

## Migration Rules

> [!IMPORTANT]
> 1. **Never rename + refactor in the same commit.** Rename first, then type.
> 2. **Keep all E2E test files as `.spec.js`.** Playwright tests don't need TypeScript.
> 3. **Co-locate prop interfaces** at the top of each component file (not in a global types file).
> 4. **Shared model types** go in `src/types/models.ts` and are imported by stores and components.
> 5. **No `any` allowed.** Use `unknown` + type narrowing instead.
> 6. **Run `npm run type-check`** after every phase before moving to the next.

---

## Estimated Effort

| Phase                      | Files          | Complexity  |
| -------------------------- | -------------- | ----------- |
| Phase 0: Infrastructure    | 4 new/modified | Low         |
| Phase 1: Core Libs & Types | 7 files        | Medium      |
| Phase 2: Zustand Stores    | 8 files        | Medium-High |
| Phase 3: Customer Domain   | 34 files       | High        |
| Phase 4: Restaurant Domain | 34 files       | High        |
| Phase 5: Rider Domain      | 8 files        | Medium      |
| Phase 6: App Root & Shared | 4 files        | Medium      |
| Phase 7: Hardening & CI    | Config files   | Low         |

**Total: ~96 file renames + typing across 7 phases**
