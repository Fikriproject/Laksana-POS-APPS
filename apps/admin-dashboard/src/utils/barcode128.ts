/**
 * Utility Barcode Code 128 (Standard ISO/IEC 15417) & PDF Generator
 * Zero-dependency: Menghasilkan barcode 1D garis dan file PDF murni tanpa dependensi eksternal.
 */

// 107 pola modul Code 128 (indeks 0 - 106)
// Setiap karakter terdiri dari 6 angka lebar batang/spasi (kecuali Stop yang memiliki 7 angka)
const CODE128_PATTERNS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export interface BarcodeResult {
    sku: string;
    patternString: string;
    totalModules: number;
    bars: { x: number; width: number }[];
}

/**
 * Meng-encode teks/SKU menjadi susunan batang Code 128 (Set B)
 */
export function encodeCode128(rawText: string): BarcodeResult {
    let clean = (rawText || '0000').trim().toUpperCase().replace(/[^ -~]/g, '');
    if (!clean) clean = '0000';

    const symbols: number[] = [104]; // Start Code B
    let checksum = 104;

    for (let i = 0; i < clean.length; i++) {
        const code = clean.charCodeAt(i) - 32;
        symbols.push(code);
        checksum += (i + 1) * code;
    }

    symbols.push(checksum % 103);
    symbols.push(106); // Stop Code

    const patternString = symbols.map(s => CODE128_PATTERNS[s] || '212222').join('');

    let currentX = 0;
    const bars: { x: number; width: number }[] = [];

    for (let i = 0; i < patternString.length; i++) {
        const width = parseInt(patternString[i], 10);
        // Batang hitam adalah indeks genap (0, 2, 4...)
        if (i % 2 === 0) {
            bars.push({ x: currentX, width });
        }
        currentX += width;
    }

    return {
        sku: clean,
        patternString,
        totalModules: currentX,
        bars
    };
}

export interface ProductForBarcode {
    id: string;
    name: string;
    sku: string;
    price: number;
    category_name?: string;
}

export type BarcodePageLayout = 'grid3x8' | 'koala109' | 'grid4x10' | 'grid3x7' | 'single';

export interface PdfOptions {
    layout?: BarcodePageLayout;
    storeName?: string;
    showPrice?: boolean;
    showStoreName?: boolean;
    copiesPerProduct?: number;
    barcodeWidthMm?: number; // Lebar barcode khusus stiker (mm)
    offsetX?: number;        // Kalibrasi geser posisi X (mm)
    offsetY?: number;        // Kalibrasi geser posisi Y (mm)
    koalaPaperSize?: 'custom170' | 'a4'; // Ukuran lembar PDF Koala 109
    onProgress?: (processed: number, total: number) => void;
}

function escapePdfText(str: string): string {
    return (str || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

/**
 * Memformat angka ke format Rupiah singkat (e.g. Rp 15.000)
 */
function formatRupiahSimple(val: number): string {
    return 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');
}

/**
 * Generator PDF Vector Murni untuk Barcode (A4 & Multi-Halaman)
 */
export async function generateBarcodePdf(
    products: ProductForBarcode[],
    options: PdfOptions = {}
): Promise<Blob> {
    const layout = options.layout || 'grid3x8';
    const storeName = options.storeName || 'LAKSANA POS';
    const showPrice = options.showPrice !== false;
    const showStoreName = options.showStoreName !== false;
    const copies = Math.max(1, options.copiesPerProduct || 1);

    // Gandakan item jika copies > 1
    const itemsToPrint: ProductForBarcode[] = [];
    products.forEach(p => {
        for (let i = 0; i < copies; i++) {
            itemsToPrint.push(p);
        }
    });

    let PAGE_W = 595.28; // A4 pt (210mm)
    let PAGE_H = 841.89; // A4 pt (297mm)

    let cols = 3;
    let rows = 8;
    let marginX = 18;
    let marginY = 24;
    let gapX = 10;
    let gapY = 8;
    let cellW = 107.72;
    let cellH = 36.85;

    const koalaPaperSize = options.koalaPaperSize || 'custom170';
    const deltaX = (options.offsetX || 0) * 2.83465; // offset horizontal (pt)
    const deltaY = (options.offsetY || 0) * 2.83465; // offset vertikal (pt)

    if (layout === 'koala109') {
        // Stiker Label Koala / Tom & Jerry No. 109 (55 label per lembar: 5 kolom x 11 baris)
        // Ukuran per stiker: 38.0 mm x 13.0 mm (107.72 pt x 36.85 pt)
        // Horizontal Pitch: 41.0 mm (116.22 pt) -> gap antar kolom = 3.0 mm (8.50 pt)
        // Vertical Pitch: 15.0 mm (42.52 pt) -> gap antar baris = 2.0 mm (5.67 pt)
        // Side Margin (Left): 3.0 mm (8.50 pt)
        // Top Margin: 3.5 mm (9.92 pt)
        PAGE_W = 595.28; // 210mm
        PAGE_H = koalaPaperSize === 'a4' ? 841.89 : 481.89; // A4 (297mm) atau Kustom Koala (170mm)
        cols = 5;
        rows = 11;
        marginX = 8.50; // 3.0 mm
        marginY = 9.92; // 3.5 mm
        gapX = 8.50;    // 3.0 mm
        gapY = 5.67;    // 2.0 mm
        cellW = 107.72; // 38.0 mm tetap presisi pabrik
        cellH = 36.85;  // 13.0 mm tetap presisi pabrik
    } else if (layout === 'grid4x10') {
        cols = 4;
        rows = 10;
        marginX = 15;
        marginY = 20;
        gapX = 8;
        gapY = 6;
        cellW = (PAGE_W - 2 * marginX - (cols - 1) * gapX) / cols;
        cellH = (PAGE_H - 2 * marginY - (rows - 1) * gapY) / rows;
    } else if (layout === 'grid3x7') {
        // Blueprint GL-A46 (66mm x 40mm - 21 Label per lembar A4)
        cols = 3;
        rows = 7;
        marginX = 17;
        marginY = 24;
        gapX = 8;
        gapY = 8;
        cellW = (PAGE_W - 2 * marginX - (cols - 1) * gapX) / cols;
        cellH = (PAGE_H - 2 * marginY - (rows - 1) * gapY) / rows;
    } else if (layout === 'single') {
        cols = 1;
        rows = 1;
        marginX = 20;
        marginY = 20;
        gapX = 0;
        gapY = 0;
        cellW = (PAGE_W - 2 * marginX - (cols - 1) * gapX) / cols;
        cellH = (PAGE_H - 2 * marginY - (rows - 1) * gapY) / rows;
    } else {
        cellW = (PAGE_W - 2 * marginX - (cols - 1) * gapX) / cols;
        cellH = (PAGE_H - 2 * marginY - (rows - 1) * gapY) / rows;
    }

    const itemsPerPage = cols * rows;
    const totalPages = Math.max(1, Math.ceil(itemsToPrint.length / itemsPerPage));

    const pageStreams: string[] = [];
    const totalItems = itemsToPrint.length;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        let stream = '';

        // Header halaman kecil (dilewati untuk Koala 109 agar margin atas bersih)
        if (layout !== 'koala109') {
            stream += '0.5 0.5 0.5 RG 0.5 w\n';
            stream += `BT /F1 7 Tf ${marginX} ${(PAGE_H - marginY + 8).toFixed(2)} Td (${escapePdfText(storeName)} - Halaman ${pageIdx + 1} dari ${totalPages}) Tj ET\n`;
        }

        const startIdx = pageIdx * itemsPerPage;
        const pageItems = itemsToPrint.slice(startIdx, startIdx + itemsPerPage);

        for (let i = 0; i < pageItems.length; i++) {
            const product = pageItems[i];
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = marginX + col * (cellW + gapX) + (layout === 'koala109' ? deltaX : 0);
            const y = PAGE_H - marginY - (row + 1) * cellH - row * gapY - (layout === 'koala109' ? deltaY : 0);

            if (layout === 'koala109') {
                // Layout khusus Koala 109: Stiker 13 x 38 mm
                // Hanya Nama Barang + Garis Barcode + SKU (Tanpa Nama Toko & Tanpa Harga)

                // Garis batas luar stiker (0.2 pt abu-abu terang)
                stream += '0.88 0.88 0.88 RG 0.2 w\n';
                stream += `${x.toFixed(2)} ${y.toFixed(2)} ${cellW.toFixed(2)} ${cellH.toFixed(2)} re S\n`;

                // 1. Nama Barang (Di atas, font 5.5 pt, truncate max 20 karakter)
                const maxNameLen = 20;
                const truncatedName = product.name.length > maxNameLen
                    ? product.name.substring(0, maxNameLen - 2) + '..'
                    : product.name;
                const nameFontSize = 5.5;
                const approxNameW = truncatedName.length * (nameFontSize * 0.48);
                const nameX = Math.max(x + 2, x + (cellW - approxNameW) / 2);
                const nameY = y + cellH - 7.0;
                stream += '0.1 0.1 0.1 rg\n';
                stream += `BT /F1 ${nameFontSize} Tf ${nameX.toFixed(2)} ${nameY.toFixed(2)} Td (${escapePdfText(truncatedName)}) Tj ET\n`;

                // 2. Garis Barcode Code 128 (Dirampingkan agar PAS di tengah stiker dan tidak meluber ke tepi)
                // Default target lebar: 26 mm (~73.7 pt), menyisakan batas aman 6 mm di kiri dan kanan stiker 38 mm
                const targetWidthMm = options.barcodeWidthMm || 26;
                const barcodeMaxW = Math.min(cellW - 16, Math.max(18, targetWidthMm) * 2.83465);
                const barcode = encodeCode128(product.sku || '0000');
                const unitW = barcodeMaxW / barcode.totalModules;
                const barcodeActualW = barcode.totalModules * unitW;
                const barcodeStartX = x + (cellW - barcodeActualW) / 2;
                const barcodeH = 14.5; // ~5.1 mm - tinggi ideal barcode scanner
                const barcodeY = y + 10.0;

                stream += '0 0 0 rg\n';
                for (const bar of barcode.bars) {
                    const barX = barcodeStartX + bar.x * unitW;
                    const barW = bar.width * unitW;
                    stream += `${barX.toFixed(2)} ${barcodeY.toFixed(2)} ${barW.toFixed(2)} ${barcodeH.toFixed(2)} re f\n`;
                }

                // 3. Teks SKU di bawah barcode (font 5.5 pt tebal)
                const skuText = barcode.sku;
                const skuFontSize = 5.5;
                const approxSkuW = skuText.length * (skuFontSize * 0.55);
                const skuX = Math.max(x + 2, x + (cellW - approxSkuW) / 2);
                const skuY = y + 2.5;
                stream += `BT /F2 ${skuFontSize} Tf ${skuX.toFixed(2)} ${skuY.toFixed(2)} Td (${escapePdfText(skuText)}) Tj ET\n`;
            } else {
                // Layout standar A4
                // Border label luar (garis tipis abu-abu agar rapi saat digunting/ditempel)
                stream += '0.85 0.85 0.85 RG 0.4 w\n';
                stream += `${x.toFixed(2)} ${y.toFixed(2)} ${cellW.toFixed(2)} ${cellH.toFixed(2)} re S\n`;

                // Teks Nama Toko (Atas)
                if (showStoreName) {
                    stream += '0.2 0.2 0.2 rg\n';
                    stream += `BT /F2 ${layout === 'grid4x10' ? '6.5' : '7.5'} Tf ${(x + 8).toFixed(2)} ${(y + cellH - (layout === 'grid4x10' ? 10 : 12)).toFixed(2)} Td (${escapePdfText(storeName)}) Tj ET\n`;
                }

                // Generate Barcode Batang
                const barcode = encodeCode128(product.sku || '0000');
                const barcodeMaxW = cellW - 24;
                const unitW = barcodeMaxW / barcode.totalModules;
                const barcodeActualW = barcode.totalModules * unitW;
                const barcodeStartX = x + (cellW - barcodeActualW) / 2;
                const barcodeH = layout === 'grid4x10' ? 24 : 32;
                const barcodeY = y + (showPrice ? 28 : 22);

                // Gambar batang hitam barcode (100% vector murni)
                stream += '0 0 0 rg\n';
                for (const bar of barcode.bars) {
                    const barX = barcodeStartX + bar.x * unitW;
                    const barW = bar.width * unitW;
                    stream += `${barX.toFixed(2)} ${barcodeY.toFixed(2)} ${barW.toFixed(2)} ${barcodeH.toFixed(2)} re f\n`;
                }

                // Teks SKU di bawah barcode
                const skuText = barcode.sku;
                const skuFontSize = layout === 'grid4x10' ? 7 : 8;
                const approxSkuW = skuText.length * (skuFontSize * 0.55);
                const skuX = Math.max(x + 4, x + (cellW - approxSkuW) / 2);
                stream += `BT /F2 ${skuFontSize} Tf ${skuX.toFixed(2)} ${(barcodeY - (layout === 'grid4x10' ? 9 : 10)).toFixed(2)} Td (${escapePdfText(skuText)}) Tj ET\n`;

                // Nama Produk (Dipotong jika terlalu panjang agar tidak keluar garis label)
                const maxNameLen = layout === 'grid4x10' ? 24 : 30;
                const truncatedName = product.name.length > maxNameLen
                    ? product.name.substring(0, maxNameLen - 2) + '..'
                    : product.name;
                const nameFontSize = layout === 'grid4x10' ? 6.5 : 7.5;
                const approxNameW = truncatedName.length * (nameFontSize * 0.5);
                const nameX = Math.max(x + 4, x + (cellW - approxNameW) / 2);
                stream += `BT /F1 ${nameFontSize} Tf ${nameX.toFixed(2)} ${(y + (showPrice ? 12 : 6)).toFixed(2)} Td (${escapePdfText(truncatedName)}) Tj ET\n`;

                // Harga Produk (Bawah)
                if (showPrice && product.price > 0) {
                    const priceText = formatRupiahSimple(product.price);
                    const priceFontSize = layout === 'grid4x10' ? 7 : 8;
                    const approxPriceW = priceText.length * (priceFontSize * 0.55);
                    const priceX = Math.max(x + 4, x + (cellW - approxPriceW) / 2);
                    stream += '0.05 0.45 0.25 rg\n'; // Sedikit hijau gelap untuk harga
                    stream += `BT /F2 ${priceFontSize} Tf ${priceX.toFixed(2)} ${(y + 3).toFixed(2)} Td (${escapePdfText(priceText)}) Tj ET\n`;
                }
            }

            // Notifikasi progress per item
            if (options.onProgress) {
                options.onProgress(startIdx + i + 1, totalItems);
            }
        }

        pageStreams.push(stream);

        // Berikan napas ke event loop agar animasi UI tetap responsif
        await new Promise(r => setTimeout(r, 4));
    }

    // Konstruksi Struktur Dokumen PDF 1.4 Standar
    const objects: string[] = [];
    const numPages = pageStreams.length;
    const pageObjIds: number[] = [];

    for (let i = 0; i < numPages; i++) {
        pageObjIds.push(5 + i * 2);
    }

    const catalog = '<< /Type /Catalog /Pages 2 0 R >>';
    const pagesDict = `<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${numPages} >>`;
    const fontReg = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    const fontBold = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

    objects.push(catalog, pagesDict, fontReg, fontBold);

    for (let i = 0; i < numPages; i++) {
        const pageId = 5 + i * 2;
        const contentId = pageId + 1;
        const stream = pageStreams[i];
        const pageObj = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
        const contentObj = `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
        objects.push(pageObj, contentObj);
    }

    let pdfText = '%PDF-1.4\n';
    const offsets: number[] = [];

    for (let i = 0; i < objects.length; i++) {
        offsets.push(pdfText.length);
        pdfText += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = pdfText.length;
    pdfText += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (const off of offsets) {
        pdfText += `${String(off).padStart(10, '0')} 00000 n \n`;
    }

    pdfText += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdfText], { type: 'application/pdf' });
}

/**
 * Memicu download file Blob di browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Membuka file Blob PDF di tab baru browser
 */
export function openPdfBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
