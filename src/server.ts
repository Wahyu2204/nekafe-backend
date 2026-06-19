import express, { type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { prisma } from './db.js'; // Perhatikan .js di ujung karena kita pakai ES Modules
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env['PORT'] || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Biar server bisa membaca body request format JSON

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Route Test Paling Mendasar
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Welcome to NeKafe API! Server runs smoothly. ☕" });
});

// Route Test Cek Koneksi Database (Mengambil data users yang masih kosong)
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ 
      success: true, 
      message: "Koneksi ke Neon.tech sukses!", 
      data: users 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Koneksi DB Gagal", 
      error: error instanceof Error ? error.message : error 
    });
  }
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server NeKafe siap meluncur di http://localhost:${PORT}`);
});