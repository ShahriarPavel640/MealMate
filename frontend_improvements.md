# MealMate Frontend — Industry-Standard Architecture Overhaul

This document outlines a comprehensive plan to elevate the MealMate React frontend from a functional prototype to a robust, highly performant, and industry-standard enterprise application. 

---

## 1. State Management & Data Fetching (The Biggest Architecture Flaw)

### 🔴 The Problem
Currently, you are using **Zustand** for *everything* (Cart, Chat, Notifications, Restaurants, Auth). 
In `useRestaurantStore.js`, you manually fetch data with Axios, manually toggle `loading: true/false`, and store the server response in Zustand.
* **Why this is bad:** Manual data fetching is prone to race conditions, lacks automatic caching, doesn't deduplicate requests, and requires massive amounts of boilerplate code.

### ✅ The Industry Standard Solution
Separate your state into two categories:
1. **Server State (Data from the DB):** Use **TanStack Query (React Query)**. It automatically handles loading states, error states, caching, background refetching, and pagination. 
2. **Client State (UI toggles, Cart):** Keep using **Zustand**. 

*Migration:* Replace `getrestaurants` in Zustand with a `useRestaurants` custom hook powered by `useQuery` from React Query.

---

## 2. Type Safety & Reliability

### 🔴 The Problem
The entire frontend is written in vanilla JavaScript (`.jsx`). As the application scales with complex nested objects (e.g., Orders containing CartItems and Restaurant details), you are highly susceptible to "Cannot read properties of undefined" runtime errors.

### ✅ The Industry Standard Solution
Migrate the codebase to **TypeScript (`.tsx`)**. 
By defining strict interfaces for `User`, `Restaurant`, `Order`, and `CartItem`, your code editor will catch errors *before* you even run the app. Combined with your backend Zod validation, you achieve end-to-end type safety.

---

## 3. Routing & Performance (Code Splitting)

### 🔴 The Problem
In `App.jsx`, every single page for the Customer, Restaurant, and Rider is imported at the top level. 
* **Why this is bad:** When a customer visits your homepage, their browser downloads the JavaScript for the Rider Earnings page and the Restaurant Menu Management dashboard. This results in a massive initial bundle size and slow load times.

### ✅ The Industry Standard Solution
Implement **Route-level Code Splitting** using React's `lazy()` and `Suspense`. 
```jsx
// Instead of: import ProfilePageRider from "@/features/rider/pages/ProfilePageRider";
const ProfilePageRider = React.lazy(() => import("@/features/rider/pages/ProfilePageRider"));
```
Even better, migrate to **React Router v6 Data APIs** (`createBrowserRouter`) to utilize loaders and actions, which parallelize data fetching and rendering.

---

## 4. UI Framework Consistency

### 🔴 The Problem
`package.json` shows a mix of raw TailwindCSS, Radix UI primitives (`@radix-ui/react-*`), and DaisyUI (`daisyui`). 
* **Why this is bad:** Mixing unstyled primitives (Radix) with heavily opinionated component libraries (DaisyUI) leads to bloated CSS, styling conflicts, and inconsistent user experiences.

### ✅ The Industry Standard Solution
Standardize your design system. Since you are already using Radix UI primitives, fully adopt **shadcn/ui**. It uses Tailwind and Radix to give you beautifully styled, accessible components that you actually own the code for. Remove `daisyui` entirely to reduce CSS bundle size.

---

## 5. Authentication Architecture

### 🔴 The Problem
In `App.jsx`, you have three separate `useEffect` hooks calling `checkAuth()`, `checkAuthRestaurant()`, and `checkAuthRider()` simultaneously on initial load. This blasts the backend with three separate API calls just to figure out who is logged in.

### ✅ The Industry Standard Solution
Unify your authentication. 
1. The backend should have a single `/api/auth/me` endpoint.
2. The frontend makes *one* call on load. 
3. The response returns the user details AND their `role` (Customer, Restaurant, Rider).
4. The frontend routes the user to the correct dashboard based on that single `role` variable.

---

## 6. Global Error Handling (Axios Interceptors)

### 🔴 The Problem
If a user's JWT token expires, the backend will return a `401 Unauthorized`. Currently, individual components have to handle this, or the API call just fails silently/shows a generic toast.

### ✅ The Industry Standard Solution
Add a response interceptor to `lib/axios.js`. If *any* API call returns a `401`, the interceptor should automatically clear the local Zustand auth state, fire a toast saying "Session expired", and redirect the user to the `/login` page globally.

---

## 7. Testing Strategy

### 🔴 The Problem
You have Playwright installed for End-to-End testing (`test:e2e`), but no unit or component integration tests.

### ✅ The Industry Standard Solution
Install **Vitest** and **React Testing Library**. 
Write unit tests for your complex utility functions (e.g., cart total calculations) and component tests for critical UI elements (e.g., the Checkout button should be disabled if the cart is empty).

---

## Suggested Implementation Roadmap

1. **Phase 1: Foundation (1 Week)**
   - Introduce React Query and migrate one feature (e.g., Restaurants) away from Zustand fetching.
   - Implement global Axios error interceptors.
   - Unify the Auth flow into a single context/store.
2. **Phase 2: Performance & Architecture (1 Week)**
   - Implement `React.lazy()` code splitting in `App.jsx`.
   - Remove DaisyUI and standardize on `shadcn/ui` components.
3. **Phase 3: The Big TypeScript Migration (2+ Weeks)**
   - Rename `.jsx` to `.tsx`.
   - Define global types/interfaces for all domain entities.
   - Fix compilation errors systematically.
