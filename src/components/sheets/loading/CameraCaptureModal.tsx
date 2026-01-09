import React from 'react';

interface CameraCaptureModalProps {
    cameraActive: boolean;
    initialCaption?: string;
    videoRef: React.RefObject<HTMLVideoElement>;
    onStop: () => void;
    onCapture: (caption: string) => void;
    options: string[];
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
    cameraActive,
    videoRef,
    onStop,
    onCapture,
    options,
    initialCaption = 'Evidence'
}) => {
    if (!cameraActive) return null;

    const [selectedCaption, setSelectedCaption] = React.useState(initialCaption);

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-2xl relative max-w-lg w-full">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm font-bold text-slate-700 text-center uppercase tracking-wide">Select Label</p>
                    <p className="text-xs text-center text-blue-600 font-bold bg-blue-50 py-1 px-3 rounded-full mx-auto w-fit mb-2">
                        {selectedCaption}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSelectedCaption(opt)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedCaption === opt || selectedCaption.startsWith(opt + ':')
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onStop}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onCapture(selectedCaption)}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex-1"
                    >
                        Capture & Save
                    </button>
                </div>
            </div>
        </div>
    );
};
