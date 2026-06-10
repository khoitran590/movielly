// Sentry must be initialized before any other module so it can hook into
// Node internals. app.js requires this file first.
require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: true,
  });
} else {
  console.warn('[Movielly] SENTRY_DSN not set — backend error reporting disabled');
}

module.exports = Sentry;
