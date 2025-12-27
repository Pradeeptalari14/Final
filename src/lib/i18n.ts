import { Language } from '@/types';

type TranslationKey =
    | 'dashboard'
    | 'staging'
    | 'loading'
    | 'shift_lead'
    | 'users'
    | 'settings'
    | 'personalization'
    | 'appearance'
    | 'theme_mode'
    | 'light'
    | 'dark'
    | 'accent_color'
    | 'view_options'
    | 'density'
    | 'compact'
    | 'comfortable'
    | 'text_size'
    | 'sidebar'
    | 'sidebar_collapsed_desc'
    | 'expanded'
    | 'collapsed'
    | 'default_tab'
    | 'language'
    | 'english'
    | 'japanese'
    | 'reports'
    | 'stats'
    | 'live_workflow_status'
    | 'recent_activity'
    | 'database'
    | 'audit_logs'
    | 'sign_out'
    | 'new_staging_sheet'
    | 'total_staging'
    | 'draft'
    | 'pending'
    | 'pending_approval'
    | 'pending_verification'
    | 'locked'
    | 'locked_not_editable'
    | 'completed'
    | 'rejected'
    | 'total_loading'
    | 'ready_to_load'
    | 'locked_pending_ver'
    | 'total_approvals'
    | 'staging_approvals'
    | 'loading_approvals'
    | 'staging_rejected'
    | 'loading_rejected'
    | 'all_done'
    | 'total_sheets'
    | 'active'
    | 'total_users'
    | 'leads'
    | 'sheet_id'
    | 'send_to_review'
    | 'all_supervisors'
    | 'all_shifts'
    | 'shift'
    | 'supervisor'
    | 'status'
    | 'date'
    | 'action'
    | 'open'
    | 'no_activity'
    | 'theme_desc'
    | 'accent_desc'
    | 'density_desc'
    | 'text_size_desc'
    | 'language_desc'
    | 'default_tab_desc'
    | 'developer_tools'
    | 'developer_tools_desc'
    | 'loading_team'
    | 'new'
    | 'in_progress'
    | 'verify'
    | 'loaded'
    | 'final_check'
    | 'dispatched'
    | 'all_active_users'
    | 'operational_overview'
    | 'admin_dashboard'
    | 'welcome_back'
    | 'system_online'
    | 'loading_dots'
    | 'all'
    | 'pending_approval'
    | 'locked_approved'
    | 'search_placeholder'
    | 'shift_dest'
    | 'duration'
    | 'no_sheets_found'
    | 'quick_reject'
    | 'quick_approve'
    | 'delete_sheet'
    | 'view_details'
    | 'delete_confirm'
    | 'approve_confirm'
    | 'rejection_reason_prompt'
    | 'user_management'
    | 'search_users_placeholder'
    | 'add_user'
    | 'user'
    | 'role'
    | 'emp'
    | 'last_active'
    | 'actions'
    | 'no_users_found'
    | 'never'
    | 'just_now'
    | 'minutes_ago'
    | 'hours_ago'
    | 'days_ago'
    | 'inactive'
    | 'reset_password'
    | 'edit_user'
    | 'delete_user'
    | 'add_new_user'
    | 'username'
    | 'full_name'
    | 'password'
    | 'emp_code'
    | 'email'
    | 'cancel'
    | 'create_user'
    | 'update_password'
    | 'save_changes'
    | 'role_assignment'
    | 'email_address'
    | 'employee_code'
    | 'delete_active_user_error'
    | 'switch_inactive_first'
    | 'delete_user_confirm'
    | 'full_database'
    | 'all_status'
    | 'view_and_print'
    | 'no_sheets_found_matching'
    | 'sheet_deleted_success'
    | 'staging_tasks'
    | 'no_active_tasks'
    | 'loading_tasks'
    | 'needs_approval'
    | 'all_approved'
    | 'master_records'
    | 'history_title'
    | 'system_audit_logs'
    | 'search_logs_placeholder'
    | 'export'
    | 'timestamp'
    | 'sheet_ref'
    | 'details'
    | 'actor'
    | 'no_logs_found'
    | 'database_desc'
    | 'clear_filters'
    | 'new_sheet'
    | 'database_search_placeholder'
    | 'id'
    | 'destination'
    | 'view'
    | 'load_older_sheets'
    | 'refresh'
    | 'live_operations'
    | 'all_systems_idle'
    | 'no_active_workflows'
    | 'check_again'
    | 'updating'
    | 'user_updated_successfully'
    | 'user_deleted'
    | 'user_created_successfully'
    | 'enter_new_password_for'
    | 'sheet_deleted_successfully'
    | 'failed_to_delete_sheet'
    | 'sheet_approved'
    | 'sheet_rejected_and_returned'
    | 'staging_supervisor'
    | 'loading_supervisor'
    | 'shift_lead'
    | 'admin'
    | 'active_sheets'
    | 'failed_to_update_user'
    | 'staging_verification_pending'
    | 'loading_verification_pending'
    | 'rejected_staging'
    | 'rejected_loading'
    | 'user_updated'
    | 'error_system'
    | 'permission_denied'
    | 'staging_sv'
    | 'loading_sv'
    | 'approval_sv'
    | 'vehicle_no'
    | 'operations_board'
    | 'kanban_view'
    | 'status_updated'
    | 'failed_to_update_status'
    | 'send_to_review'
    | 'cannot_delete_self'
    | 'cannot_deactivate_self'
    | 'delete_active_user_warning'
    | 'operations_monitor'
    | 'current_progress'
    | 'staging_active'
    | 'audit_pending'
    | 'loading_active'
    | 'total_operational_active';

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        dashboard: 'Dashboard',
        staging: 'Staging',
        loading: 'Loading',
        shift_lead: 'Shift Lead',
        users: 'Users',
        settings: 'Settings',
        personalization: 'Personalization',
        appearance: 'Appearance',
        theme_mode: 'Theme Mode',
        theme_desc: 'Light or Dark interface',
        accent_color: 'Accent Color',
        accent_desc: 'Primary highlight color',
        light: 'Light',
        dark: 'Dark',
        view_options: 'View Options',
        density: 'Density',
        density_desc: 'Spacing in tables/lists',
        compact: 'Compact',
        comfortable: 'Comfy',
        text_size: 'Text Size',
        text_size_desc: 'Global font scaling',
        sidebar: 'Sidebar',
        sidebar_collapsed_desc: 'Default menu state',
        expanded: 'Expanded',
        collapsed: 'Collapsed',
        language: 'Language',
        language_desc: 'App display language',
        english: 'English',
        japanese: 'Japanese',
        reports: 'Reports',
        default_tab: 'Default Tab',
        default_tab_desc: 'Admin landing page',
        stats: 'Stats',
        live_workflow_status: 'Live Workflow Status',
        recent_activity: 'Recent Activity',
        database: 'Database',
        audit_logs: 'Audit Logs',
        sign_out: 'Sign Out',
        new_staging_sheet: 'New Staging Sheet',
        total_staging: 'Total Staging',
        draft: 'Draft',
        pending: 'Pending',
        locked: 'Locked',
        completed: 'Completed',
        rejected: 'Rejected',
        total_loading: 'Total Loading',
        ready_to_load: 'Ready to Load',
        locked_pending_ver: 'Locked (Pending Ver.)',
        total_approvals: 'Total Approvals',
        staging_approvals: 'Staging Approvals',
        loading_approvals: 'Loading Approvals',
        staging_rejected: 'Staging Rejected',
        loading_rejected: 'Loading Rejected',
        all_done: 'All Done',
        total_sheets: 'Total Sheets',
        active: 'Active',
        total_users: 'Total Users',
        leads: 'Leads',
        sheet_id: 'Sheet ID',
        supervisor: 'Supervisor',
        status: 'Status',
        date: 'Date',
        action: 'Action',
        open: 'Open',
        no_activity: 'No recent activity found.',
        developer_tools: 'Developer Tools',
        developer_tools_desc: 'Simulate roles to verify permissions across the app.',
        loading_team: 'Loading Team',
        new: 'New',
        in_progress: 'In Progress',
        verify: 'Verify',
        loaded: 'Loaded',
        final_check: 'Final Check',
        dispatched: 'Dispatched',
        all_active_users: 'All Active Users',
        operational_overview: 'Operational Overview',
        admin_dashboard: 'Admin Dashboard',
        welcome_back: 'Welcome back',
        system_online: 'System Online',
        loading_dots: 'Loading...',
        all: 'All',
        pending_approval: 'Pending Approval',
        pending_verification: 'Pending (Ver.)',
        locked_approved: 'Locked (Approved)',
        locked_not_editable: 'Locked (Not Editable)',
        search_placeholder: 'Search...',
        shift_dest: 'Shift / Dest',
        duration: 'Duration',
        no_sheets_found: 'No sheets found for this filter.',
        quick_reject: 'Quick Reject',
        quick_approve: 'Quick Approve',
        delete_sheet: 'Delete Sheet (Admin Only)',
        view_details: 'View Details',
        delete_confirm:
            'Are you sure you want to PERMANENTLY delete this sheet? This action cannot be undone.',
        approve_confirm: 'Approve this sheet?',
        rejection_reason_prompt: 'Enter rejection reason:',
        user_management: 'User Management',
        search_users_placeholder: 'Search users...',
        add_user: 'Add User',
        user: 'User',
        role: 'Role',
        emp: 'EMP',
        last_active: 'Last Active',
        actions: 'Actions',
        staging_sv: 'Staging By',
        loading_sv: 'Loading By',
        approval_sv: 'Approved By',
        no_users_found: 'No users found.',
        never: 'Never',
        just_now: 'Just now',
        minutes_ago: 'm ago',
        hours_ago: 'h ago',
        days_ago: 'd ago',
        inactive: 'Inactive',
        reset_password: 'Reset Password',
        edit_user: 'Edit User',
        delete_user: 'Delete User',
        add_new_user: 'Add New User',
        username: 'Username',
        full_name: 'Full Name',
        password: 'Password',
        emp_code: 'Emp Code',
        email: 'Email',
        cancel: 'Cancel',
        create_user: 'Create User',
        update_password: 'Update Password',
        save_changes: 'Save Changes',
        role_assignment: 'Role Assignment',
        email_address: 'Email Address',
        employee_code: 'Employee Code',
        delete_active_user_error: 'Cannot Delete Active User!',
        switch_inactive_first: "Please switch this user to 'Inactive' first.",
        delete_user_confirm:
            'Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.',
        full_database: 'Full Database',
        all_status: 'All Status',
        view_and_print: 'View & Print',
        no_sheets_found_matching: 'No sheets found matching filters.',
        sheet_deleted_success: 'Sheet deleted successfully',
        staging_tasks: 'Staging Tasks',
        no_active_tasks: 'No Active Tasks',
        loading_tasks: 'Loading Tasks',
        needs_approval: 'Needs Approval',
        all_approved: 'All Approved',
        master_records: 'Master Records',
        history_title: 'History',
        system_audit_logs: 'System Audit Logs',
        search_logs_placeholder: 'Search logs...',
        export: 'Export',
        timestamp: 'Timestamp',
        actor: 'Actor',
        sheet_ref: 'Sheet Ref',
        details: 'Details',
        no_logs_found: 'No logs found matching your criteria.',
        database_desc: 'Manage staging and loading sheets.',
        clear_filters: 'Clear Filters',
        new_sheet: 'New Sheet',
        database_search_placeholder: 'Search by ID, Supervisor, Destination...',
        id: 'ID',
        destination: 'Destination',
        view: 'View',
        load_older_sheets: 'Load Older Sheets',
        refresh: 'Refresh',
        live_operations: 'Live Operations',
        all_systems_idle: 'All Systems Idle',
        no_active_workflows: 'No active workflows currently in progress.',
        check_again: 'Check Again',
        updating: 'Updating...',
        user_updated_successfully: 'User updated successfully',
        user_deleted: 'User deleted',
        user_created_successfully: 'User created successfully!',
        enter_new_password_for: 'Enter new password for',
        sheet_deleted_successfully: 'Sheet deleted successfully',
        failed_to_delete_sheet: 'Failed to delete sheet',
        sheet_approved: 'Sheet approved',
        sheet_rejected_and_returned: 'Sheet rejected and returned to',
        staging_supervisor: 'Staging Supervisor',
        loading_supervisor: 'Loading Supervisor',
        admin: 'Admin',
        active_sheets: 'Active',
        failed_to_update_user: 'Failed to update user',
        staging_verification_pending: 'Staging Verification Pending',
        loading_verification_pending: 'Loading Verification Pending',
        rejected_staging: 'Rejected Staging',
        rejected_loading: 'Rejected Loading',
        user_updated: 'User updated',
        error_system: 'System Error',
        permission_denied: 'Permission Denied',
        vehicle_no: 'Vehicle No',
        operations_board: 'Operations Board',
        kanban_view: 'Kanban View',
        status_updated: 'Status updated successfully',
        failed_to_update_status: 'Failed to update status',
        send_to_review: 'Send to Review',
        cannot_delete_self: 'You cannot delete your own account!',
        cannot_deactivate_self: 'You cannot deactivate your own account!',
        delete_active_user_warning:
            'This user is currently active. Deleting them will automatically deactivate their profile. Proceed?',
        operations_monitor: 'Operations Monitor',
        current_progress: 'Current Progress',
        staging_active: 'Staging Active',
        audit_pending: 'Audit Pending',
        loading_active: 'Loading Active',
        total_operational_active: 'Total Active Operational Sheets',
        all_supervisors: 'All Supervisors',
        all_shifts: 'All Shifts',
        shift: 'Shift'
    },
    jp: {
        dashboard: 'ダッシュボード',
        staging: 'ステージング',
        loading: 'ローディング',
        shift_lead: 'シフトリード',
        users: 'ユーザー',
        settings: '設定',
        personalization: 'パーソナライズ',
        appearance: '外観',
        theme_mode: 'テーマモード',
        theme_desc: 'ライトまたはダークインターフェース',
        accent_color: 'アクセントカラー',
        accent_desc: '主要なハイライトカラー',
        light: 'ライト',
        dark: 'ダーク',
        view_options: '表示オプション',
        density: '密度',
        density_desc: 'テーブル/リストの間隔',
        compact: 'コンパクト',
        comfortable: '快適',
        text_size: 'テキストサイズ',
        text_size_desc: 'グローバルなフォントスケーリング',
        sidebar: 'サイドバー',
        sidebar_collapsed_desc: 'デフォルトのメニュー状態',
        expanded: '展開',
        collapsed: '折りたたみ',
        language: '言語',
        language_desc: 'アプリの表示言語',
        english: '英語',
        japanese: '日本語',
        reports: 'レポート',
        default_tab: 'デフォルトタブ',
        default_tab_desc: '管理者のランディングページ',
        stats: '統計',
        live_workflow_status: 'ライブワークフローステータス',
        recent_activity: '最近のアクティビティ',
        database: 'データベース',
        audit_logs: '監査ログ',
        sign_out: 'サインアウト',
        new_staging_sheet: '新規ステージングシート',
        total_staging: 'ステージング合計',
        draft: 'ドラフト',
        pending: '保留中',
        locked: 'ロック済み',
        completed: '完了',
        rejected: '却下',
        total_loading: 'ローディング合計',
        ready_to_load: 'ロード準備完了',
        locked_pending_ver: 'ロック済み（認証待ち）',
        total_approvals: '承認合計',
        staging_approvals: 'ステージング承認',
        loading_approvals: 'ローディング承認',
        staging_rejected: 'ステージング却下',
        loading_rejected: 'ローディング却下',
        all_done: '全完了',
        total_sheets: 'シート合計',
        active: 'アクティブ',
        total_users: 'ユーザー合計',
        leads: 'リード',
        sheet_id: 'シートID',
        supervisor: 'スーパーバイザー',
        status: 'ステータス',
        date: '日付',
        action: 'アクション',
        open: '開く',
        no_activity: '最近のアクティビティはありません。',
        developer_tools: 'デベロッパーツー​​ル',
        developer_tools_desc: 'アプリ全体の権限を確認するためにロールをシミュレートします。',
        loading_team: 'ローディングチーム',
        new: '新規',
        in_progress: '進行中',
        verify: '認証',
        loaded: 'ロード済み',
        final_check: '最終チェック',
        dispatched: '発送済み',
        all_active_users: 'すべてのアクティブユーザー',
        operational_overview: '運用概要',
        admin_dashboard: '管理ダッシュボード',
        welcome_back: 'おかえりなさい',
        system_online: 'システムオンライン',
        loading_dots: '読み込み中...',
        all: 'すべて',
        pending_approval: '承認待ち',
        pending_verification: '認証待ち', // Kept simple
        locked_approved: 'ロック済み（承認済み）',
        locked_not_editable: 'ロック済み（編集不可）',
        search_placeholder: '検索...',
        shift_dest: 'シフト / 送り先',
        duration: '期間',
        no_sheets_found: 'このフィルターに該当するシートは見つかりませんでした。',
        quick_reject: 'クイック却下',
        quick_approve: 'クイック承認',
        delete_sheet: 'シート削除 (管理者のみ)',
        view_details: '詳細を表示',
        delete_confirm: 'このシートを完全に削除してもよろしいですか？この操作は取り消せません。',
        approve_confirm: 'このシートを承認しますか？',
        rejection_reason_prompt: '却下理由を入力してください:',
        user_management: 'ユーザー管理',
        search_users_placeholder: 'ユーザーを検索...',
        add_user: 'ユーザーを追加',
        user: 'ユーザー',
        role: '役割',
        emp: '社員コード',
        last_active: '最終活動',
        actions: '操作',
        staging_sv: 'ステージング担当',
        loading_sv: 'ローディング担当',
        approval_sv: '承認者',
        no_users_found: 'ユーザーが見つかりません。',
        never: 'なし',
        just_now: 'たった今',
        minutes_ago: '分前',
        hours_ago: '時間前',
        days_ago: '日前',
        inactive: '非アクティブ',
        reset_password: 'パスワードをリセット',
        edit_user: 'ユーザーを編集',
        delete_user: 'ユーザーを削除',
        add_new_user: '新規ユーザー追加',
        username: 'ユーザー名',
        full_name: '氏名',
        password: 'パスワード',
        emp_code: '社員コード',
        email: 'メールアドレス',
        cancel: 'キャンセル',
        create_user: 'ユーザー作成',
        update_password: 'パスワード更新',
        save_changes: '変更を保存',
        role_assignment: '役割の割り当て',
        email_address: 'メールアドレス',
        employee_code: '社員コード',
        delete_active_user_error: 'アクティブなユーザーは削除できません！',
        switch_inactive_first: 'まず、このユーザーを「非アクティブ」に切り替えてください。',
        delete_user_confirm:
            'このユーザーを完全に削除してもよろしいですか？この操作は取り消せません。',
        full_database: 'フルデータベース',
        all_status: '全ステータス',
        view_and_print: '表示と印刷',
        no_sheets_found_matching: 'フィルターに一致するシートは見つかりませんでした。',
        sheet_deleted_success: 'シートを削除しました',
        staging_tasks: 'ステージングタスク',
        no_active_tasks: 'アクティブなタスクはありません',
        loading_tasks: 'ローディングタスク',
        needs_approval: '承認が必要',
        all_approved: 'すべて承認済み',
        master_records: 'マスターレコード',
        history_title: '履歴',
        system_audit_logs: 'システム監査ログ',
        search_logs_placeholder: 'ログを検索...',
        export: 'エクスポート',
        timestamp: 'タイムスタンプ',
        actor: '担当者',
        sheet_ref: 'シート参照',
        details: '詳細',
        no_logs_found: '条件に一致するログは見つかりませんでした。',
        database_desc: 'ステージングおよびローディングシートを管理します。',
        clear_filters: 'フィルターをクリア',
        new_sheet: '新規シート',
        database_search_placeholder: 'ID、スーパーバイザー、目的地で検索...',
        id: 'ID',
        destination: '目的地',
        view: '表示',
        load_older_sheets: '古いシートを読み込む',
        refresh: '更新',
        live_operations: 'ライブ運用状況',
        all_systems_idle: '待機中',
        no_active_workflows: '現在、実行中のワークフローはありません。',
        check_again: '再確認',
        updating: '更新中...',
        user_updated_successfully: 'ユーザー情報を更新しました',
        user_deleted: 'ユーザーを削除しました',
        user_created_successfully: 'ユーザーを作成しました！',
        enter_new_password_for: '新しいパスワードを入力してください：',
        sheet_deleted_successfully: 'シートを削除しました',
        failed_to_delete_sheet: 'シートの削除に失敗しました',
        sheet_approved: 'シートを承認しました',
        sheet_rejected_and_returned: 'シートを却下し、次に戻しました：',
        staging_supervisor: 'ステージング責任者',
        loading_supervisor: 'ローディング責任者',
        admin: '管理者',
        active_sheets: 'アクティブ',
        failed_to_update_user: 'ユーザーの更新に失敗しました',
        staging_verification_pending: 'ステージング認証待ち',
        loading_verification_pending: 'ローディング認証待ち',
        rejected_staging: 'ステージング却下',
        rejected_loading: 'ローディング却下',
        user_updated: 'ユーザー情報を更新しました',
        error_system: 'システムエラー',
        permission_denied: 'アクセス権限がありません',
        vehicle_no: '車番',
        operations_board: '工程管理ボード',
        kanban_view: 'カンバン表示',
        status_updated: 'ステータスが更新されました',
        failed_to_update_status: 'ステータスの更新に失敗しました',
        send_to_review: 'レビューに送信',
        cannot_delete_self: '自分のアカウントは削除できません！',
        cannot_deactivate_self: '自分のアカウントは無効化できません！',
        delete_active_user_warning:
            'このユーザーは現在アクティブです。削除すると自動的に非アクティブ化されます。続行しますか？',
        operations_monitor: '運用モニター',
        current_progress: '現在の進捗',
        staging_active: 'ステージング中',
        audit_pending: '監査待ち',
        loading_active: 'ローディング中',
        total_operational_active: '稼働中の全シート',
        all_supervisors: '全担当者',
        all_shifts: '全シフト',
        shift: 'シフト'
    }
};

export function t(key: string, lang: Language = 'en'): string {
    const translation = translations[lang][key as TranslationKey];
    if (!translation) {
        // Fallback: Return the key itself humanized (e.g., "status_name" -> "Status Name")
        // This prevents the UI from appearing empty or broken when keys are missing
        return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return translation;
}
