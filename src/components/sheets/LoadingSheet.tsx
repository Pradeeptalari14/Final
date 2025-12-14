import { useState, useRef, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { SheetData, SheetStatus, Role } from '@/types'; // Added StagingItem
import { useNavigate, useParams } from 'react-router-dom';
import {
    Camera,
    Printer,
    CheckCircle,
    ArrowLeft,
    Save,
    ClipboardList,
    Box,
    Truck,
    MapPin,
    Calendar,
    Clock,
    User,
    FileCheck,
    Container,
    Plus,
    AlertTriangle,
    Image as ImageIcon
} from 'lucide-react';


// --- Extracted Helper Components ---
const HeaderField = ({ label, icon: Icon, hasError, children }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 ${hasError ? 'text-red-600' : 'text-slate-500'}`}>
            {Icon && <Icon size={14} className={hasError ? 'text-red-500' : 'text-slate-400'} />} {label}
        </label>
        <div className={`p-2 rounded-lg border shadow-sm transition-all ${hasError ? 'bg-red-50 border-red-500 ring-1 ring-red-200' : 'bg-white border-slate-200'}`}>
            {children}
        </div>
    </div>
);

export default function LoadingSheet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateSheet, sheets, refreshSheets, currentUser } = useData();
    // const { user } = useAuth(); // Removed: Using DataContext currentUser for consistent session state

    const [currentSheet, setCurrentSheet] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        if (!id) return;
        const found = sheets.find(s => s.id === id);
        if (found) {
            setCurrentSheet(found);
            setLoading(false);
        } else {
            // Fallback if not loaded yet
            refreshSheets().then(() => {
                // Re-check logic would go here or rely on next render if sheets changes
            });
        }
    }, [id, sheets]);

    // FAIL-SAFE REDIRECT: Staging Supervisors should NEVER see Loading Sheet unless COMPLETED
    useEffect(() => {
        if (!currentSheet || !currentUser) return;

        const isStagingUser = currentUser.role === Role.STAGING_SUPERVISOR;
        // If it's Locked (Approved) or Pending Verification, Staging SV should see Staging Sheet
        // Only if COMPLETED can they see this Loading Sheet (as a final record)
        if (isStagingUser && (currentSheet.status === SheetStatus.LOCKED || currentSheet.status === SheetStatus.LOADING_VERIFICATION_PENDING)) {
            navigate(`/sheets/staging/${currentSheet.id}`, { replace: true });
        }
    }, [currentSheet, currentUser, navigate]);


    // --- LEGACY STATE ---
    // Controls to hide Submit / Show Print after completion
    const isCompleted = currentSheet?.status === SheetStatus.COMPLETED;
    const isPendingVerification = currentSheet?.status === SheetStatus.LOADING_VERIFICATION_PENDING;
    const canApprove = (currentUser?.role === Role.SHIFT_LEAD || currentUser?.role === Role.ADMIN) && isPendingVerification;
    // Lock edits if completed or pending verification (unless rejecting)
    // STRICT RULE: If completed, it is READ ONLY for everyone.
    const isLocked = isCompleted || (isPendingVerification && currentUser?.role !== Role.ADMIN);

    // Print Preview State
    const [isPreview, setIsPreview] = useState(false);

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


    // --- Sync Local State with Sheet Updates ---
    useEffect(() => {
        if (!currentSheet) return;

        setTransporter(currentSheet.transporter || '');
        setLoadingDock(currentSheet.loadingDockNo || '');
        setShift(currentSheet.shift || 'A');
        setDestination(currentSheet.destination || '');
        setEmpCode(currentSheet.empCode || '');
        setStartTime(currentSheet.loadingStartTime || new Date().toLocaleTimeString('en-US', { hour12: false }));
        setEndTime(currentSheet.loadingEndTime || '');

        // Stronger Auto-fill: Fallback to current user if empty or whitespace
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
        setRemarks(currentSheet.comments?.[0]?.text || '');
        setCapturedImage(currentSheet.capturedImages?.[0] || null);

        // INITIALIZE LOADING ITEMS IF EMPTY
        const hasStagingData = currentSheet.stagingItems.some(i => i.ttlCases > 0);
        const hasLoadingData = currentSheet.loadingItems && currentSheet.loadingItems.length > 0;
        const hasAdditionalData = currentSheet.additionalItems && currentSheet.additionalItems.length > 0;

        if (hasStagingData && (!hasLoadingData || !hasAdditionalData)) {
            generateLoadingItems(currentSheet);
        }

    }, [currentSheet?.id, currentUser]); // Added currentUser dependency to retry auto-fill if user loads late

    // Camera Cleanup
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

        const updatedSheet = {
            ...sheet,
            loadingItems: updatedLoadingItems,
            additionalItems: updatedAdditionalItems
        };

        setCurrentSheet(updatedSheet);
        // We don't save to DB immediately here to avoid write spam, 
        // but it will be saved on "Save Progress"
    };

    const handleLoadingCellChange = (skuSrNo: number, row: number, col: number, val: string) => {
        if (!currentSheet) return;
        const value = val === '' ? 0 : parseInt(val);
        if (isNaN(value)) return;
        const stagingItem = currentSheet.stagingItems.find(s => s.srNo === skuSrNo);





        const safeLoadingItems = currentSheet.loadingItems && currentSheet.loadingItems.length > 0
            ? currentSheet.loadingItems
            : []; // Should be init already

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

        // LEGACY VALIDATION: Warn if entered quantity doesn't match Cases/Plt
        if (stagingItem && Number(stagingItem.casesPerPlt) > 0 && value !== Number(stagingItem.casesPerPlt)) {
            if (!window.confirm(`⚠️ Quantity Mismatch (Wrong Number?)\n\nYou Entered: ${value}\nStandard Cases/Plt: ${stagingItem.casesPerPlt}\n\nIs this correct?`)) {
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

    const handleAdditionalChange = (id: number, field: 'skuName' | 'count', value: string, colIndex?: number) => {
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

    const startCamera = async () => {
        try { setCameraActive(true); const stream = await navigator.mediaDevices.getUserMedia({ video: true }); setMediaStream(stream); }
        catch (err) { console.error("Camera error:", err); alert("Check permissions. Camera access is required."); setCameraActive(false); }
    };
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0); setCapturedImage(canvasRef.current.toDataURL('image/png')); stopCamera();
            }
        }
    };
    const stopCamera = () => { if (mediaStream) mediaStream.getTracks().forEach(track => track.stop()); setMediaStream(null); setCameraActive(false); };
    const clearError = (field: string) => { setErrors(prev => prev.filter(e => e !== field)); };

    const buildSheetData = (status: SheetStatus): SheetData => {
        if (!currentSheet) throw new Error("No sheet");

        const finalLoadingItems = (currentSheet.loadingItems && currentSheet.loadingItems.length > 0)
            ? currentSheet.loadingItems
            : []; // Should rely on state

        const finalAdditionalItems = (currentSheet.additionalItems && currentSheet.additionalItems.length > 0)
            ? currentSheet.additionalItems
            : (currentSheet.additionalItems || []);

        return {
            ...currentSheet,
            status,
            loadingItems: finalLoadingItems,
            additionalItems: finalAdditionalItems,
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
            comments: remarks ? [{ id: Date.now().toString(), author: currentUser?.username || 'User', text: remarks, timestamp: new Date().toISOString() }] : []
        };
    };

    const handleSaveProgress = async () => {
        if (!currentSheet) return;
        try {
            const data = buildSheetData(currentSheet.status);
            await updateSheet(data);
            alert("Progress Saved Successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save progress.");
        }
    };

    const handleSubmit = async () => {
        if (!currentSheet) return;
        // Validation
        if (!svName || svName.trim() === '') {
            alert("Supervisor Name is required to complete the sheet.");
            return;
        }

        const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false });
        setEndTime(timeNow);

        const tempSheet = buildSheetData(SheetStatus.LOADING_VERIFICATION_PENDING);
        const finalSheet = { ...tempSheet, loadingEndTime: timeNow };

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

    const handleApprove = async (approve: boolean) => {
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
                    completedAt: new Date().toISOString()
                };
                await updateSheet(finalSheet);
                setCurrentSheet(finalSheet);
                navigate('/database');
            }
        } else {
            const reason = prompt("Enter rejection reason:");
            if (reason) {
                const rejectedSheet: SheetData = {
                    ...currentSheet,
                    status: SheetStatus.LOCKED, // Return to Locked (In Progress)
                    rejectionReason: reason,
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

    if (loading || !currentSheet) return <div className="p-8 text-center text-slate-500">Loading Sheet Data...</div>;

    const togglePreview = () => setIsPreview(!isPreview);
    const printNow = () => window.print();

    // Totals
    const totalLoadedMain = currentSheet.loadingItems?.reduce((acc, li) => acc + li.total, 0) || 0;
    const totalAdditional = currentSheet.additionalItems?.reduce((acc, ai) => acc + ai.total, 0) || 0;
    const grandTotalLoaded = totalLoadedMain + totalAdditional;
    const totalStaging = currentSheet.stagingItems.reduce((acc, si) => acc + si.ttlCases, 0);
    const balance = currentSheet.loadingItems?.reduce((acc, li) => acc + Math.max(0, li.balance), 0) || 0;

    const displayedStagingItems = currentSheet.stagingItems.filter(i => i.skuName && i.skuName.trim() !== '');
    const extraItemsWithQty = (currentSheet.additionalItems || []).filter(item => item.total > 0 && item.skuName);
    const returnedItems = currentSheet.loadingItems?.filter(li => li.balance > 0) || [];
    const overLoadedItems = currentSheet.loadingItems?.filter(li => li.balance < 0) || [];

    return (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-24 print:w-full print:max-w-none print:pb-0 print:gap-1">
            {/* Preview Controls */}
            {isPreview && (
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg flex justify-between items-center print:hidden sticky top-4 z-50">
                    <div className="flex items-center gap-3">
                        {/* Incident Button REMOVED here */}
                        <div className="bg-blue-600 p-2 rounded-lg"><Printer size={20} /></div><div><h3 className="font-bold">Print Preview Mode</h3></div>
                    </div>
                    <div className="flex gap-3"><button type="button" onClick={togglePreview} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">Back</button><button type="button" onClick={printNow} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2"><Printer size={16} /> Print</button></div>
                </div>
            )}

            {/* Screen Header */}
            <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 ${isPreview ? 'hidden' : 'block'} print:hidden`}>
                <div className="flex items-center gap-4"><button type="button" onClick={() => navigate(-1)} className="text-slate-500 hover:text-blue-600"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Loading Check Sheet
                            {isPendingVerification && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">VERIFICATION PENDING</span>}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">ID: {currentSheet.id}</p>
                    </div></div>
                <div className="flex gap-2">
                    {/* Fixed: Print button always available now */}
                    <button type="button" onClick={togglePreview} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Printer size={16} /> Print Preview</button>
                    {!isLocked && <button type="button" onClick={handleSaveProgress} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"><Save size={16} /> Save Progress</button>}
                </div>
            </div>

            {/* EXCEL PRINT LAYOUT (Legacy Ported) */}
            <div className={`${isPreview ? 'block' : 'hidden'} print:block font-sans text-[10px] w-full text-black bg-white p-4 print:p-0 overflow-auto`}>
                <div className="min-w-[800px]">
                    <div className='flex justify-between items-end mb-2'>
                        <h1 className="text-xl font-bold underline">LOADING CHECK REPORT</h1>
                        <div className="border border-black px-2 py-1">Doc No: UCIA/LOG/REC/004</div>
                    </div>

                    <table className="w-full border-collapse border border-black mb-1 table-fixed text-[10px]">
                        <colgroup>
                            <col className="w-[10%]" /><col className="w-[23%]" />
                            <col className="w-[10%]" /><col className="w-[23%]" />
                            <col className="w-[14%]" /><col className="w-[20%]" />
                        </colgroup>
                        <thead><tr><th colSpan={6} className="border border-black p-1 text-center text-xl font-bold bg-white">UCIA - FG WAREHOUSE</th></tr></thead>
                        <tbody>
                            <tr><td className="border border-black p-1 font-bold text-center bg-gray-100" colSpan={6}>Staging & Loading Check Sheet</td></tr>
                            {/* Row 1 */}
                            <tr>
                                <td className="border border-black p-1 font-bold">Shift</td>
                                <td className="border border-black p-1 font-bold">{shift}</td>
                                <td className="border border-black p-1 font-bold">Date</td>
                                <td className="border border-black p-1 font-medium">{currentSheet.date}</td>
                                <td className="border border-black p-1 font-bold">Name of the SV / SG</td>
                                <td className="border border-black p-1 font-medium">{currentSheet.supervisorName}</td>
                            </tr>
                            {/* Row 2 */}
                            <tr>
                                <td className="border border-black p-1 font-bold">Emp.code</td>
                                <td className="border border-black p-1 font-medium">{currentSheet.empCode}</td>
                                <td className="border border-black p-1 font-bold">Transporter</td>
                                <td className="border border-black p-1 font-bold">{transporter}</td>
                                <td className="border border-black p-1 font-bold">Loading Start Time</td>
                                <td className="border border-black p-1 font-medium">{startTime}</td>
                            </tr>
                            {/* Row 3 */}
                            <tr>
                                <td className="border border-black p-1 font-bold">Picking By</td>
                                <td className="border border-black p-1 font-bold">{pickingBy}</td>
                                <td className="border border-black p-1 font-bold">Destination</td>
                                <td className="border border-black p-1 font-medium">{destination}</td>
                                <td className="border border-black p-1 font-bold">Loading End Time</td>
                                <td className="border border-black p-1 font-medium">{endTime}</td>
                            </tr>
                            {/* Row 4 */}
                            <tr>
                                <td className="border border-black p-1 font-bold">Picking Crosschecked By</td>
                                <td className="border border-black p-1 font-bold">{pickingCrosscheckedBy}</td>
                                <td className="border border-black p-1 font-bold">Driver Name</td>
                                <td className="border border-black p-1 font-bold">{driverName}</td>
                                <td className="border border-black p-1 font-bold">Vehicle No</td>
                                <td className="border border-black p-1 font-bold uppercase">{vehicleNo}</td>
                            </tr>
                            {/* Row 5 */}
                            <tr>
                                <td className="border border-black p-1 font-bold">Loading Dock No:</td>
                                <td className="border border-black p-1 font-medium">{loadingDock}</td>
                                <td className="border border-black p-1 font-bold">Reg.Serial No</td>
                                <td className="border border-black p-1 font-medium">{regSerialNo}</td>
                                <td className="border border-black p-1 font-bold">Seal No</td>
                                <td className="border border-black p-1 font-bold">{sealNo}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex border border-black">
                        <div className="w-[40%] border-r border-black"><div className="font-bold text-center bg-gray-200">STAGING DETAILS</div>
                            <table className="w-full text-[9px] border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-1">Sr. No.</th>
                                        <th className="border border-black p-1">SKU Name</th>
                                        <th className="border border-black p-1">Cases/PLT</th>
                                        <th className="border border-black p-1">Full PLT</th>
                                        <th className="border border-black p-1">Loose</th>
                                        <th className="border border-black p-1">TTL Cases</th>
                                    </tr>
                                </thead>
                                <tbody>{displayedStagingItems.map(i => (
                                    <tr key={i.srNo}>
                                        <td className="border border-black p-1 text-center">{i.srNo}</td>
                                        <td className="border border-black p-1">{i.skuName}</td>
                                        <td className="border border-black p-1 text-center">{i.casesPerPlt}</td>
                                        <td className="border border-black p-1 text-center">{i.fullPlt}</td>
                                        <td className="border border-black p-1 text-center">{i.loose}</td>
                                        <td className="border border-black p-1 text-center">{i.ttlCases}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <div className="w-[60%]"><div className="font-bold text-center bg-gray-200">LOADING DETAILS</div>
                            <table className="w-full text-[9px] border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-1">S No.</th>
                                        <th className="border border-black p-1">SKU Name</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <th key={n} className="border border-black p-1 w-4">{n}</th>)}
                                        <th className="border border-black p-1">Lse</th>
                                        <th className="border border-black p-1">Total</th>
                                        <th className="border border-black p-1">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSheet.loadingItems
                                        ?.filter(li => displayedStagingItems.some(ds => ds.srNo === li.skuSrNo))
                                        .map((lItem, idx) => {
                                            const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                                            if (!sItem) return null;
                                            const rowsNeeded = Math.max(1, Math.ceil(sItem.fullPlt / 10));

                                            return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                                <tr key={`${lItem.skuSrNo}-${rIndex}`}>
                                                    {rIndex === 0 ? (
                                                        <>
                                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center align-middle">{idx + 1}</td>
                                                            <td rowSpan={rowsNeeded} className="border border-black p-1 align-middle">{sItem.skuName}</td>
                                                        </>
                                                    ) : null}

                                                    {Array.from({ length: 10 }).map((_, cIndex) => {
                                                        const cell = lItem.cells.find(c => c.row === rIndex && c.col === cIndex);
                                                        return <td key={cIndex} className="border border-black p-1 text-center">{cell?.value !== undefined ? cell.value : ''}</td>
                                                    })}

                                                    {rIndex === 0 ? (
                                                        <>
                                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center align-middle">{lItem.looseInput !== undefined ? lItem.looseInput : ''}</td>
                                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center align-middle">{lItem.total}</td>
                                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center align-middle">{lItem.balance}</td>
                                                        </>
                                                    ) : null}
                                                </tr>
                                            ));
                                        })
                                    }
                                </tbody>
                            </table>
                            {currentSheet.additionalItems && currentSheet.additionalItems.length > 0 && currentSheet.additionalItems.some(i => i.total > 0 || i.skuName) && (
                                <div className="mt-2 text-[9px]">
                                    <div className="font-bold text-center bg-gray-200 border border-black border-b-0">ADDITIONAL ITEMS (EXTRAS)</div>
                                    <table className="w-full border-collapse border border-black">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-black p-1 w-8">Sr.no</th>
                                                <th className="border border-black p-1">SKU Name</th>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <th key={n} className="border border-black p-1 w-4 text-center">{n}</th>)}
                                                <th className="border border-black p-1 w-10">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentSheet.additionalItems.filter(item => (item.skuName && item.skuName.trim() !== '') || item.total > 0).map((item) => (
                                                <tr key={item.id}>
                                                    <td className="border border-black p-1 text-center font-bold">{item.id}</td>
                                                    <td className="border border-black p-1">{item.skuName}</td>
                                                    {item.counts.map((c, idx) => (
                                                        <td key={idx} className="border border-black p-1 text-center">{c > 0 ? c : ''}</td>
                                                    ))}
                                                    <td className="border border-black p-1 text-center font-bold">{item.total}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50 font-bold">
                                                <td colSpan={12} className="border border-black p-1 text-right">Total Extras:</td>
                                                <td className="border border-black p-1 text-center">{currentSheet.additionalItems.reduce((sum, item) => sum + (item.total || 0), 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="border border-black border-t-0 flex">
                        <div className="w-[40%] border-r border-black flex">
                            <div className="flex-1 p-1">
                                <div className="flex justify-between border-b border-black p-1"><span>Total Staging Qty</span><span>{totalStaging}</span></div>
                                <div className="flex justify-between border-b border-black p-1"><span>Actual Loaded Qty</span><span>{grandTotalLoaded}</span></div>
                                <div className="flex justify-between p-1"><span>Balance to be returned</span><span>{balance}</span></div>
                            </div>
                        </div>
                        <div className="w-[60%] p-1 flex flex-col">
                            <div className="font-bold text-xs">Remarks</div>
                            {remarks && <div className="mt-1 text-[9px] italic mb-1">{remarks}</div>}

                            <div className="flex gap-2 mt-1 flex-1">
                                {/* Left Side: Loose Returned */}
                                <div className="w-1/2 flex flex-col justify-between border-r border-slate-200 pr-1">
                                    <div>
                                        {returnedItems.map((item, idx) => (
                                            <div key={`ret-${idx}`} className="text-[9px]">
                                                For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {item.balance} loose returned.
                                            </div>
                                        ))}
                                    </div>
                                    {returnedItems.length > 0 && (
                                        <div className="mt-2 border border-black p-1">
                                            <div className="text-[9px] font-bold">Staging Supervisor Name (Loose Returned):</div>
                                            <div className="h-6"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Extra Loaded */}
                                <div className="w-1/2 flex flex-col justify-between pl-1">
                                    <div>
                                        {overLoadedItems.map((item, idx) => (
                                            <div key={`ol-${idx}`} className="text-[9px]">
                                                For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {Math.abs(item.balance)} Cases Extra loaded.
                                            </div>
                                        ))}
                                        {extraItemsWithQty.map((item, idx) => (
                                            <div key={`ext-${idx}`} className="text-[9px]">
                                                For <strong>{item.skuName}</strong> {item.total} Cases Extra loaded.
                                            </div>
                                        ))}
                                    </div>
                                    {(overLoadedItems.length > 0 || extraItemsWithQty.length > 0) && (
                                        <div className="mt-2 border border-black p-1">
                                            <div className="text-[9px] font-bold">Approve Sign (Extra Loaded):</div>
                                            <div className="h-6"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-black border-t-0 p-2 text-center text-lg font-bold">TOTAL loaded Cases: {grandTotalLoaded}</div>
                    <div className="flex border border-black border-t-0 text-xs mt-2">
                        <div className="w-1/4 border-r border-black p-1"><div>Supervisor Name:</div><div className="font-bold">{svName}</div></div>
                        <div className="w-1/4 border-r border-black p-1"><div>Supervisor Sign:</div><div className="font-script text-sm">{svSign}</div></div>
                        <div className="w-1/4 border-r border-black p-1"><div>SL Sign:</div><div className="font-script text-sm">{slSign}</div></div>
                        <div className="w-1/4 p-1"><div>DEO Sign:</div><div className="font-script text-sm">{deoSign}</div></div>
                    </div>
                    {capturedImage && <div className="print-break-before mt-4"><img src={capturedImage} className="max-w-full h-auto" /></div>}
                </div>
            </div>

            {/* MAIN FORM */}
            <div className={`${isPreview ? 'hidden' : 'block'} bg-white shadow-xl shadow-slate-200 rounded-xl overflow-hidden border border-slate-200 print:hidden`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 md:p-6 bg-slate-50/50 border-b border-slate-200">
                    <HeaderField label="Shift" icon={Calendar}>
                        <select value={shift} onChange={e => setShift(e.target.value)} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select>
                    </HeaderField>
                    <HeaderField label="Date" icon={Calendar}><div className="font-semibold text-slate-700 text-sm">{currentSheet.date}</div></HeaderField>
                    <HeaderField label="Transporter *" icon={Truck} hasError={errors.includes('transporter')}>
                        <input type="text" value={transporter} onChange={e => { setTransporter(e.target.value); clearError('transporter'); }} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300" placeholder="Enter Transporter" />
                    </HeaderField>
                    <HeaderField label="Destination" icon={MapPin}>
                        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300" placeholder="Destination" />
                    </HeaderField>
                    {/* Simplified Header inputs for brevity in this replace block, full logic maintained */}
                    <HeaderField label="Loading Dock *" icon={MapPin} hasError={errors.includes('loadingDock')}>
                        <input type="text" value={loadingDock} onChange={e => setLoadingDock(e.target.value)} disabled={isLocked} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Enter Dock No" />
                    </HeaderField>
                    <HeaderField label="Picking By *" icon={User} hasError={errors.includes('pickingBy')}><input type="text" value={pickingBy} onChange={e => { setPickingBy(e.target.value); clearError('pickingBy'); }} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Auto-filled / Picker" /></HeaderField>
                    <HeaderField label="Crosschecked By" icon={FileCheck}><input type="text" value={pickingCrosscheckedBy} onChange={e => setPickingCrosscheckedBy(e.target.value)} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Auto-fill" /></HeaderField>
                    <HeaderField label="Vehicle No *" icon={Truck} hasError={errors.includes('vehicleNo')}><input type="text" value={vehicleNo} onChange={e => { setVehicleNo(e.target.value); clearError('vehicleNo'); }} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none uppercase" placeholder="XX-00-XX-0000" /></HeaderField>
                    <HeaderField label="Driver Name" icon={User}><input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Driver Name" /></HeaderField>
                    <HeaderField label="Seal No *" icon={Container} hasError={errors.includes('sealNo')}><input type="text" value={sealNo} onChange={e => { setSealNo(e.target.value); clearError('sealNo'); }} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Seal #" /></HeaderField>
                    <HeaderField label="Reg. Serial No" icon={FileCheck}><input type="text" value={regSerialNo} onChange={e => setRegSerialNo(e.target.value)} disabled={isCompleted} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="Serial #" /></HeaderField>
                    <HeaderField label="Start Time" icon={Clock}><input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none" placeholder="00:00:00" /></HeaderField>
                    <HeaderField label="End Time" icon={Clock}><input type="text" value={endTime} readOnly className="w-full bg-transparent text-sm font-medium text-slate-500 outline-none" placeholder="" /></HeaderField>
                </div>

                <div className="flex flex-col lg:flex-row border-b border-slate-200">
                    {/* Left Panel: Staging Mirror */}
                    <div className="w-full lg:w-1/3 border-r border-slate-200 bg-slate-50/50">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between"><div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><ClipboardList size={14} className="no-print" /> STAGING</div></div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[350px] text-xs">
                                <thead className="text-slate-600 border-b border-slate-200 bg-slate-50 font-bold">
                                    <tr><th className="p-3 text-left w-8">Sr.No</th><th className="p-3 text-left">SKU Name</th><th className="p-3 text-center w-10">Cs/P</th><th className="p-3 text-center w-10">Full</th><th className="p-3 text-center w-10">Lse</th><th className="p-3 text-center w-12 bg-slate-100">TTL</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                    {displayedStagingItems.map((item, _idx) => (
                                        <tr key={item.srNo}>
                                            <td className="p-3 text-center font-bold">{item.srNo}</td>
                                            <td className="p-3 truncate max-w-[120px]" title={item.skuName}>{item.skuName}</td>
                                            <td className="p-3 text-center">{item.casesPerPlt || '-'}</td>
                                            <td className="p-3 text-center">{item.fullPlt || '-'}</td>
                                            <td className="p-3 text-center">{item.loose || '-'}</td>
                                            <td className="p-3 text-center font-bold bg-slate-50">{item.ttlCases}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Panel: Loading Entry */}
                    <div className="w-full lg:w-2/3 bg-white flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center"><div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Box size={14} /> LOADING SHEET</div></div>
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 text-center w-12 sticky left-0 bg-slate-50 z-20 border-r border-slate-200">Sr.No</th>
                                        <th className="p-3 text-left w-32 sticky left-12 bg-slate-50 z-20 border-r border-slate-200">SKU Name</th>
                                        <th className="p-3 text-center" colSpan={10}>Cells (1-10) - Enter Pallet #</th>
                                        <th className="p-3 text-center w-10">Lse</th>
                                        <th className="p-3 text-center w-12">Tot</th>
                                        <th className="p-3 text-center w-12">Bal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSheet.loadingItems?.map((lItem, idx) => {
                                        const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                                        if (!sItem || !sItem.skuName) return null;
                                        const rowsNeeded = Math.max(1, Math.ceil(sItem.fullPlt / 10));
                                        return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                            <tr key={`${lItem.skuSrNo}-${rIndex}`} className={`hover:bg-blue-50/20 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                {rIndex === 0 && (
                                                    <>
                                                        <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 text-center font-bold font-mono align-middle sticky left-0 z-10 bg-inherit w-12 text-slate-900">
                                                            {lItem.skuSrNo}
                                                        </td>
                                                        <td rowSpan={rowsNeeded} className="border-r border-b border-slate-200 p-3 font-bold align-middle sticky left-12 z-10 bg-inherit w-32 truncate max-w-[150px] text-slate-900" title={sItem.skuName}>
                                                            {sItem.skuName}
                                                        </td>
                                                    </>
                                                )}
                                                {Array.from({ length: 10 }).map((_, cIndex) => {
                                                    const cellNum = rIndex * 10 + cIndex + 1;
                                                    const isValid = cellNum <= sItem.fullPlt;
                                                    const cell = lItem.cells.find(c => c.row === rIndex && c.col === cIndex);
                                                    return <td key={cIndex} className={`border-r border-b border-slate-100 p-0 text-center w-10 h-10 ${!isValid ? 'bg-slate-50' : ''}`}>{isValid && <input type="number" className="w-full h-full text-center outline-none bg-transparent focus:bg-blue-50 text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-500" value={(cell?.value !== undefined && cell.value !== 0) ? cell.value : ''} onChange={e => handleLoadingCellChange(lItem.skuSrNo, rIndex, cIndex, e.target.value)} onBlur={(e) => handleCellBlur(lItem.skuSrNo, rIndex, cIndex, e.target.value)} disabled={isLocked} placeholder="" />}</td>
                                                })}
                                                {rIndex === 0 && <><td rowSpan={rowsNeeded} className="border-r border-b border-slate-100 p-0"><input type="number" placeholder="" className="w-full h-full text-center outline-none bg-transparent focus:bg-blue-50 text-slate-900 font-medium disabled:bg-slate-50 disabled:text-slate-500" value={lItem.looseInput !== undefined ? lItem.looseInput : ''} onChange={e => handleLooseChange(lItem.skuSrNo, e.target.value)} disabled={isLocked} /></td><td rowSpan={rowsNeeded} className="border-r border-b border-slate-100 p-3 text-center font-bold text-slate-900">{lItem.total}</td><td rowSpan={rowsNeeded} className={`border-b border-slate-100 p-3 text-center font-bold ${lItem.balance !== 0 ? 'text-red-600' : 'text-green-600'}`}>{lItem.balance}</td></>}
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Additional Items */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/30">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Plus size={14} /> Additional Items (Extras)</h3>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[600px] text-xs border border-slate-200 bg-white">
                            <thead><tr className="bg-slate-50 text-slate-500"><th className="p-2 text-left border-r w-8">Sr.no</th><th className="p-2 text-left border-r min-w-[120px]">SKU Name</th>{Array.from({ length: 10 }).map((_, i) => <th key={i} className="p-2 text-center border-r w-8">{i + 1}</th>)}<th className="p-2 text-center w-12">Total</th></tr></thead>
                            <tbody>
                                {currentSheet.additionalItems?.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100"><td className="p-2 text-center border-r text-slate-900 font-bold">{item.id}</td><td className="p-0 border-r"><input type="text" className="w-full p-2 outline-none text-slate-900 font-medium" placeholder="SKU Name" value={item.skuName} onChange={e => handleAdditionalChange(item.id, 'skuName', e.target.value)} disabled={isLocked} /></td>{item.counts.map((c, idx) => (<td key={idx} className="p-0 border-r"><input type="number" className="w-full p-2 text-center outline-none text-slate-900 font-medium" value={c || ''} onChange={e => handleAdditionalChange(item.id, 'count', e.target.value, idx)} disabled={isLocked} /></td>))}<td className="p-2 text-center font-bold text-slate-900">{item.total}</td></tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                                    <td colSpan={12} className="p-2 text-right border-r">Total Extras:</td>
                                    <td className="p-2 text-center">{totalAdditional}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Totals & Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
                    <div className="p-4 md:p-6 border-r border-slate-200 bg-slate-50/30">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-4">Summary Totals</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-slate-200 border-dashed"><td className="py-2.5 text-slate-500">Total Staging Qty</td><td className="py-2.5 text-right font-medium text-slate-800">{totalStaging}</td></tr>
                                <tr className="border-b border-slate-200 border-dashed"><td className="py-2.5 text-slate-500">Total Loaded Cases (Main + Extras)</td><td className="py-2.5 text-right font-bold text-blue-600">{grandTotalLoaded}</td></tr>
                                <tr><td className="py-2.5 text-slate-500">Balance to be Returned</td><td className={`py-2.5 text-right font-bold ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{balance}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 md:p-6 bg-amber-50/20">
                        <label className="block text-[10px] font-bold text-amber-600/80 uppercase tracking-wide mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Remarks & Adjustments</label>

                        <div className="mb-3 space-y-1">
                            {returnedItems.map((item, idx) => (
                                <div key={`ret-${idx}`} className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                                    For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {item.balance} loose returned.
                                </div>
                            ))}
                            {overLoadedItems.map((item, idx) => (
                                <div key={`ol-${idx}`} className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                                    For <strong>{currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName}</strong> {Math.abs(item.balance)} Cases Extra loaded.
                                </div>
                            ))}
                            {extraItemsWithQty.map((item, idx) => (
                                <div key={`ext-${idx}`} className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                                    For <strong>{item.skuName}</strong> {item.total} Cases Extra (Additional) loaded.
                                </div>
                            ))}
                        </div>

                        <textarea className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-amber-500/20" placeholder="Enter other remarks regarding shortage/excess..." value={remarks} onChange={e => setRemarks(e.target.value)} disabled={isLocked}></textarea>
                    </div>
                </div>

                {/* Captured Photo Display - ADDED */}
                {capturedImage && (
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><ImageIcon size={14} /> Captured Photo</h3>
                        <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img src={capturedImage} alt="Loading Proof" className="w-full h-auto object-cover" />
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <HeaderField label="Supervisor Name" icon={User}><input type="text" value={svName} onChange={e => setSvName(e.target.value)} disabled={isLocked} className="w-full text-sm outline-none p-1 text-slate-900 font-bold disabled:text-slate-600" /></HeaderField>
                        <HeaderField label="Supervisor Sign" icon={FileCheck}><input type="text" value={svSign} onChange={e => setSvSign(e.target.value)} disabled={isLocked} className="w-full text-sm outline-none p-1 font-script text-lg" placeholder="Sign" /></HeaderField>
                        <HeaderField label="SL Sign" icon={FileCheck}><input type="text" value={slSign} onChange={e => setSlSign(e.target.value)} disabled={isLocked} className="w-full text-sm outline-none p-1 font-script text-lg" placeholder="Sign" /></HeaderField>
                        <HeaderField label="DEO Sign" icon={FileCheck}><input type="text" value={deoSign} onChange={e => setDeoSign(e.target.value)} disabled={isLocked} className="w-full text-sm outline-none p-1 font-script text-lg" placeholder="Sign" /></HeaderField>
                    </div>
                </div>

                {!isLocked && !isCompleted && !cameraActive && !isPendingVerification && (
                    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow flex justify-center gap-4 z-50 lg:pl-64 no-print">
                        <button type="button" id="cameraButton" onClick={startCamera} className="px-6 py-2.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors pointer-events-auto"><Camera size={18} /> Add Photo</button>
                        <button type="button" id="submitButton" onClick={handleSubmit} className="px-8 py-2.5 bg-green-600 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg cursor-pointer hover:bg-green-700 transition-colors pointer-events-auto"><CheckCircle size={18} /> Request Verification</button>
                    </div>
                )}

                {/* Approval Footer (Simple Version) */}
                {isPendingVerification && canApprove && (
                    <div className="fixed bottom-0 left-0 w-full p-4 bg-purple-50/90 backdrop-blur-md border-t border-purple-200 shadow flex flex-col items-center gap-4 z-50 lg:pl-64 no-print">
                        <div className="flex gap-4">
                            <button onClick={() => handleApprove(false)} className="px-6 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200">Reject</button>
                            <button onClick={() => handleApprove(true)} className="px-8 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg">Verify & Complete Shipment</button>
                        </div>
                    </div>
                )}
            </div>
            {/* Hidden Video Elements for Camera */}
            {cameraActive && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-2 rounded-2xl relative">
                        <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[80vh] rounded-xl bg-black" />
                        <div className="flex justify-center gap-4 mt-4">
                            <button onClick={stopCamera} className="px-6 py-2 bg-red-100 text-red-600 font-bold rounded-full">Cancel</button>
                            <button onClick={capturePhoto} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full shadow-lg">Take Photo</button>
                        </div>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
