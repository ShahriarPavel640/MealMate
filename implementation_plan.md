# Project Refactoring Plan

This plan combines the structural analysis into actionable steps. We will refactor the root, backend, and frontend sequentially. As per your request, each phase has a checkpoint, and I will test or ask you to test the app after each task before marking it as completed.

## Proposed Changes

### Phase 1: Root Cleanup (Checkpoint 1)
Clear out misplaced dependencies in the root directory to prevent `npm` confusion.
- [ ] **DELETE** `package.json` in `c:\Users\User\OneDrive\Desktop\food_panda\`
- [ ] **DELETE** `package-lock.json` in `c:\Users\User\OneDrive\Desktop\food_panda\`
- [ ] **DELETE** `node_modules` folder in `c:\Users\User\OneDrive\Desktop\food_panda\`
- **Test:** Verify the root is clean and `npm install` works smoothly inside `frontend` and `backend`.

---

### Phase 2: Backend Architecture Unification (Checkpoint 2)
Transition the backend fully to a feature-based structure by removing the global `routes` and `controllers` folders completely.
- [ ] **MOVE** `backend/controllers/auth.controller.js` -> `backend/customer/auth/authController.js`
- [ ] **MOVE** `backend/routes/customerRoute.js` -> `backend/customer/auth/authRoutes.js`
- [ ] **MOVE** `backend/controllers/restaurant.controller.js` -> `backend/restaurants/profile/restaurantProfileController.js`
- [ ] **MOVE** `backend/routes/restaurantRoute.js` -> `backend/restaurants/profile/restaurantProfileRoutes.js`
- [ ] **MOVE** `backend/controllers/rider.controller.js` -> `backend/rider/auth/riderAuthController.js`
- [ ] **MOVE** `backend/routes/riderAuthRoute.js` -> `backend/rider/auth/riderAuthRoutes.js`
- [ ] **DELETE** `backend/controllers/public.controller.js`, `backend/routes/publicRoute.js`, and `backend/routes/jwtAuth.js` (these are legacy/unused as their logic is already handled in customer routes).
- [ ] **UPDATE** Imports in `backend/index.js` to point to the new route locations.
- [ ] **FIX** In `backend/index.js`, `app.use("/api/chat", chatRoutes);` is duplicated. Remove the duplicate.
- [ ] **UPDATE** Imports within the moved route files to point to the new controller locations.
- [ ] **DELETE** The now-empty `backend/controllers` and `backend/routes` directories.
- **Test:** Start the backend server (`npm start` or `npm run dev`) and verify it runs without errors. Ask user to test key API endpoints.

---

### Phase 3: Frontend Structure & Cleanup (Checkpoint 3)
Organize the React app to cleanly separate the three portals (Customer, Restaurant, Rider) and clean up bloated files.
- [ ] **NEW** Create `frontend/src/customer/` directory structure (`pages`, `components`).
- [ ] **MOVE** Customer pages from `frontend/src/pages/` to `frontend/src/customer/pages/` (e.g., `CheckoutPage.jsx`, `HomePage.jsx`, `LoginPage.jsx`, `ProfilePage.jsx`, etc.).
- [ ] **MODIFY** `frontend/src/App.jsx`: Update all imported paths for the moved pages.
- [ ] **MODIFY** `frontend/src/App.jsx`: Delete the 400+ lines of commented-out legacy code to improve readability.
- **Test:** Start the frontend development server (`npm run dev`) and ask the user to verify the app loads and navigates correctly across portals.

## Verification Plan

After each Phase, I will pause and we will run:
1. `npm run dev` in the respective directory.
2. Check for missing module/import errors.
3. Once you confirm it works, I will mark the phase as `[x]` and proceed to the next.
