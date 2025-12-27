import React from 'react';
import { SKU_MASTER_LIST } from '@/lib/constants';

interface SkuSelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export const SkuSelector: React.FC<SkuSelectorProps> = ({
    value,
    onChange,
    disabled,
    placeholder = 'Select or type SKU...',
    className = ''
}) => {
    return (
        <div className="relative w-full group">
            <input
                list="sku-options"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full p-1.5 text-xs h-8 bg-transparent outline-none transition-all placeholder:text-slate-300 text-slate-700 font-bold disabled:text-slate-500 hover:bg-white focus:bg-white rounded ${className}`}
            />
            <datalist id="sku-options">
                {SKU_MASTER_LIST.map((sku) => (
                    <option key={sku} value={sku} />
                ))}
            </datalist>

            {/* Subtle indicator for interactive state */}
            {!disabled && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                </div>
            )}
        </div>
    );
};
