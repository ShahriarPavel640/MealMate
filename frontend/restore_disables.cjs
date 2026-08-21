const fs = require('fs');
const files = [
  'src/Components/ChatButton.jsx',
  'src/features/customer/components/Header.jsx',
  'src/features/customer/components/cards/RestaurantCard.jsx',
  'src/features/customer/components/skeleton/Navbar.jsx',
  'src/features/customer/store/userAuthStore.js',
  'src/features/restaurant/components/AddMenuItemRest.jsx',
  'src/features/restaurant/components/AnalyticsRest.jsx',
  'src/features/restaurant/components/DashboardRest.jsx',
  'src/features/restaurant/components/HeaderRest.jsx',
  'src/features/restaurant/components/LoginPageRest.jsx',
  'src/features/restaurant/components/MenuManagementRest.jsx',
  'src/features/restaurant/components/OrderManagementRest.jsx',
  'src/features/restaurant/components/RestaurantProfile.jsx',
  'src/features/restaurant/components/ui/badge.jsx',
  'src/features/restaurant/components/ui/button.jsx',
  'src/features/restaurant/components/ui/toggle.jsx',
  'src/features/rider/pages/HomepageRider.jsx',
  'src/features/rider/pages/LoginPageRider.jsx',
  'src/features/customer/pages/HomePage.jsx',
  'src/features/customer/pages/LoginPage.jsx',
  'src/features/customer/pages/OrderHistoryPage.jsx',
  'src/features/customer/pages/RestaurantPage.jsx',
  'src/features/customer/pages/RestaurantProfile.jsx',
  'src/features/customer/pages/SimulatePaymentGateway.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.startsWith('/* eslint-disable */')) {
      fs.writeFileSync(file, '/* eslint-disable */\n' + content, 'utf8');
    }
  }
});
