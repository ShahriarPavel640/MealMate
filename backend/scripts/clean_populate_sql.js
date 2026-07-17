import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const filepath = path.join(rootDir, 'populate.sql');

try {
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace the INSERT INTO statement columns
  const insertPattern = /INSERT INTO deliveries \(delivery_id, order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, status, start_time, end_time\) VALUES/g;
  const newInsert = 'INSERT INTO deliveries (delivery_id, order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time) VALUES';
  content = content.replace(insertPattern, newInsert);

  // Replace the values rows to remove the status string (e.g. 'delivered', 'pending', etc.)
  // We match everything up to the address string, then match the status string, then the rest
  const valuePattern = /(\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*[\d\.]+,\s*[\d\.]+,\s*'[^']+',)\s*'[^']+',\s*(CURRENT_TIMESTAMP[^\)]*\))/g;
  
  content = content.replace(valuePattern, '$1 $2');

  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Successfully cleaned up delivery status from populate.sql');
} catch (err) {
  console.error('Error processing populate.sql:', err);
}
