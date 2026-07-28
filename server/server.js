import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import baseRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/', baseRoutes);

// Centralized Error Handling Middlewares (must be registered after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Initializes database connection and starts the HTTP server.
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    await connectDB();

    // 2. Start the Express server
    app.listen(PORT, () => {
      console.log(`[Server] Server Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error(`[Server] Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
