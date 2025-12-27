import React from 'react';

interface CameraCaptureModalProps {
    cameraActive: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    onStop: () => void;
    onCapture: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
    cameraActive,
    videoRef,
    onStop,
    onCapture
}) => {
    if (!cameraActive) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-2 rounded-2xl relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="max-w-full max-h-[80vh] rounded-xl bg-black"
                />
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={onStop}
                        className="px-6 py-2 bg-red-100 text-red-600 font-bold rounded-full"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onCapture}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full shadow-lg"
                    >
                        Take Photo
                    </button>
                </div>
            </div>
        </div>
    );
};
