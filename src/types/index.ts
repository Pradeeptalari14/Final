export enum Role {
    ADMIN = 'ADMIN',
    STAGING_SUPERVISOR = 'STAGING_SUPERVISOR',
    LOADING_SUPERVISOR = 'LOADING_SUPERVISOR',
    SHIFT_LEAD = 'SHIFT_LEAD',
    VIEWER = 'VIEWER'
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
    password?: string; // Only used for legacy simple auth comparison
}

export interface StagingItem {
    srNo: number;
    skuName: string;
    casesPerPlt: number;
    fullPlt: number;
    loose: number;
    ttlCases: number;
}

export interface LoadingCell {
    row: number;
    col: number;
    value: number;
}

export interface LoadingItemData {
    skuSrNo: number;
    cells: LoadingCell[];
    looseInput: number;
    total: number;
    balance: number;
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
    loadingItems?: LoadingItemData[];

    // Signatures / Audit
    createdBy: string;
    createdAt: string;
    updatedAt?: string;

    // ... other fields as needed
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
