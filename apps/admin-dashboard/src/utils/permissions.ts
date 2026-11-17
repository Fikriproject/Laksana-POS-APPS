/**
 * Definisi Hak Akses Granular (Granular Permissions) Laksana POS
 * 30 Toggle Izin Fitur Terpecah Rapi Per Modul
 */

export interface PermissionDefinition {
    key: string;
    label: string;
    description: string;
    icon: string;
    warning?: string; // Catatan keamanan khusus jika sensitif
}

export interface PermissionCategory {
    id: string;
    title: string;
    icon: string;
    description: string;
    permissions: PermissionDefinition[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
    {
        id: 'products',
        title: 'Manajemen Produk & Katalog',
        icon: 'inventory_2',
        description: 'Pengaturan akses melihat, merubah harga, update stok, dan hapus master barang.',
        permissions: [
            {
                key: 'products.view',
                label: 'Lihat Daftar Produk',
                description: 'Dapat membuka menu produk dan mencari data barang.',
                icon: 'visibility',
            },
            {
                key: 'products.view_cost',
                label: 'Lihat Harga Beli (Modal Kulakan)',
                description: 'Dapat melihat harga modal rahasia toko. Jika dimatikan, harga modal disembunyikan total di layar dan API.',
                icon: 'visibility_off',
                warning: 'Rahasia Toko: Matikan untuk kasir agar modal tidak bocor.',
            },
            {
                key: 'products.update_stock',
                label: 'Input & Update Jumlah Stok',
                description: 'Dapat mengubah dan memperbarui jumlah fisik stok barang di toko.',
                icon: 'edit_square',
            },
            {
                key: 'products.edit_price',
                label: 'Ubah Harga Jual Barang',
                description: 'Dapat mengubah harga eceran, harga grosir, dan harga reseller.',
                icon: 'price_change',
            },
            {
                key: 'products.create',
                label: 'Tambah Produk Baru',
                description: 'Dapat menambahkan barang baru ke dalam database toko.',
                icon: 'add_circle',
            },
            {
                key: 'products.edit',
                label: 'Edit Data Master Produk',
                description: 'Dapat mengedit nama barang, SKU, barcode, dan kategori.',
                icon: 'edit_note',
            },
            {
                key: 'products.delete',
                label: 'Hapus Produk',
                description: 'Dapat menghapus barang dari database toko.',
                icon: 'delete_forever',
                warning: 'Tindakan Berisiko: Hapus permanen data barang.',
            },
            {
                key: 'products.import_export',
                label: 'Import Excel & Ekspor Data',
                description: 'Dapat mengunggah file Excel produk massal dan mengunduh database.',
                icon: 'file_upload',
            },
        ],
    },
    {
        id: 'pos',
        title: 'Kasir & Transaksi Penjualan (POS)',
        icon: 'point_of_sale',
        description: 'Kontrol fitur saat kasir melayani transaksi pembayaran pembeli.',
        permissions: [
            {
                key: 'pos.access',
                label: 'Buka Aplikasi Kasir (POS)',
                description: 'Dapat mengakses menu kasir untuk scan barcode dan terima pembayaran.',
                icon: 'storefront',
            },
            {
                key: 'pos.discount',
                label: 'Beri Diskon Manual / Potongan',
                description: 'Dapat memasukkan diskon rupiah atau persen secara manual pada transaksi.',
                icon: 'percent',
            },
            {
                key: 'pos.change_price',
                label: 'Ubah Harga Langsung di Keranjang',
                description: 'Dapat menimpa harga jual barang sewaktu-waktu di keranjang belanja kasir.',
                icon: 'sell',
            },
            {
                key: 'pos.custom_item',
                label: 'Input Barang Manual (Non-Database)',
                description: 'Dapat memasukkan item cepat yang belum terdaftar di database.',
                icon: 'post_add',
            },
            {
                key: 'pos.void_item',
                label: 'Batalkan / Hapus Item Belanja',
                description: 'Dapat membatalkan atau menghapus item yang sudah masuk keranjang kasir.',
                icon: 'remove_shopping_cart',
            },
            {
                key: 'pos.reprint',
                label: 'Cetak Ulang Struk Lama',
                description: 'Dapat mencetak kembali struk pembayaran transaksi yang sudah selesai.',
                icon: 'receipt',
            },
        ],
    },
    {
        id: 'settlement',
        title: 'Rekap Harian & Tutup Buku Shift',
        icon: 'receipt_long',
        description: 'Pengawasan rekonsiliasi uang fisik kasir, tutup buku, dan laba harian.',
        permissions: [
            {
                key: 'settlement.view',
                label: 'Lihat Menu Rekap Harian',
                description: 'Dapat membuka halaman Rekap Harian & ringkasan penjualan hari ini.',
                icon: 'calendar_month',
            },
            {
                key: 'settlement.view_profit',
                label: 'Lihat Nominal Laba Bersih Toko',
                description: 'Melihat kartu hijau laba bersih ril yang masuk kantong pemilik toko.',
                icon: 'trending_up',
                warning: 'Rahasia Toko: Menampilkan keuntungan bersih toko.',
            },
            {
                key: 'settlement.view_cash',
                label: 'Lihat Rekonsiliasi Kas Laci Kasir',
                description: 'Melihat saldo modal awal kasir dan uang sistem yang harus ada di laci.',
                icon: 'payments',
            },
            {
                key: 'settlement.close_shift',
                label: 'Tutup Shift Kasir (Z-Report)',
                description: 'Dapat melakukan tutup buku harian, hitung kas fisik, dan cetak Z-Report.',
                icon: 'lock_clock',
            },
        ],
    },
    {
        id: 'reports',
        title: 'Laporan Finansial & Pengeluaran Toko',
        icon: 'bar_chart',
        description: 'Akses statistik penjualan, riwayat biaya operasional, dan laba rugi.',
        permissions: [
            {
                key: 'reports.view',
                label: 'Akses Halaman Laporan & Analisis',
                description: 'Melihat statistik grafik tren penjualan dan produk terlaris.',
                icon: 'analytics',
            },
            {
                key: 'reports.view_profit',
                label: 'Lihat Margin & Laba pada Laporan',
                description: 'Melihat rincian keuntungan kotor dan keuntungan bersih dalam grafik.',
                icon: 'monitoring',
                warning: 'Rahasia Toko: Menampilkan nominal keuntungan pemilik.',
            },
            {
                key: 'reports.export',
                label: 'Ekspor File Laporan (CSV / Excel)',
                description: 'Dapat mengunduh arsip rekapan penjualan ke laptop/HP.',
                icon: 'download',
            },
            {
                key: 'expenses.view',
                label: 'Lihat Daftar Pengeluaran Kas Toko',
                description: 'Melihat catatan biaya operasional, listrik, bensin, dan uang makan toko.',
                icon: 'account_balance_wallet',
            },
            {
                key: 'expenses.create',
                label: 'Catat Pengeluaran Uang Kas',
                description: 'Dapat menginput kas keluar / pengeluaran biaya harian toko.',
                icon: 'receipt_long',
            },
        ],
    },
    {
        id: 'inventory',
        title: 'Inventaris & Log Mutasi Stok',
        icon: 'warehouse',
        description: 'Pelacakan kartu stok, log barang masuk keluar, dan data supplier.',
        permissions: [
            {
                key: 'inventory.view',
                label: 'Lihat Riwayat & Log Mutasi Stok',
                description: 'Dapat membuka halaman riwayat keluar-masuk barang toko.',
                icon: 'history',
            },
            {
                key: 'inventory.adjust',
                label: 'Stock Opname (Penyesuaian Stok)',
                description: 'Dapat melakukan opname fisik dan penyesuaian selisih stok.',
                icon: 'tune',
            },
            {
                key: 'inventory.supplier',
                label: 'Kelola Data Supplier & Pemasok',
                description: 'Dapat melihat daftar kontak supplier tempat kulakan toko.',
                icon: 'local_shipping',
            },
        ],
    },
    {
        id: 'settings',
        title: 'Pengaturan & Alat Pendukung',
        icon: 'settings',
        description: 'Akses cetak barcode label, printer thermal, dan kelola karyawan.',
        permissions: [
            {
                key: 'barcode.print',
                label: 'Cetak Label Barcode',
                description: 'Dapat mengakses menu pembuat barcode stiker/label barang.',
                icon: 'qr_code_2',
            },
            {
                key: 'settings.printer',
                label: 'Pengaturan Printer Struk & Kertas',
                description: 'Dapat mengatur koneksi printer Bluetooth, USB, dan layout kertas.',
                icon: 'print',
            },
            {
                key: 'users.manage',
                label: 'Kelola Karyawan & Atur Toggle Izin',
                description: 'Dapat menambah akun karyawan dan mengaktifkan/mematikan toggle akses ini.',
                icon: 'admin_panel_settings',
                warning: 'Hanya untuk Pemilik / Manajer Utama.',
            },
            {
                key: 'settings.store',
                label: 'Pengaturan Profil & Nama Toko',
                description: 'Dapat merubah nama toko, logo, alamat, dan nomor telepon di struk.',
                icon: 'store',
            },
        ],
    },
];

// Kumpulan seluruh key permission yang tersedia
export const ALL_PERMISSION_KEYS: string[] = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.key));

// Preset Pintar 1: Kasir Standar (Hanya melayani pembeli di kasir)
export const PRESET_CASHIER_STANDARD: Record<string, boolean> = {
    'pos.access': true,
    'pos.void_item': true,
    'pos.reprint': true,
    'settings.printer': true,
};

// Preset Pintar 2: Kasir + Input Stok Toko (Sesuai Kebutuhan User: Kasir bantu stok fisik, modal toko TERKUNCI)
export const PRESET_CASHIER_STOCK_HELPER: Record<string, boolean> = {
    'pos.access': true,
    'pos.void_item': true,
    'pos.reprint': true,
    'products.view': true,
    'products.view_cost': false, // RAHASIA: Modal Kulakan Tidak Boleh Dilihat Kasir
    'products.update_stock': true, // Karyawan bisa update jumlah fisik barang
    'inventory.view': true,
    'inventory.adjust': true,
    'barcode.print': true,
    'settings.printer': true,
};

// Preset Pintar 3: Manajer Operasional Toko (Hampir semua akses kecuali kelola hak akses admin)
export const PRESET_MANAGER: Record<string, boolean> = ALL_PERMISSION_KEYS.reduce((acc, key) => {
    if (key !== 'users.manage') {
        acc[key] = true;
    }
    return acc;
}, {} as Record<string, boolean>);
