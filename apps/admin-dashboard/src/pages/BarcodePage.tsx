import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatRupiah } from '../utils/format';
import { BarcodePreview } from '../components/BarcodePreview';
import { generateBarcodePdf, downloadBlob, openPdfBlob, ProductForBarcode, BarcodePageLayout } from '../utils/barcode128';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';

interface DashboardContextType {
    toggleSidebar: () => void;
}

interface Category {
    id: number | string;
    name: string;
}

export const BarcodePage = () => {
    const { toggleSidebar } = useOutletContext<DashboardContextType>();

    const [products, setProducts] = useState<ProductForBarcode[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Selection
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // Print & PDF Options
    const [layout, setLayout] = useState<BarcodePageLayout>('koala109');
    const [copiesPerProduct, setCopiesPerProduct] = useState(1);
    const [showStoreName, setShowStoreName] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [storeName, setStoreName] = useState('TOKO LAKSANA');

    // Fine-Tuning & Calibration for Sticker Labels
    const [barcodeWidthMm, setBarcodeWidthMm] = useState<number>(30);
    const [pitchYMm, setPitchYMm] = useState<number>(15.0);
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);
    const [koalaPaperSize, setKoalaPaperSize] = useState<'custom170' | 'a4'>('custom170');

    // Build Progress State
    const [isBuilding, setIsBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);
    const [currentProcessingItem, setCurrentProcessingItem] = useState<string>('');
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
    const [isBuildComplete, setIsBuildComplete] = useState(false);

    // Fetch products & categories
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products?per_page=5000&active=true'),
                    api.get('/products/categories')
                ]);

                const prods: ProductForBarcode[] = (productsRes.data?.data?.products || []).map((p: any) => ({
                    id: String(p.id),
                    name: p.name || 'Produk Tanpa Nama',
                    sku: p.sku || `SKU-${p.id.substring(0, 6)}`,
                    price: Number(p.price || 0),
                    category_name: p.category_name || ''
                }));

                setProducts(prods);
                setCategories(categoriesRes.data?.data || []);

                // Default: pilih semua produk
                setSelectedProductIds(new Set(prods.map(p => p.id)));
            } catch (err) {
                console.error('Gagal memuat data produk:', err);
                toast.error('Gagal memuat daftar produk.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Filtered products list
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = selectedCategory === 'all' || p.category_name === selectedCategory;
            return matchesSearch && matchesCat;
        });
    }, [products, searchTerm, selectedCategory]);

    // Handlers selection
    const handleSelectAll = () => {
        if (selectedProductIds.size === filteredProducts.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleToggleProduct = (id: string) => {
        const next = new Set(selectedProductIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedProductIds(next);
    };

    // Build & Download Barcode PDF Massal
    const handleBuildPdf = async () => {
        const selectedItems = products.filter(p => selectedProductIds.has(p.id));
        if (selectedItems.length === 0) {
            toast.error('Pilih setidaknya 1 produk untuk dibuat barcodenya.');
            return;
        }

        setIsBuilding(true);
        setBuildProgress(0);
        setIsBuildComplete(false);
        setGeneratedPdfBlob(null);

        try {
            const isKoala = layout === 'koala109';
            const blob = await generateBarcodePdf(selectedItems, {
                layout,
                copiesPerProduct,
                showStoreName: !isKoala && showStoreName,
                showPrice: !isKoala && showPrice,
                storeName,
                barcodeWidthMm: isKoala ? barcodeWidthMm : undefined,
                offsetX: isKoala ? offsetX : undefined,
                offsetY: isKoala ? offsetY : undefined,
                pitchYMm: isKoala ? pitchYMm : undefined,
                koalaPaperSize: isKoala ? koalaPaperSize : undefined,
                onProgress: (current, total) => {
                    const percent = Math.round((current / total) * 100);
                    setBuildProgress(percent);
                    const item = selectedItems[Math.min(current - 1, selectedItems.length - 1)];
                    if (item) {
                        setCurrentProcessingItem(item.name);
                    }
                }
            });

            setGeneratedPdfBlob(blob);
            setIsBuildComplete(true);

            // Otomatis download file PDF
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `Laksana-Barcode-Semua-Produk-${dateStr}.pdf`;
            downloadBlob(blob, filename);

            toast.success(`Berhasil membuat PDF barcode (${selectedItems.length} produk)!`);
        } catch (error) {
            console.error('Gagal membuat PDF barcode:', error);
            toast.error('Terjadi kesalahan saat memproses PDF barcode.');
            setIsBuilding(false);
        }
    };

    // Download PDF 1 Produk saja
    const handlePrintSingleProduct = async (product: ProductForBarcode, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const isKoala = layout === 'koala109';
            const labelCount = isKoala ? 55 : (layout === 'grid4x10' ? 40 : (layout === 'grid3x7' ? 21 : 24));
            toast.loading(`Membuat barcode untuk ${product.name}...`, { id: 'single-pdf' });
            // Buat PDF 1 lembar penuh untuk produk ini
            const blob = await generateBarcodePdf([product], {
                layout,
                copiesPerProduct: labelCount,
                showStoreName: !isKoala && showStoreName,
                showPrice: !isKoala && showPrice,
                storeName,
                barcodeWidthMm: isKoala ? barcodeWidthMm : undefined,
                offsetX: isKoala ? offsetX : undefined,
                offsetY: isKoala ? offsetY : undefined,
                pitchYMm: isKoala ? pitchYMm : undefined,
                koalaPaperSize: isKoala ? koalaPaperSize : undefined
            });
            toast.dismiss('single-pdf');
            downloadBlob(blob, `Barcode-${product.sku}-${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
            toast.success(`PDF barcode 1 lembar (${product.name} - ${labelCount} label) siap dicetak!`);
        } catch {
            toast.dismiss('single-pdf');
            toast.error('Gagal membuat barcode produk.');
        }
    };

    const selectedCount = selectedProductIds.size;
    const itemsPerPage = layout === 'koala109' ? 55 : (layout === 'grid4x10' ? 40 : (layout === 'grid3x7' ? 21 : (layout === 'single' ? 1 : 24)));
    const paperLabelName = layout === 'koala109' ? 'Lembar Koala 109' : (layout === 'single' ? 'Label' : 'hal. A4');
    const estimatedPages = Math.ceil((selectedCount * copiesPerProduct) / itemsPerPage) || 1;

    return (
        <div className="flex flex-col gap-6 w-full p-4 sm:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Buka Menu"
                    >
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[28px]">barcode_scanner</span>
                            Cetak & Generator Barcode
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-text-secondary mt-0.5">
                            Generate barcode garis (Code 128) akurat untuk seluruh produk dan simpan sebagai file PDF.
                        </p>
                    </div>
                </div>

                {/* Primary Action Button & User Controls */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={handleBuildPdf}
                        disabled={loading || selectedCount === 0 || isBuilding}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        <span>Mulai Unduh PDF ({selectedCount})</span>
                    </button>
                    <ThemeToggle />
                    <UserMenu />
                </div>
            </div>

            {/* Panel Pengaturan & Filter */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-5 shadow-sm flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pencarian */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-text-secondary">Cari Produk / SKU</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama barang atau SKU..."
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#282839] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Kategori */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-text-secondary">Kategori</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                        >
                            <option value="all">Semua Kategori ({products.length})</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ukuran / Layout Halaman */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-text-secondary">Tata Letak (Layout)</label>
                        <select
                            value={layout}
                            onChange={(e) => setLayout(e.target.value as BarcodePageLayout)}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1a1a24] text-gray-900 dark:text-white focus:outline-none focus:border-primary font-medium"
                        >
                            <option value="koala109">🏷️ Koala / Tom & Jerry No. 109 (55 Label/Lembar - 13x38 mm)</option>
                            <option value="grid3x8">A4 Grid 3x8 (24 Label/Lembar - Buku & Kitab Standar)</option>
                            <option value="grid3x7">A4 Blueprint GL-A46 (21 Label/Lembar - Ukuran 66x40 mm)</option>
                            <option value="grid4x10">A4 Grid 4x10 (40 Label/Lembar - Stiker Kecil / Polos A4)</option>
                            <option value="single">Stiker Satuan (1 Label per Lembar)</option>
                        </select>
                    </div>

                    {/* Jumlah Lembar per Produk */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-text-secondary">Salinan per Produk</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={copiesPerProduct}
                                onChange={(e) => setCopiesPerProduct(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#282839] bg-transparent text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">label / item</span>
                        </div>
                    </div>
                </div>

                {/* Banner Info Khusus Koala 109 & Panel Kalibrasi */}
                {layout === 'koala109' && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-900 dark:text-amber-300 text-xs">
                            <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0">info</span>
                            <div>
                                <span className="font-bold">Mode Stiker Koala / Tom & Jerry No. 109 Aktif (55 Label per Lembar - 13x38 mm):</span>
                                <p className="mt-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                    Format label dipadatkan: <strong>Nama Barang + Garis Barcode (30 mm) + Nomor SKU</strong> tersusun rapat di bagian tengah stiker. Tata letak ini menyisakan ruang aman sekitar 2 mm di atas dan bawah serta 4 mm di kiri-kanan agar tidak terpotong pisau stiker.
                                </p>
                            </div>
                        </div>

                        {/* Panel Kalibrasi & Presisi */}
                        <div className="bg-slate-50 dark:bg-[#1a1a24] border border-slate-200 dark:border-[#282839] rounded-xl p-3.5 flex flex-col gap-3.5">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#282839] pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Kalibrasi Presisi, Lebar Barcode &amp; Jarak Baris
                                    </span>
                                </div>
                                {(offsetX !== 0 || offsetY !== 0 || barcodeWidthMm !== 30 || pitchYMm !== 15.0 || koalaPaperSize !== 'custom170') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOffsetX(0);
                                            setOffsetY(0);
                                            setBarcodeWidthMm(30);
                                            setPitchYMm(15.0);
                                            setKoalaPaperSize('custom170');
                                        }}
                                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                                        Reset ke Standar (30 mm / 15.0 mm)
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* 1. Lebar Barcode */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                        <span>Lebar Barcode Garis</span>
                                        <span className="font-bold text-primary">{barcodeWidthMm} mm</span>
                                    </label>
                                    <div className="flex items-center gap-1">
                                        {[26, 28, 30, 32].map((w) => (
                                            <button
                                                key={w}
                                                type="button"
                                                onClick={() => setBarcodeWidthMm(w)}
                                                className={`flex-1 py-1 px-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                                    barcodeWidthMm === w
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {w === 30 ? `${w}mm (Pas)` : `${w}mm`}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        30 mm pas di stiker 38 mm dengan sisa batas aman 4 mm di kiri &amp; kanan.
                                    </span>
                                </div>

                                {/* 2. Konsistensi Jarak Antar Baris (Pitch Vertikal) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                        <span>Jarak Baris (Pitch)</span>
                                        <span className="font-bold text-primary">{pitchYMm.toFixed(1)} mm</span>
                                    </label>
                                    <div className="flex items-center gap-1">
                                        {[14.8, 14.9, 15.0, 15.1].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPitchYMm(p)}
                                                className={`flex-1 py-1 px-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                                    pitchYMm === p
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {p === 15.0 ? `${p} (Std)` : `${p}`}
                                            </button>
                                        ))}
                                        <div className="flex items-center gap-0.5 ml-1">
                                            <button
                                                type="button"
                                                onClick={() => setPitchYMm(prev => Math.max(14.5, Math.round((prev - 0.1) * 10) / 10))}
                                                className="size-6 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                                                title="Kurangi jarak baris 0.1 mm"
                                            >
                                                -
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPitchYMm(prev => Math.min(15.5, Math.round((prev + 0.1) * 10) / 10))}
                                                className="size-6 flex items-center justify-center rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                                                title="Tambah jarak baris 0.1 mm"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        Jika di bawah makin turun, kurangi (misal 14.9 mm). Jika makin naik, tambah (15.1 mm).
                                    </span>
                                </div>

                                {/* 3. Kalibrasi Posisi Geser (Offset) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                        Geser Posisi Keseluruhan
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {/* Geser Horizontal (X) */}
                                        <div className="flex items-center justify-between bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-lg px-2 py-1">
                                            <span className="text-[10px] font-medium text-gray-500">Kiri/Kanan:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setOffsetX(prev => Math.max(-5, Math.round((prev - 0.5) * 10) / 10))}
                                                    className="size-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
                                                    title="Geser ke Kiri 0.5 mm"
                                                >
                                                    -
                                                </button>
                                                <span className="text-[11px] font-mono font-bold w-9 text-center text-gray-900 dark:text-white">
                                                    {offsetX > 0 ? `+${offsetX}` : offsetX}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setOffsetX(prev => Math.min(5, Math.round((prev + 0.5) * 10) / 10))}
                                                    className="size-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
                                                    title="Geser ke Kanan 0.5 mm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Geser Vertikal (Y) */}
                                        <div className="flex items-center justify-between bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-lg px-2 py-1">
                                            <span className="text-[10px] font-medium text-gray-500">Atas/Bwh:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setOffsetY(prev => Math.max(-5, Math.round((prev - 0.5) * 10) / 10))}
                                                    className="size-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
                                                    title="Geser ke Atas 0.5 mm"
                                                >
                                                    -
                                                </button>
                                                <span className="text-[11px] font-mono font-bold w-9 text-center text-gray-900 dark:text-white">
                                                    {offsetY > 0 ? `+${offsetY}` : offsetY}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setOffsetY(prev => Math.min(5, Math.round((prev + 0.5) * 10) / 10))}
                                                    className="size-5 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
                                                    title="Geser ke Bawah 0.5 mm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        Klik +/- untuk menggeser jika cetakan printer agak condong.
                                    </span>
                                </div>

                                {/* 4. Ukuran Lembar Halaman PDF */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                        Ukuran Lembar PDF
                                    </label>
                                    <select
                                        value={koalaPaperSize}
                                        onChange={(e) => setKoalaPaperSize(e.target.value as any)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="custom170">Ukuran Asli Koala (210 x 170 mm)</option>
                                        <option value="a4">Format Kertas A4 (210 x 297 mm - Posisi Atas)</option>
                                    </select>
                                    <span className="text-[10px] text-gray-400">
                                        Pilih "Format Kertas A4" jika printer menolak ukuran 170 mm.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Switch Opsi Tampilan & Ringkasan */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-[#282839]/60">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className={`flex items-center gap-2 text-xs sm:text-sm ${layout === 'koala109' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-gray-700 dark:text-gray-300'}`}>
                            <input
                                type="checkbox"
                                checked={layout === 'koala109' ? false : showStoreName}
                                disabled={layout === 'koala109'}
                                onChange={(e) => setShowStoreName(e.target.checked)}
                                className="rounded text-primary focus:ring-primary size-4"
                            />
                            <span>Tampilkan Nama Toko {layout === 'koala109' && '(Off)'}</span>
                        </label>
                        <label className={`flex items-center gap-2 text-xs sm:text-sm ${layout === 'koala109' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-gray-700 dark:text-gray-300'}`}>
                            <input
                                type="checkbox"
                                checked={layout === 'koala109' ? false : showPrice}
                                disabled={layout === 'koala109'}
                                onChange={(e) => setShowPrice(e.target.checked)}
                                className="rounded text-primary focus:ring-primary size-4"
                            />
                            <span>Tampilkan Harga Jual {layout === 'koala109' && '(Off)'}</span>
                        </label>
                        {layout !== 'koala109' && showStoreName && (
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="Nama Toko..."
                                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#282839] bg-transparent text-gray-900 dark:text-white"
                            />
                        )}
                    </div>

                    {/* Ringkasan Estimasi & Select All */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            {selectedProductIds.size === filteredProducts.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <div className="text-xs text-gray-500 dark:text-text-secondary">
                            Terpilih: <strong className="text-gray-900 dark:text-white">{selectedCount}</strong> produk
                            {' '}(Total <strong>{selectedCount * copiesPerProduct}</strong> label &bull; Estimasi <strong>{estimatedPages}</strong> {paperLabelName})
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Progress Build Barcode */}
            {isBuilding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5">
                        {!isBuildComplete ? (
                            <>
                                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                                    <span className="material-symbols-outlined text-[36px]">print</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Membangun Barcode Produk...</h3>
                                    <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">
                                        Memproses kode batang garis secara presisi & akurat. Mohon tunggu sebentar.
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full flex flex-col gap-1.5">
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-150 ease-out rounded-full"
                                            style={{ width: `${buildProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>{buildProgress}% selesai</span>
                                        <span className="truncate max-w-[200px]">{currentProcessingItem}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <span className="material-symbols-outlined text-[36px]">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">File PDF Barcode Selesai!</h3>
                                    <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">
                                        File PDF telah otomatis diunduh ke perangkat Anda. Anda dapat langsung membuka atau mencetaknya.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                                    {generatedPdfBlob && (
                                        <button
                                            onClick={() => openPdfBlob(generatedPdfBlob)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                            Buka di Tab Baru
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsBuilding(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Daftar Grid Preview Produk & Barcode */}
            {loading ? (
                <div className="p-12 text-center text-gray-500">
                    <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
                    <p className="text-sm mt-2">Memuat daftar produk & barcode...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839]">
                    <span className="material-symbols-outlined text-[48px] text-gray-400">search_off</span>
                    <p className="text-sm mt-2 font-medium">Tidak ada produk yang sesuai dengan filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredProducts.map((p) => {
                        const isSelected = selectedProductIds.has(p.id);
                        return (
                            <div
                                key={p.id}
                                onClick={() => handleToggleProduct(p.id)}
                                className={`group relative bg-white dark:bg-surface-dark rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer ${isSelected
                                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                                    : 'border-slate-200 dark:border-[#282839] opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {/* Checkbox Pilihan */}
                                <div className="flex items-center justify-between mb-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleProduct(p.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded text-primary focus:ring-primary size-4"
                                    />
                                    <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500">
                                        {p.sku}
                                    </span>
                                </div>

                                {/* Preview Barcode Batang 1D */}
                                <div className="my-1">
                                    <BarcodePreview
                                        sku={p.sku}
                                        height={36}
                                        showText={false}
                                        className="border-slate-100 dark:border-slate-800"
                                    />
                                </div>

                                {/* Info Produk */}
                                <div className="mt-2 text-center">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2" title={p.name}>
                                        {p.name}
                                    </p>
                                    <p className="text-xs font-bold text-primary mt-1">
                                        {formatRupiah(p.price)}
                                    </p>
                                </div>

                                {/* Action Cetak Satuan */}
                                <button
                                    type="button"
                                    onClick={(e) => handlePrintSingleProduct(p, e)}
                                    className="mt-2.5 w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium hover:bg-primary hover:text-white transition-colors"
                                    title={`Unduh 1 lembar (${itemsPerPage} label) khusus untuk produk ini`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">print</span>
                                    <span>Cetak 1 Lembar ({itemsPerPage})</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BarcodePage;
