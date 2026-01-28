import React, { useCallback } from 'react';
import { useBill } from '../../context/BillContext';

const ReceiptUploader: React.FC = () => {
    const { loadReceipt } = useBill();

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) loadReceipt(file);
    }, [loadReceipt]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            loadReceipt(e.target.files[0]);
        }
    };

    return (
        <div
            className="flex-1 flex items-center justify-center border-2 border-dashed border-[#333] rounded-xl bg-[#1a1a1a]/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer m-2 md:m-4 group relative overflow-hidden"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {/* Mobile: Compact View */}
            <div className="md:hidden flex flex-col items-center gap-2 p-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                </div>
                <span className="text-sm font-medium text-gray-300">Upload Receipt</span>
            </div>

            {/* Desktop: Full View */}
            <div className="hidden md:flex flex-col items-center gap-4 text-center p-8">
                <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-300">🧾</div>
                <h3 className="text-white text-xl font-semibold">Upload Receipt</h3>
                <p className="text-gray-500 mb-2">Drag & drop or click to scan</p>
                <span className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full font-semibold cursor-pointer transition-colors shadow-lg shadow-primary/20">
                    Select Image
                </span>
            </div>

            <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept="image/png, image/jpeg, image/webp, image/heic"
            />
        </div>
    );
};

export default ReceiptUploader;
