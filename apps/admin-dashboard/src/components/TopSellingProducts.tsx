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

    const formatPrice = (price: string | number) => {
        return formatRupiah(Number(price));
    };

    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold">Top Selling Products</h3>
                <a href="/reports" className="text-primary text-sm font-medium hover:underline">View All</a>
            </div>
            <div className="p-6 flex flex-col gap-6">
                {products.length === 0 ? (
                    <div className="text-center text-text-secondary py-4">No sales data yet</div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-sm">image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-800 dark:text-white truncate">{product.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-text-secondary">{product.category_name || 'Uncategorized'}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-800 dark:text-white">{formatPrice(product.price)}</p>
                                <p className="text-xs text-gray-500 dark:text-text-secondary">{product.total_sold} sold</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default TopSellingProducts;
