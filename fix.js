const fs = require('fs');
let text = fs.readFileSync('backend/customer/payment/paymentController.js', 'utf8');

const badBlockStart = text.indexOf('let total_amount = 0;');
const badBlockEnd = text.indexOf('const userId = req.user.id;');
if (badBlockStart !== -1 && badBlockEnd !== -1) {
  text = text.substring(0, badBlockStart) + text.substring(badBlockEnd);
}

const tryBlockStart = text.indexOf('try {\r\n    await client.query("BEGIN");');
if (tryBlockStart === -1) {
    const tryBlockStart2 = text.indexOf('try {\n    await client.query("BEGIN");');
    if (tryBlockStart2 !== -1) {
        insert(tryBlockStart2, 'try {\n    await client.query("BEGIN");'.length);
    }
} else {
    insert(tryBlockStart, 'try {\r\n    await client.query("BEGIN");'.length);
}

function insert(start, len) {
    const insertIndex = start + len;
    const newBlock = `\n
    let total_amount = 0;
    for (let item of cartItems) {
      const itemQuery = await client.query("SELECT price FROM menu_items WHERE menu_item_id = $1", [item.menu_item_id]);
      if (itemQuery.rows.length === 0) throw new Error("Menu item not found");
      const price = itemQuery.rows[0].price;
      item.price = price;
      total_amount += price * item.quantity;
    }\n`;
    text = text.substring(0, insertIndex) + newBlock + text.substring(insertIndex);
}

fs.writeFileSync('backend/customer/payment/paymentController.js', text);
console.log("Done");
