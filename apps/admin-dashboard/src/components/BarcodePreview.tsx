import React from 'react';
import { encodeCode128 } from '../utils/barcode128';

interface BarcodePreviewProps {
    sku: string;
    width?: number | string;
    height?: number;
    showText?: boolean;
    className?: string;
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
    sku,
    width = '100%',
    height = 50,
    showText = true,
    className = ''
}) => {
    const barcode = encodeCode128(sku || '0000');

    return (
        <div className={`flex flex-col items-center justify-center p-2 bg-white rounded border border-slate-200 dark:border-slate-700 select-none ${className}`}>
            <svg
                viewBox={`0 0 ${barcode.totalModules} ${height}`}
                style={{ width, height: `${height}px`, maxWidth: '280px' }}
                className="overflow-visible"
                preserveAspectRatio="none"
            >
                {barcode.bars.map((bar, idx) => (
                    <rect
                        key={idx}
                        x={bar.x}
                        y={0}
                        width={bar.width}
                        height={height}
                        fill="#000000"
                    />
                ))}
            </svg>
            {showText && (
                <span className="font-mono text-xs font-bold tracking-widest text-black mt-1">
                    {barcode.sku}
                </span>
            )}
        </div>
    );
};

export default BarcodePreview;
