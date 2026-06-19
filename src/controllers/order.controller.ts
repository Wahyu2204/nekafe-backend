import type { Request, Response } from 'express';
import { prisma } from '../db.js';

// ============================================================
// Interface untuk body request create order
// ============================================================
interface OrderItemInput {
  productId: string;
  kuantitas: number;
}

interface CreateOrderBody {
  items?: OrderItemInput[];
  tableId?: string | null;
}

// ============================================================
// POST /api/orders — Buat transaksi baru (dengan Prisma Transaction)
// ============================================================
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Tidak dapat mengidentifikasi kasir. Silakan login ulang.',
      });
      return;
    }

    const { items, tableId } = req.body as CreateOrderBody;

    // ---------- Validasi input ----------
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Field items wajib diisi dan harus berupa array yang tidak kosong.',
      });
      return;
    }

    for (const item of items) {
      if (!item.productId || !item.kuantitas || item.kuantitas < 1) {
        res.status(400).json({
          success: false,
          message: 'Setiap item harus memiliki productId dan kuantitas minimal 1.',
        });
        return;
      }
    }

    // ---------- Validasi tableId jika dikirim ----------
    if (tableId) {
      const table = await prisma.table.findUnique({ where: { id: tableId } });

      if (!table) {
        res.status(404).json({
          success: false,
          message: `Meja dengan ID "${tableId}" tidak ditemukan.`,
        });
        return;
      }
    }

    // ==========================================================
    // Prisma Interactive Transaction
    // Semua operasi di bawah ini bersifat atomic (all-or-nothing)
    // ==========================================================
    const order = await prisma.$transaction(async (tx) => {
      let totalHarga = 0;

      // Struktur data untuk OrderItem yang akan di-insert
      const orderItemsData: {
        productId: string;
        qty: number;
        harga: number;
        subtotal: number;
      }[] = [];

      // ---------- Loop setiap item: validasi, hitung, potong stok ----------
      for (const item of items) {
        // 1. Cek apakah produk ada dan aktif
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produk dengan ID "${item.productId}" tidak ditemukan.`);
        }

        if (!product.status) {
          throw new Error(`Produk "${product.nama}" sedang tidak tersedia.`);
        }

        // 2. Cek ketersediaan stok
        if (product.stok < item.kuantitas) {
          throw new Error(
            `Stok produk "${product.nama}" tidak mencukupi. Tersedia: ${product.stok}, diminta: ${item.kuantitas}.`,
          );
        }

        // 3. Potong stok produk
        await tx.product.update({
          where: { id: item.productId },
          data: { stok: { decrement: item.kuantitas } },
        });

        // 4. Hitung subtotal dan kumpulkan data
        const subtotal = product.harga * item.kuantitas;
        totalHarga += subtotal;

        orderItemsData.push({
          productId: item.productId,
          qty: item.kuantitas,
          harga: product.harga,
          subtotal,
        });
      }

      // ---------- Simpan Order induk + OrderItems sekaligus ----------
      const newOrder = await tx.order.create({
        data: {
          userId,
          tableId: tableId ?? null,
          totalHarga,
          status: 'pending',
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: { product: { select: { id: true, nama: true, harga: true } } },
          },
          user: { select: { id: true, nama: true, email: true, role: true } },
          table: true,
        },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dibuat. ☕',
      data: order,
    });
  } catch (error) {
    console.error('[OrderController] Create Error:', error);

    // Error dari validasi bisnis di dalam transaction (throw new Error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    const isBusinessError = error instanceof Error && !message.includes('prisma');

    res.status(isBusinessError ? 400 : 500).json({
      success: false,
      message,
    });
  }
};

// ============================================================
// GET /api/orders — Ambil semua riwayat transaksi
// ADMIN & MANAGER: lihat semua | KASIR: hanya miliknya sendiri
// ============================================================
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    const userId = req.user?.userId;

    // Filter: kasir hanya bisa melihat transaksinya sendiri
    const whereClause = userRole === 'kasir' ? { userId } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: { product: { select: { id: true, nama: true, harga: true } } },
        },
        user: { select: { id: true, nama: true, email: true, role: true } },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Data transaksi berhasil diambil.',
      data: orders,
    });
  } catch (error) {
    console.error('[OrderController] GetAll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil data transaksi.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// GET /api/orders/:id — Detail satu transaksi
// ============================================================
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const userRole = req.user?.role?.toLowerCase();
    const userId = req.user?.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { product: { select: { id: true, nama: true, harga: true, gambar: true } } },
        },
        user: { select: { id: true, nama: true, email: true, role: true } },
        table: true,
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
      return;
    }

    // Guard: kasir hanya bisa lihat transaksi miliknya sendiri
    if (userRole === 'kasir' && order.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat transaksi ini.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Detail transaksi berhasil diambil.',
      data: order,
    });
  } catch (error) {
    console.error('[OrderController] GetById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil detail transaksi.',
      error: error instanceof Error ? error.message : error,
    });
  }
};
