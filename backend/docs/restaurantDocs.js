const restaurantDocs = {
  schemas: {
    RestaurantRegister: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
        phone: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        street: { type: 'string' },
        city: { type: 'string' },
        postal_code: { type: 'string' },
      },
    },
    RestaurantLogin: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
      },
    },
    ChangePassword: {
      type: 'object',
      required: ['prevPassword', 'newPassword'],
      properties: {
        prevPassword: { type: 'string', format: 'password' },
        newPassword: { type: 'string', format: 'password' },
      },
    },
    EditProfile: {
      type: 'object',
      properties: {
        restaurant_name: { type: 'string' },
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        description: { type: 'string' },
        delivery_fee: { type: 'number' },
        min_order: { type: 'number' },
        delivery_time: { type: 'string' },
        delivery_radius: { type: 'number' },
        operating_hours: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        street: { type: 'string' },
        city: { type: 'string' },
        postal_code: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
    AddMenu: {
      type: 'object',
      required: ['name', 'category', 'price'],
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        is_available: { type: 'boolean' },
        discount: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
    ChangeAvailability: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'boolean' } },
    },
    CreateMenuCategory: {
      type: 'object',
      required: ['category_name'],
      properties: { category_name: { type: 'string' } },
    },
    CreateMenuItem: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
      },
    },
    UpdateMenuItem: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        isAvailable: { type: 'boolean' },
      },
    },
    UpdateOrderStatus: {
      type: 'object',
      required: ['status'],
      properties: {
        order_id: { type: 'string' },
        new_status: { type: 'string' },
        status: { type: 'string' },
      },
    },
    GenericResponse: {
      type: 'object',
      additionalProperties: true,
      description: 'Flexible response schema containing data fetched from database.',
    }
  },
  paths: {
    // ---- AUTH & PROFILE ----
    '/api/restaurant/register': {
      post: {
        tags: ['Restaurant - Auth & Profile'],
        summary: 'Register restaurant',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantRegister' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/restaurant/login': {
      post: {
        tags: ['Restaurant - Auth & Profile'],
        summary: 'Login restaurant',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantLogin' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/logout': {
      get: { tags: ['Restaurant - Auth & Profile'], summary: 'Logout', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/is-verify': {
      get: { tags: ['Restaurant - Auth & Profile'], summary: 'Verify session', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/change_password': {
      put: {
        tags: ['Restaurant - Auth & Profile'],
        summary: 'Change password',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePassword' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/get_restaurant_profile': {
      get: { tags: ['Restaurant - Auth & Profile'], summary: 'Get profile', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericResponse' } } } } } },
    },
    '/api/restaurant/edit_profile': {
      post: {
        tags: ['Restaurant - Auth & Profile'],
        summary: 'Edit profile (multipart)',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/EditProfile' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/reviews': {
      get: { tags: ['Restaurant - Auth & Profile'], summary: 'Get restaurant reviews', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/reviews/menu/{id}': {
      get: {
        tags: ['Restaurant - Auth & Profile'],
        summary: 'Get reviews for specific menu item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },

    // ---- MENU (LEGACY API) ----
    '/api/restaurant/add_menu': {
      post: {
        tags: ['Restaurant - Menu'],
        summary: 'Add menu item (multipart)',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/AddMenu' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/restaurant/edit_menu/{menu_item_id}': {
      put: {
        tags: ['Restaurant - Menu'],
        summary: 'Edit menu item (multipart)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'menu_item_id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { $ref: '#/components/schemas/AddMenu' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/change_availablity/{menu_item_id}': {
      put: {
        tags: ['Restaurant - Menu'],
        summary: 'Change item availability',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'menu_item_id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangeAvailability' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/delete_menu/{menu_item_id}': {
      delete: {
        tags: ['Restaurant - Menu'],
        summary: 'Delete menu item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'menu_item_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/get_menu_items': {
      get: { tags: ['Restaurant - Menu'], summary: 'Get all menu items', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/get_menu_categories': {
      get: { tags: ['Restaurant - Menu'], summary: 'Get menu categories', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },

    // ---- MENU CATEGORIES & ITEMS (RESTFUL API) ----
    '/api/restaurant/restaurants/{id}/categories': {
      post: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Create menu category',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMenuCategory' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/restaurant/categories/{id}': {
      put: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Update menu category',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMenuCategory' } } } },
        responses: { 200: { description: 'Success' } },
      },
      delete: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Delete menu category',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      }
    },
    '/api/restaurant/categories/{id}/items': {
      post: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Create item in category',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMenuItem' } } } },
        responses: { 201: { description: 'Success' } },
      },
    },
    '/api/restaurant/menu-items/{id}': {
      put: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Update menu item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMenuItem' } } } },
        responses: { 200: { description: 'Success' } },
      },
      delete: {
        tags: ['Restaurant - Menu (RESTful)'],
        summary: 'Delete menu item',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Success' } },
      }
    },

    // ---- ORDER ROUTES ----
    '/api/restaurant/recent_orders': {
      get: { tags: ['Restaurant - Order'], summary: 'Get recent orders', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/all_orders': {
      get: { tags: ['Restaurant - Order'], summary: 'Get all orders', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/orders': {
      get: { tags: ['Restaurant - Order'], summary: 'Get orders (paginated)', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/update_order_status': {
      put: {
        tags: ['Restaurant - Order'],
        summary: 'Update order status',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderStatus' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/orders/{orderId}/status': {
      put: {
        tags: ['Restaurant - Order'],
        summary: 'Update specific order status',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderStatus' } } } },
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/restaurant/today_stat': {
      get: { tags: ['Restaurant - Order'], summary: 'Get today\'s order stats', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },

    // ---- STATS ROUTES ----
    '/api/restaurant/daily_revenue': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get daily revenue', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/monthly_revenue': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get monthly revenue', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/top_selling_items': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get top selling items', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/category_wise_sell': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get category wise sales', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/last_two_week_revenue': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get last 2 weeks revenue', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/last_two_week_order_count': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get last 2 weeks order count', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
    '/api/restaurant/last_two_week_new_customer': {
      get: { tags: ['Restaurant - Stats'], summary: 'Get last 2 weeks new customers', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Success' } } },
    },
  },
};

export default restaurantDocs;
