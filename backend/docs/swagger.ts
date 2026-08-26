import customerDocs from './customerDocs.js';
import restaurantDocs from './restaurantDocs.js';
import riderDocs from './riderDocs.js';
import sharedDocs from './sharedDocs.js';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MealMate API Documentation',
    version: '1.0.0',
    description:
      'Interactive API documentation for MealMate Customer, Restaurant, and Rider modules.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Customer - Auth', description: 'Customer Authentication' },
    { name: 'Customer - Restaurant', description: 'Browsing Restaurants and Menus' },
    { name: 'Customer - Cart', description: 'Cart Management' },
    { name: 'Customer - Order', description: 'Order Creation and Management' },
    { name: 'Customer - Payment', description: 'Payment Processing (SSLCommerz)' },
    { name: 'Restaurant - Auth & Profile', description: 'Restaurant Authentication and Profile' },
    { name: 'Restaurant - Menu', description: 'Menu and Category Management' },
    { name: 'Restaurant - Order', description: 'Order Fulfillment Lifecycle' },
    { name: 'Restaurant - Stats', description: 'Restaurant Statistics and Analytics' },
    { name: 'Rider - Auth', description: 'Rider Authentication' },
    { name: 'Rider - Profile & Orders', description: 'Rider Profile and Deliveries' },
    { name: 'Shared - Reviews', description: 'Review Management' },
    { name: 'Shared - Chat', description: 'Chat and Messaging' },
    { name: 'Shared - Notifications', description: 'Push Notifications' },
    { name: 'Shared - AI', description: 'AI Assistant features' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'jwt',
        description:
          'HttpOnly JWT Cookie. Log in via any /login endpoint to automatically set this cookie.',
      },
    },
    schemas: {
      ...customerDocs.schemas,
      ...restaurantDocs.schemas,
      ...riderDocs.schemas,
      ...sharedDocs.schemas,
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
  paths: {
    ...customerDocs.paths,
    ...restaurantDocs.paths,
    ...riderDocs.paths,
    ...sharedDocs.paths,
  },
};

export default swaggerDocument;
