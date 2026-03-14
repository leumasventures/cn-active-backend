// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import errorHandler from './middleware/errorHandler.js';
import { rateLimiters } from './middleware/ratelimit.js';
import apiRoutes from './routes/index.js';


const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// ── Allowed origins ───────────────────────────────────────────────
const allowedOrigins = [
  'https://cnjohnsonventures.com',
  'https://www.cnjohnsonventures.com',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS policy violation from origin: ${origin}`));
  }
};

// ── Socket.IO setup ───────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

// Socket.IO basic events
io.on('connection', (socket) => {
  console.log(`🔌 User connected → ${socket.id}`);

  socket.on('message', (data) => {
    io.emit('message', {
      ...data,
      receivedAt: new Date().toISOString(),
      socketId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected → ${socket.id}`);
  });
});

// ── Express middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ── Health / root endpoint ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'C.N. Johnson Ventures API v2.1',
    socket: 'enabled',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes with rate limiting ─────────────────────────────────
app.use('/api/auth', rateLimiters.auth);  // strict limiter for login only
app.use('/api', rateLimiters.api);        // generous + skips authenticated
app.use('/api', apiRoutes);

// ── Catch-all 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready  → same port`);
});