const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, 'tests');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace pool.query(...) with prisma.$executeRawUnsafe(...)
    // This is tricky because of the array of parameters.
    // pool.query("DELETE FROM users WHERE user_id = $1", [riderId]);
    
    // Pattern: pool.query( query_string_or_var, [ param1, param2 ] )
    content = content.replace(/pool\.query\(([\s\S]*?),\s*\[([\s\S]*?)\]\)/g, (match, query, params) => {
        return `prisma.$executeRawUnsafe(${query}, ${params})`;
    });

    // Replace pool.query without parameters: pool.query("DELETE FROM users")
    content = content.replace(/pool\.query\(([\s\S]*?)\)/g, (match, query) => {
        if (!query.includes('prisma.')) {
            return `prisma.$executeRawUnsafe(${query})`;
        }
        return match;
    });

    // Clean up prisma.$executeRawUnsafe(prisma.$executeRawUnsafe(...)) if any overlap happened
    content = content.replace(/prisma\.\$executeRawUnsafe\(prisma\.\$executeRawUnsafe\(([\s\S]*?)\)\)/g, 'prisma.$executeRawUnsafe($1)');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.test.js')) {
            processFile(fullPath);
        }
    }
}

walk(testsDir);
console.log('Done replacing pool.query');
