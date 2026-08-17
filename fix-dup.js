const fs = require('fs');
let content = fs.readFileSync('backend/restaurants/order/orderRoutes.js', 'utf8');
content = content.replace(/import \{ validate \} from "\.\.\/\.\.\/middleware\/validate\.js";\nimport \{ validate \} from "\.\.\/\.\.\/middleware\/validate\.js";/g, 'import { validate } from "../../middleware/validate.js";');
fs.writeFileSync('backend/restaurants/order/orderRoutes.js', content);
