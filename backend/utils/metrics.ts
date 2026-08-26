import client from 'prom-client';

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mealmate_backend',
});

// Enable the collection of default metrics (CPU, memory, garbage collection, event loop, etc.)
client.collectDefaultMetrics({ register });

// --- Custom Metrics ---

// 1. Histogram for HTTP Request duration
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Buckets for response time in seconds
});

// 2. Counter for total HTTP Requests
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Express middleware to collect metrics for all incoming requests
export const metricsMiddleware = (
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) => {
  const startEpoch = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startEpoch) / 1000;

    // Construct full route path (e.g., /api/customer/order or /api/customer/order/:id)
    let route = req.baseUrl
      ? `${req.baseUrl}${req.route?.path && req.route.path !== '/' ? req.route.path : ''}`
      : req.route?.path || req.originalUrl?.split('?')[0];
    if (!route || route === '') {
      route = req.originalUrl?.split('?')[0] || '/';
    }

    // Update histogram
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    // Update counter
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });

  next();
};
