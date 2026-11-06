import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running.' }));
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
