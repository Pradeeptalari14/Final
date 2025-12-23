import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus, Role } from '@/types';

export const useLoadingSheetLogic = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateSheet, sheets, refreshSheets, currentUser } = useData();

    const [currentSheet, setCurrentSheet] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);

    // Header inputs
    const [transporter, setTransporter] = useState('');
    const [loadingDock, setLoadingDock] = useState('');
    const [shift, setShift] = useState('A');
    const [destination, setDestination] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [empCode, setEmpCode] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Loading Specific Extra Fields
    const [pickingBy, setPickingBy] = useState('');
    const [pickingCrosscheckedBy, setPickingCrosscheckedBy] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [driverName, setDriverName] = useState('');
    const [sealNo, setSealNo] = useState('');
    const [regSerialNo, setRegSerialNo] = useState('');

    // Signatures & Remarks
    const [svName, setSvName] = useState('');
    const [svSign, setSvSign] = useState('');
    const [slSign, setSlSign] = useState('');
    const [deoSign, setDeoSign] = useState('');
    const [remarks, setRemarks] = useState('');

    // Validation State
    const [errors, setErrors] = useState<string[]>([]);

    // Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // Initial Data Load
    useEffect(() => {
        if (!id) return;
        const found = sheets.find(s => s.id === id);
        if (found) {
            setCurrentSheet(found);
            setLoading(false);
        } else {
            refreshSheets();
        }
    }, [id, sheets]);

    // Role-based redirect
    useEffect(() => {
        if (!currentSheet || !currentUser) return;
        const isStagingUser = currentUser.role === Role.STAGING_SUPERVISOR;
        if (isStagingUser && (currentSheet.status === SheetStatus.LOCKED || currentSheet.status === SheetStatus.LOADING_VERIFICATION_PENDING)) {
            navigate(`/sheets/staging/${currentSheet.id}`, { replace: true });
        }
    }, [currentSheet, currentUser, navigate]);

    // Sync Local State
    useEffect(() => {
        if (!currentSheet) return;

        setTransporter(currentSheet.transporter || '');
        setLoadingDock(currentSheet.loadingDockNo || '');
        setShift(currentSheet.shift || 'A');
        setDestination(currentSheet.destination || '');

        const currentUserCode = currentUser?.empCode || '';
        setEmpCode((currentSheet.empCode && currentSheet.empCode.trim() !== '') ? currentSheet.empCode : currentUserCode);

        setStartTime(currentSheet.loadingStartTime || new Date().toLocaleTimeString('en-US', { hour12: false }));
        setEndTime(currentSheet.loadingEndTime || '');

        const currentUserName = currentUser?.fullName || currentUser?.username || '';
        setPickingBy((currentSheet.pickingBy && currentSheet.pickingBy.trim() !== '') ? currentSheet.pickingBy : (currentSheet.supervisorName || currentSheet.createdBy || currentUserName));
        setPickingCrosscheckedBy((currentSheet.pickingCrosscheckedBy && currentSheet.pickingCrosscheckedBy.trim() !== '') ? currentSheet.pickingCrosscheckedBy : currentUserName);
        setVehicleNo(currentSheet.vehicleNo || '');
        setDriverName(currentSheet.driverName || '');
        setSealNo(currentSheet.sealNo || '');
        setRegSerialNo(currentSheet.regSerialNo || '');
        setSupervisorName((currentSheet.supervisorName && currentSheet.supervisorName.trim() !== '') ? currentSheet.supervisorName : currentUserName);
        setSvName((currentSheet.loadingSvName && currentSheet.loadingSvName.trim() !== '') ? currentSheet.loadingSvName : currentUserName);
        setSvSign(currentSheet.loadingSupervisorSign || '');
        setSlSign(currentSheet.slSign || '');
        setDeoSign(currentSheet.deoSign || '');
        setCapturedImage(currentSheet.capturedImages?.[0] || null);

        const hasStagingData = currentSheet.stagingItems.some(i => i.ttlCases > 0);
        const hasLoadingData = currentSheet.loadingItems && currentSheet.loadingItems.length > 0;
        const hasAdditionalData = currentSheet.additionalItems && currentSheet.additionalItems.length > 0;

        if (hasStagingData && (!hasLoadingData || !hasAdditionalData)) {
            generateLoadingItems(currentSheet);
        }
    }, [currentSheet?.id, currentUser]);

    // Camera Lifecycle
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaStream]);

    useEffect(() => {
        if (cameraActive && mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [cameraActive, mediaStream]);

    const generateLoadingItems = (sheet: SheetData) => {
        let updatedLoadingItems = sheet.stagingItems
            .filter(item => item.skuName && item.ttlCases > 0)
            .map(item => ({
                skuSrNo: item.srNo,
                cells: [],
                looseInput: undefined,
                total: 0,
                balance: item.ttlCases
            }));

        let updatedAdditionalItems = (sheet.additionalItems && sheet.additionalItems.length > 0)
            ? sheet.additionalItems
            : Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                skuName: '',
                counts: Array(10).fill(0),
                total: 0
            }));

        setCurrentSheet(prev => prev ? ({
            ...prev,
            loadingItems: updatedLoadingItems,
            additionalItems: updatedAdditionalItems
        }) : null);
    };

    const handleHeaderChange = (field: string, value: any) => {
        setErrors(prev => prev.filter(e => e !== field));
        switch (field) {
            case 'shift': setShift(value); break;
            case 'transporter': setTransporter(value); break;
            case 'destination': setDestination(value); break;
            case 'loadingDockNo': setLoadingDock(value); break;
            case 'supervisorName': setSupervisorName(value); break;
            case 'pickingBy': setPickingBy(value); break;
            case 'pickingCrosscheckedBy': setPickingCrosscheckedBy(value); break;
            case 'vehicleNo': setVehicleNo(value); break;
            case 'driverName': setDriverName(value); break;
            case 'sealNo': setSealNo(value); break;
            case 'regSerialNo': setRegSerialNo(value); break;
            case 'empCode': setEmpCode(value); break;
            case 'loadingStartTime': setStartTime(value); break;
            case 'loadingEndTime': setEndTime(value); break;
        }
    };

    const handleLoadingCellChange = (skuSrNo: number, row: number, col: number, val: string) => {
        if (!currentSheet) return;
        const value = val === '' ? 0 : parseInt(val);
        if (isNaN(value)) return;
        const stagingItem = currentSheet.stagingItems.find(s => s.srNo === skuSrNo);
        const safeLoadingItems = currentSheet.loadingItems || [];

        const updatedLoadingItems = safeLoadingItems.map(li => {
            if (li.skuSrNo !== skuSrNo) return li;
            const existingCellIndex = li.cells.findIndex(c => c.row === row && c.col === col);
            let newCells = [...li.cells];
            if (existingCellIndex >= 0) { newCells[existingCellIndex] = { row, col, value }; }
            else { newCells.push({ row, col, value }); }
            const cellSum = newCells.reduce((acc, c) => acc + c.value, 0);
            const total = cellSum + (li.looseInput || 0);
            const totalCases = stagingItem?.ttlCases || 0;
            const balance = totalCases - total;
            return { ...li, cells: newCells, total, balance };
        });
        setCurrentSheet(prev => prev ? ({ ...prev, loadingItems: updatedLoadingItems }) : null);
    };

    const handleCellBlur = (skuSrNo: number, row: number, col: number, val: string) => {
        if (!val || val === '') return;
        const value = parseInt(val);
        const stagingItem = currentSheet?.stagingItems.find(s => s.srNo === skuSrNo);
        if (stagingItem && Number(stagingItem.casesPerPlt) > 0 && value !== Number(stagingItem.casesPerPlt)) {
            if (!window.confirm(`\u26A0\uFE0F Quantity Mismatch\n\nYou Entered: ${value}\nStandard Cases/Plt: ${stagingItem.casesPerPlt}\n\nIs this correct?`)) {
                handleLoadingCellChange(skuSrNo, row, col, '');
            }
        }
    };

    const handleLooseChange = (skuSrNo: number, val: string) => {
        if (!currentSheet) return;
        const value = val === '' ? undefined : parseInt(val);
        if (value !== undefined && isNaN(value)) return;
        const stagingItem = currentSheet.stagingItems.find(s => s.srNo === skuSrNo);

        const updatedLoadingItems = (currentSheet.loadingItems || []).map(li => {
            if (li.skuSrNo !== skuSrNo) return li;
            const cellSum = li.cells.reduce((acc, c) => acc + c.value, 0);
            const total = cellSum + (value || 0);
            const totalCases = stagingItem?.ttlCases || 0;
            const balance = totalCases - total;
            return { ...li, looseInput: value, total, balance };
        });
        setCurrentSheet(prev => prev ? ({ ...prev, loadingItems: updatedLoadingItems }) : null);
    };

    const handleAdditionalChange = (id: number, field: string, value: any, colIndex?: number) => {
        if (!currentSheet) return;
        const updatedAdditional = (currentSheet.additionalItems || []).map(item => {
            if (item.id !== id) return item;
            if (field === 'skuName') {
                return { ...item, skuName: value };
            } else if (field === 'count' && colIndex !== undefined) {
                const newCounts = [...item.counts];
                newCounts[colIndex] = value === '' ? 0 : parseInt(value) || 0;
                const newTotal = newCounts.reduce((sum, v) => sum + v, 0);
                return { ...item, counts: newCounts, total: newTotal };
            }
            return item;
        });
        setCurrentSheet(prev => prev ? ({ ...prev, additionalItems: updatedAdditional }) : null);
    };

    const handleToggleRejection = (skuSrNo: number, reason?: string) => {
        if (!currentSheet) return;
        const updatedLoadingItems = (currentSheet.loadingItems || []).map(li => {
            if (li.skuSrNo !== skuSrNo) return li;
            return { ...li, isRejected: !li.isRejected, rejectionReason: !li.isRejected ? reason : undefined };
        });
        setCurrentSheet(prev => prev ? ({ ...prev, loadingItems: updatedLoadingItems }) : null);
    };

    const startCamera = async () => {
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMediaStream(stream);
        } catch (err) {
            console.error("Camera error:", err);
            alert("Check permissions. Camera access is required.");
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
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setCameraActive(false);
    };

    const buildSheetData = (status: SheetStatus): SheetData => {
        if (!currentSheet) throw new Error("No sheet");
        return {
            ...currentSheet,
            status,
            shift,
            destination,
            supervisorName,
            empCode,
            transporter,
            loadingDockNo: loadingDock,
            loadingStartTime: startTime,
            loadingEndTime: endTime,
            pickingBy,
            pickingCrosscheckedBy,
            vehicleNo,
            driverName,
            sealNo,
            regSerialNo,
            loadingSvName: svName,
            loadingSupervisorSign: svSign,
            slSign,
            deoSign,
            capturedImages: capturedImage ? [capturedImage] : [],
            completedBy: status === SheetStatus.COMPLETED ? currentUser?.username : undefined,
            completedAt: status === SheetStatus.COMPLETED ? new Date().toISOString() : undefined,
            comments: remarks
                ? [...(currentSheet.comments || []), { id: Date.now().toString(), author: currentUser?.username || 'User', text: remarks, timestamp: new Date().toISOString() }]
                : (currentSheet.comments || [])
        };
    };

    const handleSaveProgress = async () => {
        if (!currentSheet) return;
        try {
            const data = buildSheetData(currentSheet.status);
            const hasStartedLog = currentSheet.history?.some(h => h.action === 'LOADING_STARTED');
            if (!hasStartedLog && data.loadingStartTime) {
                data.history = [...(data.history || []), {
                    id: Date.now().toString(),
                    actor: currentUser?.username || 'Unknown',
                    action: 'LOADING_STARTED',
                    timestamp: new Date().toISOString(),
                    details: 'Loading Process Started'
                }];
            }
            await updateSheet(data);
            alert("Progress Saved Successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save progress.");
        }
    };

    const handleSubmit = async () => {
        if (!currentSheet) return;
        if (!svName || svName.trim() === '') {
            alert("Supervisor Name is required to complete the sheet.");
            return;
        }
        const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
        setEndTime(timeNow);
        const tempSheet = buildSheetData(SheetStatus.LOADING_VERIFICATION_PENDING);
        const finalSheet = {
            ...tempSheet,
            loadingEndTime: timeNow,
            rejectionReason: undefined,
            history: [...(currentSheet.history || []), {
                id: Date.now().toString(),
                actor: currentUser?.username || 'Unknown',
                action: 'LOADING_SUBMITTED',
                timestamp: new Date().toISOString(),
                details: 'Submitted for Final Verification'
            }]
        };
        try {
            await updateSheet(finalSheet);
            setCurrentSheet(finalSheet);
            alert("Submitted for Shift Lead Verification!");
            navigate('/database');
        } catch (e) {
            console.error(e);
            alert("Failed to submit.");
        }
    };

    const handleVerificationAction = async (approve: boolean, reason?: string) => {
        if (!currentSheet) return;
        if (approve) {
            if (confirm("Confirm final approval? This sheet will be marked as COMPLETED.")) {
                const finalSheet: SheetData = {
                    ...currentSheet,
                    status: SheetStatus.COMPLETED,
                    loadingApprovedBy: currentUser?.username,
                    loadingApprovedAt: new Date().toISOString(),
                    loadingEndTime: currentSheet.loadingEndTime || new Date().toLocaleTimeString('en-US', { hour12: false }),
                    slSign: currentUser?.fullName,
                    completedBy: currentUser?.username,
                    completedAt: new Date().toISOString(),
                    history: [...(currentSheet.history || []), {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'COMPLETED',
                        timestamp: new Date().toISOString(),
                        details: 'Final Approval Granted - Dispatched'
                    }]
                };
                await updateSheet(finalSheet);
                setCurrentSheet(finalSheet);
                navigate('/database');
            }
        } else {
            if (reason) {
                const rejectedSheet: SheetData = {
                    ...currentSheet,
                    status: SheetStatus.LOCKED,
                    rejectionReason: reason,
                    comments: [...(currentSheet.comments || []), {
                        id: Date.now().toString(),
                        author: currentUser?.username || 'Shift Lead',
                        text: `REJECTED: ${reason}`,
                        timestamp: new Date().toISOString()
                    }],
                    history: [...(currentSheet.history || []), {
                        id: Date.now().toString(),
                        actor: currentUser?.username || 'Unknown',
                        action: 'REJECTED_LOADING',
                        timestamp: new Date().toISOString(),
                        details: `Rejected: ${reason}`
                    }]
                };
                await updateSheet(rejectedSheet);
                setCurrentSheet(rejectedSheet);
                navigate('/database');
            }
        }
    };

    const totals = useMemo(() => {
        if (!currentSheet) return { totalLoadedMain: 0, totalAdditional: 0, grandTotalLoaded: 0, totalStaging: 0, balance: 0 };
        const totalLoadedMain = currentSheet.loadingItems?.reduce((acc, li) => acc + li.total, 0) || 0;
        const totalAdditional = currentSheet.additionalItems?.reduce((acc, ai) => acc + ai.total, 0) || 0;
        const grandTotalLoaded = totalLoadedMain + totalAdditional;
        const totalStaging = currentSheet.stagingItems.reduce((acc, si) => acc + si.ttlCases, 0);
        const balance = currentSheet.loadingItems?.reduce((acc, li) => acc + Math.max(0, li.balance), 0) || 0;
        return { totalLoadedMain, totalAdditional, grandTotalLoaded, totalStaging, balance };
    }, [currentSheet]);

    const lists = useMemo(() => {
        if (!currentSheet) return { extraItemsWithQty: [], returnedItems: [], overLoadedItems: [], displayedStagingItems: [] };
        const extraItemsWithQty = (currentSheet.additionalItems || []).filter(item => item.total > 0 && item.skuName);
        const returnedItems = currentSheet.loadingItems?.filter(li => li.balance > 0) || [];
        const overLoadedItems = currentSheet.loadingItems?.filter(li => li.balance < 0) || [];
        const displayedStagingItems = currentSheet.stagingItems.filter(i => i.skuName && i.skuName.trim() !== '');
        return { extraItemsWithQty, returnedItems, overLoadedItems, displayedStagingItems };
    }, [currentSheet]);

    const states = {
        isCompleted: currentSheet?.status === SheetStatus.COMPLETED,
        isPendingVerification: currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING,
        isLocked: (currentSheet?.status === SheetStatus.COMPLETED) || (currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING && currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SHIFT_LEAD)
    };

    return {
        id, currentSheet, loading, currentUser, states, errors,
        header: {
            shift, transporter, destination, loadingDock, supervisorName, empCode, startTime, endTime, pickingBy, pickingCrosscheckedBy, vehicleNo, driverName, sealNo, regSerialNo
        },
        footer: { svName, svSign, slSign, deoSign, remarks, capturedImage },
        camera: { videoRef, canvasRef, cameraActive, startCamera, stopCamera, capturePhoto },
        totals, lists,
        handlers: {
            handleHeaderChange, handleLoadingCellChange, handleCellBlur, handleLooseChange, handleAdditionalChange,
            handleSaveProgress, handleSubmit, handleVerificationAction, setRemarks, setSvName, setSvSign, setSlSign, setDeoSign, handleToggleRejection
        }
    };
};
