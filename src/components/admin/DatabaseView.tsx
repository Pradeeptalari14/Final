import { SheetData, SheetStatus, User } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { OperationsMonitor } from './OperationsMonitor';
import { t } from '@/lib/i18n';
import { DatabaseFilters } from './database/DatabaseFilters';
import { DatabaseTable } from './database/DatabaseTable';
import { useDatabaseFilters } from '@/hooks/useDatabaseFilters';
import { NuclearButton } from './settings/NuclearButton';

interface DatabaseViewProps {
    sheets: SheetData[];
    currentUser: User | null;
    refreshSheets: () => Promise<void>;
    isLoading?: boolean;
}

export function DatabaseView({ sheets, currentUser, refreshSheets, isLoading }: DatabaseViewProps) {
    const { addToast } = useToast();
    const { updateSheet, deleteSheet } = useData();
    const { settings } = useAppState();

    const {
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
    } = useDatabaseFilters(sheets);

    const handleDeleteSheet = async (sheetId: string) => {
        if (!confirm(t('delete_confirm', settings.language))) return;

        try {
            const { error } = await deleteSheet(sheetId);
            if (error) throw error;
            addToast('success', t('sheet_deleted_successfully', settings.language));
            await refreshSheets();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            addToast(
                'error',
                t('failed_to_delete_sheet', settings.language) + ': ' + message
            );
        }
    };

    const handleUpdateStatus = async (sheetId: string, newStatus: SheetStatus) => {
        try {
            const currentSheet = sheets.find((s) => s.id === sheetId);
            if (!currentSheet) return;

            const updatedSheet = {
                ...currentSheet,
                status: newStatus,
                verifiedBy: currentUser?.fullName,
                verifiedAt: new Date().toISOString()
            };

            const { error } = await updateSheet(updatedSheet);
            if (error) throw error;
            addToast('success', `${t('status_updated', settings.language)}: ${newStatus}`);
            await refreshSheets();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            addToast(
                'error',
                t('failed_to_update_status', settings.language) + ': ' + message
            );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end">
                <NuclearButton />
            </div>

            <DatabaseFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                stageFilter={stageFilter}
                setStageFilter={setStageFilter}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            {viewMode === 'board' ? (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <OperationsMonitor sheets={filteredSheets} onRefresh={refreshSheets} />
                </div>
            ) : (
                <DatabaseTable
                    sheets={filteredSheets}
                    currentUser={currentUser}
                    isLoading={isLoading}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onDeleteSheet={handleDeleteSheet}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}
        </div>
    );
}
