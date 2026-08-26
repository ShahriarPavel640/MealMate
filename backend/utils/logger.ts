import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

// Create a Winston logger that outputs structured JSON.
// This JSON will be picked up by Promtail and sent to Loki.
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Ensure stack traces are included for errors
    timestamp(),
    json() // Output as pure JSON string on each line
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
