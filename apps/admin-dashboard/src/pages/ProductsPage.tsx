import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatRupiah } from '../utils/format';
import { DashboardContextType } from '../layouts/DashboardLayout';
import { BarcodePreview } from '../components/BarcodePreview';
import { generateBarcodePdf, downloadBlob, openPdfBlob } from '../utils/barcode128';
import ImportExcelModal from '../components/ImportExcelModal';
import BulkMarginModal from '../components/BulkMarginModal';
import QuickPriceModal from '../components/QuickPriceModal';
import ApproveProductModal from '../components/ApproveProductModal';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';

export interface ProductUnitData {
    id?: string;
    product_id?: string;
    unit_name: string;
    conversion_factor: number;
    price: number;
    wholesale_price?: number | null;
    reseller_price?: number | null;
    barcode?: string | null;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    category_name: string;
    price: number;
    purchase_price: number;
    wholesale_price?: number | null;
    wholesale_min_qty?: number;
    reseller_price?: number | null;
    base_unit?: string;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: number | boolean;
    updated_at: string;
    created_at?: string;
    image_url: string;
    category_id: number | null;
    units?: ProductUnitData[];
    approval_status?: 'approved' | 'pending' | 'rejected' | string;
    submitted_by?: string | null;
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
    const [conditionFilter, setConditionFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'loss' | 'pending'>('all');
    const [filterCounts, setFilterCounts] = useState({
        total: 0,
        out_of_stock: 0,
        low_stock: 0,
        loss: 0,
        pending: 0
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [paginationInfo, setPaginationInfo] = useState({
        current_page: 1,
        per_page: 50,
        total: 0,
        total_pages: 1
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        purchase_price: '',
        wholesale_price: '',
        wholesale_min_qty: '12',
        reseller_price: '',
        base_unit: 'pcs',
        stock_quantity: '',
        category_id: '',
        sku: '',
        image_url: ''
    });
    const [productUnits, setProductUnits] = useState<ProductUnitData[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBulkMarginModalOpen, setIsBulkMarginModalOpen] = useState(false);

    // Granular Permissions Auth
    const { user, hasPermission } = useAuth();
    const isAdmin = user?.role === 'admin';
    const canViewCost = hasPermission('products.view_cost');
    const canUpdateStock = hasPermission('products.update_stock') || hasPermission('inventory.adjust');
    const canEditPrice = hasPermission('products.edit_price');
    const canCreate = hasPermission('products.create');
    const canEdit = hasPermission('products.edit');
    const canDelete = hasPermission('products.delete');
    const canImportExport = hasPermission('products.import_export');
    const canPrintBarcode = hasPermission('barcode.print');
    const requiresApprovalOnCreate = !isAdmin && !canViewCost;
    const canApprovePending = isAdmin || (canEdit && canViewCost);

    // Approve Pending Product Modal State (Khusus Admin konfirmasi & isi modal)
    const [approveModalProduct, setApproveModalProduct] = useState<Product | null>(null);

    // Quick Stock Modal State (Khusus Kasir / Karyawan input stok fisik)
    const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
    const [quickStockValue, setQuickStockValue] = useState<number>(0);
    const [isSavingStock, setIsSavingStock] = useState(false);

    // Quick Price Modal State (Khusus Kasir / Karyawan sesuaikan harga jual)
    const [priceModalProduct, setPriceModalProduct] = useState<Product | null>(null);

    const openQuickStockModal = (product: Product) => {
        setStockModalProduct(product);
        setQuickStockValue(Number(product.stock_quantity) || 0);
    };

    const openQuickPriceModal = (product: Product) => {
        setPriceModalProduct(product);
    };

    const handleQuickStockSave = async () => {
        if (!stockModalProduct) return;
        setIsSavingStock(true);
        try {
            await api.patch(`/products/${stockModalProduct.id}/stock`, {
                stock_quantity: Number(quickStockValue)
            });
            toast.success(`Stok "${stockModalProduct.name}" berhasil diperbarui ke ${quickStockValue}!`);
            setProductList(prev => prev.map(p => p.id === stockModalProduct.id ? { ...p, stock_quantity: Number(quickStockValue) } : p));
            setStockModalProduct(null);
            fetchFilterCounts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui stok');
        } finally {
            setIsSavingStock(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, statusFilter, conditionFilter]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            fetchProducts();
        }
    }, [currentPage, perPage, categoryFilter, statusFilter, conditionFilter, searchQuery]);

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

    const fetchFilterCounts = async () => {
        try {
            const params = new URLSearchParams();
            if (categoryFilter && categoryFilter !== 'all') params.append('category_id', categoryFilter);
            const res = await api.get(`/products/filter-counts?${params.toString()}`);
            if (res.data?.data) {
                setFilterCounts({
                    total: 0,
                    out_of_stock: 0,
                    low_stock: 0,
                    loss: 0,
                    pending: 0,
                    ...res.data.data
                });
            }
        } catch (error) {
            console.error('Error fetching filter counts:', error);
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
            if (conditionFilter && conditionFilter !== 'all') params.append('condition', conditionFilter);

            const url = `/products?${params.toString()}`;
            const response = await api.get(url);

            // Handle pagination structure
            if (response.data.data.products) {
                setProductList(response.data.data.products);
                if (response.data.data.pagination) {
                    setPaginationInfo(response.data.data.pagination);
                }
                if (response.data.data.counts) {
                    setFilterCounts({
                        total: 0,
                        out_of_stock: 0,
                        low_stock: 0,
                        loss: 0,
                        pending: 0,
                        ...response.data.data.counts
                    });
                }
            } else {
                setProductList(response.data.data);
                setPaginationInfo({
                    current_page: 1,
                    per_page: response.data.data.length,
                    total: response.data.data.length,
                    total_pages: 1
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchProducts();
            return;
        }
        setLoading(true);
        try {
            let searchUrl = `/products/search?q=${encodeURIComponent(searchQuery)}`;
            if (conditionFilter && conditionFilter !== 'all') {
                searchUrl += `&condition=${encodeURIComponent(conditionFilter)}`;
            }
            const response = await api.get(searchUrl);
            const data = response.data.data;
            if (Array.isArray(data)) {
                setProductList(data);
                setPaginationInfo({
                    current_page: 1,
                    per_page: data.length,
                    total: data.length,
                    total_pages: 1
                });
            } else if (data && data.products) {
                setProductList(data.products);
                setPaginationInfo({
                    current_page: 1,
                    per_page: data.products.length,
                    total: data.products.length,
                    total_pages: 1
                });
            } else {
                setProductList([]);
                setPaginationInfo({
                    current_page: 1,
                    per_page: perPage,
                    total: 0,
                    total_pages: 1
                });
            }
        } catch (error) {
            console.error('Error searching products:', error);
            setProductList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);

            const res = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.data?.url) {
                setFormData(prev => ({ ...prev, image_url: res.data.data.url }));
                toast.success('Gambar berhasil diupload!');
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal mengupload gambar';
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
            purchase_price: '',
            wholesale_price: '',
            wholesale_min_qty: '12',
            reseller_price: '',
            base_unit: 'pcs',
            stock_quantity: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            sku: '',
            image_url: ''
        });
        setProductUnits([]);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            price: product.price ? product.price.toString() : '',
            purchase_price: (product.purchase_price || 0).toString(),
            wholesale_price: product.wholesale_price ? product.wholesale_price.toString() : '',
            wholesale_min_qty: (product.wholesale_min_qty || 12).toString(),
            reseller_price: product.reseller_price ? product.reseller_price.toString() : '',
            base_unit: product.base_unit || 'pcs',
            stock_quantity: product.stock_quantity.toString(),
            category_id: product.category_id ? product.category_id.toString() : '',
            sku: product.sku || '',
            image_url: product.image_url || ''
        });
        setProductUnits(product.units && Array.isArray(product.units) ? product.units : []);
        setIsModalOpen(true);
    };

    const handleAddUnit = () => {
        const cost = parseFloat(formData.purchase_price) || 0;
        const retailPerPcs = parseFloat(formData.price) || 0;
        const wholesalePerPcs = parseFloat(formData.wholesale_price) || retailPerPcs;
        const resellerPerPcs = parseFloat(formData.reseller_price) || retailPerPcs;

        setProductUnits(prev => [
            ...prev,
            {
                unit_name: 'Lusin',
                conversion_factor: 12,
                price: retailPerPcs * 12,
                wholesale_price: wholesalePerPcs * 12,
                reseller_price: resellerPerPcs * 12,
                barcode: ''
            }
        ]);
    };

    const handleUpdateUnit = (index: number, field: keyof ProductUnitData, value: any) => {
        setProductUnits(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemoveUnit = (index: number) => {
        setProductUnits(prev => prev.filter((_, i) => i !== index));
    };

    const handleAutoCalculatePrices = () => {
        const cost = parseFloat(formData.purchase_price);
        if (isNaN(cost) || cost <= 0) {
            toast.error('Masukkan Harga Beli (Modal) terlebih dahulu!');
            return;
        }
        // Round up to nearest 500
        const roundTo500 = (val: number) => Math.ceil(val / 500) * 500;
        
        const retail = roundTo500(cost * 1.35); // +35% Ecer
        const wholesale = roundTo500(cost * 1.25); // +25% Grosir
        const reseller = roundTo500(cost * 1.20); // +20% Reseller

        setFormData(prev => ({
            ...prev,
            price: retail.toString(),
            wholesale_price: wholesale.toString(),
            reseller_price: reseller.toString(),
        }));
        toast.success('Harga ecer, grosir, dan reseller terisi otomatis dengan margin aman!');
    };

    const calculateMargin = (sellPriceStr: string, costPriceStr: string) => {
        const sell = parseFloat(sellPriceStr);
        const cost = parseFloat(costPriceStr);
        if (isNaN(sell) || sell <= 0) return null;
        const costVal = isNaN(cost) ? 0 : cost;
        const profit = sell - costVal;
        const percentage = costVal > 0 ? (profit / costVal) * 100 : 100;
        const isLoss = profit < 0;
        return { profit, percentage: percentage.toFixed(1), isLoss };
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isCashierSubmission = !currentProduct && requiresApprovalOnCreate;
            const price = formData.price !== '' ? parseFloat(formData.price) : 0;
            const purchase_price = isCashierSubmission ? 0 : (formData.purchase_price !== '' ? parseFloat(formData.purchase_price) : 0);
            const stock_quantity = parseInt(formData.stock_quantity);
            const wholesale_price = formData.wholesale_price ? parseFloat(formData.wholesale_price) : null;
            const reseller_price = formData.reseller_price ? parseFloat(formData.reseller_price) : null;
            const wholesale_min_qty = parseInt(formData.wholesale_min_qty) || 12;

            if (!isCashierSubmission && canViewCost && purchase_price > 0 && price < purchase_price) {
                const proceed = await confirm({
                    title: 'Peringatan Harga Jual Rugi!',
                    message: `Harga jual ecer (${formatRupiah(price)}) lebih murah dari harga beli modal (${formatRupiah(purchase_price)}). Anda akan mengalami kerugian. Tetap simpan?`,
                    confirmText: 'Tetap Simpan',
                    cancelText: 'Perbaiki Harga',
                    type: 'danger'
                });
                if (!proceed) return;
            }

            const payload = {
                ...formData,
                price: isNaN(price) ? 0 : price,
                purchase_price: isNaN(purchase_price) ? 0 : purchase_price,
                wholesale_price: wholesale_price,
                wholesale_min_qty: wholesale_min_qty,
                reseller_price: reseller_price,
                base_unit: formData.base_unit || 'pcs',
                stock_quantity: isNaN(stock_quantity) ? 0 : stock_quantity,
                category_id: formData.category_id ? parseInt(formData.category_id) : null,
                units: productUnits
            };

            if (currentProduct) {
                await api.put(`/products/${currentProduct.id}`, payload);
                toast.success('Produk berhasil diperbarui!');
            } else {
                const res = await api.post('/products', payload);
                if (isCashierSubmission) {
                    toast.success(res.data?.message || 'Produk diajukan! Menunggu konfirmasi & input harga modal dari Admin.', { duration: 4500 });
                    window.dispatchEvent(new Event('products-pending-updated'));
                } else {
                    toast.success('Produk berhasil ditambahkan!');
                }
            }

            setIsModalOpen(false);
            fetchProducts(); // Refresh list & counts
        } catch (error: any) {
            console.error('Error saving product:', error);
            const msg = error.response?.data?.message || 'Gagal menyimpan produk. Pastikan semua field valid.';
            toast.error(msg);
        }
    };

    const handleDownloadSingleProductPdf = async (targetProduct?: Product) => {
        const prod = targetProduct || (currentProduct ? {
            ...currentProduct,
            name: formData.name || currentProduct.name,
            sku: formData.sku || currentProduct.sku,
            price: parseFloat(formData.price) || currentProduct.price
        } : null);

        if (!prod) {
            toast.error('Data produk tidak tersedia.');
            return;
        }

        try {
            toast.loading(`Membuat barcode untuk ${prod.name}...`, { id: 'single-prod-pdf' });
            const blob = await generateBarcodePdf([{
                id: prod.id,
                name: prod.name,
                sku: prod.sku || '0000',
                price: Number(prod.price || 0)
            }], {
                layout: 'grid3x8',
                copiesPerProduct: 24, // 1 lembar stiker A4 isi 24 label untuk produk ini
                showStoreName: true,
                showPrice: true,
                storeName: 'TOKO LAKSANA'
            });
            toast.dismiss('single-prod-pdf');
            downloadBlob(blob, `Barcode-${prod.sku || '0000'}-${prod.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
            toast.success(`PDF barcode (${prod.name}) berhasil diunduh!`);
        } catch (e) {
            toast.dismiss('single-prod-pdf');
            toast.error('Gagal membuat barcode produk.');
        }
    };

    const handlePrintSingleProductDirect = async (targetProduct?: Product) => {
        const prod = targetProduct || (currentProduct ? {
            ...currentProduct,
            name: formData.name || currentProduct.name,
            sku: formData.sku || currentProduct.sku,
            price: parseFloat(formData.price) || currentProduct.price
        } : null);

        if (!prod) return;

        try {
            const blob = await generateBarcodePdf([{
                id: prod.id,
                name: prod.name,
                sku: prod.sku || '0000',
                price: Number(prod.price || 0)
            }], {
                layout: 'grid3x8',
                copiesPerProduct: 24,
                showStoreName: true,
                showPrice: true,
                storeName: 'TOKO LAKSANA'
            });
            openPdfBlob(blob);
        } catch {
            toast.error('Gagal membuka preview cetak.');
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
                            className="p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0" title="Buka Menu"
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
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <UserMenu />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
                        {/* Action Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Dropdown 1: Kategori */}
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="appearance-none h-10 pl-4 pr-10 rounded-xl bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-primary focus:border-primary transition-colors cursor-pointer shadow-sm"
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

                                {/* Dropdown 2: Status */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none h-10 pl-4 pr-10 rounded-xl bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-primary focus:border-primary transition-colors cursor-pointer shadow-sm"
                                    >
                                        <option value="all">Status: Semua</option>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Nonaktif</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-[#9d9db9]">
                                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                    </div>
                                </div>

                                {/* Dropdown 3: Filter Kondisi Stok & Harga Rugi */}
                                <div className="relative">
                                    <select
                                        value={conditionFilter}
                                        onChange={(e) => setConditionFilter(e.target.value as any)}
                                        className={`appearance-none h-10 pl-3.5 pr-9 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm ${
                                            conditionFilter === 'out_of_stock'
                                                ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                                                : conditionFilter === 'low_stock'
                                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                                                : conditionFilter === 'loss'
                                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                                                : conditionFilter === 'pending'
                                                ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400'
                                                : 'bg-white dark:bg-[#111118] border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white'
                                        }`}
                                    >
                                        <option value="all">Semua Kondisi Produk</option>
                                        <option value="out_of_stock">🔴 Barang Habis (Stok 0)</option>
                                        <option value="low_stock">⚠️ Stok Sedikit (Menipis)</option>
                                        {canViewCost && <option value="loss">💥 Penjualan Rugi (Jual &lt; Modal)</option>}
                                        <option value="pending">⏳ Menunggu Konfirmasi Admin ({filterCounts.pending})</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-[#9d9db9]">
                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Aksi Kanan */}
                            <div className="flex flex-wrap items-center gap-2">
                                {canEditPrice && (
                                    <button
                                        onClick={() => setIsBulkMarginModalOpen(true)}
                                        className="h-10 px-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-1.5 shadow-sm"
                                        title="Terapkan rumus margin grosir & reseller massal ke seluruh produk"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                                        <span>Margin Massal</span>
                                    </button>
                                )}
                                {canImportExport && (
                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="h-10 px-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5 shadow-sm"
                                        title="Import data produk dari Excel / CSV"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                        <span>Import Excel</span>
                                    </button>
                                )}
                                {canImportExport && (
                                    <button
                                        onClick={handleExportCSV}
                                        className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] text-gray-900 dark:text-white text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-green-500">file_download</span>
                                        <span className="hidden sm:inline">Export</span>
                                    </button>
                                )}
                                {canCreate && (
                                    <button
                                        onClick={openAddModal}
                                        className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Tambah Produk
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Filter Chips (Pill Badges Interaktif) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 pb-0.5">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#9d9db9] flex items-center gap-1 mr-1">
                                <span className="material-symbols-outlined text-[16px]">tune</span>
                                Filter Khusus:
                            </span>

                            {/* Chip 1: Semua Produk */}
                            <button
                                type="button"
                                onClick={() => setConditionFilter('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                    conditionFilter === 'all'
                                        ? 'bg-primary text-white border-primary shadow-primary/25'
                                        : 'bg-white dark:bg-[#111118] text-gray-600 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-primary/50'
                                }`}
                            >
                                <span>Semua Produk</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                    conditionFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {filterCounts.total.toLocaleString('id-ID')}
                                </span>
                            </button>

                            {/* Chip 2: Barang Habis */}
                            <button
                                type="button"
                                onClick={() => setConditionFilter(conditionFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                    conditionFilter === 'out_of_stock'
                                        ? 'bg-red-600 text-white border-red-600 shadow-red-600/25 ring-2 ring-red-500/20'
                                        : 'bg-white dark:bg-[#111118] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-red-400 hover:text-red-500'
                                }`}
                            >
                                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                                <span>Barang Habis</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    conditionFilter === 'out_of_stock' ? 'bg-white/25 text-white' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                                }`}>
                                    {filterCounts.out_of_stock.toLocaleString('id-ID')}
                                </span>
                            </button>

                            {/* Chip 3: Stok Sedikit */}
                            <button
                                type="button"
                                onClick={() => setConditionFilter(conditionFilter === 'low_stock' ? 'all' : 'low_stock')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                    conditionFilter === 'low_stock'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/25 ring-2 ring-amber-500/20'
                                        : 'bg-white dark:bg-[#111118] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-amber-400 hover:text-amber-500'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px] text-amber-500">warning</span>
                                <span>Stok Sedikit</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    conditionFilter === 'low_stock' ? 'bg-white/25 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                }`}>
                                    {filterCounts.low_stock.toLocaleString('id-ID')}
                                </span>
                            </button>

                            {/* Chip 4: Live Penjualan Harga Rugi */}
                            {canViewCost && (
                                <button
                                    type="button"
                                    onClick={() => setConditionFilter(conditionFilter === 'loss' ? 'all' : 'loss')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                        conditionFilter === 'loss'
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-rose-600/25 ring-2 ring-rose-500/20 animate-pulse'
                                            : 'bg-white dark:bg-[#111118] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-rose-400 hover:text-rose-500'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] text-rose-500">trending_down</span>
                                    <span>Penjualan Rugi (Jual &lt; Modal)</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        conditionFilter === 'loss' ? 'bg-white/25 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                    }`}>
                                        {filterCounts.loss.toLocaleString('id-ID')}
                                    </span>
                                </button>
                            )}

                            {/* Chip 5: Menunggu Konfirmasi Admin (Ajuan Kasir) */}
                            {(canApprovePending || canCreate || filterCounts.pending > 0) && (
                                <button
                                    type="button"
                                    onClick={() => setConditionFilter(conditionFilter === 'pending' ? 'all' : 'pending')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                                        conditionFilter === 'pending'
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-orange-500/25 ring-2 ring-orange-500/20'
                                            : filterCounts.pending > 0
                                            ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-950/50'
                                            : 'bg-white dark:bg-[#111118] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-[#282839] hover:border-orange-400 hover:text-orange-500'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-[14px] ${conditionFilter === 'pending' ? 'text-white' : 'text-orange-500'} ${filterCounts.pending > 0 && conditionFilter !== 'pending' ? 'animate-pulse' : ''}`}>
                                        hourglass_top
                                    </span>
                                    <span>{canApprovePending ? 'Menunggu Konfirmasi' : 'Ajuan Menunggu Admin'}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        conditionFilter === 'pending'
                                            ? 'bg-white/25 text-white'
                                            : filterCounts.pending > 0
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
                                    }`}>
                                        {filterCounts.pending.toLocaleString('id-ID')}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Banner Aktif Filter Khusus */}
                        {conditionFilter !== 'all' && (
                            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
                                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                                        Menampilkan filter khusus:{' '}
                                        <strong className="text-primary font-bold">
                                            {conditionFilter === 'out_of_stock'
                                                ? 'Barang Habis (Stok 0)'
                                                : conditionFilter === 'low_stock'
                                                ? 'Barang Stok Sedikit (Menipis)'
                                                : conditionFilter === 'pending'
                                                ? 'Produk Baru Menunggu Konfirmasi & Input Modal Admin'
                                                : 'Barang Penjualan Harga Rugi (Jual < Modal)'}
                                        </strong>{' '}
                                        ({paginationInfo.total.toLocaleString('id-ID')} produk ditemukan)
                                    </span>
                                </div>
                                <button
                                    onClick={() => setConditionFilter('all')}
                                    className="text-primary hover:underline font-bold flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                    Reset Filter
                                </button>
                            </div>
                        )}

                        {/* Table */}
                        <div className="rounded-2xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1c1c27] border-b border-slate-200 dark:border-[#282839] text-gray-500 dark:text-[#9d9db9] text-xs uppercase tracking-wider font-semibold transition-colors">
                                            <th className="p-4 w-16 text-center">Gambar</th>
                                            <th className="p-4 min-w-[200px]">Nama Produk</th>
                                            <th className="p-4 min-w-[120px]">SKU</th>
                                            <th className="p-4 min-w-[120px]">Kategori</th>
                                            {canViewCost && <th className="p-4 min-w-[100px]">Harga Beli</th>}
                                            <th className="p-4 min-w-[100px]">
                                                <div className="flex items-center gap-1">
                                                    <span>Harga Jual</span>
                                                    {canViewCost && productList.some(p => {
                                                        const costVal = parseFloat(String(p.purchase_price || 0)) || 0;
                                                        const priceVal = parseFloat(String(p.price || 0)) || 0;
                                                        return costVal > 0 && priceVal < costVal;
                                                    }) && (
                                                        <span className="text-red-500 font-extrabold text-xs" title="Ada produk yang harga jualnya di bawah harga beli modal (*)">(*)</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="p-4 min-w-[100px]">Stok</th>
                                            <th className="p-4 text-center min-w-[100px]">Status</th>
                                            <th className="p-4 text-right min-w-[120px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-200 dark:divide-[#282839]">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={canViewCost ? 9 : 8} className="p-12 text-center text-gray-500 dark:text-[#9d9db9]">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                                                        <span className="text-sm font-semibold">Memuat produk...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : productList.length === 0 ? (
                                            <tr>
                                                <td colSpan={canViewCost ? 9 : 8} className="p-12 text-center text-gray-500 dark:text-[#9d9db9]">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">inventory_2</span>
                                                        <p className="text-sm font-semibold">
                                                            {conditionFilter === 'out_of_stock'
                                                                ? 'Bagus! Tidak ada barang yang habis stok.'
                                                                : conditionFilter === 'low_stock'
                                                                ? 'Aman! Tidak ada produk dengan stok menipis.'
                                                                : conditionFilter === 'loss'
                                                                ? 'Bagus! Semua harga jual produk sudah di atas modal (tidak ada yang rugi).'
                                                                : conditionFilter === 'pending'
                                                                ? 'Tidak ada pengajuan produk baru yang menunggu konfirmasi.'
                                                                : 'Tidak ada produk ditemukan.'}
                                                        </p>
                                                        {conditionFilter !== 'all' && (
                                                            <button
                                                                onClick={() => setConditionFilter('all')}
                                                                className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary/90"
                                                            >
                                                                Tampilkan Semua Produk
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            productList.map((product) => {
                                                const cost = parseFloat(String(product.purchase_price || 0)) || 0;
                                                const price = parseFloat(String(product.price || 0)) || 0;
                                                const wsPrice = parseFloat(String(product.wholesale_price || 0)) || 0;
                                                const rsPrice = parseFloat(String(product.reseller_price || 0)) || 0;
                                                const isPending = product.approval_status === 'pending' || conditionFilter === 'pending';
                                                const isRowLoss = !isPending && canViewCost && cost > 0 && (price < cost || (wsPrice > 0 && wsPrice < cost) || (rsPrice > 0 && rsPrice < cost));

                                                return (
                                                <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-[#1c1c27] transition-colors group ${isPending ? 'bg-amber-50/40 dark:bg-amber-950/10' : isRowLoss ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                                                    <td className="p-4">
                                                        <div
                                                            className="size-10 rounded-lg bg-gray-200 dark:bg-[#282839] bg-center bg-cover border border-slate-300 dark:border-[#3b3c54]"
                                                            style={{ backgroundImage: `url("${product.image_url || 'https://via.placeholder.com/150'}")` }}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900 dark:text-white flex items-center flex-wrap gap-1.5">
                                                            <span>{product.name}</span>
                                                            {isPending && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                                                    MENUNGGU ADMIN
                                                                </span>
                                                            )}
                                                            {isRowLoss && (
                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800" title="Harga jual di bawah harga beli modal">
                                                                    RUGI
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-500 dark:text-[#55556d] text-xs mt-0.5">
                                                            {isPending
                                                                ? `Diajukan oleh ${product.submitted_by || 'Kasir'} • ${new Date(product.created_at || product.updated_at).toLocaleDateString('id-ID')}`
                                                                : `Diperbarui ${new Date(product.updated_at).toLocaleDateString('id-ID')}`}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-500 dark:text-[#9d9db9] font-mono">{product.sku}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#282839] text-xs font-medium text-gray-600 dark:text-[#9d9db9]">
                                                            {product.category_name || 'Tanpa Kategori'}
                                                        </span>
                                                    </td>
                                                    {canViewCost && (
                                                        <td className="p-4 text-gray-900 dark:text-white font-medium text-sm text-yellow-600 dark:text-yellow-500">
                                                            {isPending ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                                                    Belum diisi
                                                                </span>
                                                            ) : (
                                                                formatRupiah(product.purchase_price || 0)
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-gray-900 dark:text-white font-medium">
                                                        {(() => {
                                                            const isLoss = !isPending && canViewCost && cost > 0 && price < cost;
                                                            const formatted = formatRupiah(price);
                                                            const numOnly = formatted.replace(/^Rp\s?/, '');
                                                            const lossAmount = Math.max(0, cost - price);

                                                            return (
                                                                <div className="flex items-start justify-between gap-1 group/price">
                                                                    <div className="min-w-0">
                                                                        {isPending && price <= 0 ? (
                                                                            <span className="text-xs italic text-amber-600 dark:text-amber-400 font-semibold">
                                                                                Belum diisi kasir
                                                                            </span>
                                                                        ) : isLoss ? (
                                                                            <div>
                                                                                <div
                                                                                    className="inline-flex items-center flex-wrap gap-1 text-red-600 dark:text-red-400 font-bold"
                                                                                    title={`⚠️ PERINGATAN POTENSI RUGI:\nHarga Jual (Rp ${numOnly}) lebih rendah dari Modal Beli (${formatRupiah(cost)}).\nRugi: Rp ${formatRupiah(lossAmount).replace(/^Rp\s?/, '')} per ${product.base_unit || 'pcs'}`}
                                                                                >
                                                                                    <span className="inline-flex items-center">
                                                                                        <span>Rp</span>
                                                                                        <span className="inline-flex items-center justify-center font-black text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-1 py-0.5 rounded border border-red-300 dark:border-red-700 mx-0.5 shadow-sm animate-pulse">
                                                                                            (*)
                                                                                        </span>
                                                                                        <span>{numOnly}</span>
                                                                                    </span>
                                                                                    <span className="text-[10px] text-red-400 dark:text-red-500 font-normal">/{product.base_unit || 'pcs'}</span>
                                                                                </div>
                                                                                <div className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5 mt-0.5 animate-pulse">
                                                                                    <span className="material-symbols-outlined text-[13px]">warning</span>
                                                                                    <span>Rugi Rp {formatRupiah(lossAmount).replace(/^Rp\s?/, '')}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <span>Rp {numOnly}</span>{' '}
                                                                                <span className="text-[10px] text-gray-400">/{product.base_unit || 'pcs'}</span>
                                                                            </div>
                                                                        )}

                                                                        {(product.wholesale_price || product.reseller_price) && (
                                                                            <div className="flex flex-wrap gap-1 text-[10px] font-semibold mt-1">
                                                                                {product.wholesale_price && (() => {
                                                                                    const isWsLoss = canViewCost && cost > 0 && wsPrice > 0 && wsPrice < cost;
                                                                                    const wsNum = formatRupiah(wsPrice).replace(/^Rp\s?/, '');
                                                                                    const wsLossAmount = Math.max(0, cost - wsPrice);
                                                                                    return (
                                                                                        <span
                                                                                            className={`px-1.5 py-0.5 rounded ${
                                                                                                isWsLoss
                                                                                                    ? 'bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 font-bold'
                                                                                                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                                                                                            }`}
                                                                                            title={
                                                                                                isWsLoss
                                                                                                    ? `⚠️ Grosir Rugi: Rp ${wsNum} < Modal ${formatRupiah(cost)} (Rugi Rp ${formatRupiah(wsLossAmount).replace(/^Rp\s?/, '')})`
                                                                                                    : `Grosir min ${product.wholesale_min_qty || 12} ${product.base_unit || 'pcs'}`
                                                                                            }
                                                                                        >
                                                                                            G: Rp{isWsLoss && <span className="text-red-600 dark:text-red-400 font-black ml-0.5 mr-0.5">(*)</span>}{wsNum}
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                                {product.reseller_price && (() => {
                                                                                    const isRsLoss = canViewCost && cost > 0 && rsPrice > 0 && rsPrice < cost;
                                                                                    const rsNum = formatRupiah(rsPrice).replace(/^Rp\s?/, '');
                                                                                    const rsLossAmount = Math.max(0, cost - rsPrice);
                                                                                    return (
                                                                                        <span
                                                                                            className={`px-1.5 py-0.5 rounded ${
                                                                                                isRsLoss
                                                                                                    ? 'bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 font-bold'
                                                                                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                                                                            }`}
                                                                                            title={
                                                                                                isRsLoss
                                                                                                    ? `⚠️ Reseller Rugi: Rp ${rsNum} < Modal ${formatRupiah(cost)} (Rugi Rp ${formatRupiah(rsLossAmount).replace(/^Rp\s?/, '')})`
                                                                                                    : 'Reseller'
                                                                                            }
                                                                                        >
                                                                                            R: Rp{isRsLoss && <span className="text-red-600 dark:text-red-400 font-black ml-0.5 mr-0.5">(*)</span>}{rsNum}
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        {product.units && product.units.length > 0 && (
                                                                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold">
                                                                                +{product.units.length} Satuan ({product.units.map(u => u.unit_name).join(', ')})
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Quick Price Edit Button (Kasir / Staff bisa ubah harga) */}
                                                                    {canEditPrice && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openQuickPriceModal(product)}
                                                                            className="size-6 shrink-0 inline-flex items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all shadow-sm opacity-80 group-hover/price:opacity-100"
                                                                            title="Ubah Harga Jual, Grosir & Reseller"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[14px]">price_change</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-4 text-gray-900 dark:text-white">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-16 bg-gray-200 dark:bg-[#282839] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${getStockColor(product.stock_quantity, product.low_stock_threshold)} rounded-full`}
                                                                    style={{ width: `${getStockPercentage(product.stock_quantity)}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                <span className={`text-xs font-bold ${
                                                                    Number(product.stock_quantity) <= 0
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : Number(product.stock_quantity) <= (Number(product.low_stock_threshold) || 5)
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-gray-700 dark:text-[#9d9db9]'
                                                                }`}>
                                                                    {product.stock_quantity}
                                                                </span>
                                                                {Number(product.stock_quantity) <= 0 ? (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                                                                        Habis
                                                                    </span>
                                                                ) : Number(product.stock_quantity) <= (Number(product.low_stock_threshold) || 5) ? (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                                                                        Menipis
                                                                    </span>
                                                                ) : null}

                                                                {/* Quick Stock Edit Button (Karyawan kasir bisa update stok fisik) */}
                                                                {canUpdateStock && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openQuickStockModal(product)}
                                                                        className="size-6 ml-1 inline-flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                                        title="Input & Update Jumlah Stok Fisik"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">edit_square</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {isPending ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                                                                <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                                                                Pending
                                                            </span>
                                                        ) : (
                                                            <label className={`relative inline-flex items-center ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!product.is_active}
                                                                    disabled={!canEdit}
                                                                    onChange={() => canEdit && toggleActive(product.id)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-9 h-5 bg-gray-200 dark:bg-[#282839] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                                                            </label>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-100">
                                                            {isPending ? (
                                                                canApprovePending ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setApproveModalProduct(product)}
                                                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                                        title="Review data, isi harga modal (HPP), lalu setujui & aktifkan"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">fact_check</span>
                                                                        <span>Konfirmasi &amp; Modal</span>
                                                                    </button>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                                                                        Menunggu Admin
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <>
                                                                    {canPrintBarcode && (
                                                                        <button
                                                                            onClick={() => handleDownloadSingleProductPdf(product)}
                                                                            className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                                                                            title="Unduh 1 Lembar Barcode Produk Ini"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                                                                        </button>
                                                                    )}
                                                                    {canEdit ? (
                                                                        <button
                                                                            onClick={() => openEditModal(product)}
                                                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20 transition-colors"
                                                                            title="Edit Data Produk (Master)"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            {canUpdateStock && (
                                                                                <button
                                                                                    onClick={() => openQuickStockModal(product)}
                                                                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                                                    title="Input & Update Stok Fisik"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                                                                </button>
                                                                            )}
                                                                            {canEditPrice && (
                                                                                <button
                                                                                    onClick={() => openQuickPriceModal(product)}
                                                                                    className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                                                                                    title="Ubah Harga Jual, Grosir & Reseller"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[18px]">price_change</span>
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    {canDelete && (
                                                                        <button
                                                                            onClick={() => handleDelete(product.id)}
                                                                            className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 transition-colors"
                                                                            title="Hapus Produk"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-[#282839] bg-white dark:bg-[#111118] flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-[#9d9db9]">
                                    <span>
                                        Menampilkan <span className="text-gray-900 dark:text-white font-medium">{paginationInfo.total === 0 ? 0 : (currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, paginationInfo.total)}</span> dari <span className="text-gray-900 dark:text-white font-medium">{paginationInfo.total}</span> produk
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span>Tampilkan:</span>
                                        <select
                                            value={perPage}
                                            onChange={(e) => {
                                                setPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-gray-100 dark:bg-[#282839] border-none rounded px-2.5 py-1 text-xs text-gray-900 dark:text-white font-medium focus:ring-1 focus:ring-primary cursor-pointer"
                                        >
                                            <option value={20}>20 per halaman</option>
                                            <option value={50}>50 per halaman</option>
                                            <option value={100}>100 per halaman</option>
                                            <option value={500}>500 (Tampilkan Semua)</option>
                                        </select>
                                    </div>
                                </div>

                                {paginationInfo.total_pages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage <= 1}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-[#9d9db9] hover:bg-gray-100 dark:hover:bg-[#1c1c27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Halaman Pertama"
                                        >
                                            <span className="material-symbols-outlined text-sm">first_page</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage <= 1}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-[#9d9db9] hover:bg-gray-100 dark:hover:bg-[#1c1c27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Sebelumnya"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-[#9d9db9]">
                                            Halaman <strong className="text-gray-900 dark:text-white">{currentPage}</strong> dari {paginationInfo.total_pages}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationInfo.total_pages))}
                                            disabled={currentPage >= paginationInfo.total_pages}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-[#9d9db9] hover:bg-gray-100 dark:hover:bg-[#1c1c27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Selanjutnya"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(paginationInfo.total_pages)}
                                            disabled={currentPage >= paginationInfo.total_pages}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-600 dark:text-[#9d9db9] hover:bg-gray-100 dark:hover:bg-[#1c1c27] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Halaman Terakhir"
                                        >
                                            <span className="material-symbols-outlined text-sm">last_page</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CRUD Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                        <div className="bg-white dark:bg-[#1c1c27] rounded-2xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#282839] shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[22px]">
                                            {currentProduct ? 'edit_square' : 'add_box'}
                                        </span>
                                        {currentProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-[#9d9db9]">
                                        Kelola harga bertingkat (ecer, grosir, reseller) dan satuan kemasan produk
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Modal Body Form */}
                            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                                {/* Banner Info khusus pengajuan Kasir (tanpa modal -> menunggu konfirmasi Admin) */}
                                {!currentProduct && requiresApprovalOnCreate && (
                                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] mt-0.5 shrink-0">
                                            hourglass_top
                                        </span>
                                        <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                            <p className="font-bold">Mode Pengajuan Produk Baru (Menunggu Konfirmasi Admin)</p>
                                            <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/90">
                                                Anda <strong>tidak perlu mengisi harga modal</strong>. Harga jual ecer, grosir, dan reseller boleh dikosongkan jika belum tahu. Produk yang diajukan akan masuk ke antrean Admin untuk dilengkapi harga modalnya sebelum aktif di kasir POS.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* SECTION 1: Informasi Produk Dasar */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Nama Produk <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nama lengkap barang (misal: Buku Tulis Sinar Dunia 38 Lembar)"
                                            className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Kategori
                                            </label>
                                            <select
                                                value={formData.category_id}
                                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                            >
                                                <option value="">Pilih Kategori</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Stok Satuan Dasar <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.stock_quantity}
                                                onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-bold focus:outline-none focus:border-primary transition-colors"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Satuan Dasar
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.base_unit}
                                                onChange={e => setFormData({ ...formData, base_unit: e.target.value.toLowerCase() })}
                                                placeholder="pcs, rim, botol..."
                                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white font-medium focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* SKU & Barcode Preview */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                SKU / Kode Barcode Satuan Dasar
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.sku}
                                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                placeholder="Contoh: 8991234567 atau LM6374"
                                                className="w-full bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-3.5 py-2 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">Kode ini yang dibaca scanner barcode saat barang satuan di-scan.</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl p-3 flex flex-col justify-between gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[15px] text-primary">barcode_scanner</span>
                                                    Barcode Satuan (Code 128)
                                                </span>
                                                <span className="text-[10px] font-mono text-gray-400 font-bold">{formData.sku || currentProduct?.sku || '0000'}</span>
                                            </div>
                                            <BarcodePreview
                                                sku={formData.sku || currentProduct?.sku || '0000'}
                                                height={30}
                                                showText={false}
                                                className="w-full py-0.5 border-slate-200 dark:border-slate-800"
                                            />
                                            <div className="flex items-center gap-1.5 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadSingleProductPdf()}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[11px] font-semibold transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                                                    <span>Unduh PDF</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintSingleProductDirect()}
                                                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg border border-slate-200 dark:border-[#282839] text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#282839] text-[11px] font-medium transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">print</span>
                                                    <span>Cetak</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: PENGATURAN HARGA (Satuan Dasar) */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#151520] border border-slate-200/80 dark:border-[#282839] space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                                Pengaturan Harga
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                (per {formData.base_unit || 'satuan'})
                                            </span>
                                        </div>
                                        {canViewCost && (
                                            <button
                                                type="button"
                                                onClick={handleAutoCalculatePrices}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm"
                                                title="Hitung otomatis harga ecer (+35%), grosir (+20%), dan reseller (+10%) dari modal"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                <span>Isi Otomatis Margin Aman</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Kolom Harga (3 kolom untuk Kasir tanpa modal, 4 kolom untuk Admin) */}
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewCost ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
                                        {/* 1. Modal / HPP (Hanya tampil jika punya izin lihat modal) */}
                                        {canViewCost && (
                                            <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] shadow-sm">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 uppercase">
                                                        Modal (HPP)
                                                    </span>
                                                </div>
                                                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                                    Harga Pokok
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        step="any"
                                                        value={formData.purchase_price}
                                                        onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                                                        placeholder="0"
                                                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                                                    Biaya kulakan per {formData.base_unit || 'pcs'}.
                                                </p>
                                            </div>
                                        )}

                                        {/* 2. Harga Ecer */}
                                        <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] shadow-sm">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 uppercase">
                                                    Eceran
                                                </span>
                                                {!currentProduct && requiresApprovalOnCreate && (
                                                    <span className="text-[10px] text-gray-400 font-medium">Opsional</span>
                                                )}
                                            </div>
                                            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                                Harga Ecer {(!currentProduct && requiresApprovalOnCreate) ? '' : <span className="text-red-500">*</span>}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 flex items-center">
                                                    Rp
                                                    {canViewCost && (() => {
                                                        const m = calculateMargin(formData.price, formData.purchase_price);
                                                        return m?.isLoss ? (
                                                            <span className="text-red-500 font-black ml-0.5 animate-pulse" title="Harga jual lebih rendah dari modal (*)">(*)</span>
                                                        ) : null;
                                                    })()}
                                                </span>
                                                <input
                                                    type="number"
                                                    required={!(!currentProduct && requiresApprovalOnCreate)}
                                                    min="0"
                                                    step="any"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                    placeholder={(!currentProduct && requiresApprovalOnCreate) ? 'Kosongkan jika tdk tahu' : '0'}
                                                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            {canViewCost ? (() => {
                                                const m = calculateMargin(formData.price, formData.purchase_price);
                                                if (!m) return <p className="text-[10px] text-gray-400 mt-1">Pelanggan umum</p>;
                                                return (
                                                    <p className={`text-[10px] font-semibold mt-1 ${m.isLoss ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {m.isLoss ? `⚠️ Rugi Rp ${formatRupiah(Math.abs(m.profit))}` : `Margin ${formatRupiah(m.profit)} · ${m.percentage}%`}
                                                    </p>
                                                );
                                            })() : (
                                                <p className="text-[10px] text-gray-400 mt-1">Pelanggan umum (boleh kosong)</p>
                                            )}
                                        </div>

                                        {/* 3. Harga Grosir */}
                                        <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] shadow-sm">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 uppercase">
                                                    Grosir
                                                </span>
                                            </div>
                                            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                                Harga Grosir
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 flex items-center">
                                                    Rp
                                                    {canViewCost && (() => {
                                                        const m = calculateMargin(formData.wholesale_price || formData.price, formData.purchase_price);
                                                        return m?.isLoss ? (
                                                            <span className="text-red-500 font-black ml-0.5 animate-pulse" title="Harga grosir lebih rendah dari modal (*)">(*)</span>
                                                        ) : null;
                                                    })()}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={formData.wholesale_price}
                                                    onChange={e => setFormData({ ...formData, wholesale_price: e.target.value })}
                                                    placeholder="Kosongkan jika tdk tahu"
                                                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            {canViewCost ? (() => {
                                                const m = calculateMargin(formData.wholesale_price || formData.price, formData.purchase_price);
                                                if (!m) return <p className="text-[10px] text-gray-400 mt-1">Pembelian banyak</p>;
                                                return (
                                                    <p className={`text-[10px] font-semibold mt-1 ${m.isLoss ? 'text-red-500 font-bold' : 'text-purple-600 dark:text-purple-400'}`}>
                                                        {m.isLoss ? `⚠️ Rugi Rp ${formatRupiah(Math.abs(m.profit))}` : `Margin ${formatRupiah(m.profit)} · ${m.percentage}%`}
                                                    </p>
                                                );
                                            })() : (
                                                <p className="text-[10px] text-gray-400 mt-1">Pembelian banyak (boleh kosong)</p>
                                            )}
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                                <span>Min:</span>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={formData.wholesale_min_qty}
                                                    onChange={e => setFormData({ ...formData, wholesale_min_qty: e.target.value })}
                                                    className="w-12 px-1 py-0.5 text-center bg-gray-100 dark:bg-[#111118] rounded border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white font-bold"
                                                />
                                                <span>{formData.base_unit || 'pcs'}</span>
                                            </div>
                                        </div>

                                        {/* 4. Harga Reseller */}
                                        <div className="p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] shadow-sm">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 uppercase">
                                                    Reseller
                                                </span>
                                            </div>
                                            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                                Harga Reseller
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 flex items-center">
                                                    Rp
                                                    {canViewCost && (() => {
                                                        const m = calculateMargin(formData.reseller_price || formData.price, formData.purchase_price);
                                                        return m?.isLoss ? (
                                                            <span className="text-red-500 font-black ml-0.5 animate-pulse" title="Harga reseller lebih rendah dari modal (*)">(*)</span>
                                                        ) : null;
                                                    })()}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={formData.reseller_price}
                                                    onChange={e => setFormData({ ...formData, reseller_price: e.target.value })}
                                                    placeholder="Kosongkan jika tdk tahu"
                                                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            {canViewCost ? (() => {
                                                const m = calculateMargin(formData.reseller_price || formData.price, formData.purchase_price);
                                                if (!m) return <p className="text-[10px] text-gray-400 mt-1">Langganan tetap</p>;
                                                return (
                                                    <p className={`text-[10px] font-semibold mt-1 ${m.isLoss ? 'text-red-500 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {m.isLoss ? `⚠️ Rugi Rp ${formatRupiah(Math.abs(m.profit))}` : `Margin ${formatRupiah(m.profit)} · ${m.percentage}%`}
                                                    </p>
                                                );
                                            })() : (
                                                <p className="text-[10px] text-gray-400 mt-1">Langganan tetap (boleh kosong)</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                                        {!currentProduct && requiresApprovalOnCreate
                                            ? '💡 Jika harga ecer, grosir, atau reseller belum diketahui, boleh dikosongkan dan nanti dilengkapi oleh Admin.'
                                            : '💡 Kosongkan harga grosir/reseller untuk memakai harga ecer standar.'}
                                    </p>
                                </div>

                                {/* SECTION 3: Satuan Bertingkat (Opsional - Multi-Unit Kemasan) */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#151520] border border-slate-200/80 dark:border-[#282839] space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                                    Satuan Bertingkat (Kemasan)
                                                </h4>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
                                                    Opsional
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-[#9d9db9] mt-0.5">
                                                Contoh: 1 Lusin = 12 {formData.base_unit || 'pcs'}, 1 Dus = 36 {formData.base_unit || 'pcs'}. Modal satuan = modal × isi.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddUnit}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            <span>Tambah Satuan</span>
                                        </button>
                                    </div>

                                    {/* Daftar Satuan Bertingkat */}
                                    {productUnits.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-[#282839] text-center text-xs text-gray-400">
                                            Belum ada satuan bertingkat. Klik <strong>+ Tambah Satuan</strong> jika barang ini juga dijual per Lusin, Dus, Pack, atau Rim.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {productUnits.map((unit, idx) => {
                                                const costBase = parseFloat(formData.purchase_price) || 0;
                                                const costUnit = costBase * (unit.conversion_factor || 1);
                                                const unitPriceVal = unit.price || 0;
                                                const marginUnit = unitPriceVal - costUnit;
                                                const marginUnitPct = costUnit > 0 ? ((marginUnit / costUnit) * 100).toFixed(1) : '100';

                                                return (
                                                    <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] shadow-sm space-y-2.5">
                                                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
                                                            {/* Nama Satuan */}
                                                            <div className="col-span-1">
                                                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                                    Nama Satuan
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={unit.unit_name}
                                                                    onChange={e => handleUpdateUnit(idx, 'unit_name', e.target.value)}
                                                                    placeholder="Lusin, Dus..."
                                                                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            {/* Isi / Conversion Factor */}
                                                            <div className="col-span-1">
                                                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                                    Isi ({formData.base_unit || 'pcs'})
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    required
                                                                    min="1"
                                                                    value={unit.conversion_factor}
                                                                    onChange={e => handleUpdateUnit(idx, 'conversion_factor', parseInt(e.target.value) || 1)}
                                                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-center rounded-lg bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            {/* Harga Ecer Kemasan */}
                                                            <div className="col-span-1">
                                                                <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                                                                    H. Ecer
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    required
                                                                    min="0"
                                                                    step="any"
                                                                    value={unit.price}
                                                                    onChange={e => handleUpdateUnit(idx, 'price', parseFloat(e.target.value) || 0)}
                                                                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            {/* Harga Grosir Kemasan */}
                                                            <div className="col-span-1">
                                                                <label className="block text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                                                                    H. Grosir
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={unit.wholesale_price ?? ''}
                                                                    onChange={e => handleUpdateUnit(idx, 'wholesale_price', e.target.value ? parseFloat(e.target.value) : null)}
                                                                    placeholder="= ecer"
                                                                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            {/* Barcode Kemasan */}
                                                            <div className="col-span-1">
                                                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                                    Barcode Kemasan
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={unit.barcode || ''}
                                                                    onChange={e => handleUpdateUnit(idx, 'barcode', e.target.value)}
                                                                    placeholder="Barcode dus"
                                                                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-gray-50 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            {/* Tombol Hapus */}
                                                            <div className="col-span-1 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveUnit(idx)}
                                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                                    title="Hapus satuan ini"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Rincian Modal & Margin Kemasan */}
                                                        <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 border-t border-slate-100 dark:border-white/5">
                                                            <span>1 {unit.unit_name || 'kemasan'} = {unit.conversion_factor} {formData.base_unit || 'pcs'}</span>
                                                            <span>•</span>
                                                            <span>Modal: <strong>{formatRupiah(costUnit)}</strong></span>
                                                            <span>•</span>
                                                            <span className={marginUnit < 0 ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                                                                {marginUnit < 0 ? `⚠️ Rugi Rp ${formatRupiah(Math.abs(marginUnit))}` : `Margin: ${formatRupiah(marginUnit)} (${marginUnitPct}%)`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 4: Gambar Produk */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Gambar Produk
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {formData.image_url && (
                                            <div className="size-16 rounded-xl bg-gray-200 dark:bg-[#282839] bg-center bg-cover shrink-0 border border-slate-200 dark:border-[#3b3c54]"
                                                style={{ backgroundImage: `url("${formData.image_url}")` }}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full text-xs text-gray-500 dark:text-[#9d9db9]
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-xl file:border-0
                                                    file:text-xs file:font-semibold
                                                    file:bg-gray-100 dark:file:bg-[#282839] file:text-gray-900 dark:file:text-white
                                                    hover:file:bg-gray-200 dark:hover:file:bg-[#3b3c54] cursor-pointer"
                                                disabled={uploading}
                                            />
                                            {uploading && <p className="text-xs text-primary mt-1">Mengunggah...</p>}
                                        </div>
                                    </div>
                                    <input type="hidden" value={formData.image_url} />
                                </div>

                                {/* Footer Form */}
                                <div className="pt-4 border-t border-slate-100 dark:border-[#282839] flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1c1c27] py-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282839] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#282839] transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 transition-all disabled:opacity-50"
                                    >
                                        {currentProduct
                                            ? 'Simpan Perubahan'
                                            : requiresApprovalOnCreate
                                            ? 'Ajukan Produk ke Admin'
                                            : 'Buat Produk Baru'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Import Excel / CSV */}
                <ImportExcelModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => fetchProducts()}
                />

                {/* Modal Terapkan Margin Massal */}
                <BulkMarginModal
                    isOpen={isBulkMarginModalOpen}
                    onClose={() => setIsBulkMarginModalOpen(false)}
                    onSuccess={() => fetchProducts()}
                    categories={categories}
                />

                {/* Quick Stock Modal (Kasir / Karyawan input stok fisik) */}
                {stockModalProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white dark:bg-[#1a1a26] rounded-2xl border border-slate-200 dark:border-[#282839] shadow-2xl w-full max-w-md overflow-hidden">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 dark:border-[#282839] flex items-center justify-between bg-slate-50/50 dark:bg-[#161622]">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <span className="material-symbols-outlined text-[22px]">inventory</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                            Update Stok Fisik Toko
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Input langsung jumlah stok nyata di etalase
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStockModalProduct(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#13131c] border border-slate-200 dark:border-[#282839]">
                                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                                        {stockModalProduct.name}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                                        <span>SKU: {stockModalProduct.sku}</span>
                                        <span>Satuan: {stockModalProduct.base_unit || 'pcs'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-500">Harga Jual:</span>
                                                <span className="text-primary font-bold">{formatRupiah(stockModalProduct.price)}</span>
                                            </div>
                                            {(stockModalProduct.wholesale_price || stockModalProduct.reseller_price) && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                                                    {stockModalProduct.wholesale_price && (
                                                        <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold">
                                                            Grosir: {formatRupiah(stockModalProduct.wholesale_price)} (min {stockModalProduct.wholesale_min_qty || 12})
                                                        </span>
                                                    )}
                                                    {stockModalProduct.reseller_price && (
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold">
                                                            Reseller: {formatRupiah(stockModalProduct.reseller_price)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {canEditPrice && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const prod = stockModalProduct;
                                                    setStockModalProduct(null);
                                                    openQuickPriceModal(prod);
                                                }}
                                                className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm shrink-0"
                                                title="Klik untuk menyesuaikan harga eceran, grosir & reseller"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">price_change</span>
                                                <span>Ubah Harga</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                                        Jumlah Stok Fisik Sekarang ({stockModalProduct.base_unit || 'pcs'}):
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={quickStockValue}
                                            onChange={e => setQuickStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full pl-4 pr-16 py-3 bg-white dark:bg-[#111118] border-2 border-primary/40 focus:border-primary rounded-xl text-2xl font-black text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            {stockModalProduct.base_unit || 'pcs'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Increment/Decrement Buttons */}
                                <div className="grid grid-cols-4 gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setQuickStockValue(prev => Math.max(0, prev - 1))}
                                        className="py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                                    >
                                        -1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickStockValue(prev => Math.max(0, prev - 5))}
                                        className="py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                                    >
                                        -5
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickStockValue(prev => prev + 1)}
                                        className="py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                                    >
                                        +1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickStockValue(prev => prev + 5)}
                                        className="py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                                    >
                                        +5
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-[#282839] flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#161622]">
                                <button
                                    type="button"
                                    onClick={() => setStockModalProduct(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#282839] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleQuickStockSave}
                                    disabled={isSavingStock}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25 transition-all flex items-center gap-1.5"
                                >
                                    {isSavingStock ? (
                                        <>
                                            <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                            <span>Simpan Stok Baru</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Price Modal (Kasir / Staff ubah harga eceran, grosir, reseller) */}
                <QuickPriceModal
                    isOpen={!!priceModalProduct}
                    product={priceModalProduct}
                    onClose={() => setPriceModalProduct(null)}
                    onSuccess={(updated) => {
                        setProductList(prev => prev.map(p => p.id === priceModalProduct?.id ? { ...p, ...updated } : p));
                        fetchFilterCounts();
                    }}
                    onSwitchToStock={(prod) => {
                        setPriceModalProduct(null);
                        openQuickStockModal(prod);
                    }}
                    canViewCost={canViewCost}
                    canUpdateStock={canUpdateStock}
                />

                {/* Modal Konfirmasi & Input Modal Produk Baru dari Kasir (Khusus Admin) */}
                <ApproveProductModal
                    isOpen={!!approveModalProduct}
                    product={approveModalProduct}
                    categories={categories}
                    onClose={() => setApproveModalProduct(null)}
                    onApproved={() => {
                        fetchProducts();
                        fetchFilterCounts();
                        window.dispatchEvent(new Event('products-pending-updated'));
                    }}
                    onRejected={() => {
                        fetchProducts();
                        fetchFilterCounts();
                        window.dispatchEvent(new Event('products-pending-updated'));
                    }}
                />
            </main>
        </div>
    );
};

export default ProductsPage;
