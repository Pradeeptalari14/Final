import { useState, useEffect, useRef } from 'react';
import { SheetData, User } from '@/types';

export const useSheetHeader = (
    currentSheet: SheetData | null,
    currentUser: User | null,
    users: User[] = []
) => {
    // Header inputs
    const [transporter, setTransporter] = useState('');
    const [loadingDock, setLoadingDock] = useState('');
    const [shift, setShift] = useState('');
    const [destination, setDestination] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [empCode, setEmpCode] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Loading Specific Extra Fields
    const [pickingBy, setPickingBy] = useState('');
    const [pickingByEmpCode, setPickingByEmpCode] = useState('');
    const [pickingCrosscheckedBy, setPickingCrosscheckedBy] = useState('');
    const [pickingCrosscheckedByEmpCode, setPickingCrosscheckedByEmpCode] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [driverName, setDriverName] = useState('');
    const [sealNo, setSealNo] = useState('');
    const [regSerialNo, setRegSerialNo] = useState('');

    const isInitialized = useRef<string | null>(null);

    // Sync Local State
    useEffect(() => {
        if (!currentSheet) return;

        // Only initialize state if we haven't initialized for this specific sheet ID yet
        // This prevents overwriting local typing during background refreshes
        if (isInitialized.current === currentSheet.id) {
            return;
        }

        queueMicrotask(() => {
            setTransporter(currentSheet.transporter || '');
            setLoadingDock(currentSheet.loadingDockNo || '');
            setShift(currentSheet.shift || '');
            setDestination(currentSheet.destination || '');

            // Row 1 (Stager) Code
            const startLog = currentSheet.history?.find(h => h.action === 'LOADING_STARTED' || h.action === 'STAGING_STARTED');
            const fallbackStart = startLog ? new Date(startLog.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

            setStartTime(
                currentSheet.loadingStartTime ||
                fallbackStart ||
                new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );

            // Lookup helper
            const getEmpCodeByName = (name: string) => {
                if (!name) return null;
                return users.find(u => u.fullName === name || u.username === name)?.empCode;
            };

            // Fallback for End Time from history
            const endLog = currentSheet.history?.find(h => h.action === 'COMPLETED' || h.action === 'LOADING_SUBMITTED' || h.action === 'STAGING_SUBMITTED');
            const fallbackEnd = endLog ? new Date(endLog.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

            setEndTime(currentSheet.loadingEndTime || fallbackEnd || '');

            const currentUserName = currentUser?.fullName || currentUser?.username || '';
            const initialPickingBy =
                currentSheet.pickingBy && currentSheet.pickingBy.trim() !== ''
                    ? currentSheet.pickingBy
                    : currentSheet.supervisorName || currentSheet.createdBy || currentUserName;
            setPickingBy(initialPickingBy);

            // Row 1 (Stager) Code
            // Try to find by name first to ensure accuracy for historical data
            const stagerLookup = getEmpCodeByName(initialPickingBy);
            setEmpCode(stagerLookup || currentSheet.empCode || '');
            setPickingByEmpCode(stagerLookup || currentSheet.empCode || '');

            const initialPickingCrosscheckedBy =
                currentSheet.pickingCrosscheckedBy &&
                    currentSheet.pickingCrosscheckedBy.trim() !== ''
                    ? currentSheet.pickingCrosscheckedBy
                    : currentUserName;
            setPickingCrosscheckedBy(initialPickingCrosscheckedBy);

            const loaderLookup = getEmpCodeByName(initialPickingCrosscheckedBy);
            setPickingCrosscheckedByEmpCode(
                loaderLookup ||
                currentSheet.pickingCrosscheckedByEmpCode ||
                (initialPickingCrosscheckedBy === (currentUser?.fullName || currentUser?.username) ? (currentUser?.empCode || '') : '')
            );
            setVehicleNo(currentSheet.vehicleNo || '');
            setDriverName(currentSheet.driverName || '');
            setSealNo(currentSheet.sealNo || '');
            setRegSerialNo(currentSheet.regSerialNo || '');

            setSupervisorName(
                currentSheet.loadingSvName && currentSheet.loadingSvName.trim() !== ''
                    ? currentSheet.loadingSvName
                    : currentUserName
            );

            isInitialized.current = currentSheet.id;
        });
    }, [currentSheet, currentUser, users]);

    const handleHeaderChange = (field: string, value: string | number | boolean) => {
        const valStr = String(value);
        switch (field) {
            case 'shift': setShift(valStr); break;
            case 'transporter': setTransporter(valStr); break;
            case 'destination': setDestination(valStr); break;
            case 'loadingDockNo': setLoadingDock(valStr); break;
            case 'supervisorName': setSupervisorName(valStr); break;
            case 'pickingBy': setPickingBy(valStr); break;
            case 'pickingByEmpCode': setPickingByEmpCode(valStr); break;
            case 'pickingCrosscheckedBy': setPickingCrosscheckedBy(valStr); break;
            case 'pickingCrosscheckedByEmpCode': setPickingCrosscheckedByEmpCode(valStr); break;
            case 'vehicleNo': setVehicleNo(valStr); break;
            case 'driverName': setDriverName(valStr); break;
            case 'sealNo': setSealNo(valStr); break;
            case 'regSerialNo': setRegSerialNo(valStr); break;
            case 'empCode': setEmpCode(valStr); break;
            case 'loadingStartTime': setStartTime(valStr); break;
            case 'loadingEndTime': setEndTime(valStr); break;
        }
    };

    return {
        headerState: {
            transporter, loadingDock, shift, destination, supervisorName, empCode,
            startTime, endTime, pickingBy, pickingByEmpCode,
            pickingCrosscheckedBy, pickingCrosscheckedByEmpCode,
            vehicleNo, driverName, sealNo, regSerialNo,
            // Setters exposed for edge cases if referenced directly, though handleHeaderChange is preferred
            setEndTime
        },
        handleHeaderChange
    };
};
