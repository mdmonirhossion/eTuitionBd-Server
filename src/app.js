import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tuitionRoutes from './routes/tuitionRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Allowed origins list
const allowedOrigins = [
  'https://etuitionbd-client.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Enable CORS with dynamic origin resolution (required when credentials: true)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is explicitly allowed, configured via env, or is a vercel deployment
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        (process.env.CLIENT_URL && process.env.CLIENT_URL.includes(origin))
      ) {
        return callback(null, true);
      }

      // Echo origin dynamically so credentials: true works seamlessly
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// JSON body parser
app.use(express.json());

// Ensure Database is connected for Serverless Functions (Vercel)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('Failed to connect DB in serverless middleware:', err);
    }
  }
  next();
});

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'eTuitionBd API Server is running smoothly ',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tuitions', tuitionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);

// Centralized Error Handler
app.use(errorHandler);

export default app;
