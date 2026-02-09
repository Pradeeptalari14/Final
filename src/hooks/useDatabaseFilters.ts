import { useState, useMemo } from 'react';
import { SheetData, SheetStatus } from '@/types';

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface DatabaseFilterState {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    stageFilter: 'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED';
    setStageFilter: (filter: 'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED') => void;
    timeFilter: 'ALL' | '30D' | '90D' | 'CUSTOM';
    setTimeFilter: (filter: 'ALL' | '30D' | '90D' | 'CUSTOM') => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    sortConfig: SortConfig;
    handleSort: (key: string) => void;
    viewMode: 'list' | 'board';
    setViewMode: (mode: 'list' | 'board') => void;
}

export function useDatabaseFilters(sheets: SheetData[]) {
    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED'>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [timeFilter, setTimeFilter] = useState<'ALL' | '30D' | '90D' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'updatedAt',
        direction: 'desc'
    });

    const handleSort = (key: string) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filteredSheets = useMemo(() => {
        let relevantSheets = [...sheets];

        // 0. Time Filtering
        if (timeFilter !== 'ALL') {
            if (timeFilter === 'CUSTOM') {
                if (startDate) {
                    const start = new Date(startDate);
                    relevantSheets = relevantSheets.filter((s) => new Date(s.createdAt) >= start);
                }
                if (endDate) {
                    const end = new Date(endDate);
                    relevantSheets = relevantSheets.filter((s) => new Date(s.createdAt) <= end);
                }
            } else {
                const now = new Date();
                const days = timeFilter === '30D' ? 30 : 90;
                const threshold = new Date(now.setDate(now.getDate() - days));
                relevantSheets = relevantSheets.filter((s) => new Date(s.createdAt) >= threshold);
            }
        }

        // 1. Stage Filtering (Grouping Statuses)
        if (stageFilter !== 'ALL') {
            relevantSheets = relevantSheets.filter((sheet) => {
                if (stageFilter === 'STAGING')
                    return (
                        sheet.status === SheetStatus.DRAFT ||
                        sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING
                    );
                if (stageFilter === 'LOADING')
                    return (
                        sheet.status === SheetStatus.LOCKED ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING
                    );
                if (stageFilter === 'COMPLETED') return sheet.status === SheetStatus.COMPLETED;
                return true;
            });
        }

        // 2. Global Search
        relevantSheets = relevantSheets.filter((sheet) => {
            const matchesSearch =
                searchQuery === '' ||
                (sheet.supervisorName &&
                    sheet.supervisorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.loadingSvName &&
                    sheet.loadingSvName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.verifiedBy &&
                    sheet.verifiedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
                sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sheet.shift && sheet.shift.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (sheet.destination &&
                    sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch;
        });

        // 3. Sorting
        return relevantSheets.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof SheetData];
            const bValue = b[sortConfig.key as keyof SheetData];

            const getTimeSafe = (d: string | number | Date | null | undefined) => {
                if (!d) return 0;
                const t = new Date(d).getTime();
                return isNaN(t) ? 0 : t;
            };

            // ID Sorting (Numeric)
            if (sortConfig.key === 'id') {
                const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            // Date Sorting
            if (sortConfig.key === 'date' || sortConfig.key === 'updatedAt') {
                const dateA = getTimeSafe(a.date || a.createdAt);
                const dateB = getTimeSafe(b.date || b.createdAt);
                const diff = sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;

                // Tie-breaker: If dates are same, sort by created time desc
                if (diff === 0) {
                    return (
                        getTimeSafe(b.updatedAt || b.createdAt) -
                        getTimeSafe(a.updatedAt || a.createdAt)
                    );
                }
                return diff;
            }

            if ((aValue || '') < (bValue || '')) return sortConfig.direction === 'asc' ? -1 : 1;
            if ((aValue || '') > (bValue || '')) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sheets, stageFilter, searchQuery, sortConfig, timeFilter, startDate, endDate]);

    return {
        filteredSheets,
        searchQuery,
        setSearchQuery,
        stageFilter,
        setStageFilter,
        timeFilter,
        setTimeFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortConfig,
        handleSort,
        viewMode,
        setViewMode
    };
}
