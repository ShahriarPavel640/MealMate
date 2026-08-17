const fs = require('fs');

function updateRoute(file, schemaName) {
  if (!fs.existsSync(file)) {
      console.log("File not found: " + file);
      return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('import { validate }')) {
      console.log("Already updated: " + file);
      return;
  }
  
  // Replace validinfo import with validate and the schema
  content = content.replace(
    /import validinfo from ".*middleware\/validinfo\.js";/,
    `import { validate } from "../../middleware/validate.js";\nimport { ${schemaName} } from "../../schemas/extra.js";`
  );
  
  // Replace validinfo in routes
  content = content.replace(/validinfo/g, `validate(${schemaName})`);
  
  fs.writeFileSync(file, content);
  console.log("Updated: " + file);
}

updateRoute('backend/rider/auth/riderAuthRoutes.js', 'riderAuthSchema');
updateRoute('backend/restaurants/profile/restaurantProfileRoutes.js', 'restaurantAuthSchema');

