const fs = require('fs');
const file = 'backend/customer/payment/paymentController.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const data = \{\r?\n\s+total_amount: total_amount,\r?\n\s+total_amount: total_amount,/,
  "const final_total_amount = createdOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);\n      const data = {\n        total_amount: final_total_amount,"
);

content = content.replace(
  /\/\/     console\.log\("DEBUG: frontendUrl \(resolved\) =", frontendUrl\);[\s\S]*?\/\/   \};/g,
  ''
);

fs.writeFileSync(file, content);
