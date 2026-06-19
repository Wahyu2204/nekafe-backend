import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  createOrder,
  getAllOrders,
  getOrderById,
} from '../controllers/order.controller.js';

const router = Router();

// Semua route order memerlukan autentikasi
router.use(authenticate);

// POST /api/orders     — Buat transaksi baru (ADMIN, MANAGER, KASIR)
router.post('/', authorize('admin', 'manager', 'kasir'), createOrder);

// GET  /api/orders     — Riwayat transaksi (ADMIN/MANAGER: semua, KASIR: milik sendiri)
router.get('/', authorize('admin', 'manager', 'kasir'), getAllOrders);

// GET  /api/orders/:id — Detail satu transaksi
router.get('/:id', authorize('admin', 'manager', 'kasir'), getOrderById);

export default router;
