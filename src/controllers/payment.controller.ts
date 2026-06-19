import type { Request, Response } from 'express';
import { prisma } from '../db.js';

// ============================================================
// Interface untuk body request payment
// ============================================================
interface CreatePaymentBody {
  orderId?: string;
  metode?: string;
}

// Metode pembayaran yang diizinkan
const ALLOWED_METHODS = ['QRIS', 'Cash', 'Debit'] as const;

// ============================================================
// POST /api/payments — Proses pembayaran untuk sebuah order
// ============================================================
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, metode } = req.body as CreatePaymentBody;

    // ---------- Validasi input ----------
    if (!orderId || !metode) {
      res.status(400).json({
        success: false,
        message: 'Field orderId dan metode wajib diisi.',
      });
      return;
    }

    // Validasi metode pembayaran
    if (!ALLOWED_METHODS.includes(metode as typeof ALLOWED_METHODS[number])) {
      res.status(400).json({
        success: false,
        message: `Metode pembayaran tidak valid. Gunakan salah satu dari: ${ALLOWED_METHODS.join(', ')}.`,
      });
      return;
    }

    // ---------- Cek apakah order ada ----------
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan.',
      });
      return;
    }

    // ---------- Cek apakah sudah pernah dibayar ----------
    if (order.payment && order.payment.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Order ini sudah dibayar. Tidak bisa melakukan pembayaran ganda.',
      });
      return;
    }

    if (order.status === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Order ini sudah selesai dan tidak bisa dibayar ulang.',
      });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Order ini sudah dibatalkan dan tidak bisa dibayar.',
      });
      return;
    }

    // ==========================================================
    // Prisma Interactive Transaction
    // 1. Buat record Payment
    // 2. Update status Order menjadi 'completed'
    // ==========================================================
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Buat data Payment
      const newPayment = await tx.payment.create({
        data: {
          orderId,
          metode,
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // 2. Update status Order
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'completed' },
      });

      return newPayment;
    });

    // Ambil data lengkap untuk response
    const completedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: { select: { id: true, nama: true, harga: true } } },
        },
        user: { select: { id: true, nama: true, email: true, role: true } },
        table: true,
        payment: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Pembayaran berhasil via ${metode}. Transaksi selesai! ☕`,
      data: completedOrder,
    });
  } catch (error) {
    console.error('[PaymentController] Create Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses pembayaran.',
      error: error instanceof Error ? error.message : error,
    });
  }
};
