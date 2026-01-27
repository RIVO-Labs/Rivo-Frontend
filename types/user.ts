// RIVO platform types - Account Payable & Payroll solution

export interface UserProfile {
    walletAddress?: string;
    companyName?: string;
    email?: string;
    createdAt?: string;
}

// Invoice interface for QR payment system
export interface Invoice {
    id: string;
    invoiceNumber: string;
    recipient: string;
    recipientWallet: string;
    amount: number;
    currency: 'IDRX' | 'USDC';
    description: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    dueDate: string;
    createdAt: string;
    paidAt?: string;
    qrCodeData: string;
    notes?: string;
}

// Employee interface for payroll management
export interface Employee {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    position: string;
    department: string;
    salary: number;
    currency: 'IDRX' | 'USDC';
    joinDate: string;
    status: 'active' | 'inactive' | 'pending';
    lastPayment?: string;
}

// Supplier interface for vendor management
export interface Supplier {
    id: string;
    name: string;
    email: string;
    walletAddress: string;
    company: string;
    contactPerson: string;
    category: string;
    totalInvoices: number;
    totalPaid: number;
    status: 'active' | 'inactive';
    createdAt: string;
}

// Payment transaction interface
export interface Payment {
    id: string;
    type: 'invoice' | 'payroll' | 'supplier';
    amount: number;
    currency: 'IDRX' | 'USDC';
    recipient: string;
    recipientWallet: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    txHash?: string;
    createdAt: string;
    completedAt?: string;
    description: string;
    invoiceId?: string;
    employeeId?: string;
    supplierId?: string;
}

// Payroll batch interface
export interface PayrollBatch {
    id: string;
    name: string;
    employees: Employee[];
    totalAmount: number;
    currency: 'IDRX' | 'USDC';
    status: 'draft' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    processedAt?: string;
    txHashes?: string[];
}

// Dashboard statistics
export interface DashboardStats {
    totalInvoices: number;
    totalInvoiceAmount: number;
    pendingPayments: number;
    pendingPaymentAmount: number;
    activeEmployees: number;
    monthlyPayrollAmount: number;
    totalSuppliers: number;
    monthlySpend: number;
}
