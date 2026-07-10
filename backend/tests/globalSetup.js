import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setup() {
  console.log('Running Global Setup for E2E Tests...');
  // Connect to the default database to create the test database
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5434,
    database: 'postgres',
  });

  await client.connect();
  
  // Terminate active connections before dropping (in case tests left them hanging)
  await client.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = 'test_food_panda'
      AND pid <> pg_backend_pid();
  `);

  // Drop and create test database
  await client.query('DROP DATABASE IF EXISTS test_food_panda');
  await client.query('CREATE DATABASE test_food_panda');
  await client.end();

  // Connect to the new test database to run migrations and seeds
  const testClient = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5434,
    database: 'test_food_panda',
  });

  await testClient.connect();

  const rootDir = path.resolve(__dirname, '../../');
  const schemaSql = fs.readFileSync(path.join(rootDir, 'food_panda.sql'), 'utf-8');
  const seedSql = fs.readFileSync(path.join(rootDir, 'populate.sql'), 'utf-8');

  try {
    console.log('Running schema...');
    await testClient.query(schemaSql);
    console.log('Running seeds...');
    await testClient.query(seedSql);
    console.log('Test database setup complete.');
  } catch (err) {
    console.error("Error setting up test DB:", err);
    throw err;
  } finally {
    await testClient.end();
  }
}

export async function teardown() {
  console.log('Global Teardown for E2E Tests completed.');
}
