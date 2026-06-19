import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/register — Daftarkan user baru
router.post('/register', register);

// POST /api/auth/login — Login & dapatkan JWT token
router.post('/login', login);

export default router;
