// Structured application logger. Silent under tests so `node --test` output
// stays clean; level otherwise configurable via LOG_LEVEL (default info).
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
});

module.exports = logger;
