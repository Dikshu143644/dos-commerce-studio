import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

// Socket.io for real-time order/stock events
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket: Socket) => {
  console.log(`⚡ Client connected to StockFlow Real-Time Gateway: ${socket.id}`);

  socket.on('join_branch', (branchId: string) => {
    socket.join(`branch_${branchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req: Request, expressRes: Response) => {
  expressRes.json({
    status: 'healthy',
    system: 'StockFlow CRM + ERP Enterprise Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Bootstrap
async function bootstrap() {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`🚀 StockFlow Enterprise Server is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    console.log(`📍 API Gateway: http://localhost:${env.PORT}/api`);
    console.log(`🩺 Health Endpoint: http://localhost:${env.PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Server Initialization Failure:', err);
  process.exit(1);
});

export { app, server, io };
