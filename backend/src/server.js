import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/database.js';
import { errorHandler } from './middleware/auth.js';
import { auditLogger } from './middleware/auditLogger.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import columnRoutes from './routes/columns.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    // Allow the configured FRONTEND_URL
    const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (origin === allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
// Automatinis audit hook po CRUD (jei user nustatytas)
app.use(auditLogger);

// Initialize database
await initDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/columns', columnRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveris veikia' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveris paleistas http://0.0.0.0:${PORT}`);
  console.log(`📊 API dokumentacija: http://0.0.0.0:${PORT}/api`);
});
