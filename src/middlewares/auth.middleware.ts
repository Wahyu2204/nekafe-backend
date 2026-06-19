import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ============================================================
// Interface untuk JWT Payload kita
// ============================================================
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// Extend Express Request agar bisa menyimpan data user
// ============================================================
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ============================================================
// Middleware: Autentikasi — Validasi JWT Token
// ============================================================
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Format token tidak valid.',
      });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'];

    if (!jwtSecret) {
      throw new Error('JWT_SECRET tidak ditemukan di file .env');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token sudah kedaluwarsa. Silakan login ulang.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
      return;
    }

    console.error('[AuthMiddleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat verifikasi token.',
    });
  }
};

// ============================================================
// Middleware: Otorisasi — Periksa Role User
// Gunakan setelah middleware `authenticate`.
// Contoh: router.get('/admin', authenticate, authorize('admin'), handler)
// ============================================================
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Autentikasi diperlukan.',
      });
      return;
    }

    // Normalisasi: bandingkan dalam lowercase
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Role '${req.user.role}' tidak memiliki izin untuk mengakses resource ini.`,
      });
      return;
    }

    next();
  };
};
