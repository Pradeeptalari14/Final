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
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

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
            setCapturedImage(currentSheet.capturedImages?.[0] || null);
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

    const startCamera = async () => {
        try {
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

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                setCapturedImage(canvasRef.current.toDataURL('image/png'));
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
            capturedImage
        },
        camera: {
            videoRef,
            canvasRef,
            cameraActive,
            startCamera,
            stopCamera,
            capturePhoto
        }
    };
};
