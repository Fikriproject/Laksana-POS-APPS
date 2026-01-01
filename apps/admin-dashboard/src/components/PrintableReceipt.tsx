import React from 'react';
import { formatRupiah } from '../utils/format';

interface ReceiptItem {
    product_name: string;
    quantity: number;
    unit_price?: number;
    price?: number; // fallback
    subtotal: number;
}

interface ReceiptOrder {
    order_number: string;
    created_at: string;
    user_name?: string;
    items: ReceiptItem[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    amount_paid?: number;
    payment_method?: string;
}

interface PrintableReceiptProps {
    order: ReceiptOrder | null;
    className?: string; // Allow custom styling/overrides
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ order, className = '' }) => {
    // If no order, render a placeholder so we know it's a data issue, not CSS
    if (!order) {
        return (
            <div id="printable-receipt" className={`hidden print:block text-center p-10 font-mono ${className}`}>
                <h2 className="text-xl font-bold">NO RECEIPT DATA</h2>
                <p>Silakan coba print ulang manual.</p>
            </div>
        );
    }

    return (
        <div id="printable-receipt" className={`hidden print:block print:w-full print:bg-white text-black font-mono p-8 bg-white ${className}`}>
            <div className="max-w-[80mm] mx-auto">
                <div className="text-center mb-4">
                    <h2 className="font-bold text-xl uppercase">Toko Plastik Dan Bahan Kue Laksana</h2>
                    <p className="text-sm">Kramat Dukupuntang</p>
                    <p className="text-sm">Telp: 0852-3477-1975</p>
                </div>

                <div className="border-b border-dashed border-black my-2"></div>

                <div className="text-sm mb-2">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span>{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tgl:</span>
                        <span>{new Date(order.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{order.user_name || 'Admin'}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black my-2"></div>

                <div className="text-sm space-y-2">
                    {(order.items || []).map((item, index) => (
                        <div key={index}>
                            <div className="font-bold">{item.product_name}</div>
                            <div className="flex justify-between">
                                <span>{item.quantity} x {formatRupiah(Number(item.unit_price || item.price || 0))}</span>
                                <span>{formatRupiah(Number(item.subtotal))}</span>
                            </div>
                        </div>
                    ))}
                    {(!order.items || order.items.length === 0) && (
                        <div className="text-center text-gray-400 italic">No Items Data</div>
                    )}
                </div>

                <div className="border-b border-dashed border-black my-2"></div>

                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatRupiah(Number(order.subtotal))}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Diskon</span>
                            <span>-{formatRupiah(Number(order.discount_amount))}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>{formatRupiah(Number(order.tax_amount))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                        <span>TOTAL</span>
                        <span>{formatRupiah(Number(order.total_amount))}</span>
                    </div>
                    {order.amount_paid !== undefined && Number(order.amount_paid) > 0 && (
                        <>
                            <div className="flex justify-between mt-2">
                                <span>Bayar</span>
                                <span>{formatRupiah(Number(order.amount_paid))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali</span>
                                <span>{formatRupiah(Number(order.amount_paid) - Number(order.total_amount))}</span>
                            </div>
                        </>
                    )}
                    {order.payment_method && (
                        <div className="flex justify-between mt-1 text-xs uppercase">
                            <span>Metode</span>
                            <span>{order.payment_method}</span>
                        </div>
                    )}
                </div>

                <div className="border-b border-dashed border-black my-4"></div>

                <div className="text-center text-sm">
                    <p>Terima Kasih</p>
                    <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                </div>
            </div>
        </div>
    );
};

export default PrintableReceipt;

