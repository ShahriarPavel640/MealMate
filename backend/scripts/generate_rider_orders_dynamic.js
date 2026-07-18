import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = path.join(__dirname, '..', '..', 'populate.sql');

if (!fs.existsSync(sqlFile)) {
  console.error("Could not find populate.sql at:", sqlFile);
  process.exit(1);
}

let content = fs.readFileSync(sqlFile, 'utf8');

// Find the start of the rider dashboard data
const marker = "-- RIDER DASHBOARD ORDERS DATA --";
const idx = content.indexOf(marker);
if (idx !== -1) {
  content = content.substring(0, idx);
}

// Now generate the new data with created_at and delivered_at using INTERVAL
const ordersSql = [];
const orderItemsSql = [];
const paymentsSql = [];
const deliveriesSql = [];
const reviewsSql = [];

const riders = [4, 5];
const customers = [1, 2, 3];
const restaurants = [6, 7, 8, 9, 10, 11];

const startId = 1001;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

const reviewComments = [
  "Fast delivery and very polite!",
  "Arrived right on time, great service.",
  "Friendly rider, food was hot.",
  "Quick and efficient.",
  "Super fast delivery, highly recommend!",
  "A bit delayed, but the rider was nice.",
  "Excellent service.",
  "Perfect drop-off."
];

// Generate 100 orders to populate analytics densely
for (let i = 0; i < 100; i++) {
  const orderId = startId + i;
  const customerId = randomChoice(customers);
  const restaurantId = randomChoice(restaurants);
  
  // Random days ago between 0 and 90 for 3 months of historical data
  const daysAgo = randomInt(0, 90);
  const createdInterval = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days'`;
  const deliveredInterval = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '30 minutes'`;
  
  let status, deliveryStatus, riderId, deliveredVal, createdVal;
  
  if (i < 20) {
    status = 'ready_for_pickup';
    deliveryStatus = 'pending'; // No rider assigned yet
    riderId = 'NULL';
    deliveredVal = 'NULL';
    createdVal = "CURRENT_TIMESTAMP";
  } else if (i === 20) {
    status = 'out_for_delivery';
    deliveryStatus = 'in_transit';
    riderId = 4;
    deliveredVal = 'NULL';
    createdVal = "CURRENT_TIMESTAMP";
  } else {
    // 79 delivered orders
    status = 'delivered';
    deliveryStatus = 'delivered';
    riderId = 4;
    createdVal = createdInterval;
    deliveredVal = deliveredInterval;
  }

  const totalAmount = randomFloat(20.0, 100.0);
  const tranId = `TRAN10${orderId}`;
  
  ordersSql.push(`(${orderId}, ${customerId}, ${restaurantId}, ${riderId}, '${status}', ${totalAmount}, '${tranId}', ${createdVal}, ${deliveredVal})`);
  
  // Order items
  const menuItemId = randomInt(1, 10);
  const qty = randomInt(1, 3);
  orderItemsSql.push(`(${orderId}, ${menuItemId}, ${qty}, ${totalAmount})`);
  
  // Payments
  paymentsSql.push(`(${orderId}, ${orderId}, ${customerId}, 'sslcommerz', ${totalAmount}, 'paid', '${tranId}')`);
  
  // Deliveries
  const lat = (23.7285 + (Math.random() * 0.04 - 0.02)).toFixed(8);
  const lng = (90.3952 + (Math.random() * 0.04 - 0.02)).toFixed(8);
  const addr = `Random Addr ${orderId}`;
  
  const startTime = createdVal;
  const endTime = status === 'delivered' ? deliveredVal : 'NULL';
  deliveriesSql.push(`(${orderId}, ${orderId}, ${riderId}, ${restaurantId}, ${lat}, ${lng}, '${addr}', ${startTime}, ${endTime})`);
  
  // Reviews (Only for delivered orders)
  if (status === 'delivered') {
    // 90% chance to leave a review
    if (Math.random() > 0.1) {
      const rating = randomFloat(4.0, 5.0); // mostly good ratings for a good dashboard
      const comment = randomChoice(reviewComments);
      reviewsSql.push(`(${customerId}, ${restaurantId}, ${riderId}, ${orderId}, ${rating}, '${comment}', ${deliveredVal})`);
    }
  }
}

let newSql = "\n" + marker + "\n";
newSql += "INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id, created_at, delivered_at) VALUES \n";
newSql += ordersSql.join(",\n") + " ON CONFLICT (order_id) DO NOTHING;\n\n";

newSql += "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES \n";
newSql += orderItemsSql.join(",\n") + " ON CONFLICT (order_id, menu_item_id) DO NOTHING;\n\n";

newSql += "INSERT INTO payments (payment_id, order_id, user_id, method_type, amount, status, tran_id) VALUES \n";
newSql += paymentsSql.join(",\n") + " ON CONFLICT (payment_id) DO NOTHING;\n\n";

newSql += "INSERT INTO deliveries (delivery_id, order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time) VALUES \n";
newSql += deliveriesSql.join(",\n") + " ON CONFLICT (delivery_id) DO NOTHING;\n\n";

if (reviewsSql.length > 0) {
  newSql += "INSERT INTO reviews (user_id, restaurant_id, rider_id, order_id, rating, comment, created_at) VALUES \n";
  newSql += reviewsSql.join(",\n") + ";\n\n";
}

content += newSql;

fs.writeFileSync(sqlFile, content, 'utf8');

console.log("Successfully replaced and appended new dynamic orders using JavaScript!");
