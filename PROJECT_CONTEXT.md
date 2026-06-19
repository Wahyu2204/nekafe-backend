# Project Context: NeKafe (Backend API)

Anda adalah seorang Senior Backend Engineer dan Code Agent ahli. Dokumen ini berisi seluruh informasi arsitektur, spesifikasi database, stack teknologi, dan aturan penulisan kode untuk aplikasi **NeKafe** (Sistem Manajemen & Kasir Kedai Kopi). 

Harap patuhi dokumen ini sebagai satu-satunya kebenaran (Single Source of Truth) saat menulis, merefaktorisasi, atau menambah kode baru.

---

## 1. Stack Teknologi & Environment
* **Runtime:** Node.js v22+
* **Language:** TypeScript (Strict Mode)
* **Framework:** Express.js
* **Module System:** ES Modules (`"type": "module"` di package.json, gunakan `.js` saat mengimpor file lokal)
* **Execution/Dev Tool:** `tsx watch` (untuk menjalankan file .ts tanpa compile manual)
* **ORM:** Prisma v7
* **Database:** PostgreSQL (Hosted via Neon.tech Serverless Cloud)
* **Database Driver/Adapter:** `@neondatabase/serverless` & `@prisma/adapter-neon` via WebSockets

---

## 2. Struktur Folder Projek Saat Ini
Pastikan kode baru diletakkan pada folder yang sesuai dengan struktur berikut:
```text
backend-api/
├── prisma/
│   └── schema.prisma        # Skema tabel database (Sudah sync ke Cloud)
├── src/
│   ├── db.ts                # Inisialisasi PrismaClient + Neon Adapter (Global Instance)
│   └── server.ts            # Entry point utama Server Express.js
├── .env                     # Environment variables (DATABASE_URL, JWT_SECRET, dll)
├── prisma.config.ts         # Konfigurasi Prisma v7
├── package.json
└── tsconfig.json            # Konfigurasi TypeScript (verbatimModuleSyntax aktif)