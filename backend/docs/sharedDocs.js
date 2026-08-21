const sharedDocs = {
  schemas: {
    SubmitRestaurantReview: {
      type: 'object',
      required: ['restaurantId', 'orderId', 'rating'],
      properties: {
        restaurantId: { type: 'integer' },
        orderId: { type: 'integer' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
      },
    },
    SubmitRiderReview: {
      type: 'object',
      required: ['riderId', 'orderId', 'rating'],
      properties: {
        riderId: { type: 'integer' },
        orderId: { type: 'integer' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
      },
    },
    SendMessage: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' },
      },
    },
    AIGenerateDescription: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
    GenericResponse: {
      type: 'object',
      additionalProperties: true,
    }
  },
  paths: {
    // ---- REVIEWS ----
    '/api/customer/review/restaurant': {
      post: {
        tags: ['Shared - Reviews'],
        summary: 'Submit restaurant review',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitRestaurantReview' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/customer/review/rider': {
      post: {
        tags: ['Shared - Reviews'],
        summary: 'Submit rider review',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitRiderReview' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/customer/review/restaurant/{restaurantId}': {
      get: {
        tags: ['Shared - Reviews'],
        summary: 'Get restaurant reviews',
        parameters: [{ name: 'restaurantId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/customer/review/my-reviews': {
      get: {
        tags: ['Shared - Reviews'],
        summary: 'Get my reviews (Rider)',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- CHATS ----
    '/api/chat/': {
      get: { tags: ['Shared - Chat'], summary: 'Get conversations', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/chat/unread-count': {
      get: { tags: ['Shared - Chat'], summary: 'Get unread message count', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/chat/{orderId}': {
      get: {
        tags: ['Shared - Chat'],
        summary: 'Get chat messages for order',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Success' } },
      },
      post: {
        tags: ['Shared - Chat'],
        summary: 'Send message in chat',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SendMessage' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/chat/{orderId}/read': {
      put: {
        tags: ['Shared - Chat'],
        summary: 'Mark chat as read',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- NOTIFICATIONS ----
    '/api/notifications/': {
      get: { tags: ['Shared - Notifications'], summary: 'Get notifications', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/notifications/mark-read': {
      put: { tags: ['Shared - Notifications'], summary: 'Mark notifications as read', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },

    // ---- AI ----
    '/api/ai/generate-description': {
      post: {
        tags: ['Shared - AI'],
        summary: 'Generate menu item description with AI',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AIGenerateDescription' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/ai/summarize-reviews/{restaurantId}': {
      get: {
        tags: ['Shared - AI'],
        summary: 'Summarize restaurant reviews with AI',
        parameters: [{ name: 'restaurantId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
  },
};

export default sharedDocs;
