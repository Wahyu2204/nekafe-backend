import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';

const router = Router();

// Semua route kategori memerlukan autentikasi
router.use(authenticate);

// GET  /api/categories — Semua role bisa mengakses
router.get('/', authorize('admin', 'manager', 'kasir'), getAllCategories);

// POST /api/categories — Hanya ADMIN & MANAGER
router.post('/', authorize('admin', 'manager'), createCategory);

// PUT  /api/categories/:id — Hanya ADMIN & MANAGER
router.put('/:id', authorize('admin', 'manager'), updateCategory);

// DELETE /api/categories/:id — Hanya ADMIN & MANAGER
router.delete('/:id', authorize('admin', 'manager'), deleteCategory);

export default router;
