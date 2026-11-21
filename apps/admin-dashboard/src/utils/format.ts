export const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export const parseSafeDate = (dateVal?: string | Date | null): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'string') {
        const safeStr = dateVal.includes(' ') && !dateVal.includes('T')
            ? dateVal.replace(' ', 'T')
            : dateVal;
        const d = new Date(safeStr);
        return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
};

export const formatDateTime = (dateVal?: string | Date | null): string => {
    return parseSafeDate(dateVal).toLocaleString('id-ID');
};

export const formatDate = (dateVal?: string | Date | null, options?: Intl.DateTimeFormatOptions): string => {
    return parseSafeDate(dateVal).toLocaleDateString('id-ID', options || { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (dateVal?: string | Date | null): string => {
    return parseSafeDate(dateVal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

