import React from 'react';
import { formatRupiah } from '../utils/format';

export interface ZReportData {
    title?: string;
    shift?: {
        id: string;
        user_name?: string;
        user_role?: string;
        started_at: string;
        ended_at?: string;
        opening_cash: number;
        closing_cash?: number;
    };
    cash_drawer: {
        opening_cash: number;
        cash_sales: number;
        non_cash_sales: number;
        total_expenses: number;
        expected_cash: number;
        actual_cash?: number | null;
        cash_difference?: number | null;
        status?: string;
    };
    sales_summary: {
        total_orders: number;
        gross_sales: number;
        total_discount: number;
        total_tax: number;
        net_sales: number;
        total_cogs: number;
        gross_profit: number;
        total_expenses: number;
        net_profit: number;
    };
    expenses?: Array<{
        category: string;
        amount: number;
        description: string;
        created_at?: string;
    }>;
}

interface PrintableZReportProps {
    data: ZReportData | null;
    className?: string;
}

export const PrintableZReport: React.FC<PrintableZReportProps> = ({ data, className = '' }) => {
    const printerConfig = React.useMemo(() => {
        try {
            const saved = localStorage.getItem('pos_printer_settings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            paperWidth: '80mm',
            storeName: 'Kasir Laksana',
            storeAddress: 'Kramat Dukupuntang',
            storePhone: '+62 851-8316-7100',
        };
    }, []);

    if (!data) return null;

    const is80mm = (printerConfig.paperWidth || '80mm') === '80mm';
    const maxWidthClass = is80mm ? 'max-w-[80mm]' : 'max-w-[58mm]';

    const diff = data.cash_drawer.cash_difference ?? 0;
    const isBalanced = diff === 0;

    return (
        <div id="printable-zreport" className={`hidden print:block print:w-full print:bg-white text-black font-mono p-2 sm:p-4 bg-white ${className}`}>
            <div className={`${maxWidthClass} mx-auto text-xs leading-relaxed`}>
                {/* Toko Header */}
                <div className="text-center mb-2">
                    <h2 className="font-bold text-sm uppercase">{printerConfig.storeName || 'KASIR LAKSANA'}</h2>
                    {printerConfig.storeAddress && <p className="text-[11px]">{printerConfig.storeAddress}</p>}
                    {printerConfig.storePhone && <p className="text-[11px]">Telp: {printerConfig.storePhone}</p>}
                    <div className="border-b border-black border-dashed my-1.5"></div>
                    <p className="font-bold text-xs uppercase tracking-wider">{data.title || 'LAPORAN REKAP TUTUP KASIR (Z-REPORT)'}</p>
                </div>

                {/* Metadata Waktu & Kasir */}
                <div className="text-[11px] mb-2 space-y-0.5">
                    {data.shift?.user_name && (
                        <div className="flex justify-between">
                            <span>Kasir / Petugas:</span>
                            <span className="font-bold">{data.shift.user_name}</span>
                        </div>
                    )}
                    {data.shift?.started_at && (
                        <div className="flex justify-between">
                            <span>Waktu Buka:</span>
                            <span>{new Date(data.shift.started_at).toLocaleString('id-ID')}</span>
                        </div>
                    )}
                    {data.shift?.ended_at && (
                        <div className="flex justify-between">
                            <span>Waktu Tutup:</span>
                            <span>{new Date(data.shift.ended_at).toLocaleString('id-ID')}</span>
                        </div>
                    )}
                </div>

                <div className="border-b border-black border-dashed my-1.5"></div>

                {/* 1. KAS LACI KASIR */}
                <div className="mb-2">
                    <p className="font-bold uppercase text-[11px] mb-1">--- REKONSILIASI KAS LACI ---</p>
                    <div className="space-y-0.5">
                        <div className="flex justify-between">
                            <span>Modal Kas Awal:</span>
                            <span>{formatRupiah(data.cash_drawer.opening_cash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Penjualan Tunai (+):</span>
                            <span>{formatRupiah(data.cash_drawer.cash_sales)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>Kas Keluar Toko (-):</span>
                            <span>{formatRupiah(data.cash_drawer.total_expenses)}</span>
                        </div>
                        <div className="border-b border-black border-dotted my-1"></div>
                        <div className="flex justify-between font-bold">
                            <span>Uang Harus di Laci:</span>
                            <span>{formatRupiah(data.cash_drawer.expected_cash)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Uang Fisik Dihitung:</span>
                            <span>{formatRupiah(data.cash_drawer.actual_cash ?? data.cash_drawer.expected_cash)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-0.5">
                            <span>Status Selisih:</span>
                            <span className={isBalanced ? 'text-green-700' : diff < 0 ? 'text-red-600' : 'text-blue-600'}>
                                {isBalanced ? 'PAS (Rp 0)' : `${diff > 0 ? '+' : ''}${formatRupiah(diff)}`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-b border-black border-dashed my-1.5"></div>

                {/* 2. RINGKASAN PENJUALAN */}
                <div className="mb-2">
                    <p className="font-bold uppercase text-[11px] mb-1">--- RINGKASAN PENJUALAN ---</p>
                    <div className="space-y-0.5">
                        <div className="flex justify-between">
                            <span>Total Transaksi / Nota:</span>
                            <span className="font-bold">{data.sales_summary.total_orders} Struk</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Penjualan Tunai:</span>
                            <span>{formatRupiah(data.cash_drawer.cash_sales)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Penjualan Non-Tunai:</span>
                            <span>{formatRupiah(data.cash_drawer.non_cash_sales)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Total Penjualan Kotor:</span>
                            <span>{formatRupiah(data.sales_summary.gross_sales)}</span>
                        </div>
                        {data.sales_summary.total_discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Total Diskon:</span>
                                <span>-{formatRupiah(data.sales_summary.total_discount)}</span>
                            </div>
                        )}
                        <div className="border-b border-black border-dotted my-1"></div>
                        <div className="flex justify-between font-bold text-xs">
                            <span>PENJUALAN BERSIH:</span>
                            <span>{formatRupiah(data.sales_summary.net_sales)}</span>
                        </div>
                    </div>
                </div>

                <div className="border-b border-black border-dashed my-1.5"></div>

                {/* 3. ESTIMASI KEUNTUNGAN TOKO */}
                <div className="mb-2">
                    <p className="font-bold uppercase text-[11px] mb-1">--- KEUNTUNGAN BERSIH ---</p>
                    <div className="space-y-0.5">
                        <div className="flex justify-between">
                            <span>Penjualan Bersih:</span>
                            <span>{formatRupiah(data.sales_summary.net_sales)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Modal Barang (HPP):</span>
                            <span>-{formatRupiah(data.sales_summary.total_cogs)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Pengeluaran Toko:</span>
                            <span>-{formatRupiah(data.sales_summary.total_expenses)}</span>
                        </div>
                        <div className="border-b border-black border-dotted my-1"></div>
                        <div className="flex justify-between font-bold text-xs pt-0.5">
                            <span>LABA BERSIH REAL:</span>
                            <span>{formatRupiah(data.sales_summary.net_profit)}</span>
                        </div>
                    </div>
                </div>

                {/* Rincian Pengeluaran jika ada */}
                {data.expenses && data.expenses.length > 0 && (
                    <>
                        <div className="border-b border-black border-dashed my-1.5"></div>
                        <div className="mb-2">
                            <p className="font-bold uppercase text-[11px] mb-1">RINCIAN KAS KELUAR ({data.expenses.length}):</p>
                            <div className="space-y-1">
                                {data.expenses.map((exp, idx) => (
                                    <div key={idx} className="flex justify-between text-[10px]">
                                        <span className="truncate max-w-[65%]">{exp.description || exp.category}</span>
                                        <span>{formatRupiah(exp.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="border-b border-black border-dashed my-2"></div>

                {/* Footer & Tanda Tangan */}
                <div className="text-center pt-2 pb-4 text-[10px] space-y-4">
                    <div className="flex justify-around pt-2">
                        <div className="text-center">
                            <p>Kasir,</p>
                            <div className="h-8"></div>
                            <p>( .................... )</p>
                        </div>
                        <div className="text-center">
                            <p>Pemilik / Admin,</p>
                            <div className="h-8"></div>
                            <p>( .................... )</p>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-2">Dicetak otomatis oleh Sistem Kasir Laksana</p>
                </div>
            </div>
        </div>
    );
};

export default PrintableZReport;
