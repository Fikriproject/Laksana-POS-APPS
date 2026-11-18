import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatRupiah } from '../utils/format';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import PrintableReceipt from '../components/PrintableReceipt';
import PrintableZReport from '../components/PrintableZReport';
import { OpenShiftModal, PettyCashModal, CloseShiftModal } from '../components/ShiftModals';

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

export type PriceTier = 'retail' | 'wholesale' | 'reseller';

interface Product {
    id: string;
    name: string;
    category_name: string;
    price: number;
    purchase_price?: number;
    wholesale_price?: number | null;
    wholesale_min_qty?: number;
    reseller_price?: number | null;
    base_unit?: string;
    image_url: string;
    stock_quantity: number;
    category_id?: number | string;
    sku?: string;
    is_active?: boolean | number;
    units?: ProductUnitData[];
}

interface Category {
    id: number | string;
    name: string;
    icon?: string;
}

interface CartItem {
    id: string; // product id
    cartItemId: string; // unique item key e.g. `${id}_${unit_name}`
    name: string;
    category_name: string;
    image_url: string;
    stock_quantity: number;
    sku?: string;
    
    unit_name: string;
    conversion_factor: number;
    price: number;
    base_retail_price: number;
    wholesale_price?: number | null;
    reseller_price?: number | null;
    wholesale_min_qty: number;
    price_tier: PriceTier;
    
    quantity: number;
    is_auto_wholesale?: boolean;
    available_units?: ProductUnitData[];
}





const POSTerminal = () => {
    const { user, hasPermission } = useAuth();
    const canDiscount = hasPermission('pos.discount');
    const canVoidItem = hasPermission('pos.void_item');
    const canCustomItem = hasPermission('pos.custom_item');
    const canReprint = hasPermission('pos.reprint');
    const canChangePrice = hasPermission('pos.change_price');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | string>('all');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingOrder, setProcessingOrder] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null); // State for printing

    // New State for Tax and Discount
    const [taxRate, setTaxRate] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState<boolean>(false);
    const [activePriceTier, setActivePriceTier] = useState<PriceTier>('retail');

    // State Shift Kasir & Rekonsiliasi Kas Laci
    const [currentShift, setCurrentShift] = useState<any>(null);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
    const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState<boolean>(false);
    const [zReportData, setZReportData] = useState<any>(null);

    const fetchCurrentShift = async () => {
        try {
            const res = await api.get('/shifts/current');
            setCurrentShift(res.data.data);
            if (!res.data.data) {
                setTimeout(() => {
                    setIsOpenShiftModalOpen(true);
                }, 400);
            } else {
                setIsOpenShiftModalOpen(false);
            }
        } catch (err) {
            console.error("Gagal memeriksa shift kasir:", err);
        }
    };

    // Toggle Product Images in POS (persisted in localStorage)
    const [showProductImages, setShowProductImages] = useState<boolean>(() => {
        const saved = localStorage.getItem('pos_show_product_images');
        return saved !== null ? saved === 'true' : true;
    });

    const toggleProductImages = () => {
        setShowProductImages(prev => {
            const next = !prev;
            localStorage.setItem('pos_show_product_images', String(next));
            toast.success(next ? 'Mode Gambar Produk diaktifkan' : 'Mode Gambar dinonaktifkan (Mode Ringkas)', {
                id: 'pos-image-toggle',
                icon: next ? '🖼️' : '📝',
                duration: 2000
            });
            return next;
        });
    };

    const { confirm } = useConfirm();


    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    // ... (rest of the component)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products?per_page=5000'),
                    api.get('/products/categories')
                ]);

                // Handle pagination structure
                const productsData = productsRes.data.data.products ? productsRes.data.data.products : productsRes.data.data;
                setProducts(productsData);

                // Add 'All' category and map icons if possible
                const fetchedCategories = categoriesRes.data.data.map((c: any) => ({
                    ...c,
                    icon: c.icon || (
                        c.name.toLowerCase().includes('drink') ? 'local_bar' :
                        c.name.toLowerCase().includes('food') ? 'lunch_dining' :
                        c.name.toLowerCase().includes('kitab') || c.name.toLowerCase().includes('quran') || c.name.toLowerCase().includes('buku') ? 'menu_book' : 'grid_view'
                    )
                }));

                // Filter hanya kategori yang memiliki produk aktif agar kasir tidak terganggu oleh tab kosong
                const categoriesWithProducts = fetchedCategories.filter((c: any) => {
                    const count = Number(c.product_count ?? 0);
                    return count > 0 || (Array.isArray(productsData) && productsData.some((p: any) => p.category_id == c.id));
                });

                const hasUncategorized = Array.isArray(productsData) && productsData.some((p: any) => !p.category_id);

                setCategories([
                    { id: 'all', name: 'All', icon: 'grid_view' },
                    ...(hasUncategorized ? [{ id: 'uncategorized', name: 'Kitab & Lainnya', icon: 'menu_book' }] : []),
                    ...categoriesWithProducts
                ]);
            } catch (error) {
                console.error("Failed to fetch POS data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        fetchCurrentShift();
    }, []);

    const calculateItemPrice = (
        product: Product,
        unitName: string,
        quantity: number,
        tier: PriceTier
    ): { price: number; isAutoWholesale: boolean } => {
        const matchedUnit = product.units?.find(u => u.unit_name.toLowerCase() === unitName.toLowerCase());

        if (matchedUnit) {
            if (tier === 'reseller' && matchedUnit.reseller_price !== null && matchedUnit.reseller_price !== undefined) {
                return { price: Number(matchedUnit.reseller_price), isAutoWholesale: false };
            }
            if (tier === 'wholesale' && matchedUnit.wholesale_price !== null && matchedUnit.wholesale_price !== undefined) {
                return { price: Number(matchedUnit.wholesale_price), isAutoWholesale: false };
            }
            return { price: Number(matchedUnit.price), isAutoWholesale: false };
        }

        // Base unit
        if (tier === 'reseller' && product.reseller_price !== null && product.reseller_price !== undefined) {
            return { price: Number(product.reseller_price), isAutoWholesale: false };
        }
        if (tier === 'wholesale' && product.wholesale_price !== null && product.wholesale_price !== undefined) {
            return { price: Number(product.wholesale_price), isAutoWholesale: false };
        }

        // Retail tier: check auto wholesale if qty >= wholesale_min_qty
        const minQty = product.wholesale_min_qty || 12;
        if (product.wholesale_price !== null && product.wholesale_price !== undefined && quantity >= minQty) {
            return { price: Number(product.wholesale_price), isAutoWholesale: true };
        }

        return { price: Number(product.price), isAutoWholesale: false };
    };

    const addToCart = (product: Product, selectedUnit?: ProductUnitData): boolean => {
        const unitName = selectedUnit ? selectedUnit.unit_name : (product.base_unit || 'pcs');
        const factor = selectedUnit ? (selectedUnit.conversion_factor || 1) : 1;
        const cartItemId = `${product.id}_${unitName}`;

        if (product.stock_quantity !== undefined && product.stock_quantity < factor) {
            toast.error(`Stok "${product.name}" tidak cukup (Sisa: ${product.stock_quantity} ${product.base_unit || 'pcs'}, butuh: ${factor})!`, { id: `stock-${product.id}`, duration: 2500 });
            return false;
        }

        let success = true;
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newQty = currentQty + 1;
            const totalStockNeeded = newQty * factor;

            if (product.stock_quantity !== undefined && totalStockNeeded > product.stock_quantity) {
                toast.error(`Maksimal stok tercapai untuk "${product.name}" (${product.stock_quantity} ${product.base_unit || 'pcs'})`, { id: `limit-${product.id}`, duration: 2500 });
                success = false;
                return prevCart;
            }

            const { price, isAutoWholesale } = calculateItemPrice(product, unitName, newQty, activePriceTier);

            if (existingItem) {
                return prevCart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: newQty, price, is_auto_wholesale: isAutoWholesale }
                        : item
                );
            } else {
                const newItem: CartItem = {
                    id: product.id,
                    cartItemId,
                    name: product.name,
                    category_name: product.category_name,
                    image_url: product.image_url,
                    stock_quantity: product.stock_quantity,
                    sku: product.sku,
                    unit_name: unitName,
                    conversion_factor: factor,
                    price,
                    base_retail_price: Number(product.price),
                    wholesale_price: product.wholesale_price !== null && product.wholesale_price !== undefined ? Number(product.wholesale_price) : null,
                    reseller_price: product.reseller_price !== null && product.reseller_price !== undefined ? Number(product.reseller_price) : null,
                    wholesale_min_qty: product.wholesale_min_qty || 12,
                    price_tier: activePriceTier,
                    quantity: 1,
                    is_auto_wholesale: isAutoWholesale,
                    available_units: product.units || []
                };
                return [...prevCart, newItem];
            }
        });
        return success;
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return { ...item, quantity: 0 };

                const totalStockNeeded = newQty * item.conversion_factor;
                if (delta > 0 && totalStockNeeded > item.stock_quantity) {
                    toast.error(`Maksimal stok tercapai (${item.stock_quantity} unit dasar)`);
                    return item;
                }

                const prod = products.find(p => p.id === item.id) || item;
                const { price, isAutoWholesale } = calculateItemPrice(prod as Product, item.unit_name, newQty, activePriceTier);

                return {
                    ...item,
                    quantity: newQty,
                    price,
                    is_auto_wholesale: isAutoWholesale
                };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleChangeUnit = (cartItemId: string, newUnitName: string) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.cartItemId !== cartItemId) return item;
            const prod = products.find(p => p.id === item.id);
            if (!prod) return item;

            const matchedUnit = prod.units?.find(u => u.unit_name.toLowerCase() === newUnitName.toLowerCase());
            const factor = matchedUnit ? (matchedUnit.conversion_factor || 1) : 1;
            const newCartItemId = `${prod.id}_${newUnitName}`;

            const totalStockNeeded = item.quantity * factor;
            if (totalStockNeeded > prod.stock_quantity) {
                toast.error(`Stok tidak mencukupi untuk ${item.quantity} ${newUnitName} (butuh ${totalStockNeeded} pcs, sisa ${prod.stock_quantity} pcs)`);
                return item;
            }

            const { price, isAutoWholesale } = calculateItemPrice(prod, newUnitName, item.quantity, activePriceTier);

            return {
                ...item,
                cartItemId: newCartItemId,
                unit_name: newUnitName,
                conversion_factor: factor,
                price,
                is_auto_wholesale: isAutoWholesale
            };
        }));
    };

    const handleSelectPriceTier = (newTier: PriceTier) => {
        setActivePriceTier(newTier);
        setCart(prevCart => prevCart.map(item => {
            const prod = products.find(p => p.id === item.id);
            if (!prod) return item;
            const { price, isAutoWholesale } = calculateItemPrice(prod, item.unit_name, item.quantity, newTier);
            return {
                ...item,
                price_tier: newTier,
                price,
                is_auto_wholesale: isAutoWholesale
            };
        }));
        const label = newTier === 'retail' ? 'Ecer (Umum)' : 'Reseller';
        toast.success(`Mode harga beralih ke ${label}`, { id: 'price-tier-switch', duration: 1500 });
    };

    const removeFromCart = (cartItemId: string) => {
        setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    // Calculate Discount
    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountValue / 100);
    } else {
        discountAmount = discountValue;
    }
    // Prevent negative subtotal
    if (discountAmount > subtotal) discountAmount = subtotal;

    const subtotalAfterDiscount = subtotal - discountAmount;

    // Calculate Tax
    const taxAmount = subtotalAfterDiscount * (taxRate / 100);

    const total = subtotalAfterDiscount + taxAmount;

    // Unified state for the receipt to print (could be last order or current cart preview)
    const [receiptData, setReceiptData] = useState<any>(null);

    // Update receiptData whenever lastOrder changes
    useEffect(() => {
        if (lastOrder) {
            setReceiptData(lastOrder);
        }
    }, [lastOrder]);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            toast.error('Keranjang belanja kosong!', {
                icon: '🛒',
            });
            return;
        }

        const effectiveCash = cashReceived > 0 ? cashReceived : total;

        if (effectiveCash < total) {
            toast.error(`Pembayaran kurang! Kurang: ${formatRupiah(total - effectiveCash)}`);
            return;
        }

        const isConfirmed = await confirm({
            title: 'Konfirmasi Pembayaran',
            message: `Total tagihan ${formatRupiah(total)}. Uang diterima ${formatRupiah(effectiveCash)}. Kembalian ${formatRupiah(effectiveCash - total)}. Lanjutkan transaksi?`,
            confirmText: 'Proses Pembayaran',
            cancelText: 'Batal',
            type: 'info'
        });

        if (!isConfirmed) return;

        setProcessingOrder(true);

        try {
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    unit_name: item.unit_name,
                    conversion_factor: item.conversion_factor,
                    price_tier: item.price_tier
                })),
                payment_method: 'cash',
                subtotal: subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: total,
                amount_paid: effectiveCash
            };

            const response = await api.post('/orders', orderData);

            // Backend returns { success: true, message: '...', data: { ...order... } }
            // Axios wraps this in data property. So we need response.data.data
            const savedOrder = response.data.data;

            if (!savedOrder || !savedOrder.created_at) {
                console.error("Invalid order data received:", savedOrder, "Full Response:", response);
                toast.error("Error: Data order tidak valid dari server.");
                return;
            }

            // CRITICAL: Update STATE immediately to prevent stale preview data
            setLastOrder(savedOrder);
            setReceiptData(savedOrder);
            console.log("Order saved, receipt data set:", savedOrder);

            setCart([]);
            setDiscountValue(0);
            setCashReceived(0);

            // Allow DOM to update with new receipt data before printing
            // Increased timeout to 500ms to ensure React commit and browser layout are ready
            setTimeout(async () => {
                toast.success('Transaksi Berhasil!', { duration: 3000 });
                const printConfirm = await confirm({
                    title: 'Cetak Nota?',
                    message: 'Transaksi berhasil disimpan. Apakah Anda ingin mencetak nota sekarang?',
                    confirmText: 'Cetak Nota',
                    cancelText: 'Tutup',
                    type: 'success'
                });

                if (printConfirm) {
                    window.print();
                }
            }, 500);

            const res = await api.get('/products?per_page=1000');
            const productsData = res.data.data.products ? res.data.data.products : res.data.data;
            setProducts(productsData);
            fetchCurrentShift();

        } catch (error: any) {
            console.error('Failed to create order', error);
            const message = error.response?.data?.message || 'Gagal memproses transaksi. Silakan coba lagi.';
            toast.error(message);
        } finally {
            setProcessingOrder(false);
        }
    };

    const handlePrint = () => {
        if (lastOrder) {
            // Already set via effect, just print
            window.print();
        } else if (cart.length > 0) {
            // Create a temporary receipt object from the cart
            const previewData = {
                order_number: "PREVIEW",
                created_at: new Date().toISOString(),
                user_name: user?.full_name || 'Cashier',
                items: cart.map(item => ({
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal: subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total_amount: total,
                amount_paid: cashReceived > 0 ? cashReceived : total,
                // If prepaying/exact
            };
            setReceiptData(previewData);

            // Wait for clean render
            setTimeout(() => {
                window.print();
            }, 300);
        } else {
            toast.error("Tidak ada data transaksi untuk dicetak.");
        }
    };

    const handleSave = () => {
        if (cart.length === 0) return;
        localStorage.setItem('pos_saved_cart', JSON.stringify(cart));
        setCart([]);
        localStorage.setItem('pos_saved_cart', JSON.stringify(cart));
        setCart([]);
        toast.success('Order saved locally!');
    };




    // Debounce pencarian manual agar tablet tidak lag saat mengetik & scanner tidak memicu re-render katalog
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(val);
        }, 250);
    };

    const clearSearch = () => {
        if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
        setSearchTerm('');
        setDebouncedSearch('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    };

    const isSearching = debouncedSearch.trim().length > 0;
    const cleanSearch = debouncedSearch.trim().toLowerCase();

    // Map pencarian cepat O(1) untuk Barcode / SKU (termasuk barcode satuan bertingkat kemasan dus/lusin)
    // Memisahkan exactMap (pencocokan 100% persis) dan fallbackMap (tanpa strip/nol di depan)
    // agar SKU mirip seperti AMLKS167 vs AM-LKS-167 TIDAK PERNAH saling menimpa!
    const productSkuLookup = useMemo(() => {
        type SkuEntry = { product: Product; unit?: ProductUnitData };
        const exactMap = new Map<string, SkuEntry>();
        const fallbackMap = new Map<string, SkuEntry>();
        const nameMap = new Map<string, SkuEntry>();
        const ambiguousFallbackKeys = new Set<string>();

        // Tahap 1: Index semua SKU & Barcode secara EKSAK terlebih dahulu
        for (const p of products) {
            if (p.sku) {
                const clean = String(p.sku).trim().toLowerCase();
                if (clean && !exactMap.has(clean)) {
                    exactMap.set(clean, { product: p });
                }
            }
            if ((p as any).barcode) {
                const cleanB = String((p as any).barcode).trim().toLowerCase();
                if (cleanB && !exactMap.has(cleanB)) {
                    exactMap.set(cleanB, { product: p });
                }
            }
            // Index Barcode Satuan Bertingkat (Kemasan)
            if (p.units && Array.isArray(p.units)) {
                for (const u of p.units) {
                    if (u.barcode) {
                        const cleanU = String(u.barcode).trim().toLowerCase();
                        if (cleanU && !exactMap.has(cleanU)) {
                            exactMap.set(cleanU, { product: p, unit: u });
                        }
                    }
                }
            }
            if (p.id) {
                const cleanId = String(p.id).toLowerCase();
                if (!exactMap.has(cleanId)) {
                    exactMap.set(cleanId, { product: p });
                }
                const skuFallback = `sku-${cleanId.substring(0, 6)}`;
                if (!exactMap.has(skuFallback)) {
                    exactMap.set(skuFallback, { product: p });
                }
            }
            if (p.name) {
                const cleanName = p.name.trim().toLowerCase();
                if (cleanName && !nameMap.has(cleanName)) {
                    nameMap.set(cleanName, { product: p });
                }
            }
        }

        // Helper untuk mendaftarkan key fallback (noZero / noDash) secara aman tanpa menimpa exactMap / barang lain
        const registerFallback = (key: string, entry: SkuEntry) => {
            if (!key || exactMap.has(key) || ambiguousFallbackKeys.has(key)) return;
            const existing = fallbackMap.get(key);
            if (existing) {
                const isSameTarget =
                    existing.product.id === entry.product.id &&
                    (existing.unit?.id ?? null) === (entry.unit?.id ?? null);
                if (!isSameTarget) {
                    // Terdeteksi tabrakan antara 2 produk berbeda -> nonaktifkan fallback untuk key ini
                    fallbackMap.delete(key);
                    ambiguousFallbackKeys.add(key);
                }
                return;
            }
            fallbackMap.set(key, entry);
        };

        // Tahap 2: Index variasi fallback (tanpa 0 di depan / tanpa strip) hanya jika 100% tidak bentrok
        for (const p of products) {
            if (p.sku) {
                const clean = String(p.sku).trim().toLowerCase();
                registerFallback(clean.replace(/^0+/, ''), { product: p });
                registerFallback(clean.replace(/[-\s]/g, ''), { product: p });
            }
            if ((p as any).barcode) {
                const cleanB = String((p as any).barcode).trim().toLowerCase();
                registerFallback(cleanB.replace(/^0+/, ''), { product: p });
                registerFallback(cleanB.replace(/[-\s]/g, ''), { product: p });
            }
            if (p.units && Array.isArray(p.units)) {
                for (const u of p.units) {
                    if (u.barcode) {
                        const cleanU = String(u.barcode).trim().toLowerCase();
                        registerFallback(cleanU.replace(/^0+/, ''), { product: p, unit: u });
                        registerFallback(cleanU.replace(/[-\s]/g, ''), { product: p, unit: u });
                    }
                }
            }
        }

        return { exactMap, fallbackMap, nameMap };
    }, [products]);

    const isProductActive = (product: Product) => {
        return product.is_active !== 0 && product.is_active !== '0' && product.is_active !== false;
    };

    const matchesCategoryFilter = (product: Product, catId: string | number) => {
        if (catId === 'all') return true;
        if (catId === 'uncategorized') {
            return !product.category_id || product.category_id === 'uncategorized' || product.category_id === '0' || product.category_id === 0;
        }
        const matchesId = product.category_id !== undefined && product.category_id !== null && String(product.category_id) === String(catId);
        const matchesName = product.category_name && String(product.category_name).trim().toLowerCase() === String(catId).trim().toLowerCase();
        return Boolean(matchesId || matchesName);
    };

    const matchesSearchFilter = (product: Product, query: string) => {
        if (!query) return true;
        return (
            product.name.toLowerCase().includes(query) ||
            (product.sku && product.sku.toLowerCase().includes(query)) ||
            (product.category_name && product.category_name.toLowerCase().includes(query))
        );
    };

    // Memoize filtered products agar tidak re-compute dan memicu re-render 285 kartu produk saat scanner berjalan
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesCat = matchesCategoryFilter(product, activeCategory);
            const matchesQuery = matchesSearchFilter(product, cleanSearch);
            const active = isProductActive(product);
            return matchesCat && matchesQuery && active;
        });
    }, [products, activeCategory, cleanSearch]);

    // Cek apakah ada barang yang cocok di kategori lain jika hasil di kategori aktif kosong
    const totalMatchesAllCategories = isSearching && activeCategory !== 'all'
        ? products.filter(p => isProductActive(p) && matchesSearchFilter(p, cleanSearch)).length
        : 0;

    // --- Barcode Scanner Engine & Audio Feedback ---
    const scanBufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Refs untuk event listener agar tidak perlu re-subscribe listener saat cart / state berubah
    const productSkuLookupRef = useRef(productSkuLookup);
    useEffect(() => {
        productSkuLookupRef.current = productSkuLookup;
    }, [productSkuLookup]);

    const productsRef = useRef(products);
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    const addToCartRef = useRef(addToCart);
    useEffect(() => {
        addToCartRef.current = addToCart;
    }, [addToCart]);

    // Suara Beep konfirmasi saat scan berhasil
    const playScanBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1760, ctx.currentTime); // Nada A6 (1760Hz POS Beep)
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        } catch {
            // Audio diabaikan jika browser membatasi autoplay
        }
    };

    /**
     * Memproses kode barcode dari scanner atau input manual secara instan via Hash Map O(1)
     * Prioritas 1: Pencocokan 100% eksak (exactMap)
     * Prioritas 2: Fallback tanpa strip / nol depan HANYA jika tidak bentrok (fallbackMap)
     * Prioritas 3: Lookup instan ke API server jika barang belum termuat di browser
     */
    const processBarcodeScan = (
        scannedCode: string,
        options?: { allowSingleTextMatch?: boolean }
    ): boolean => {
        const raw = (scannedCode || '')
            .replace(/[\r\n\t]/g, '')
            .replace(/^\][A-Za-z0-9]{2}/, '') // Hapus prefix AIM identifier jika scanner mengirimkan ]C0, ]E0 dll
            .trim();

        if (!raw) return false;

        const clean = raw.toLowerCase();
        const cleanNoLeadingZero = clean.replace(/^0+/, '');
        const cleanNoDash = clean.replace(/[-\s]/g, '');

        const { exactMap, fallbackMap, nameMap } = productSkuLookupRef.current;

        // 1. Wajib cocokkan EKSAK terlebih dahulu (AMLKS167 != AM-LKS-167)
        const found =
            exactMap.get(clean) ||
            fallbackMap.get(clean) ||
            (cleanNoLeadingZero ? fallbackMap.get(cleanNoLeadingZero) : undefined) ||
            (cleanNoDash ? fallbackMap.get(cleanNoDash) : undefined) ||
            nameMap.get(clean);

        if (found) {
            const added = addToCartRef.current(found.product, found.unit);
            if (added) {
                playScanBeep();
                const unitBadge = found.unit ? ` (${found.unit.unit_name})` : '';
                const skuBadge = found.product.sku ? ` [${found.product.sku}]` : '';
                toast.success(`Ditambahkan: ${found.product.name}${unitBadge}${skuBadge}`, {
                    id: 'scan-success',
                    duration: 1800
                });
            }
            clearSearch();
            return true;
        }

        // 2. Jika kasir mengetik manual di kotak cari lalu tekan Enter, cek kecocokan sinkron (tanpa delay debounce)
        if (options?.allowSingleTextMatch) {
            const directMatches = productsRef.current.filter(
                p => isProductActive(p) && matchesSearchFilter(p, clean)
            );
            if (directMatches.length === 1) {
                const single = directMatches[0];
                const added = addToCartRef.current(single);
                if (added) {
                    playScanBeep();
                    const skuBadge = single.sku ? ` [${single.sku}]` : '';
                    toast.success(`Ditambahkan: ${single.name}${skuBadge}`, {
                        id: 'scan-success',
                        duration: 1800
                    });
                }
                clearSearch();
                return true;
            }
        }

        // 3. Fallback: Cek langsung ke server (jaga-jaga jika produk baru ditambahkan atau di luar daftar lokal)
        clearSearch();
        api.get(`/products/sku/${encodeURIComponent(raw)}`)
            .then(res => {
                const fetched = res.data?.data;
                if (fetched && fetched.id) {
                    const matchedUnit = fetched.matched_unit as ProductUnitData | undefined;
                    setProducts(prev =>
                        prev.some(p => String(p.id) === String(fetched.id)) ? prev : [...prev, fetched]
                    );
                    const added = addToCartRef.current(fetched, matchedUnit);
                    if (added) {
                        playScanBeep();
                        const unitBadge = matchedUnit ? ` (${matchedUnit.unit_name})` : '';
                        const skuBadge = fetched.sku ? ` [${fetched.sku}]` : '';
                        toast.success(`Ditambahkan: ${fetched.name}${unitBadge}${skuBadge}`, {
                            id: 'scan-success',
                            duration: 1800
                        });
                    }
                } else {
                    toast.error(`Barcode "${raw}" tidak terdaftar di daftar produk!`, {
                        id: 'barcode-not-found',
                        duration: 4000,
                        icon: '⚠️'
                    });
                }
            })
            .catch(() => {
                toast.error(`Barcode "${raw}" tidak terdaftar di daftar produk!`, {
                    id: 'barcode-not-found',
                    duration: 4000,
                    icon: '⚠️'
                });
            });

        return false;
    };

    // Global Keydown Listener: Mendukung pemindaian hands-free (tanpa perlu sentuh layar)
    // Menggunakan timeout 400ms yang aman untuk USB OTG Android & tidak bentrok dengan input kotak pencarian
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Abaikan jika fokus sedang berada di kolom input / textarea / select (termasuk searchInputRef yg punya handler sendiri)
            const target = e.target as HTMLElement;
            const isInsideAnyInput = target && (
                target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
            );
            if (isInsideAnyInput) {
                return;
            }

            const now = Date.now();
            const timeDiff = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            // Reset buffer jika jeda lebih dari 400ms (pengetikan manual manusia terjeda)
            // 400ms menjamin tidak pernah mereset di tengah-tengah transmisi OTG Android
            if (timeDiff > 400) {
                scanBufferRef.current = '';
            }

            // Jika tombol Enter ditekan (akhir pembacaan barcode scanner)
            if (e.key === 'Enter' || e.keyCode === 13) {
                const codeToProcess = scanBufferRef.current.trim();
                scanBufferRef.current = '';

                if (codeToProcess.length >= 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    processBarcodeScan(codeToProcess);
                }
                return;
            }

            // Simpan setiap karakter tunggal ke buffer scan
            if (e.key && e.key.length === 1) {
                scanBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const val = e.currentTarget.value.trim();
            scanBufferRef.current = '';
            if (!val) return;

            processBarcodeScan(val, { allowSingleTextMatch: true });
            e.currentTarget.blur();
        }
    };

    return (
        <>
            <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white overflow-hidden print:hidden">
                {/* Sidebar (Always visible based on request) */}
                <div className="print:hidden h-full">
                    <Sidebar
                        className="h-full"
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </div>

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Header */}
                    <header className="flex items-center gap-2 sm:gap-4 border-b border-solid border-slate-200 dark:border-[#282839] px-3 sm:px-6 py-2.5 bg-white dark:bg-surface-dark shrink-0 print:hidden transition-colors">
                        {/* Kiri: Menu & Logo Kasir (Teks POS Terminal dihapus untuk menghemat ruang) */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <button
                                onClick={toggleSidebar}
                                className="p-1.5 -ml-1 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 shrink-0"
                                title="Buka Menu"
                            >
                                <span className="material-symbols-outlined text-[22px] sm:text-[24px]">menu</span>
                            </button>
                            <div 
                                className="size-8 sm:size-9 flex items-center justify-center bg-primary rounded-xl text-white shadow-sm shadow-primary/25 shrink-0"
                                title="Kasir Laksana POS"
                            >
                                <span className="material-symbols-outlined text-[19px] sm:text-[21px]">point_of_sale</span>
                            </div>
                        </div>

                        {/* Tengah: Search Bar Responsif Fleksibel (Optimal untuk HP & Tablet segala ukuran) */}
                        <div className="flex-1 min-w-0 max-w-2xl">
                            <div className="flex items-center w-full h-9 sm:h-10 rounded-xl bg-gray-100 dark:bg-background-dark border border-slate-200 dark:border-[#282839] focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden px-2.5 sm:px-3">
                                <span className="material-symbols-outlined text-gray-400 dark:text-[#9d9db9] text-[18px] sm:text-[20px] shrink-0 mr-1.5 sm:mr-2">search</span>
                                <input
                                    ref={searchInputRef}
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                    className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#9d9db9] focus:outline-none border-none p-0"
                                    placeholder="Cari nama barang, SKU, barcode..."
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full shrink-0 ml-1"
                                        title="Hapus pencarian"
                                    >
                                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Shift Kasir & Tombol Kas Keluar / Tutup Kasir */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {currentShift ? (
                                <>
                                    {/* Tombol Status Kasir Buka */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCloseShiftModalOpen(true)}
                                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm"
                                        title="Klik untuk melihat status laci & tutup kasir"
                                    >
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>Kasir Buka</span>
                                    </button>

                                    {/* Tombol Catat Kas Keluar */}
                                    <button
                                        type="button"
                                        onClick={() => setIsPettyCashModalOpen(true)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold transition-all shadow-sm"
                                        title="Catat uang keluar dari laci (beli kresek, galon, dll)"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">payments</span>
                                        <span className="hidden md:inline">Kas Keluar</span>
                                    </button>

                                    {/* Tombol Tutup Kasir */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCloseShiftModalOpen(true)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
                                        title="Tutup kasir harian & hitung uang di laci"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                                        <span className="hidden sm:inline">Tutup Kasir</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsOpenShiftModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all animate-pulse"
                                >
                                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                                    <span>Buka Kasir</span>
                                </button>
                            )}
                        </div>

                        {/* Kanan: Theme Toggle & User Menu */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
                            <ThemeToggle />
                            <UserMenu />
                        </div>
                    </header>

                    {/* Main Layout */}
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Left Side: Products Grid */}
                        <div className={`flex-1 flex flex-col md:mr-[340px] lg:mr-[360px] xl:mr-[390px] 2xl:mr-[400px] overflow-hidden bg-background-light dark:bg-background-dark transition-all print:hidden ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
                            {/* Category Tabs */}
                            <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 overflow-x-auto no-scrollbar">
                                <div className="flex gap-3 min-w-max">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all border ${activeCategory === category.id
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 translate-y-[-2px]'
                                                : 'bg-white dark:bg-surface-dark text-gray-500 dark:text-[#9d9db9] border-slate-200 dark:border-[#282839] hover:bg-gray-50 dark:hover:bg-[#282839] hover:text-gray-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#3b3c54]'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{category.icon || 'category'}</span>
                                            <span className="text-sm font-semibold">{category.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sub-header: Count & Mode Toggle */}
                            <div className="px-3 sm:px-6 py-2 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white/40 dark:bg-surface-dark/20 backdrop-blur-sm text-xs">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-[#9d9db9]">
                                    <span>Menampilkan <strong className="text-gray-900 dark:text-white font-semibold">{filteredProducts.length}</strong> produk</span>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-background-dark p-1 rounded-lg border border-slate-200 dark:border-[#282839]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!showProductImages) toggleProductImages();
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                                            showProductImages
                                                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm font-semibold'
                                                : 'text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                        title="Tampilkan dengan gambar produk"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">grid_view</span>
                                        <span className="hidden sm:inline">Mode Gambar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (showProductImages) toggleProductImages();
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                                            !showProductImages
                                                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm font-semibold'
                                                : 'text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                        title="Tampilkan mode ringkas tanpa gambar"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                                        <span className="hidden sm:inline">Mode Ringkas (Teks)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-[#9d9db9]">
                                        Loading products...
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#9d9db9] gap-3 p-6 text-center">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        <p className="text-sm font-medium">
                                            {isSearching 
                                                ? `Tidak ada produk yang cocok dengan "${searchTerm}" di kategori ini` 
                                                : 'Tidak ada produk dalam kategori ini'}
                                        </p>
                                        {activeCategory !== 'all' && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveCategory('all')}
                                                className="mt-1 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:text-indigo-400 font-semibold text-xs border border-primary/20 transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                                {totalMatchesAllCategories > 0 
                                                    ? `Tampilkan ${totalMatchesAllCategories} Hasil di Semua Kategori` 
                                                    : 'Tampilkan Semua Kategori'}
                                            </button>
                                        )}
                                    </div>
                                ) : showProductImages ? (
                                    /* MODE DENGAN GAMBAR (Visual Grid) */
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-2.5 sm:gap-3.5">
                                        {filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`group relative flex flex-col bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none ${product.stock_quantity <= 0 ? 'opacity-55 pointer-events-none' : ''}`}
                                            >
                                                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-200 dark:bg-[#111118] relative">
                                                    <div
                                                        className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
                                                        style={{ backgroundImage: `url("${product.image_url || 'https://via.placeholder.com/300'}")` }}
                                                    />
                                                    {/* Price Badge */}
                                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md border border-white/10 shadow-sm max-w-[85%] truncate">
                                                        {formatRupiah(product.price)}
                                                    </div>
                                                    {product.stock_quantity <= 0 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white uppercase tracking-wider text-[11px]">
                                                            Stok Habis
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 text-[11px] text-gray-500 dark:text-[#9d9db9] mb-1 min-w-0">
                                                        <span className="truncate max-w-[65%]">{product.category_name || 'Umum'}</span>
                                                        <span className={`shrink-0 font-medium ${product.stock_quantity <= 10 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                                            {product.stock_quantity > 0 ? `Stok: ${product.stock_quantity}` : 'Habis'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-gray-900 dark:text-white font-bold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors break-words">
                                                        {product.name}
                                                    </h3>
                                                    {product.sku && (
                                                        <span className="text-[10px] font-mono text-gray-400 dark:text-text-secondary mt-1 block truncate">
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* MODE TANPA GAMBAR (Compact POS Text Cards) - Ergonomis, Rapi, & Elegan */
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-2.5 sm:gap-3">
                                        {filteredProducts.map((product) => {
                                            const isOutOfStock = product.stock_quantity <= 0;
                                            const isLowStock = !isOutOfStock && product.stock_quantity <= 10;

                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => addToCart(product)}
                                                    className={`group relative flex flex-col justify-between bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-xl p-2.5 sm:p-3 hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer min-h-[125px] sm:min-h-[135px] select-none overflow-hidden ${
                                                        isOutOfStock ? 'opacity-55 pointer-events-none' : ''
                                                    }`}
                                                >
                                                    {/* Baris Atas: Kategori & Status Stok */}
                                                    <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                                                        <span
                                                            className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 dark:text-indigo-300 truncate max-w-[55%]"
                                                            title={product.category_name || 'Umum'}
                                                        >
                                                            {product.category_name || 'Umum'}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                                                                isOutOfStock
                                                                    ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                                                                    : isLowStock
                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            }`}
                                                        >
                                                            {isOutOfStock ? 'Habis' : `Stok: ${product.stock_quantity}`}
                                                        </span>
                                                    </div>

                                                    {/* Bagian Tengah: Nama Produk & SKU */}
                                                    <div className="my-1 min-w-0">
                                                        <h3 className="text-gray-900 dark:text-white font-bold text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors break-words">
                                                            {product.name}
                                                        </h3>
                                                        {product.sku && (
                                                            <span className="text-[10px] font-mono text-gray-400 dark:text-text-secondary mt-0.5 block truncate">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Baris Bawah: Harga Prominen & Tombol Tambah Cepat */}
                                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1 mt-1.5 min-w-0">
                                                        <div className="text-xs sm:text-sm font-extrabold text-primary dark:text-indigo-400 truncate min-w-0">
                                                            {formatRupiah(product.price)}
                                                        </div>
                                                        <div className="size-6 sm:size-6.5 rounded-md bg-gray-100 dark:bg-white/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-gray-400 dark:text-gray-300 transition-colors shrink-0">
                                                            <span className="material-symbols-outlined text-[15px] sm:text-[16px]">add</span>
                                                        </div>
                                                    </div>

                                                    {/* Overlay Jika Stok Habis */}
                                                    {isOutOfStock && (
                                                        <div className="absolute inset-0 bg-white/80 dark:bg-surface-dark/85 backdrop-blur-[1px] rounded-xl flex items-center justify-center p-2">
                                                            <span className="text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/50 shadow-sm text-center">
                                                                Stok Habis
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Cart / Checkout Sidebar */}
                        <aside className={`${showMobileCart ? 'flex w-full z-30' : 'hidden'} md:flex flex-col w-full md:w-[340px] lg:w-[360px] xl:w-[390px] 2xl:w-[400px] border-l border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark absolute right-0 top-0 bottom-0 shadow-2xl print:relative print:w-full print:border-none print:shadow-none print:flex print:bg-white print:text-black transition-colors`}>
                            {/* Cart Header */}
                            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-[#282839] flex items-center justify-between bg-gray-50 dark:bg-[#151520] shrink-0">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {showMobileCart && (
                                        <button onClick={() => setShowMobileCart(false)} className="md:hidden text-gray-500 dark:text-[#9d9db9] hover:text-primary dark:hover:text-white mr-1">
                                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                        </button>
                                    )}
                                    <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">shopping_cart</span>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Current Order</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-gray-200 dark:bg-[#282839] text-gray-900 dark:text-white text-xs font-bold px-2 py-0.5 rounded-md">
                                        #{cart.reduce((sum, item) => sum + item.quantity, 0)} Items
                                    </div>
                                    {cart.length > 0 && (
                                        <button
                                            onClick={() => setCart([])}
                                            className="text-gray-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                            title="Kosongkan Keranjang"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Selector Level Harga (Ecer / Reseller) */}
                            <div className="px-3 py-2 bg-slate-50 dark:bg-[#111118] border-b border-slate-200 dark:border-[#282839] shrink-0">
                                <div className="grid grid-cols-2 gap-1.5 w-full bg-gray-200/70 dark:bg-[#1c1c27] p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPriceTier('retail')}
                                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                            activePriceTier === 'retail'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[15px]">person</span>
                                        <span>Ecer</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPriceTier('reseller')}
                                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                            activePriceTier === 'reseller'
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[15px]">verified</span>
                                        <span>Reseller</span>
                                    </button>
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 flex flex-col gap-2.5">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#55556d] gap-3 py-8">
                                        <div className="size-16 sm:size-20 bg-gray-100 dark:bg-[#282839] rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[32px] sm:text-[40px] opacity-50">remove_shopping_cart</span>
                                        </div>
                                        <p className="font-semibold text-sm sm:text-base">Keranjang Kosong</p>
                                        <p className="text-xs text-center max-w-[200px]">Pilih produk dari menu untuk memulai pesanan baru.</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.cartItemId} className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] group hover:border-primary/50 dark:hover:border-[#3b3c54] transition-all relative overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                                            {showProductImages ? (
                                                <div className="size-12 sm:size-14 rounded-lg bg-gray-200 dark:bg-[#282839] bg-center bg-cover shrink-0" style={{ backgroundImage: `url("${item.image_url || 'https://via.placeholder.com/150'}")` }} />
                                            ) : (
                                                <div className="size-9 sm:size-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-indigo-400 flex items-center justify-center shrink-0 self-center">
                                                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_bag</span>
                                                </div>
                                            )}

                                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                                <div className="flex justify-between items-start gap-1">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-1 truncate" title={item.name}>
                                                            {item.name}
                                                        </h4>
                                                        {/* Satuan & Badges */}
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                            {item.available_units && item.available_units.length > 0 ? (
                                                                <select
                                                                    value={item.unit_name}
                                                                    onChange={(e) => handleChangeUnit(item.cartItemId, e.target.value)}
                                                                    className="text-[10px] font-bold py-0.5 px-1.5 rounded bg-gray-100 dark:bg-[#111118] border border-slate-200 dark:border-[#282839] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary cursor-pointer"
                                                                >
                                                                    <option value="pcs">Satuan (Pcs)</option>
                                                                    {item.available_units.map((u, ui) => (
                                                                        <option key={ui} value={u.unit_name}>
                                                                            {u.unit_name} (isi {u.conversion_factor})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 capitalize">
                                                                    /{item.unit_name}
                                                                </span>
                                                            )}

                                                            {item.is_auto_wholesale && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                                    Auto Grosir
                                                                </span>
                                                            )}
                                                            {item.price_tier === 'reseller' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                                    Reseller
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {canVoidItem && (
                                                        <button
                                                            onClick={() => removeFromCart(item.cartItemId)}
                                                            className="text-gray-400 dark:text-[#55556d] hover:text-red-500 transition-colors p-0.5 -mt-0.5 -mr-0.5 shrink-0"
                                                            title="Hapus barang"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-end justify-between gap-1 mt-1.5">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 dark:bg-[#111118] rounded-lg p-0.5 border border-slate-200 dark:border-[#282839]">
                                                        <button
                                                            onClick={() => updateQuantity(item.cartItemId, -1)}
                                                            className="size-5 sm:size-6 flex items-center justify-center rounded bg-white dark:bg-[#282839] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b3c54] transition-colors shadow-sm dark:shadow-none"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">remove</span>
                                                        </button>
                                                        <span className="text-xs sm:text-sm font-bold min-w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.cartItemId, 1)}
                                                            className="size-5 sm:size-6 flex items-center justify-center rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">add</span>
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-400">
                                                            {item.quantity} x {formatRupiah(Number(item.price))}
                                                        </div>
                                                        <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                                                            {formatRupiah(Number(item.price) * item.quantity)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Order Summary Footer (Dengan Fitur Minimize & Rincian Pembayaran) */}
                            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#151520] border-t border-slate-200 dark:border-[#282839] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 transition-all flex flex-col gap-2.5 shrink-0">
                                {/* Collapsible Header Bar: Klik untuk Minimize / Expand Rincian */}
                                <button
                                    type="button"
                                    onClick={() => setIsSummaryCollapsed(prev => !prev)}
                                    className="w-full flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-white/5 transition-colors text-left"
                                    title={isSummaryCollapsed ? "Klik untuk melihat rincian diskon, pajak & pembayaran" : "Klik untuk meminimalkan rincian"}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`material-symbols-outlined text-primary text-[20px] transition-transform duration-200 ${isSummaryCollapsed ? 'rotate-180' : ''}`}>
                                            keyboard_arrow_down
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 truncate">
                                                {isSummaryCollapsed ? "Rincian & Diskon" : "Rincian Pembayaran"}
                                                {discountAmount > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                                        Diskon
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {isSummaryCollapsed ? "Sentuh untuk buka" : "Sentuh untuk minimize"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] text-gray-400 block leading-tight">Total Tagihan</span>
                                        <span className="text-base sm:text-lg font-black text-primary dark:text-indigo-400 leading-tight">
                                            {formatRupiah(total)}
                                        </span>
                                    </div>
                                </button>

                                {/* Isi Rincian Pembayaran (Dapat Di-minimize) */}
                                {!isSummaryCollapsed && (
                                    <div className="space-y-2.5 pt-1 border-t border-slate-200/80 dark:border-[#282839]/80 max-h-[42vh] overflow-y-auto pr-0.5">
                                        {/* Discount Controls (Full width dengan tombol % dan Rp di ujung) */}
                                        {canDiscount && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs text-gray-500 dark:text-[#9d9db9] font-medium">
                                                        Diskon {discountType === 'percent' ? '(%)' : '(Rp)'}
                                                    </label>
                                                    {discountAmount > 0 && (
                                                        <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                                                            -{formatRupiah(discountAmount)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 w-full">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            value={discountValue || ''}
                                                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                        />
                                                    </div>
                                                    <div className="flex bg-gray-200/80 dark:bg-[#1c1c27] rounded-xl p-1 border border-slate-200 dark:border-[#282839] shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDiscountType('percent')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                discountType === 'percent'
                                                                    ? 'bg-primary text-white shadow-sm'
                                                                    : 'text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            %
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDiscountType('fixed')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                discountType === 'fixed'
                                                                    ? 'bg-primary text-white shadow-sm'
                                                                    : 'text-gray-500 dark:text-[#9d9db9] hover:text-gray-900 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            Rp
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Breakdown Subtotal & Diskon */}
                                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-[#282839]/50 text-xs sm:text-sm">
                                            <div className="flex justify-between text-gray-500 dark:text-[#9d9db9]">
                                                <span>Subtotal</span>
                                                <span>{formatRupiah(subtotal)}</span>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-red-500">
                                                    <span>Diskon {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                                                    <span>-{formatRupiah(discountAmount)}</span>
                                                </div>
                                            )}
                                            {taxAmount > 0 && (
                                                <div className="flex justify-between text-gray-500 dark:text-[#9d9db9]">
                                                    <span>Pajak ({taxRate}%)</span>
                                                    <span>{formatRupiah(taxAmount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Input Pembayaran Uang Diterima */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-[#9d9db9] font-medium">Uang Diterima (Rp)</label>
                                            <input
                                                type="number"
                                                value={cashReceived || ''}
                                                onChange={(e) => setCashReceived(parseFloat(e.target.value))}
                                                placeholder="0"
                                                className={`w-full bg-white dark:bg-[#111118] border rounded-lg px-3 py-1.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary ${cashReceived > 0 && cashReceived < total ? 'border-red-500' : 'border-slate-200 dark:border-[#282839]'}`}
                                            />
                                            {cashReceived > total && (
                                                <div className="flex justify-between text-xs sm:text-sm text-emerald-600 dark:text-emerald-500 font-bold mt-0.5">
                                                    <span>Kembalian</span>
                                                    <span>{formatRupiah(cashReceived - total)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tombol Print & Save */}
                                        <div className="grid grid-cols-2 gap-2 pt-0.5 print:hidden">
                                            <button
                                                onClick={handlePrint}
                                                className="h-9 sm:h-10 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1c1c27] text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#282839] transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">print</span>
                                                <span>Print Nota</span>
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="h-9 sm:h-10 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1c1c27] text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#282839] transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">save</span>
                                                <span>Simpan</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Tombol Bayar Sekarang (Selalu Nyaman Diakses) */}
                                <button
                                    disabled={cart.length === 0 || processingOrder}
                                    onClick={handlePlaceOrder}
                                    className="w-full h-11 sm:h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    {processingOrder ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Bayar Sekarang</span>
                                            <span className="material-symbols-outlined text-[18px]">payments</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </aside>
                    </div >

                    {/* Mobile Cart Toggle Button (Floating) */}
                    {!showMobileCart && cart.length > 0 && (
                        <div className="md:hidden absolute bottom-6 left-6 right-6 z-40">
                            <button
                                onClick={() => setShowMobileCart(true)}
                                className="w-full h-14 bg-primary text-white rounded-xl shadow-xl shadow-primary/30 flex items-center justify-between px-6 font-bold"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 size-8 rounded-lg flex items-center justify-center text-sm">
                                        {cart.reduce((a, b) => a + b.quantity, 0)}
                                    </div>
                                    <span>Lihat Pesanan</span>
                                </div>
                                <span>{formatRupiah(total)}</span>
                            </button>
                        </div>
                    )}
                </div >

            </div>
            {/* Printable Receipt - Sibling to Main Layout */}
            <PrintableReceipt order={receiptData} />

            {/* Template Cetak Thermal Z-Report Tutup Kasir */}
            <PrintableZReport data={zReportData} />

            {/* Modal Buka Kasir */}
            <OpenShiftModal
                isOpen={isOpenShiftModalOpen}
                onClose={() => setIsOpenShiftModalOpen(false)}
                onSuccess={(shift) => setCurrentShift(shift)}
            />

            {/* Modal Kas Keluar (Peti Kas) */}
            <PettyCashModal
                isOpen={isPettyCashModalOpen}
                onClose={() => setIsPettyCashModalOpen(false)}
                onSuccess={() => fetchCurrentShift()}
            />

            {/* Modal Tutup Kasir */}
            <CloseShiftModal
                isOpen={isCloseShiftModalOpen}
                shift={currentShift}
                onClose={() => setIsCloseShiftModalOpen(false)}
                onSuccess={async (summary) => {
                    setCurrentShift(null);
                    setZReportData(summary);
                    const shouldPrint = await confirm({
                        title: 'Cetak Laporan Tutup Kasir (Z-Report)?',
                        message: `Shift kasir berhasil ditutup. Selisih laci: ${summary.cash_drawer?.cash_difference === 0 ? 'PAS (Rp 0)' : formatRupiah(summary.cash_drawer?.cash_difference || 0)}. Cetak struk laporan Z-Report sekarang?`,
                        confirmText: 'Cetak Z-Report',
                        cancelText: 'Selesai',
                        type: 'success'
                    });
                    if (shouldPrint) {
                        setTimeout(() => window.print(), 300);
                    }
                }}
            />
        </>
    );
};

export default POSTerminal;
