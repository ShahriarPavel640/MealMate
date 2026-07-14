const fs = require('fs');
const files = [
  "backend/tests/restaurant.test.js",
  "backend/tests/customer.test.js",
  "backend/rider/auth/riderAuthRoutes.js",
  "backend/rider/auth/riderAuthController.js",
  "backend/restaurants/profile/restaurantProfileRoutes.js",
  "backend/restaurants/profile/restaurantProfileController.js",
  "backend/customer/auth/authRoutes.js",
  "backend/customer/auth/authController.js",
  "frontend/src/features/restaurant/store/restaurantAuthStore.js",
  "frontend/src/features/customer/store/userAuthStore.js"
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/varify/g, 'verify');
    content = content.replace(/Varify/g, 'Verify');
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
  }
});
console.log("Done replacing varify with verify.");
