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
    // Fix: Do NOT replace dots here. Value is expected to be a raw number string (e.g., "10000" or "10000.00").
    // Replacing dots in "10000.00" turns it into "1000000" (one million), which caused the bug.
    const num = typeof value === 'string' ? parseFloat(value) : value;
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
