import type { Request, Response } from 'express';
import { prisma } from '../db.js';

// ============================================================
// Interface body request untuk Product
// ============================================================
interface ProductBody {
  nama?: string;
  deskripsi?: string;
  harga?: number;
  stok?: number;
  gambar?: string;
  status?: boolean;
  categoryId?: string | null;
}

// ============================================================
// POST /api/products — Tambah produk/menu baru
// ============================================================
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, deskripsi, harga, stok, gambar, status, categoryId } = req.body as ProductBody;

    // ---------- Validasi wajib ----------
    if (!nama || nama.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Field nama wajib diisi.',
      });
      return;
    }

    if (harga === undefined || harga === null || harga < 0) {
      res.status(400).json({
        success: false,
        message: 'Field harga wajib diisi dan tidak boleh negatif.',
      });
      return;
    }

    // ---------- Validasi categoryId jika disertakan ----------
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });

      if (!category) {
        res.status(404).json({
          success: false,
          message: `Kategori dengan ID "${categoryId}" tidak ditemukan.`,
        });
        return;
      }
    }

    const product = await prisma.product.create({
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() ?? null,
        harga,
        stok: stok ?? 0,
        gambar: gambar?.trim() ?? null,
        status: status ?? true,
        categoryId: categoryId ?? null,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: product,
    });
  } catch (error) {
    console.error('[ProductController] Create Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menambah produk.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// GET /api/products — Ambil semua produk beserta kategorinya
// ============================================================
export const getAllProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { nama: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: 'Data produk berhasil diambil.',
      data: products,
    });
  } catch (error) {
    console.error('[ProductController] GetAll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil data produk.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// GET /api/products/:id — Detail satu produk
// ============================================================
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params ['id'] as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Detail produk berhasil diambil.',
      data: product,
    });
  } catch (error) {
    console.error('[ProductController] GetById Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil detail produk.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// PUT /api/products/:id — Update produk
// ============================================================
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params ['id'] as string;
    const { nama, deskripsi, harga, stok, gambar, status, categoryId } = req.body as ProductBody;

    // ---------- Cek apakah produk ada ----------
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
      return;
    }

    // ---------- Validasi nama jika dikirim ----------
    if (nama !== undefined && nama.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Field nama tidak boleh kosong.',
      });
      return;
    }

    // ---------- Validasi harga jika dikirim ----------
    if (harga !== undefined && harga < 0) {
      res.status(400).json({
        success: false,
        message: 'Harga tidak boleh negatif.',
      });
      return;
    }

    // ---------- Validasi categoryId jika dikirim ----------
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });

      if (!category) {
        res.status(404).json({
          success: false,
          message: `Kategori dengan ID "${categoryId}" tidak ditemukan.`,
        });
        return;
      }
    }

    // ---------- Bangun data update (hanya field yang dikirim) ----------
    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData['nama'] = nama.trim();
    if (deskripsi !== undefined) updateData['deskripsi'] = deskripsi?.trim() ?? null;
    if (harga !== undefined) updateData['harga'] = harga;
    if (stok !== undefined) updateData['stok'] = stok;
    if (gambar !== undefined) updateData['gambar'] = gambar?.trim() ?? null;
    if (status !== undefined) updateData['status'] = status;
    if (categoryId !== undefined) updateData['categoryId'] = categoryId;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    console.error('[ProductController] Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memperbarui produk.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// DELETE /api/products/:id — Hapus produk
// ============================================================
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan.',
      });
      return;
    }

    // Guard: jangan hapus produk yang sudah pernah masuk order
    if (product._count.orderItems > 0) {
      res.status(400).json({
        success: false,
        message: `Tidak bisa menghapus produk "${product.nama}" karena sudah terkait dengan ${product._count.orderItems} item pesanan. Nonaktifkan produk ini sebagai gantinya.`,
      });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: `Produk "${product.nama}" berhasil dihapus.`,
      data: null,
    });
  } catch (error) {
    console.error('[ProductController] Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menghapus produk.',
      error: error instanceof Error ? error.message : error,
    });
  }
};
