const fs = require('fs');

function wireReviewSchema() {
  const file = 'backend/shared/reviews/reviewRoutes.js';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import { validate }')) {
    content = content.replace(/import express from 'express';/, import express from 'express';\nimport { validate } from '../../middleware/validate.js';\nimport { reviewSchema } from '../../schemas/extra.js';);
  }
  
  content = content.replace(
    /reviewController\.submitRestaurantReview\);/,
    alidate(reviewSchema), reviewController.submitRestaurantReview);
  );
  
  content = content.replace(
    /reviewController\.submitRiderReview\);/,
    alidate(reviewSchema), reviewController.submitRiderReview);
  );
  
  fs.writeFileSync(file, content);
}

function wireOrderStatusSchema() {
  const file = 'backend/restaurants/order/orderRoutes.js';
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import { validate }')) {
    content = content.replace(/import express from "express";/, import express from "express";\nimport { validate } from "../../middleware/validate.js";\nimport { orderStatusSchema } from "../../schemas/extra.js";);
  }
  
  content = content.replace(
    /authorizeRoles\(role\), updateOrderStatus/,
    uthorizeRoles(role), validate(orderStatusSchema), updateOrderStatus
  );
  
  fs.writeFileSync(file, content);
}

wireReviewSchema();
wireOrderStatusSchema();
