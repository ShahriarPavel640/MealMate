const customerDocs = {
  schemas: {
    CustomerSignup: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: { type: 'string', format: 'password', example: 'password123' },
        phone_number: { type: 'string', example: '+1234567890' },
        latitude: { type: 'number', example: 23.8103 },
        longitude: { type: 'number', example: 90.4125 },
      },
    },
    CustomerLogin: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: { type: 'string', format: 'password', example: 'password123' },
      },
    },
    CustomerChangePassword: {
      type: 'object',
      required: ['prevPassword', 'newPassword'],
      properties: {
        prevPassword: { type: 'string', format: 'password' },
        newPassword: { type: 'string', format: 'password' },
      },
    },
    CustomerUpdateProfile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        location: {
          type: 'object',
          properties: { lat: { type: 'number' }, lng: { type: 'number' } }
        },
        address: {
          type: 'object',
          properties: { street: { type: 'string' }, city: { type: 'string' }, postal_code: { type: 'string' } }
        },
      },
    },
    AddToCart: {
      type: 'object',
      required: ['menu_item_id', 'restaurant_id', 'quantity'],
      properties: {
        menu_item_id: { type: 'integer' },
        restaurant_id: { type: 'integer' },
        quantity: { type: 'integer' },
      },
    },
    CreateOrder: {
      type: 'object',
      required: ['cartItems'],
      properties: {
        cartItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              restaurant_id: { type: 'integer' },
              menu_item_id: { type: 'integer' },
              quantity: { type: 'integer' },
              price: { type: 'number' },
            }
          }
        },
        specialInstructions: { type: 'object' },
      },
    },
    InitiatePayment: {
      type: 'object',
      required: ['cartItems', 'customerInfo'],
      properties: {
        cartItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              menu_item_id: { type: 'integer' },
              restaurant_id: { type: 'integer' },
              quantity: { type: 'integer' },
              price: { type: 'number' },
            }
          }
        },
        customerInfo: {
          type: 'object',
          properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'object' } }
        },
        total_amount: { type: 'number' },
        tran_id: { type: 'string' },
        paymentMethod: { type: 'string', default: 'sslcommerz' },
        specialInstructions: { type: 'object' }
      },
    },
    GenericResponse: {
      type: 'object',
      additionalProperties: true,
      description: 'Flexible response schema containing data fetched from database.',
    }
  },
  paths: {
    // ---- AUTH ROUTES ----
    '/api/customer/register': {
      post: {
        tags: ['Customer - Auth'],
        summary: 'Register a new customer',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerSignup' } } } },
        responses: { 201: { description: 'Success' }, 400: { description: 'Validation Error' } },
      },
    },
    '/api/customer/login': {
      post: {
        tags: ['Customer - Auth'],
        summary: 'Login customer',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerLogin' } } } },
        responses: { 200: { description: 'Success' }, 401: { description: 'Invalid Credentials' } },
      },
    },
    '/api/customer/is-verify': {
      get: { tags: ['Customer - Auth'], summary: 'Verify customer session', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/logout': {
      get: { tags: ['Customer - Auth'], summary: 'Logout customer', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/change_password': {
      put: {
        tags: ['Customer - Auth'],
        summary: 'Change customer password',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerChangePassword' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/profile': {
      get: { tags: ['Customer - Auth'], summary: 'Get customer profile', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericResponse' } } } } } },
    },
    '/api/customer/update_profile': {
      put: {
        tags: ['Customer - Auth'],
        summary: 'Update customer profile',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerUpdateProfile' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- RESTAURANT ROUTES ----
    '/api/customer/nearby_restaurants': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get nearby restaurants',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericResponse' } } } } },
      },
    },
    '/api/customer/restaurant/{id}/favorite': {
      post: {
        tags: ['Customer - Restaurant'],
        summary: 'Toggle favorite restaurant',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/getRestaurants': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get all restaurants',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/getCategories': {
      get: { tags: ['Customer - Restaurant'], summary: 'Get all global categories', responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/menus': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get menus with filtering',
        parameters: [{ name: 'restaurant_id', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/menu/{id}': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get specific menu item details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/getRestaurant/{id}': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get restaurant details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/get_restaurant_by_location': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get restaurants by bounding box',
        parameters: [
          { name: 'neLat', in: 'query', schema: { type: 'number' } },
          { name: 'neLng', in: 'query', schema: { type: 'number' } },
          { name: 'swLat', in: 'query', schema: { type: 'number' } },
          { name: 'swLng', in: 'query', schema: { type: 'number' } }
        ],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/reviews': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Get reviews for restaurant',
        parameters: [{ name: 'restaurant_id', in: 'query', schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/searchRestaurant': {
      get: {
        tags: ['Customer - Restaurant'],
        summary: 'Search restaurants by name',
        parameters: [{ name: 'name', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- CART ROUTES ----
    '/api/customer/cart': {
      get: { tags: ['Customer - Cart'], summary: 'Get customer cart', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/add_cart': {
      post: {
        tags: ['Customer - Cart'],
        summary: 'Add item to cart',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddToCart' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/cart/{cart_item_id}': {
      delete: {
        tags: ['Customer - Cart'],
        summary: 'Remove item from cart',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'cart_item_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- ORDER ROUTES ----
    '/api/customer/order/create': {
      post: {
        tags: ['Customer - Order'],
        summary: 'Create COD order',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrder' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/customer/order/': {
      get: { tags: ['Customer - Order'], summary: 'Get order history', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/order/{orderId}': {
      get: {
        tags: ['Customer - Order'],
        summary: 'Get order details',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/order/{orderId}/location': {
      get: {
        tags: ['Customer - Order'],
        summary: 'Get real-time location of active delivery',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- PAYMENT ROUTES ----
    '/api/customer/payment/initiate': {
      post: {
        tags: ['Customer - Payment'],
        summary: 'Initiate SSLCommerz payment',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InitiatePayment' } } } },
        responses: { 200: { description: 'Returns Gateway URL' } },
      },
    },
    '/api/customer/payment/ipn': {
      post: { tags: ['Customer - Payment'], summary: 'SSLCommerz IPN Webhook', responses: { 200: { description: 'Success' } } },
    },
    '/api/customer/payment/success': {
      post: { tags: ['Customer - Payment'], summary: 'Payment Success Redirect', responses: { 200: { description: 'HTML Redirect page' } } },
    },
    '/api/customer/payment/fail': {
      post: { tags: ['Customer - Payment'], summary: 'Payment Failed Redirect', responses: { 200: { description: 'HTML Redirect page' } } },
    },
    '/api/customer/payment/cancel': {
      post: { tags: ['Customer - Payment'], summary: 'Payment Cancelled Redirect', responses: { 200: { description: 'HTML Redirect page' } } },
    },
  },
};

export default customerDocs;
