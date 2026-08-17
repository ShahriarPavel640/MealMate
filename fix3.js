const fs = require('fs');
let text = fs.readFileSync('backend/customer/payment/paymentController.js', 'utf8');

// 1. Fix initiatePayment (move total_amount recalculation to the correct place, inside try block and fix $$1 to $1)
const initFindStr = `  const { cartItems, customerInfo, total_amount, paymentMethod } = req.body; // Added paymentMethod
  const userId = req.user.id;
  const tran_id = \`TXN_${Date.now()}_${userId}\`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create the order with a 'pending_payment' status`;

const initReplaceStr = `  const { cartItems, customerInfo, paymentMethod, specialInstructions } = req.body;
  const userId = req.user.id;
  const tran_id = \`TXN_\${Date.now()}_\${userId}_\${uuidv4()}\`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total_amount = 0;
    for (let item of cartItems) {
      const itemQuery = await client.query("SELECT price FROM menu_items WHERE menu_item_id = $1", [item.menu_item_id]);
      if (itemQuery.rows.length === 0) throw new Error("Menu item not found");
      const price = itemQuery.rows[0].price;
      item.price = price;
      total_amount += price * item.quantity;
    }

    // 1. Create the order with a 'pending_payment' status`;
text = text.replace(initFindStr, initReplaceStr);

const importStr = `import { v4 as uuidv4 } from "uuid";\n`;
if (!text.includes('uuidv4')) {
    text = importStr + text;
}

text = text.replace('const data = {', `const data = {\n      total_amount: total_amount,`);

// 2. Fix callbacks (handleSuccess, handleFail, handleCancel) IDOR vulnerability

const successFind = `export const handleSuccess = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");`;
const successReplace = `export const handleSuccess = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }`;
text = text.replace(successFind, successReplace);

const failFind = `export const handleFail = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");`;
const failReplace = `export const handleFail = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }`;
text = text.replace(failFind, failReplace);

const cancelFind = `export const handleCancel = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");`;
const cancelReplace = `export const handleCancel = async (req, res) => {
  const tran_id = req.query?.tran_id || req.body?.tran_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const check = await client.query("SELECT * FROM payments WHERE tran_id = $1", [tran_id]);
    if (check.rows.length === 0) { await client.query("ROLLBACK"); return res.status(400).json("Invalid transaction"); }`;
text = text.replace(cancelFind, cancelReplace);

fs.writeFileSync('backend/customer/payment/paymentController.js', text);
console.log("Done");
