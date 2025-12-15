import React, { useState, useEffect } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { DashboardContextType } from '../layouts/DashboardLayout';

interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category_name: string;
    stock_quantity: number;
    low_stock_threshold: number;
    updated_at: string;
    image_url: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    product_count: number;
}

interface Log {
    id: number;
    product_name: string;
    sku: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    user_name: string;
    notes: string;
    created_at: string;
}

interface StockReport {
    id: string;
    product_name: string;
    sku: string;
    reporter_name: string;
    notes: string;
    status: 'pending' | 'resolved';
    created_at: string;
}

const InventoryPage = () => {
    const location = useLocation();

    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const [activeTab, setActiveTab] = useState<'in' | 'out' | 'opname' | 'categories' | 'reports'>('in');

    // Data States
    const [logs, setLogs] = useState<Log[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stockReports, setStockReports] = useState<StockReport[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Action Form States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState('');
    const [supplier, setSupplier] = useState(''); // Only for Stock In
    const [submitting, setSubmitting] = useState(false);

    // Category Creation State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        fetchLogs();

        // Check for navigation state action (e.g. from Dashboard or Reports)
        if (location.state?.action === 'stock-in' && location.state?.productId) {
            setActiveTab('in');
            // We need to fetch product details to set selectedProduct
            // But we might only have ID/Name. Let's try to search by exact name for now or fetch by ID if API supported
            // Assuming search by name works reasonably well or we can optimize later
            if (location.state.productName) {
                setSearchQuery(location.state.productName);
                api.get(`/products/search?q=${location.state.productName}`).then(res => {
                    const found = res.data.data.find((p: any) => p.id === location.state.productId);
                    if (found) handleProductSelect(found);
                });
            }
            // Clear state so it doesn't persist on reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (activeTab === 'categories') {
            fetchCategories();
        } else if (activeTab === 'reports') {
            fetchStockReports();
        }
    }, [activeTab]);

    // Search Products
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchProducts();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const response = await api.get('/inventory/logs');
            setLogs(response.data.data.logs || []);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/products/categories');
            setCategories(response.data.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchStockReports = async () => {
        try {
            const response = await api.get('/stock-reports/pending');
            setStockReports(response.data.data);
        } catch (error) {
            console.error("Failed to fetch stock reports", error);
        }
    };

    const handleResolveReport = async (id: string) => {
        if (!confirm('Tandai laporan ini sebagai selesai?')) return;
        try {
            await api.patch(`/stock-reports/${id}/resolve`);
            fetchStockReports();
            alert('Laporan diselesaikan');
        } catch (error) {
            alert('Gagal menyelesaikan laporan');
        }
    };

    const searchProducts = async () => {
        try {
            const response = await api.get(`/products/search?q=${searchQuery}`);
            setSearchResults(response.data.data);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const handleProductSelect = (product: InventoryItem) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setSearchResults([]);
        // For opname, default quantity to current stock
        if (activeTab === 'opname') {
            setQuantity(product.stock_quantity);
        } else {
            setQuantity(1);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct) return;
        setSubmitting(true);
        try {
            let endpoint = '';
            let payload: any = {
                product_id: selectedProduct.id,
                notes: notes
            };

            if (activeTab === 'in') {
                endpoint = '/inventory/stock-in';
                payload.quantity = quantity;
                payload.supplier_id = null; // Ideally select supplier ID, but backend accepts string matching? No, checks ID.
                // Currently API requires ID or NULL. If we want name string support, backend needs update. 
                // For now, let's omit supplier or treat as notes.
                // Assuming backend expects integer quantity.
            } else if (activeTab === 'out') {
                endpoint = '/inventory/stock-out';
                payload.quantity = quantity;
            } else if (activeTab === 'opname') {
                endpoint = '/inventory/adjustment';
                payload.new_quantity = quantity;
            }

            await api.post(endpoint, payload);

            // Success
            alert('Operasi berhasil');
            setSelectedProduct(null);
            setQuantity(1);
            setNotes('');
            setSupplier('');
            fetchLogs(); // Refresh logs
        } catch (error: any) {
            console.error("Submission failed", error);
            alert(error.response?.data?.message || "Operasi gagal");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/products/categories', { name: newCategoryName });
            setNewCategoryName('');
            setIsCategoryModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal membuat kategori');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Waktu", "Produk", "SKU", "Tipe", "Jml", "Pengguna", "Catatan"];
        const rows = logs.map(log => [
            log.id,
            new Date(log.created_at).toLocaleString('id-ID'),
            log.product_name,
            log.sku,
            log.type,
            log.quantity,
            log.user_name,
            log.notes
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "laporan_inventaris.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="flex-shrink-0 px-4 md:px-8 py-4 md:py-6 flex flex-col gap-4 border-b border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-1 mr-2 text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="text-gray-500 dark:text-[#9d9db9]">Beranda</span>
                        <span className="text-gray-400 dark:text-[#585870]">/</span>
                        <span className="text-gray-900 dark:text-white font-medium">Inventaris</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manajemen Inventaris</h1>
                            <p className="text-gray-500 dark:text-[#9d9db9] text-sm max-w-2xl">Kelola stok, kategori, dan lihat riwayat trasaksi barang.</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-[#282839] border border-slate-200 dark:border-[#3b3c54] text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#323246] transition-colors w-full md:w-auto"
                            >
                                <span className="material-symbols-outlined text-[20px]">file_download</span>
                                <span>Export Laporan</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
                    <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-6">
                        {/* Main Tabs Card */}
                        <div className="flex flex-col bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-[#3b3c54] overflow-visible transition-colors">
                            <div className="border-b border-slate-200 dark:border-[#3b3c54] px-6 overflow-x-auto no-scrollbar">
                                <nav className="flex gap-8 -mb-px whitespace-nowrap">
                                    <button onClick={() => setActiveTab('in')} className={`flex items-center gap-2 py-4 px-1 border-b-[3px] font-bold text-sm transition-all ${activeTab === 'in' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'}`}>
                                        <span className="material-symbols-outlined">download</span> Masuk Stok
                                    </button>
                                    <button onClick={() => setActiveTab('out')} className={`flex items-center gap-2 py-4 px-1 border-b-[3px] font-bold text-sm transition-all ${activeTab === 'out' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'}`}>
                                        <span className="material-symbols-outlined">upload</span> Keluar Stok
                                    </button>
                                    <button onClick={() => setActiveTab('opname')} className={`flex items-center gap-2 py-4 px-1 border-b-[3px] font-bold text-sm transition-all ${activeTab === 'opname' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'}`}>
                                        <span className="material-symbols-outlined">fact_check</span> Opname Stok
                                    </button>
                                    <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 py-4 px-1 border-b-[3px] font-bold text-sm transition-all ${activeTab === 'categories' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'}`}>
                                        <span className="material-symbols-outlined">category</span> Kategori
                                    </button>
                                    <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 py-4 px-1 border-b-[3px] font-bold text-sm transition-all ${activeTab === 'reports' ? 'border-purple-500 text-purple-500' : 'border-transparent text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'}`}>
                                        <span className="material-symbols-outlined">campaign</span> Laporan Stok
                                    </button>
                                </nav>
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-[#16161f] transition-colors">
                                {activeTab === 'categories' ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-gray-900 dark:text-white font-bold">Kategori Produk</h3>
                                            <button
                                                onClick={() => setIsCategoryModalOpen(true)}
                                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add</span> Tambah Kategori
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#3b3c54]">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-[#9d9db9]">
                                                <thead className="bg-gray-100 dark:bg-[#1c1c27] text-gray-900 dark:text-white uppercase text-xs font-semibold">
                                                    <tr>
                                                        <th className="px-6 py-3">ID</th>
                                                        <th className="px-6 py-3">Nama</th>
                                                        <th className="px-6 py-3">Slug</th>
                                                        <th className="px-6 py-3 text-right">Produk</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#3b3c54]">
                                                    {categories.map(cat => (
                                                        <tr key={cat.id} className="hover:bg-gray-100 dark:hover:bg-[#1c1c27] transition-colors">
                                                            <td className="px-6 py-4">{cat.id}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                                                            <td className="px-6 py-4">{cat.slug}</td>
                                                            <td className="px-6 py-4 text-right">{cat.product_count}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : activeTab === 'reports' ? (
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500">campaign</span>
                                            Laporan Stok Menipis (Pending)
                                        </h3>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#3b3c54]">
                                            <table className="w-full text-left text-sm text-gray-500 dark:text-[#9d9db9]">
                                                <thead className="bg-gray-100 dark:bg-[#1c1c27] text-gray-900 dark:text-white uppercase text-xs font-semibold">
                                                    <tr>
                                                        <th className="px-6 py-3">Waktu</th>
                                                        <th className="px-6 py-3">Produk</th>
                                                        <th className="px-6 py-3">SKU</th>
                                                        <th className="px-6 py-3">Pelapor</th>
                                                        <th className="px-6 py-3">Catatan</th>
                                                        <th className="px-6 py-3 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-[#3b3c54]">
                                                    {stockReports.length === 0 ? (
                                                        <tr><td colSpan={6} className="p-6 text-center">Tidak ada laporan pending.</td></tr>
                                                    ) : stockReports.map(report => (
                                                        <tr key={report.id} className="hover:bg-gray-100 dark:hover:bg-[#1c1c27] transition-colors">
                                                            <td className="px-6 py-4">{new Date(report.created_at).toLocaleString('id-ID')}</td>
                                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{report.product_name}</td>
                                                            <td className="px-6 py-4 font-mono">{report.sku}</td>
                                                            <td className="px-6 py-4">{report.reporter_name}</td>
                                                            <td className="px-6 py-4 italic">{report.notes}</td>
                                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveTab('in');
                                                                        // Resolving report implicitly if we restock? Maybe keep separate.
                                                                        // Auto-select product logic similar to dashboard
                                                                        api.get(`/products/search?q=${report.product_name}`).then(res => {
                                                                            const found = res.data.data.find((p: any) => p.sku === report.sku);
                                                                            if (found) handleProductSelect(found);
                                                                        });
                                                                    }}
                                                                    className="text-primary hover:text-white font-bold text-xs border border-primary/50 hover:border-primary hover:bg-primary px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                                                                    Isi Stok
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResolveReport(report.id)}
                                                                    className="text-emerald-500 hover:text-white font-bold text-xs border border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-500 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                                                    Selesai
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* Stock Action Form */
                                    <div className="flex flex-col gap-6">
                                        <h3 className="text-sm uppercase tracking-wider font-bold text-gray-500 dark:text-[#9d9db9] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">
                                                {activeTab === 'in' ? 'add_circle' : activeTab === 'out' ? 'remove_circle' : 'edit_square'}
                                            </span>
                                            {activeTab === 'in' ? 'Terima Barang Masuk' : activeTab === 'out' ? 'Proses Barang Keluar' : 'Sesuaikan Stok (Opname)'}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {/* Product Search */}
                                            <div className="lg:col-span-2 relative">
                                                <label className="block text-xs font-medium text-gray-500 dark:text-[#9d9db9] mb-1.5 uppercase">Cari Produk</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={selectedProduct ? selectedProduct.name : searchQuery}
                                                        onChange={e => {
                                                            setSearchQuery(e.target.value);
                                                            setSelectedProduct(null);
                                                        }}
                                                        placeholder="Ketik nama produk atau SKU..."
                                                        className="w-full bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#3b3c54] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary placeholder-gray-400 dark:placeholder-[#585870] transition-colors"
                                                    />
                                                    {selectedProduct && (
                                                        <button
                                                            onClick={() => { setSelectedProduct(null); setSearchQuery(''); }}
                                                            className="absolute right-2 top-2.5 text-gray-400 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                                {/* Search Results Dropdown */}
                                                {!selectedProduct && searchResults.length > 0 && (
                                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#3b3c54] rounded-lg shadow-xl max-h-60 overflow-y-auto transition-colors">
                                                        {searchResults.map(product => (
                                                            <button
                                                                key={product.id}
                                                                onClick={() => handleProductSelect(product)}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#282839] border-b border-slate-100 dark:border-[#282839] last:border-0 flex items-center gap-3 transition-colors"
                                                            >
                                                                <div
                                                                    className="size-8 rounded bg-gray-100 dark:bg-[#282839] bg-cover bg-center shrink-0"
                                                                    style={{ backgroundImage: `url("${product.image_url || 'https://via.placeholder.com/150'}")` }}
                                                                />
                                                                <div>
                                                                    <div className="text-gray-900 dark:text-white font-medium text-sm">{product.name}</div>
                                                                    <div className="text-gray-500 dark:text-[#9d9db9] text-xs">SKU: {product.sku} | Stok: {product.stock_quantity}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Input Fields */}
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-[#9d9db9] mb-1.5 uppercase">
                                                        {activeTab === 'opname' ? 'Jumlah Baru' : 'Jumlah'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={quantity}
                                                        onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#3b3c54] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary font-mono transition-colors"
                                                    />
                                                </div>
                                                {activeTab === 'in' && (
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-500 dark:text-[#9d9db9] mb-1.5 uppercase">Pemasok</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Opsional"
                                                            value={supplier}
                                                            onChange={e => setSupplier(e.target.value)}
                                                            className="w-full bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#3b3c54] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-[#9d9db9] mb-1.5 uppercase">Catatan</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Alasan atau ref..."
                                                        value={notes}
                                                        onChange={e => setNotes(e.target.value)}
                                                        className="w-full bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#3b3c54] rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={!selectedProduct || submitting}
                                                    className={`h-[42px] px-6 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed
                                                        ${activeTab === 'in' ? 'bg-primary hover:bg-primary/90 shadow-primary/25' :
                                                            activeTab === 'out' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' :
                                                                'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'}`}
                                                >
                                                    {submitting ? 'Menyimpan...' : 'Konfirmasi'}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedProduct && (
                                            <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-[#282839]/50 border border-slate-200 dark:border-[#3b3c54] flex items-center justify-between transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-sm text-gray-500 dark:text-[#9d9db9]">Stok Saat Ini: <span className="text-gray-900 dark:text-white font-mono font-bold text-lg">{selectedProduct.stock_quantity}</span></div>
                                                    <div className="h-4 w-px bg-slate-300 dark:bg-[#3b3c54]" />
                                                    <div className="text-sm text-gray-500 dark:text-[#9d9db9]">Kategori: <span className="text-gray-900 dark:text-white">{selectedProduct.category_name}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Inventory Logs / History */}
                        <div className="flex flex-col bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-[#3b3c54] overflow-hidden transition-colors">
                            <div className="px-6 py-5 border-b border-slate-200 dark:border-[#3b3c54] flex justify-between items-center bg-white dark:bg-inherit">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Inventaris Terbaru</h2>
                                <button onClick={fetchLogs} className="text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white">
                                    <span className="material-symbols-outlined">refresh</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-[#16161f] text-gray-500 dark:text-[#9d9db9] uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="px-6 py-3">Waktu</th>
                                            <th className="px-6 py-3">Tipe</th>
                                            <th className="px-6 py-3">Produk</th>
                                            <th className="px-6 py-3 text-right">Jml</th>
                                            <th className="px-6 py-3">Pengguna</th>
                                            <th className="px-6 py-3">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-[#3b3c54]">
                                        {loadingLogs ? (
                                            <tr><td colSpan={6} className="p-6 text-center text-gray-500 dark:text-[#9d9db9]">Memuat...</td></tr>
                                        ) : logs.length === 0 ? (
                                            <tr><td colSpan={6} className="p-6 text-center text-gray-500 dark:text-[#9d9db9]">Tidak ada riwayat.</td></tr>
                                        ) : logs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors">
                                                <td className="px-6 py-4 text-gray-500 dark:text-[#9d9db9] whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase
                                                        ${log.type === 'in' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                            log.type === 'out' ? 'bg-red-500/10 text-red-600 dark:text-red-500' :
                                                                'bg-amber-500/10 text-amber-600 dark:text-amber-500'}`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    <div>{log.product_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-[#585870] font-mono">{log.sku}</div>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold font-mono ${log.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {log.type === 'out' ? '-' : '+'}{log.quantity}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-[#9d9db9]">{log.user_name}</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-[#9d9db9] italic">{log.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Category Modal */}
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#1c1c27] rounded-xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-sm p-6 transition-colors">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tambah Kategori Baru</h3>
                            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Nama Kategori</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
                                    >
                                        Buat
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InventoryPage;
