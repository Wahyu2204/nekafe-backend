import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

// ============================================================
// POST /api/auth/register — Mendaftarkan user baru
// ============================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, email, password, role } = req.body as {
      nama?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // ---------- Validasi input ----------
    if (!nama || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Field nama, email, dan password wajib diisi.',
      });
      return;
    }

    // ---------- Cek apakah email sudah terdaftar ----------
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain.',
      });
      return;
    }

    // ---------- Hash password ----------
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ---------- Validasi role (opsional, default: kasir) ----------
    const allowedRoles = ['admin', 'manager', 'kasir'];
    const userRole = role && allowedRoles.includes(role.toLowerCase())
      ? role.toLowerCase()
      : 'kasir';

    // ---------- Simpan user ke database ----------
    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di NeKafe. ☕',
      data: newUser,
    });
  } catch (error) {
    console.error('[AuthController] Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat registrasi.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// POST /api/auth/login — Login user & generate JWT
// ============================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    // ---------- Validasi input ----------
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Field email dan password wajib diisi.',
      });
      return;
    }

    // ---------- Cari user berdasarkan email ----------
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
      return;
    }

    // ---------- Bandingkan password ----------
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
      return;
    }

    // ---------- Generate JWT Token ----------
    const jwtSecret = process.env['JWT_SECRET'];

    if (!jwtSecret) {
      throw new Error('JWT_SECRET tidak ditemukan di file .env');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    res.status(200).json({
      success: true,
      message: 'Login berhasil! ☕',
      data: {
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('[AuthController] Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.',
      error: error instanceof Error ? error.message : error,
    });
  }
};
