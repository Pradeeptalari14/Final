import { useState, useRef, useEffect } from 'react';
import { SheetData, User } from '@/types';

export const useSheetSignatures = (
    currentSheet: SheetData | null,
    currentUser: User | null
) => {
    // Signatures & Remarks
    const [svName, setSvName] = useState('');
    const [svSign, setSvSign] = useState('');
    const [slSign, setSlSign] = useState('');
    const [deoSign, setDeoSign] = useState('');
    const [remarks, setRemarks] = useState('');

    // Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImages, setCapturedImages] = useState<(string | { url: string; caption: string; timestamp: string })[]>([]);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [initialCaption, setInitialCaption] = useState<string>('Evidence');

    // Sync Local State
    useEffect(() => {
        if (!currentSheet) return;

        queueMicrotask(() => {
            const currentUserName = currentUser?.fullName || currentUser?.username || '';
            setSvName(
                currentSheet.loadingSvName && currentSheet.loadingSvName.trim() !== ''
                    ? currentSheet.loadingSvName
                    : currentUserName
            );
            setSvSign(currentSheet.loadingSupervisorSign || '');
            setSlSign(currentSheet.slSign || '');
            setDeoSign(currentSheet.deoSign || '');
            setCapturedImages(currentSheet.capturedImages || []);
        });
    }, [currentSheet, currentUser]);

    // Camera Lifecycle
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [mediaStream]);

    useEffect(() => {
        if (cameraActive && mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [cameraActive, mediaStream]);

    const startCamera = async (defaultCaption: string = 'Evidence') => {
        try {
            setInitialCaption(defaultCaption);
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMediaStream(stream);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Camera error:', err);
            alert('Check permissions. Camera access is required.');
            setCameraActive(false);
        }
    };

    const capturePhoto = (caption: string = 'Evidence') => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const newDataUrl = canvasRef.current.toDataURL('image/png');
                const newImage = {
                    url: newDataUrl,
                    caption,
                    timestamp: new Date().toISOString()
                };
                setCapturedImages(prev => [...prev, newImage]);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        setCameraActive(false);
    };

    return {
        signatureState: {
            svName, setSvName,
            svSign, setSvSign,
            slSign, setSlSign,
            deoSign, setDeoSign,
            remarks, setRemarks,
            capturedImages,
            setCapturedImages
        },
        camera: {
            videoRef,
            canvasRef,
            cameraActive,
            initialCaption,
            startCamera,
            stopCamera,
            capturePhoto
        }
    };
};
