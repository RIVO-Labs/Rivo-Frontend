// User role types for Rivo platform

export type UserRole = 'freelancer' | 'company';

export interface UserProfile {
    walletAddress?: string;
    role: UserRole;
    username?: string;
    email?: string;
    createdAt?: string;
}

// Role-specific data interfaces
export interface FreelancerStats {
    activeAgreements: number;
    totalEarned: number;
    pendingPayments: number;
    completedProjects: number;
}

export interface CompanyStats {
    activeAgreements: number;
    totalEscrowed: number;
    pendingApprovals: number;
    teamMembers: number;
}

// Agreement interface with role perspective
// MUST match RivoHub.sol smart contract types exactly
export interface Agreement {
    id: string;
    company: string;
    companyWallet: string;
    freelancer: string;
    freelancerWallet: string;
    type: 'one-time' | 'milestone' | 'monthly';  // Changed from 'payroll' to 'monthly'
    status: 'created' | 'funded' | 'proposed' | 'accepted' | 'completed' | 'cancelled' | 'disputed';  // Updated to match contract
    escrowAmount: number;
    nextPayment: number;
    nextPaymentDate: string;
    createdAt: string;
    lastActivity: string;
    projectName: string;
    description: string;
    totalBudget: number;
    amountReleased: number;
    monthlyRate: number;
    totalMilestones: number;
    currentMilestone: number;
    milestoneDeadlines: number[];
    currentProofURI: string;
    token: string;
    arbitrator: string;
    lastPaymentTime: number;  // Timestamp in seconds (for Monthly Payroll cycle check)
    rejectionReason?: string;  // Current rejection reason (for one-time & milestone)
    rejectionHistory?: RejectionHistory[];  // Historical rejections
}

// Rejection history for tracking work rejections
export interface RejectionHistory {
    timestamp: string;
    reason: string;
    milestoneNumber?: number;  // For milestone agreements
}

// Role-specific quick actions
export interface QuickAction {
    title: string;
    description: string;
    icon: string;
    href: string;
    color: string;
}
