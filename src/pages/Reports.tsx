import { useData } from '@/contexts/DataContext';
import { AnalyticsHub } from '@/components/admin/AnalyticsHub';

export default function ReportsPage() {
    const { sheets, refreshSheets, currentUser } = useData();

    return (
        <div className="h-full w-full">
            <AnalyticsHub sheets={sheets} onRefresh={refreshSheets} currentUser={currentUser} />
        </div>
    );
}
