import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatRupiah, formatNumber, parseFormattedNumber } from '../utils/format';
import { DashboardContextType } from '../layouts/DashboardLayout';

interface Product {
    id: string;
    name: string;
    sku: string;
    category_name: string;
    price: number;
    price_grosir?: number;
    price_reseller?: number;
    purchase_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: number | boolean;
    updated_at: string;
    image_url: string;
    category_id: number | null;
}

const ProductsPage = () => {
    const { toggleSidebar } = useOutletContext<DashboardContextType>();
    const { confirm } = useConfirm();

    // ... existing state ...
    const [productList, setProductList] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage, setPerPage] = useState(20);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        price_grosir: '',
        price_reseller: '',
        purchase_price: '',
        stock_quantity: '',
        category_id: '',
        sku: '',
        image_url: ''
    });



    // ... existing functions (fetchCategories, fetchProducts, etc.) ...
    const fetchCategories = async () => {
        try {
            const response = await api.get('/products/categories');
            if (response.data.data) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('per_page', perPage.toString());
            if (categoryFilter && categoryFilter !== 'all') params.append('category_id', categoryFilter);
            if (statusFilter && statusFilter !== 'all') params.append('active', statusFilter === 'active' ? 'true' : 'false');

            const url = `/products?${params.toString()}`;
            const response = await api.get(url);

            // Handle pagination structure
            if (response.data.data.products) {
                setProductList(response.data.data.products);
                // Set pagination data if available
                if (response.data.data.pagination) {
                    setTotalPages(response.data.data.pagination.total_pages);
                    setTotalItems(response.data.data.pagination.total);
                    // Ensure current page matches server response (logic safety)
                    // setCurrentPage(response.data.data.pagination.current_page); 
                }
            } else {
                // Fallback for non-paginated structure if any
                setProductList(response.data.data);
                setTotalPages(1);
                setTotalItems(Array.isArray(response.data.data) ? response.data.data.length : 0);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter, statusFilter, currentPage, perPage]); // Re-fetch when filters or page changes

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.get(`/products/search?q=${searchQuery}`);
            if (Array.isArray(response.data.data)) {
                setProductList(response.data.data);
            } else if (response.data.data.products) {
                setProductList(response.data.data.products);
            } else {
                setProductList([]);
            }
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data.data?.url) {
                setFormData(prev => ({ ...prev, image_url: response.data.data.url }));
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to upload image';
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleExportCSV = () => {
        if (productList.length === 0) return;

        const headers = ['ID', 'Nama Produk', 'SKU', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Status', 'URL Gambar'];

        // Add BOM for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        let csvContent = BOM + headers.join(';') + '\n';

        csvContent += productList.map(p => [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
            p.sku,
            p.category_name || '',
            p.purchase_price,
            p.price,
            p.stock_quantity,
            p.is_active ? 'Aktif' : 'Nonaktif',
            p.image_url
        ].join(';')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const toggleActive = async (id: string) => {
        try {
            await api.patch(`/products/${id}/status`);
            // Update local state immediately for better UX
            setProductList(productList.map(p =>
                p.id === id ? { ...p, is_active: !p.is_active } : p
            ));
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Gagal mengubah status produk.');
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Hapus Produk',
            message: 'Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            type: 'danger'
        });

        if (!isConfirmed) return;

        try {
            await api.delete(`/products/${id}`);
            setProductList(productList.filter(p => p.id !== id));
            toast.success('Produk berhasil dihapus');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Gagal menghapus produk.');
        }
    };

    const openAddModal = () => {
        setCurrentProduct(null);
        setFormData({
            name: '',
            price: '',
            price_grosir: '',
            price_reseller: '',
            purchase_price: '',
            stock_quantity: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            sku: '',
            image_url: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            price_grosir: (product.price_grosir || product.price).toString(),
            price_reseller: (product.price_reseller || product.price).toString(),
            purchase_price: (product.purchase_price || 0).toString(),
            stock_quantity: product.stock_quantity.toString(),
            category_id: product.category_id ? product.category_id.toString() : '',
            sku: product.sku || '',
            image_url: product.image_url || ''
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                price_grosir: parseFloat(formData.price_grosir),
                price_reseller: parseFloat(formData.price_reseller),
                purchase_price: parseFloat(formData.purchase_price),
                stock_quantity: parseInt(formData.stock_quantity),
                category_id: formData.category_id ? parseInt(formData.category_id) : null
            };

            if (currentProduct) {
                await api.put(`/products/${currentProduct.id}`, payload);
            } else {
                await api.post('/products', payload);
            }

            setIsModalOpen(false);
            fetchProducts(); // Refresh list
            toast.success(currentProduct ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Gagal menyimpan produk. Pastikan semua field valid.');
        }
    };

    const getStockColor = (stock: number, threshold: number) => {
        if (stock === 0) return 'bg-red-500';
        if (stock <= threshold) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getStockPercentage = (stock: number) => {
        const max = 100; // Arbitrary max for visualization
        return Math.min((stock / max) * 100, 100);
    }

    return (
        <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header */}
                {/* Header */}
                <header className="min-h-16 h-auto py-3 flex flex-wrap items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#111118] border-b border-slate-200 dark:border-[#282839] shrink-0 z-10 gap-3 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* Hamburger */}
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h2 className="text-gray-900 dark:text-white text-lg font-bold tracking-tight">Manajemen Produk</h2>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <form onSubmit={handleSearch} className="flex relative flex-1 sm:flex-none">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-[#9d9db9]">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="block w-full sm:w-64 rounded-lg bg-gray-100 dark:bg-[#282839] border-none py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#9d9db9] focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#1c1c27] transition-all"
                            />
                        </form>
                        <button className="flex items-center justify-center size-9 rounded-lg bg-gray-100 dark:bg-[#282839] text-gray-500 dark:text-[#9d9db9] hover:text-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#3b3c54] transition-colors relative shrink-0">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#282839]" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            setCurrentPage(1); // Reset to page 1
                                        }}
                                        className="appearance-none h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white text-sm focus:ring-primary focus:border-primary transition-colors"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-[#9d9db9]">
                                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white text-sm focus:ring-primary focus:border-primary transition-colors"
                                    >
                                        <option value="all">Status: Semua</option>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Nonaktif</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-[#9d9db9]">
                                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportCSV}
                                    className="h-10 px-4 rounded-lg border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-green-500">file_download</span>
                                    <span className="hidden sm:inline">Export CSV</span>
                                </button>
                                <button
                                    onClick={openAddModal}
                                    className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Tambah Produk
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1c1c27] border-b border-slate-200 dark:border-[#282839] text-gray-500 dark:text-[#9d9db9] text-xs uppercase tracking-wider font-semibold transition-colors">
                                            <th className="p-4 w-16 text-center">Gambar</th>
                                            <th className="p-4 min-w-[200px]">Nama Produk</th>
                                            <th className="p-4 min-w-[120px]">SKU</th>
                                            <th className="p-4 min-w-[120px]">Kategori</th>
                                            <th className="p-4 min-w-[100px]">Harga Beli</th>
                                            <th className="p-4 min-w-[100px]">Harga Jual</th>
                                            <th className="p-4 min-w-[100px]">Stok</th>
                                            <th className="p-4 text-center min-w-[100px]">Status</th>
                                            <th className="p-4 text-right min-w-[120px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-200 dark:divide-[#282839]">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-[#9d9db9]">Memuat produk...</td>
                                            </tr>
                                        ) : productList.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-[#9d9db9]">Tidak ada produk ditemukan.</td>
                                            </tr>
                                        ) : (
                                            productList.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors group">
                                                    <td className="p-4">
                                                        <div
                                                            className="size-10 rounded-lg bg-gray-200 dark:bg-[#282839] bg-center bg-cover border border-slate-300 dark:border-[#3b3c54]"
                                                            style={{ backgroundImage: `url("${product.image_url || 'https://via.placeholder.com/150'}")` }}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                        <div className="text-gray-500 dark:text-[#55556d] text-xs mt-0.5">Diperbarui {new Date(product.updated_at).toLocaleDateString('id-ID')}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-500 dark:text-[#9d9db9] font-mono">{product.sku}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#282839] text-xs font-medium text-gray-600 dark:text-[#9d9db9]">
                                                            {product.category_name || 'Tanpa Kategori'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-900 dark:text-white font-medium text-sm text-yellow-600 dark:text-yellow-500">{formatRupiah(product.purchase_price || 0)}</td>
                                                    <td className="p-4 text-gray-900 dark:text-white font-medium">{formatRupiah(product.price)}</td>
                                                    <td className="p-4 text-gray-900 dark:text-white">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-16 bg-gray-200 dark:bg-[#282839] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${getStockColor(product.stock_quantity, product.low_stock_threshold)} rounded-full`}
                                                                    style={{ width: `${getStockPercentage(product.stock_quantity)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 dark:text-[#9d9db9]">{product.stock_quantity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!product.is_active}
                                                                onChange={() => toggleActive(product.id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 dark:bg-[#282839] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                                                        </label>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-100">
                                                            <button
                                                                onClick={() => openEditModal(product)}
                                                                className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] flex items-center justify-between transition-colors">
                                <div className="text-xs text-gray-500 dark:text-[#9d9db9]">
                                    Menampilkan <span className="text-gray-900 dark:text-white font-medium">
                                        {productList.length > 0 ? (currentPage - 1) * perPage + 1 : 0}
                                        -
                                        {Math.min(currentPage * perPage, totalItems)}
                                    </span> dari <span className="text-gray-900 dark:text-white font-medium">{totalItems}</span> produk
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#282839] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-[#9d9db9]"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Simple logic to show a window of pages around current page
                                            let pageNum = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage > 3) {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                if (pageNum > totalPages) {
                                                    pageNum = totalPages - 4 + i;
                                                }
                                            }

                                            // Ensure we don't go out of bounds (simple safety)
                                            if (pageNum < 1) pageNum = 1;
                                            if (pageNum > totalPages) return null;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`size-8 rounded-lg text-xs font-medium transition-colors ${currentPage === pageNum
                                                        ? 'bg-primary text-white'
                                                        : 'hover:bg-gray-100 dark:hover:bg-[#282839] text-gray-600 dark:text-[#9d9db9]'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#282839] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-[#9d9db9]"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CRUD Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#1c1c27] rounded-xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#282839] transition-colors">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Nama Produk</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Harga Beli</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            value={formData.purchase_price ? formatNumber(formData.purchase_price) : ''}
                                            onChange={e => setFormData({ ...formData, purchase_price: parseFormattedNumber(e.target.value).toString() })}
                                            placeholder="0"
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Harga Jual (Ecer)</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            value={formData.price ? formatNumber(formData.price) : ''}
                                            onChange={e => setFormData({ ...formData, price: parseFormattedNumber(e.target.value).toString() })}
                                            placeholder="0"
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Harga Grosir</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.price_grosir ? formatNumber(formData.price_grosir) : ''}
                                            onChange={e => setFormData({ ...formData, price_grosir: parseFormattedNumber(e.target.value).toString() })}
                                            placeholder="Optional"
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Harga Reseller</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.price_reseller ? formatNumber(formData.price_reseller) : ''}
                                            onChange={e => setFormData({ ...formData, price_reseller: parseFormattedNumber(e.target.value).toString() })}
                                            placeholder="Optional"
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Stok</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock_quantity}
                                            onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Kategori</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">SKU (Opsional)</label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 dark:text-[#9d9db9] mb-1">Gambar Produk</label>
                                        <div className="flex items-center gap-4">
                                            {formData.image_url && (
                                                <div className="size-16 rounded-lg bg-gray-200 dark:bg-[#282839] bg-center bg-cover shrink-0 border border-slate-200 dark:border-[#3b3c54]"
                                                    style={{ backgroundImage: `url("${formData.image_url}")` }}
                                                />
                                            )}
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="w-full text-sm text-gray-500 dark:text-[#9d9db9]
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-lg file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-gray-100 dark:file:bg-[#282839] file:text-gray-900 dark:file:text-white
                                                        hover:file:bg-gray-200 dark:hover:file:bg-[#3b3c54] cursor-pointer"
                                                    disabled={uploading}
                                                />
                                                {uploading && <p className="text-xs text-primary mt-1">Mengunggah...</p>}
                                            </div>
                                        </div>
                                        {/* Hidden input to store URL */}
                                        <input type="hidden" value={formData.image_url} />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#282839] transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {currentProduct ? 'Simpan' : 'Buat Produk'}
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

export default ProductsPage;
