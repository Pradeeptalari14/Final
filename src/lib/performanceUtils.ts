import { SheetData, SheetStatus, User } from '@/types';

export interface UserStats {
    totalSheets: number;
    completedSheets: number;
    pendingSheets: number;
    totalCases: number;
    avgLoadingTimeMinutes: number;
    efficiency: number;
}

export function calculateUserStats(userId: string, sheets: SheetData[]): UserStats {
    const userSheets = sheets.filter(
        (s) =>
            s.supervisorName === userId ||
            s.loadingSvName === userId ||
            s.createdBy === userId ||
            s.completedBy === userId
    );

    if (userSheets.length === 0) {
        return {
            totalSheets: 0,
            completedSheets: 0,
            pendingSheets: 0,
            totalCases: 0,
            avgLoadingTimeMinutes: 0,
            efficiency: 0
        };
    }

    const completed = userSheets.filter((s) => s.status === SheetStatus.COMPLETED);

    let totalTime = 0;
    let timedSheets = 0;
    let totalCases = 0;

    userSheets.forEach((s) => {
        // Cases
        const stagingCases = s.stagingItems.reduce((acc, i) => acc + (i.ttlCases || 0), 0);
        totalCases += stagingCases;

        // Time
        if (s.status === SheetStatus.COMPLETED && s.loadingStartTime && s.loadingEndTime) {
            const start = parseTimeToMinutes(s.loadingStartTime);
            const end = parseTimeToMinutes(s.loadingEndTime);
            if (end > start) {
                totalTime += (end - start);
                timedSheets++;
            }
        }
    });

    const avgLoadingTime = timedSheets > 0 ? totalTime / timedSheets : 0;

    // Efficiency: Simple ratio of completed to total for now
    // Future: Base on cases per hour
    const efficiency = userSheets.length > 0 ? (completed.length / userSheets.length) * 100 : 0;

    return {
        totalSheets: userSheets.length,
        completedSheets: completed.length,
        pendingSheets: userSheets.length - completed.length,
        totalCases,
        avgLoadingTimeMinutes: Math.round(avgLoadingTime),
        efficiency: Math.round(efficiency)
    };
}

function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    // Handle formats like "09:30:00" or "09:30"
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2) return 0;
    const hours = parts[0];
    const minutes = parts[1];
    const seconds = parts[2] || 0;
    return hours * 60 + minutes + (seconds / 60);
}

export interface StagingStats {
    totalStagingPlaces: number;
    totalQuantity: number;
    completionRate: number;
}

export interface LoadingStats {
    totalVehicles: number;
    totalQuantity: number;
    avgTimeMinutes: number;
}

export interface ShiftLeadStats {
    stagingPlaces: number;
    vehiclesDispatched: number;
    totalQuantity: number;
    avgLoadingTime: number;
}

export function calculateStagingStats(userIdOrName: string, sheets: SheetData[]): StagingStats {
    const userSheets = sheets.filter(s => s.supervisorName === userIdOrName || s.createdBy === userIdOrName);

    // Unique "Staging Places" (Docks)
    const stagingPlaces = new Set(userSheets.map(s => s.loadingDoc).filter(Boolean)).size;

    const quantity = userSheets.reduce((acc, s) => {
        return acc + s.stagingItems.reduce((sum, item) => sum + (item.ttlCases || 0), 0);
    }, 0);

    const completed = userSheets.filter(s => s.status !== SheetStatus.DRAFT).length;
    const rate = userSheets.length > 0 ? (completed / userSheets.length) * 100 : 0;

    return {
        totalStagingPlaces: stagingPlaces,
        totalQuantity: quantity,
        completionRate: Math.round(rate)
    };
}

export function calculateLoadingStats(userIdOrName: string, sheets: SheetData[]): LoadingStats {
    const userSheets = sheets.filter(s => s.loadingSvName === userIdOrName || s.completedBy === userIdOrName);
    const completed = userSheets.filter(s => s.status === SheetStatus.COMPLETED);

    const quantity = completed.reduce((acc, s) => {
        const loadingQty = s.loadingItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
        const additionalQty = s.additionalItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
        return acc + loadingQty + additionalQty;
    }, 0);

    let totalTime = 0;
    let timedSheets = 0;

    completed.forEach(s => {
        if (s.loadingStartTime && s.loadingEndTime) {
            const start = parseTimeToMinutes(s.loadingStartTime);
            const end = parseTimeToMinutes(s.loadingEndTime);
            if (end > start) {
                totalTime += (end - start);
                timedSheets++;
            }
        }
    });

    return {
        totalVehicles: completed.length,
        totalQuantity: quantity,
        avgTimeMinutes: timedSheets > 0 ? Math.round(totalTime / timedSheets) : 0
    };
}

export function calculateShiftLeadStats(userIdOrName: string, sheets: SheetData[]): ShiftLeadStats {
    const userSheets = sheets.filter(s => s.loadingApprovedBy === userIdOrName || s.slName === userIdOrName);

    const stagingPlaces = new Set(userSheets.map(s => s.loadingDoc).filter(Boolean)).size;
    const vehicles = userSheets.filter(s => s.status === SheetStatus.COMPLETED).length;

    const quantity = userSheets.reduce((acc, s) => {
        const loadingQty = s.loadingItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
        const additionalQty = s.additionalItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
        return acc + loadingQty + additionalQty;
    }, 0);

    let totalTime = 0;
    let timedSheets = 0;
    userSheets.forEach(s => {
        if (s.status === SheetStatus.COMPLETED && s.loadingStartTime && s.loadingEndTime) {
            const start = parseTimeToMinutes(s.loadingStartTime);
            const end = parseTimeToMinutes(s.loadingEndTime);
            if (end > start) {
                totalTime += (end - start);
                timedSheets++;
            }
        }
    });

    return {
        stagingPlaces,
        vehiclesDispatched: vehicles,
        totalQuantity: quantity,
        avgLoadingTime: timedSheets > 0 ? Math.round(totalTime / timedSheets) : 0
    };
}

export function getAllUsersStats(users: User[], sheets: SheetData[]) {
    return users.map(user => ({
        ...user,
        stats: calculateUserStats(user.fullName || user.username, sheets)
    }));
}
