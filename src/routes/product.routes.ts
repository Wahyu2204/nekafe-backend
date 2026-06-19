import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';

const router = Router();

// Semua route produk memerlukan autentikasi
router.use(authenticate);

// GET  /api/products     — Semua role bisa mengakses
router.get('/', authorize('admin', 'manager', 'kasir'), getAllProducts);

// GET  /api/products/:id — Semua role bisa mengakses
router.get('/:id', authorize('admin', 'manager', 'kasir'), getProductById);

// POST /api/products     — Hanya ADMIN & MANAGER
router.post('/', authorize('admin', 'manager'), createProduct);

// PUT  /api/products/:id — Hanya ADMIN & MANAGER
router.put('/:id', authorize('admin', 'manager'), updateProduct);

// DELETE /api/products/:id — Hanya ADMIN & MANAGER
router.delete('/:id', authorize('admin', 'manager'), deleteProduct);

export default router;
