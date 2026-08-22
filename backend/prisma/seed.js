import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  try {
    const sqlFilePath = path.join(__dirname, '..', '..', 'populate.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      console.log(`Found populate.sql at ${sqlFilePath}`);
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      console.log('Executing raw SQL...');
      await prisma.$executeRawUnsafe(sql);
      
      console.log('Seeding finished successfully.');
    } else {
      console.log('populate.sql not found at', sqlFilePath);
    }
  } catch (e) {
    console.error('Error during seeding:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


