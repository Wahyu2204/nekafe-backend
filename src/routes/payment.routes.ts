import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { createPayment } from '../controllers/payment.controller.js';

const router = Router();

// Semua route payment memerlukan autentikasi
router.use(authenticate);

// POST /api/payments — Proses pembayaran order (ADMIN, MANAGER, KASIR)
router.post('/', authorize('admin', 'manager', 'kasir'), createPayment);

export default router;
