import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';

import userRoute from './routes/user.route.js';
import productRoute from './routes/product.route.js';
import reviewRoute from './routes/review.route.js';
import orderRoute from './routes/order.route.js';
import paymentRoute from './routes/payment.route.js';

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
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/orders', orderRoute);
app.use('/api/payments', paymentRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});