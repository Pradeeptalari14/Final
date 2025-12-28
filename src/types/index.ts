export enum Role {
    ADMIN = 'ADMIN',
    STAGING_SUPERVISOR = 'STAGING_SUPERVISOR',
    LOADING_SUPERVISOR = 'LOADING_SUPERVISOR',
    SHIFT_LEAD = 'SHIFT_LEAD'
}

export enum SheetStatus {
    DRAFT = 'DRAFT',
    STAGING_VERIFICATION_PENDING = 'STAGING_VERIFICATION_PENDING',
    LOCKED = 'LOCKED', // Ready for loading
    LOADING_VERIFICATION_PENDING = 'LOADING_VERIFICATION_PENDING',
    COMPLETED = 'COMPLETED'
}

export interface User {
    id: string;
    username: string;
    fullName: string;
    empCode: string;
    role: Role;
    email?: string;
    isApproved: boolean;
    isLocked?: boolean;
    isDeleted?: boolean;
    password?: string; // Only used for legacy simple auth comparison
}

export interface StagingItem {
    srNo: number;
    skuName: string;
    casesPerPlt: number;
    fullPlt: number;
    loose: number;
    ttlCases: number;
    isRejected?: boolean;
    rejectionReason?: string;
}

export interface LoadingCell {
    row: number;
    col: number;
    value: number;
}

export interface LoadingItem {
    skuSrNo: number;
    cells: LoadingCell[];
    looseInput?: number;
    total: number;
    balance: number;
    isRejected?: boolean;
    rejectionReason?: string;
}

export interface AdditionalItem {
    id: number;
    skuName: string;
    counts: number[];
    total: number;
}

export interface HistoryLog {
    id: string;
    actor: string;
    action: string;
    timestamp: string;
    details: string;
}

export interface SecurityLog {
    id: string;
    action: string;
    details: string;
    actor: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: string;
}

export interface ActivityLog {
    id: string;
    action: string;
    details: string;
    actor: string;
    timestamp: string;
}

export interface SheetData {
    id: string;
    status: SheetStatus;
    version: number;

    // Header Info
    shift: string;
    date: string;
    destination: string;
    supervisorName: string;
    empCode: string;
    loadingDoc: string; // Staging Loading Dock
    loadingDockNo?: string; // Actual Loading Dock

    // Staging
    stagingItems: StagingItem[];

    // Loading
    transporter?: string;
    vehicleNo?: string;
    sealNo?: string;
    regSerialNo?: string; // Container No
    driverName?: string;
    loadingItems?: LoadingItem[];
    additionalItems?: AdditionalItem[];

    // Detailed Loading Info
    loadingStartTime?: string;
    loadingEndTime?: string;
    pickingBy?: string;
    pickingByEmpCode?: string;
    pickingCrosscheckedBy?: string;
    pickingCrosscheckedByEmpCode?: string;

    // Signatures / Audit
    loadingSvName?: string;
    loadingSupervisorSign?: string;
    slSign?: string;
    slName?: string;
    deoSign?: string;

    // Approval Metadata
    loadingApprovedBy?: string;
    loadingApprovedAt?: string;
    rejectionReason?: string;

    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    lockedBy?: string;
    lockedAt?: string;
    completedBy?: string;
    completedAt?: string;

    verifiedBy?: string;
    verifiedAt?: string;

    capturedImages?: string[];
    history?: HistoryLog[];
    comments?: Comment[];
}

export interface Comment {
    id: string;
    author: string;
    text: string;
    timestamp: string;
}

export interface Notification {
    id: string;
    message: string;
    read: boolean;
    timestamp: string;
}

export type Language = 'en' | 'jp';
export type Theme = 'light' | 'dark';
export type AccentColor = 'blue' | 'emerald' | 'purple';
export type Density = 'compact' | 'comfortable';
export type FontSize = 'small' | 'medium' | 'large';

export interface AppSettings {
    theme: Theme;
    accentColor: AccentColor;
    density: Density;
    sidebarCollapsed: boolean;
    fontSize: FontSize;
    defaultTab: string;
    language: Language;
}
