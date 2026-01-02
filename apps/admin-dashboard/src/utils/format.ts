export const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Format a number with Indonesian thousand separators (e.g., 5000 → "5.000")
 * Used for displaying in input fields
 */
export const formatNumber = (value: number | string): string => {
    if (value === '' || value === null || value === undefined) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Parse a formatted string back to a number (e.g., "5.000" → 5000)
 * Used for getting the actual value from formatted input
 */
export const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    // Remove all dots (thousand separators in ID locale)
    const cleaned = value.replace(/\./g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};
