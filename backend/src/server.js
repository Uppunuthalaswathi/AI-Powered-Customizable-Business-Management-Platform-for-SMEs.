
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import app from './app.js';
import { connectDatabase } from './config/db.js';
import Product from './models/Product.js';

// Load environment variables from backend/.env
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDir, '../.env');

dotenv.config({ path: envPath });

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const DEMO_BUSINESS_ID = process.env.DEMO_BUSINESS_ID;

let server;

async function startServer() {
  try {
    // Validate required environment variables
    if (!MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is missing. Check the backend/.env file.'
      );
    }

    if (!DEMO_BUSINESS_ID) {
      throw new Error(
        'DEMO_BUSINESS_ID is missing. Check the backend/.env file.'
      );
    }

    // Validate MongoDB ObjectId format
    if (!/^[a-fA-F0-9]{24}$/.test(DEMO_BUSINESS_ID)) {
      throw new Error(
        'DEMO_BUSINESS_ID must contain exactly 24 hexadecimal characters.'
      );
    }

    // Connect to MongoDB
    await connectDatabase(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // Initialize product model indexes
    await Product.init();
    console.log('Product model initialized successfully.');

    // Start Express server
    server = app.listen(PORT, () => {
      console.log(`API ready at http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      console.error('HTTP server error:', error.message);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  }
}

// Gracefully shut down the server
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.disconnect().catch((error) => {
    console.error('MongoDB disconnect error:', error.message);
  });

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start application
startServer();
