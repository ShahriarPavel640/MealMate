const riderDocs = {
  schemas: {
    RiderSignup: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
        phone_number: { type: 'string' },
        vehicle_type: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
      },
    },
    RiderLogin: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
      },
    },
    RiderUpdateProfile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone_number: { type: 'string' },
        vehicle_type: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
      },
    },
    RiderUpdateAvailability: {
      type: 'object',
      required: ['is_available'],
      properties: {
        is_available: { type: 'boolean' },
      },
    },
    RiderUpdateOrderStatus: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['out_for_delivery', 'delivered', 'cancelled'] },
      },
    },
    GenericResponse: {
      type: 'object',
      additionalProperties: true,
    }
  },
  paths: {
    // ---- AUTH ----
    '/api/rider/signup': {
      post: {
        tags: ['Rider - Auth'],
        summary: 'Register rider',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RiderSignup' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/rider/login': {
      post: {
        tags: ['Rider - Auth'],
        summary: 'Login rider',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RiderLogin' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/rider/logout': {
      post: { tags: ['Rider - Auth'], summary: 'Logout', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/rider/is-verify': {
      get: { tags: ['Rider - Auth'], summary: 'Verify session', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },

    // ---- PROFILE & DASHBOARD ----
    '/api/rider/data/dashboard': {
      get: {
        tags: ['Rider - Dashboard'],
        summary: 'Get dashboard data (active delivery & available orders)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' } },
          { name: 'lon', in: 'query', schema: { type: 'number' } }
        ],
        responses: { 200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericResponse' } } } } },
      },
    },
    '/api/rider/data/profile': {
      get: { tags: ['Rider - Profile'], summary: 'Get profile', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
      put: {
        tags: ['Rider - Profile'],
        summary: 'Update profile',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RiderUpdateProfile' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/rider/data/availability': {
      put: {
        tags: ['Rider - Profile'],
        summary: 'Update availability',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RiderUpdateAvailability' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/rider/data/history': {
      get: { tags: ['Rider - Profile'], summary: 'Get delivery history', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/rider/data/earnings': {
      get: { tags: ['Rider - Profile'], summary: 'Get earnings', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/rider/data/reviews': {
      get: { tags: ['Rider - Profile'], summary: 'Get reviews', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },

    // ---- ORDERS ----
    '/api/rider/data/orders/{orderId}/accept': {
      put: {
        tags: ['Rider - Orders'],
        summary: 'Accept an order',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/rider/data/orders/{orderId}/status': {
      put: {
        tags: ['Rider - Orders'],
        summary: 'Update order status',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RiderUpdateOrderStatus' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/rider/data/orders/{orderId}': {
      get: {
        tags: ['Rider - Orders'],
        summary: 'Get order details',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
  },
};

export default riderDocs;
