import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/format';

interface Product {
    id: string;
    name: string;
    category_name: string;
    price: string | number;
    total_sold: string | number;
    image_url: string;
}

interface TopSellingProductsProps {
    products: Product[];
}

const TopSellingProducts = ({ products }: TopSellingProductsProps) => {
    const { user } = useAuth();

    const formatPrice = (price: string | number) => {
        return formatRupiah(Number(price));
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-[#282839] shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#282839] flex justify-between items-center">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Produk Terlaris</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Penjualan produk paling diminati</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <a href="/reports" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                        <span>Lihat Semua</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </a>
                )}
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-4">
                {products.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-xs font-medium">
                        Belum ada data penjualan produk
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 sm:gap-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">package_2</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white truncate">{product.name}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">{product.category_name || 'Umum'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">{formatPrice(product.price)}</p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{product.total_sold} terjual</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default TopSellingProducts;
