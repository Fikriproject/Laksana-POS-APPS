import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { formatRupiah } from '../utils/format';
import ThemeToggle from '../components/ThemeToggle';
import PrintableReceipt from '../components/PrintableReceipt';

interface Product {
    id: string;
    name: string;
    category_name: string;
    price: number;
    image_url: string;
    stock_quantity: number;
    category_id?: number | string;
    sku?: string;
    is_active?: boolean | number;
}

interface Category {
    id: number | string;
    name: string;
    icon?: string;
}

interface CartItem extends Product {
    quantity: number;
}





const POSTerminal = () => {
    const { user } = useAuth();
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

    const { confirm } = useConfirm();


    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    // ... (rest of the component)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/products/categories')
                ]);

                // Handle pagination structure
                const productsData = productsRes.data.data.products ? productsRes.data.data.products : productsRes.data.data;
                setProducts(productsData);

                // Add 'All' category and map icons if possible
                const fetchedCategories = categoriesRes.data.data.map((c: any) => ({
                    ...c,
                    icon: c.name.toLowerCase().includes('drink') ? 'local_bar' :
                        c.name.toLowerCase().includes('food') ? 'lunch_dining' : 'grid_view'
                }));

                setCategories([
                    { id: 'all', name: 'All', icon: 'grid_view' },
                    ...fetchedCategories
                ]);
            } catch (error) {
                console.error("Failed to fetch POS data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const addToCart = (product: Product) => {
        if (product.stock_quantity <= 0) return;

        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            // Check stock limit
            if (existingItem.quantity >= product.stock_quantity) return;

            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                // Check stock limit for increase
                if (delta > 0 && newQty > item.stock_quantity) return item;

                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
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
                    price: item.price
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

            const res = await api.get('/products');
            const productsData = res.data.data.products ? res.data.data.products : res.data.data;
            setProducts(productsData);

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




    const filteredProducts = products.filter(product => {
        const matchesCategory = activeCategory === 'all' || product.category_id === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch && product.is_active;
    });

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
                    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#282839] px-6 py-3 bg-white dark:bg-surface-dark shrink-0 print:hidden transition-colors">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                                <button
                                    onClick={toggleSidebar}
                                    className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-text-secondary hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined">menu</span>
                                </button>
                                <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white">
                                    <span className="material-symbols-outlined">point_of_sale</span>
                                </div>
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-tight">POS Terminal</h2>
                            </div>
                            {/* Search */}
                            <label className="flex items-center flex-1 mx-4 max-w-lg h-10">
                                <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-gray-100 dark:bg-background-dark border border-slate-200 dark:border-[#282839] overflow-hidden group focus-within:border-primary/50 transition-colors">
                                    <div className="text-gray-400 dark:text-[#9d9db9] flex border-none items-center justify-center pl-4">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                                    </div>
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent focus:border-none h-full placeholder:text-gray-400 dark:placeholder:text-[#9d9db9] px-3 text-sm font-normal leading-normal"
                                        placeholder="Search by name, SKU or barcode..."
                                    />
                                </div>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-6">
                            <div className="flex items-center gap-4">
                                <ThemeToggle />
                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium text-gray-500 dark:text-[#9d9db9] hover:text-primary dark:hover:text-white">
                                    <span className="material-symbols-outlined">sync</span>
                                    Sync
                                </button>
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name || 'Cashier'}</div>
                                    <div className="text-xs text-gray-500 dark:text-[#9d9db9] capitalize">{user?.role || 'Staff'}</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Layout */}
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Left Side: Products Grid */}
                        <div className={`flex-1 flex flex-col md:mr-[400px] overflow-hidden bg-background-light dark:bg-background-dark transition-all print:hidden ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
                            {/* Category Tabs */}
                            <div className="px-6 pt-4 pb-2 overflow-x-auto no-scrollbar">
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

                            {/* Products Grid */}
                            <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-[#9d9db9]">
                                        Loading products...
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[#9d9db9] gap-2">
                                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        <p>No products found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => addToCart(product)}
                                                className={`group relative flex flex-col bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#282839] rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${product.stock_quantity <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-200 dark:bg-[#111118] relative">
                                                    <div
                                                        className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-110"
                                                        style={{ backgroundImage: `url("${product.image_url || 'https://via.placeholder.com/300'}")` }}
                                                    />
                                                    {/* Price Badge */}
                                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg border border-white/10">
                                                        {formatRupiah(product.price)}
                                                    </div>
                                                    {product.stock_quantity <= 0 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-white uppercase tracking-widest">
                                                            Out of Stock
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <div className="text-xs text-gray-500 dark:text-[#9d9db9] mb-1">{product.category_name}</div>
                                                    <h3 className="text-gray-900 dark:text-white font-bold leading-tight mb-2 line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                                                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500 dark:text-[#9d9db9]">
                                                        <span>{product.stock_quantity} in stock</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Cart / Checkout Sidebar */}
                        <aside className={`${showMobileCart ? 'flex w-full z-30' : 'hidden'} md:flex flex-col w-full md:w-[400px] border-l border-slate-200 dark:border-[#282839] bg-white dark:bg-surface-dark absolute right-0 top-0 bottom-0 shadow-2xl print:relative print:w-full print:border-none print:shadow-none print:flex print:bg-white print:text-black transition-colors`}>
                            {/* Cart Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-[#282839] flex items-center justify-between bg-gray-50 dark:bg-[#151520]">
                                <div className="flex items-center gap-3">
                                    {showMobileCart && (
                                        <button onClick={() => setShowMobileCart(false)} className="md:hidden text-gray-500 dark:text-[#9d9db9] hover:text-primary dark:hover:text-white mr-2">
                                            <span className="material-symbols-outlined">arrow_back</span>
                                        </button>
                                    )}
                                    <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Order</h3>
                                </div>
                                <div className="bg-gray-200 dark:bg-[#282839] text-gray-900 dark:text-white text-xs font-bold px-2 py-1 rounded-md">
                                    #{cart.length} Items
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#55556d] gap-4">
                                        <div className="size-20 bg-gray-100 dark:bg-[#282839] rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[40px] opacity-50">remove_shopping_cart</span>
                                        </div>
                                        <p className="font-medium">Keranjang Kosong</p>
                                        <p className="text-xs text-center max-w-[200px]">Pilih produk dari menu untuk memulai pesanan baru.</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-white dark:bg-[#1c1c27] border border-slate-200 dark:border-[#282839] group hover:border-primary/50 dark:hover:border-[#3b3c54] transition-all relative overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                                            {/* Background slide effect for quantity controls could go here */}

                                            <div className="size-16 rounded-lg bg-gray-200 dark:bg-[#282839] bg-center bg-cover shrink-0" style={{ backgroundImage: `url("${item.image_url || 'https://via.placeholder.com/150'}")` }} />

                                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{item.name}</h4>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-gray-400 dark:text-[#55556d] hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#111118] rounded-lg p-1 border border-slate-200 dark:border-[#282839]">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="size-6 flex items-center justify-center rounded bg-white dark:bg-[#282839] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b3c54] transition-colors shadow-sm dark:shadow-none"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                                        </button>
                                                        <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="size-6 flex items-center justify-center rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                                        </button>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {formatRupiah(Number(item.price) * item.quantity)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Order Summary Footer */}
                            <div className="p-6 bg-gray-50 dark:bg-[#151520] border-t border-slate-200 dark:border-[#282839] space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 transition-colors">
                                {/* Discount & Tax Controls */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-[#9d9db9] font-medium">Diskon</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                    className="w-full bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                                />
                                            </div>
                                            <div className="flex bg-white dark:bg-[#111118] rounded-lg border border-slate-200 dark:border-[#282839] p-0.5">
                                                <button
                                                    onClick={() => setDiscountType('percent')}
                                                    className={`px-2 py-0.5 rounded text-xs font-bold ${discountType === 'percent' ? 'bg-primary text-white' : 'text-gray-500 dark:text-[#9d9db9]'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setDiscountType('fixed')}
                                                    className={`px-2 py-0.5 rounded text-xs font-bold ${discountType === 'fixed' ? 'bg-primary text-white' : 'text-gray-500 dark:text-[#9d9db9]'}`}
                                                >
                                                    Rp
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 dark:text-[#9d9db9] font-medium">Pajak (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(Number(e.target.value))}
                                                className="w-full bg-white dark:bg-[#111118] border border-slate-200 dark:border-[#282839] rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#282839]/50">
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-[#9d9db9]">
                                        <span>Subtotal</span>
                                        <span>{formatRupiah(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>Diskon {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                                            <span>-{formatRupiah(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-[#9d9db9]">
                                        <span>Pajak ({taxRate}%)</span>
                                        <span>{formatRupiah(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-slate-200 dark:border-[#282839]">
                                        <span>Total</span>
                                        <span>{formatRupiah(total)}</span>
                                    </div>
                                </div>

                                {/* Payment Amount Input */}
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 dark:text-[#9d9db9] font-medium">Uang Diterima (Rp)</label>
                                    <input
                                        type="number"
                                        value={cashReceived || ''}
                                        onChange={(e) => setCashReceived(parseFloat(e.target.value))}
                                        placeholder="0"
                                        className={`w-full bg-white dark:bg-[#111118] border rounded-lg px-3 py-2 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary ${cashReceived > 0 && cashReceived < total ? 'border-red-500' : 'border-slate-200 dark:border-[#282839]'}`}
                                    />
                                    {cashReceived > total && (
                                        <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-500 font-bold mt-1">
                                            <span>Kembalian</span>
                                            <span>{formatRupiah(cashReceived - total)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 print:hidden">
                                    <button
                                        onClick={handlePrint}
                                        className="h-12 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1c1c27] text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#282839] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">print</span>
                                        <span className="hidden sm:inline">Print</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="h-12 rounded-xl border border-slate-200 dark:border-[#282839] bg-white dark:bg-[#1c1c27] text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#282839] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        <span className="hidden sm:inline">Save</span>
                                    </button>
                                </div>

                                <button
                                    disabled={cart.length === 0 || processingOrder}
                                    onClick={handlePlaceOrder}
                                    className="w-full h-14 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingOrder ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <span>Bayar Sekarang</span>
                                            <span className="material-symbols-outlined">payments</span>
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
        </>
    );
};

export default POSTerminal;
