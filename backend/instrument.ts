import * as Sentry from '@sentry/node';
import env from '@/config/env.js';

Sentry.init({
  dsn:
    env.SENTRY_DSN ||
    'https://534fe3aadb5ae51c767ee7b9802464fc@o4511875651600384.ingest.de.sentry.io/4511875675062352',
  tracesSampleRate: 1.0,
});
