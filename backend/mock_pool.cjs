const fs = require('fs');
const path = require('path');

const mockCode = `import prisma from '../prismaClient.js';
const pool = {
  query: async (text, params) => {
    if (params) return prisma.$executeRawUnsafe(text, ...params);
    return prisma.$executeRawUnsafe(text);
  },
  end: async () => { await prisma.$disconnect(); }
};`;

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.test.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/import pool from ['"]\.\.\/db\.js['"];?/g, mockCode);
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

walk(path.join(__dirname, 'tests'));
console.log('Mocked pool in all tests');
