import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setup() {
  console.log('Running Global Setup for E2E Tests with Prisma...');

  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || 'postgres';
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 5434;
  const dbUrl = `postgresql://${user}:${pass}@${host}:${port}/test_mealmate?schema=public`;
  process.env.DATABASE_URL = dbUrl;

  const rootDir = path.resolve(__dirname, '../../');
  
  try {
    // 1. Push schema.prisma to create the exact tables Prisma expects
    execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 2. Run triggers.sql to add PostGIS and required functions/triggers
    console.log('Running triggers and extensions...');
    const triggersSqlPath = path.join(rootDir, 'triggers.sql');
    execSync(`npx prisma db execute --file "${triggersSqlPath}" --url="${dbUrl}"`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 3. Populate initial data
    console.log('Running seeds...');
    const seedSqlPath = path.join(rootDir, 'populate.sql');
    execSync(`npx prisma db execute --file "${seedSqlPath}" --url="${dbUrl}"`, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    
    console.log('Test database setup complete.');
  } catch (err) {
    console.error("Error setting up test DB:", err);
    throw err;
  }
}

export async function teardown() {
  console.log('Global Teardown for E2E Tests completed.');
}
