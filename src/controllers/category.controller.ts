import type { Request, Response } from 'express';
import { prisma } from '../db.js';

// ============================================================
// POST /api/categories — Tambah kategori baru
// ============================================================
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama } = req.body as { nama?: string };

    if (!nama || nama.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Field nama wajib diisi.',
      });
      return;
    }

    // Cek duplikasi nama kategori (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: { nama: { equals: nama.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Kategori "${nama.trim()}" sudah ada.`,
      });
      return;
    }

    const category = await prisma.category.create({
      data: { nama: nama.trim() },
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan.',
      data: category,
    });
  } catch (error) {
    console.error('[CategoryController] Create Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menambah kategori.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// GET /api/categories — Ambil semua kategori
// ============================================================
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { nama: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: 'Data kategori berhasil diambil.',
      data: categories,
    });
  } catch (error) {
    console.error('[CategoryController] GetAll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil data kategori.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// PUT /api/categories/:id — Edit kategori
// ============================================================
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const { nama } = req.body as { nama?: string };

    if (!nama || nama.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Field nama wajib diisi.',
      });
      return;
    }

    // Cek apakah kategori ada
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan.',
      });
      return;
    }

    // Cek duplikasi nama (kecuali dirinya sendiri)
    const duplicate = await prisma.category.findFirst({
      where: {
        nama: { equals: nama.trim(), mode: 'insensitive' },
        id: { not: id },
      },
    });

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: `Kategori "${nama.trim()}" sudah ada.`,
      });
      return;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { nama: nama.trim() },
    });

    res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    console.error('[CategoryController] Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memperbarui kategori.',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ============================================================
// DELETE /api/categories/:id — Hapus kategori
// ============================================================
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params ['id'] as string;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Kategori tidak ditemukan.',
      });
      return;
    }

    // Guard: jangan hapus kategori yang masih punya produk
    if (category._count.products > 0) {
      res.status(400).json({
        success: false,
        message: `Tidak bisa menghapus kategori "${category.nama}" karena masih memiliki ${category._count.products} produk. Pindahkan atau hapus produknya terlebih dahulu.`,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: `Kategori "${category.nama}" berhasil dihapus.`,
      data: null,
    });
  } catch (error) {
    console.error('[CategoryController] Delete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menghapus kategori.',
      error: error instanceof Error ? error.message : error,
    });
  }
};
