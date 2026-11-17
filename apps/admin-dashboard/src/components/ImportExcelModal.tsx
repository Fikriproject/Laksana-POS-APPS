import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatRupiah } from '../utils/format';

interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedProductRow {
    rawCode: string;
    finalSku: string;
    name: string;
    stock: number;
    purchasePrice: number;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleMinQty: number;
    resellerPrice: number;
    categoryName: string;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [importing, setImporting] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    // Pengaturan Rumus & Kode
    const [wholesalePercent, setWholesalePercent] = useState<number>(25);
    const [resellerPercent, setResellerPercent] = useState<number>(20);
    const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(12);
    const [codeFormat, setCodeFormat] = useState<'joined' | 'dashed'>('joined'); // joined: DMLKS001, dashed: DM-LKS-001
    const [prefixText, setPrefixText] = useState<string>('LKS');
    const [updateExisting, setUpdateExisting] = useState<boolean>(true);

    if (!isOpen) return null;

    // Bersihkan format uang (misal "Rp 15.000" -> 15000)
    const parseCurrency = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9]/g, '');
        return Number(cleaned) || 0;
    };

    // Bersihkan angka stok (mendukung format penjumlahan seperti "24 + 4 Pcs" atau "85+18")
    const parseStock = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return Math.floor(val);
        const s = String(val).trim();
        if (s.includes('+')) {
            const parts = s.split('+');
            let sum = 0;
            for (const p of parts) {
                const num = parseInt(p.replace(/[^0-9]/g, ''), 10) || 0;
                sum += num;
            }
            return sum;
        }
        const cleaned = s.replace(/[^0-9]/g, '');
        return parseInt(cleaned, 10) || 0;
    };

    // Helper untuk mengambil nilai kolom secara fleksibel, case-insensitive, dan mengabaikan spasi/simbol
    const getRowVal = (row: any, ...keys: string[]): any => {
        const rowKeys = Object.keys(row);
        for (const key of keys) {
            const targetClean = key.toLowerCase().replace(/[\s_-]+/g, '');
            const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_-]+/g, '') === targetClean);
            if (foundKey && row[foundKey] !== undefined && String(row[foundKey]).trim() !== '') {
                return row[foundKey];
            }
        }
        return '';
    };

    // Format SKU sesuai aturan pengguna: 2 digit kode asli + LKS + digit urutan
    const generateFormattedSku = (
        rawCode: string,
        index: number,
        totalItems: number,
        format: 'joined' | 'dashed',
        middleText: string
    ): string => {
        // Ambil 2 digit pertama dari kode excel (huruf besar)
        let cleanedCode = String(rawCode || '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (cleanedCode.length === 0) {
            cleanedCode = 'PR';
        } else if (cleanedCode.length === 1) {
            cleanedCode = cleanedCode + '0';
        } else {
            cleanedCode = cleanedCode.substring(0, 2);
        }

        // Tentukan jumlah digit padding (minimal 3 digit, misal 001, atau 4 digit jika > 999)
        const padLength = totalItems > 999 ? 4 : 3;
        const orderNumber = String(index + 1).padStart(padLength, '0');

        const mid = middleText.trim().toUpperCase();

        if (format === 'dashed') {
            return `${cleanedCode}-${mid}-${orderNumber}`;
        }
        return `${cleanedCode}${mid}${orderNumber}`;
    };

    // Proses pembacaan file Excel / CSV
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setFileName(selectedFile.name);
        setLoading(true);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Baca SEMUA sheet yang ada di file Excel/CSV
            let rawJson: any[] = [];
            const sheetCount = workbook.SheetNames.length;
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const sheetRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                rawJson = rawJson.concat(sheetRows);
            });

            if (rawJson.length === 0) {
                toast.error('File Excel kosong atau tidak terbaca.');
                setLoading(false);
                return;
            }

            // Normalisasi baris
            recalculateRows(rawJson, wholesalePercent, resellerPercent, wholesaleMinQty, codeFormat, prefixText, sheetCount);
        } catch (err: any) {
            console.error('Error parsing Excel:', err);
            toast.error('Gagal membaca file Excel. Pastikan format file valid (.xlsx, .xls, .csv)');
        } finally {
            setLoading(false);
        }
    };

    // Menghitung ulang baris ketika setting berubah
    const recalculateRows = (
        rawRows: any[],
        wsPct: number,
        rsPct: number,
        minQty: number,
        fmt: 'joined' | 'dashed',
        pfx: string,
        sheetCount: number = 1
    ) => {
        const total = rawRows.length;
        const results: ParsedProductRow[] = [];

        rawRows.forEach((row, idx) => {
            // Deteksi kolom secara fleksibel & case-insensitive (huruf besar/kecil/spasi/garis bawah diabaikan)
            const name = String(getRowVal(row, 'nama_barang', 'nama_produk', 'nama', 'name', 'barang', 'item')).trim();
            if (!name) return; // Lewati baris kosong atau baris pembatas

            const stock = parseStock(getRowVal(row, 'stok', 'stock', 'qty', 'jumlah'));
            const retailPrice = parseCurrency(getRowVal(row, 'harga_jual', 'harga_ecer', 'ecer', 'price', 'jual'));
            const purchasePrice = parseCurrency(getRowVal(row, 'harga_beli', 'modal', 'purchase_price', 'beli', 'pokok'));
            const rawCode = String(getRowVal(row, 'kode', 'code', 'sku', 'barcode')).trim();
            const categoryName = String(getRowVal(row, 'kategori', 'category', 'kelompok') || 'Umum').trim();

            // Hitung harga grosir: Modal + wsPct (pembulatan ratusan terdekat)
            let wsPrice = purchasePrice > 0
                ? Math.round((purchasePrice * (1 + wsPct / 100)) / 100) * 100
                : (retailPrice > 0 ? Math.round((retailPrice * 0.9) / 100) * 100 : 0);

            // Hitung harga reseller: Modal + rsPct (pembulatan ratusan terdekat)
            let rsPrice = purchasePrice > 0
                ? Math.round((purchasePrice * (1 + rsPct / 100)) / 100) * 100
                : (retailPrice > 0 ? Math.round((retailPrice * 0.95) / 100) * 100 : 0);

            // Format SKU
            const finalSku = generateFormattedSku(rawCode, idx, total, fmt, pfx);

            results.push({
                rawCode,
                finalSku,
                name,
                stock,
                purchasePrice,
                retailPrice,
                wholesalePrice: wsPrice,
                wholesaleMinQty: minQty,
                resellerPrice: rsPrice,
                categoryName
            });
        });

        setParsedRows(results);
        if (results.length > 0) {
            const sheetMsg = sheetCount > 1 ? ` dari ${sheetCount} Sheet` : '';
            toast.success(`${results.length} data produk${sheetMsg} siap di-import!`, { id: 'excel-parsed' });
        }
    };

    // Handle saat parameter setting diubah oleh pengguna
    const handleSettingChange = (
        newWs: number,
        newRs: number,
        newQty: number,
        newFmt: 'joined' | 'dashed',
        newPfx: string
    ) => {
        setWholesalePercent(newWs);
        setResellerPercent(newRs);
        setWholesaleMinQty(newQty);
        setCodeFormat(newFmt);
        setPrefixText(newPfx);

        if (parsedRows.length > 0) {
            const updated = parsedRows.map((row, idx) => {
                const wsPrice = row.purchasePrice > 0
                    ? Math.round((row.purchasePrice * (1 + newWs / 100)) / 100) * 100
                    : (row.retailPrice > 0 ? Math.round((row.retailPrice * 0.9) / 100) * 100 : 0);

                const rsPrice = row.purchasePrice > 0
                    ? Math.round((row.purchasePrice * (1 + newRs / 100)) / 100) * 100
                    : (row.retailPrice > 0 ? Math.round((row.retailPrice * 0.95) / 100) * 100 : 0);

                const finalSku = generateFormattedSku(row.rawCode, idx, parsedRows.length, newFmt, newPfx);

                return {
                    ...row,
                    finalSku,
                    wholesalePrice: wsPrice,
                    wholesaleMinQty: newQty,
                    resellerPrice: rsPrice
                };
            });
            setParsedRows(updated);
        }
    };

    // Kirim data batch ke backend
    const handleStartImport = async () => {
        if (parsedRows.length === 0) {
            toast.error('Belum ada data produk yang dimuat.');
            return;
        }

        setImporting(true);
        setProgress(10);

        try {
            // Buat payload produk yang bersih untuk backend
            const productsPayload = parsedRows.map(r => ({
                name: r.name,
                sku: r.finalSku,
                barcode: r.finalSku,
                stock_quantity: r.stock,
                price: r.retailPrice,
                purchase_price: r.purchasePrice,
                wholesale_price: r.wholesalePrice,
                wholesale_min_qty: r.wholesaleMinQty,
                reseller_price: r.resellerPrice,
                category_name: r.categoryName,
                base_unit: 'pcs'
            }));

            // Kirim dalam chunk 250 produk per request agar stabil dan cepat
            const chunkSize = 250;
            const totalChunks = Math.ceil(productsPayload.length / chunkSize);
            let totalInserted = 0;
            let totalUpdated = 0;
            let totalCategories = 0;

            for (let i = 0; i < totalChunks; i++) {
                const chunk = productsPayload.slice(i * chunkSize, (i + 1) * chunkSize);
                const res = await api.post('/products/bulk-import', {
                    products: chunk,
                    update_existing: updateExisting
                });

                if (res.data?.data) {
                    totalInserted += res.data.data.inserted || 0;
                    totalUpdated += res.data.data.updated || 0;
                    totalCategories += res.data.data.categories_created || 0;
                }

                const currentProgress = Math.min(95, Math.round(((i + 1) / totalChunks) * 100));
                setProgress(currentProgress);
            }

            setProgress(100);
            toast.success(`Berhasil mengimpor ${totalInserted} produk baru & memperbarui ${totalUpdated} produk!`, { duration: 5000 });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Import Error:', error);
            toast.error(error.response?.data?.message || 'Gagal mengimpor produk ke database.');
        } finally {
            setImporting(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-[#282839] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[24px]">upload_file</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Import Produk Massal (Excel / CSV)</h3>
                            <p className="text-xs text-gray-500">Mendukung file .xlsx, .xls, .csv dengan kalkulasi otomatis kode & margin</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={importing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body Konten */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Area Upload File */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            file
                                ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                                : 'border-slate-300 dark:border-[#282839] hover:border-primary bg-slate-50/40 dark:bg-[#111118]/50'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <span className="material-symbols-outlined text-[26px]">table_view</span>
                        </div>
                        {file ? (
                            <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">{fileName}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {parsedRows.length} produk siap diproses. Klik untuk mengganti file.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                    Klik atau seret file Excel/CSV ke sini
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Format kolom: <strong>Nama Barang, Stok, Harga Jual, Kode, Harga Beli, Kategori</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pengaturan Format Kode & Persentase Margin Otomatis */}
                    {parsedRows.length > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl space-y-3">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
                                Pengaturan Rumus Otomatis & Format Barcode
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {/* Format Kode Barcode */}
                                <div>
                                    <label className="text-gray-500 mb-1 block font-medium">Format Kode / SKU</label>
                                    <select
                                        value={codeFormat}
                                        onChange={(e) => handleSettingChange(wholesalePercent, resellerPercent, wholesaleMinQty, e.target.value as any, prefixText)}
                                        className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-semibold text-xs"
                                    >
                                        <option value="joined">Sambung (e.g. DMLKS001)</option>
                                        <option value="dashed">Pemisah Strip (e.g. DM-LKS-001)</option>
                                    </select>
                                </div>

                                {/* Kata Sisipan */}
                                <div>
                                    <label className="text-gray-500 mb-1 block font-medium">Kata Tengah</label>
                                    <input
                                        type="text"
                                        value={prefixText}
                                        onChange={(e) => handleSettingChange(wholesalePercent, resellerPercent, wholesaleMinQty, codeFormat, e.target.value)}
                                        className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold text-xs uppercase"
                                    />
                                </div>

                                {/* Margin Grosir */}
                                <div>
                                    <label className="text-gray-500 mb-1 block font-medium">Margin Grosir (%)</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={wholesalePercent}
                                            onChange={(e) => handleSettingChange(Number(e.target.value), resellerPercent, wholesaleMinQty, codeFormat, prefixText)}
                                            className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold text-xs"
                                        />
                                        <span className="text-gray-400 font-bold">%</span>
                                    </div>
                                </div>

                                {/* Margin Reseller */}
                                <div>
                                    <label className="text-gray-500 mb-1 block font-medium">Margin Reseller (%)</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={resellerPercent}
                                            onChange={(e) => handleSettingChange(wholesalePercent, Number(e.target.value), wholesaleMinQty, codeFormat, prefixText)}
                                            className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold text-xs"
                                        />
                                        <span className="text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                                <span>Rumus: <em>[2 Digit Kode Asli] + {prefixText} + [Urutan Produk]</em></span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={updateExisting}
                                        onChange={(e) => setUpdateExisting(e.target.checked)}
                                        className="rounded text-primary focus:ring-primary size-3.5"
                                    />
                                    <span>Perbarui jika Kode/SKU sudah ada di sistem</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Pratinjau Tabel 5 Baris Pertama */}
                    {parsedRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                    Pratinjau Hasil Konversi (Menampilkan 5 dari {parsedRows.length} produk)
                                </h4>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    ✓ {parsedRows.length} Produk Valid
                                </span>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-[#282839] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px] text-left">
                                        <thead className="bg-gray-100 dark:bg-[#1c1c27] text-gray-600 dark:text-gray-300 font-bold uppercase border-b border-slate-200 dark:border-[#282839]">
                                            <tr>
                                                <th className="py-2 px-3">Kode SKU</th>
                                                <th className="py-2 px-3">Nama Barang</th>
                                                <th className="py-2 px-3">Kategori</th>
                                                <th className="py-2 px-3 text-right">Modal</th>
                                                <th className="py-2 px-3 text-right">Ecer</th>
                                                <th className="py-2 px-3 text-right text-purple-600">Grosir (+{wholesalePercent}%)</th>
                                                <th className="py-2 px-3 text-right text-amber-600">Reseller (+{resellerPercent}%)</th>
                                                <th className="py-2 px-3 text-center">Stok</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-[#282839]/60">
                                            {parsedRows.slice(0, 5).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                                    <td className="py-2 px-3 font-mono font-bold text-primary dark:text-indigo-400">
                                                        {row.finalSku}
                                                    </td>
                                                    <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white max-w-[200px] truncate">
                                                        {row.name}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500">
                                                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 font-medium">
                                                            {row.categoryName}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">
                                                        {formatRupiah(row.purchasePrice)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-gray-900 dark:text-white">
                                                        {formatRupiah(row.retailPrice)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-purple-600 dark:text-purple-400">
                                                        {formatRupiah(row.wholesalePrice)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                                                        {formatRupiah(row.resellerPrice)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center font-bold">
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                            {row.stock}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar saat Import */}
                    {importing && (
                        <div className="space-y-1.5 p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="flex justify-between text-xs font-bold text-primary">
                                <span>Mengimpor produk ke sistem kasir...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-[#282839] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-4 border-t border-slate-200 dark:border-[#282839] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="text-xs text-gray-500">
                        {parsedRows.length > 0 ? (
                            <span>Total siap simpan: <strong>{parsedRows.length} produk</strong></span>
                        ) : (
                            <span>Pilih file Excel/CSV untuk melihat pratinjau</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={importing}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleStartImport}
                            disabled={parsedRows.length === 0 || importing || loading}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                        >
                            {importing ? (
                                <>
                                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                    <span>Sedang Mengimpor...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                    <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Produk` : ''}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportExcelModal;
