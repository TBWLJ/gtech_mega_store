import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the database
connectDB().catch((err) => {
  console.error('Failed to connect to the database:', err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});