require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const moviesRouter = require('./routes/movies');
const listsRouter = require('./routes/lists');

const app = express();

// Allow one or more comma-separated frontend origins (prod + previews).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl (no origin) and any configured origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // allow Vercel preview deployments if a *.vercel.app origin is configured
    if (allowedOrigins.some(o => o.endsWith('.vercel.app')) && origin.endsWith('.vercel.app')) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/movies', moviesRouter);
app.use('/api/lists', listsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
