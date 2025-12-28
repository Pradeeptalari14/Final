import { useData } from '@/contexts/DataContext';
import { DatabaseView } from '@/components/admin/DatabaseView';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';

export default function DatabasePage() {
    const { sheets, refreshSheets, currentUser, loading } = useData();
    const { settings } = useAppState();

    if (loading && sheets.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 animate-pulse">
                {t('loading_dots', settings.language)}
            </div>
        );
    }

    return (
        <DatabaseView
            sheets={sheets}
            currentUser={currentUser}
            refreshSheets={refreshSheets}
        />
    );
}
