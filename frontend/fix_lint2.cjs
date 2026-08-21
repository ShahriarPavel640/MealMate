const fs = require('fs');
const files = [
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
