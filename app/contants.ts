// Rivo Platform Testimonials

export const testimonials = [
  {
    quote:
      "Rivo completely changed how we work with our global team. No more payment delays, no more trust issues. Everything is automated and transparent.",
    name: "Sarah Chen",
    role: "CEO, RemoteFirst Studios",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    stats: ["$250K Escrowed", "45 Agreements", "100% On-time"],
  },
  {
    quote:
      "As a freelancer, I finally have peace of mind. The escrow system guarantees I'll get paid, and milestone approvals are automatic. No more chasing invoices.",
    name: "Marcus Rodriguez",
    role: "Full-Stack Developer",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    rating: 5,
    stats: ["$180K Earned", "32 Projects", "Zero Disputes"],
  },
  {
    quote:
      "The programmable agreements are genius. We set the rules once, and everything executes automatically. It's like having a neutral third party that never sleeps.",
    name: "Priya Sharma",
    role: "Product Manager, TechVentures",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 5,
    stats: ["15 Team Members", "Monthly Payroll", "$500K+ Processed"],
  },
  {
    quote:
      "Rivo removed all the friction from international payments. Our freelancers get paid instantly in stablecoin, no bank delays, no currency conversion headaches.",
    name: "James Liu",
    role: "CTO, GlobalDesign Co",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 5,
    stats: ["8 Countries", "Real-time Payments", "50+ Freelancers"],
  },
  {
    quote:
      "The transparency is incredible. Every milestone, every payment, every approval is recorded on-chain. Perfect for our compliance requirements.",
    name: "Elena Popov",
    role: "Finance Director, StartupHub",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    stats: ["Full Audit Trail", "Compliance Ready", "$1M+ Volume"],
  },
];

// Rivo Feature Categories
export const featureCategories = {
  forCompanies: [
    "Create programmable work agreements",
    "Lock funds in secure escrow",
    "Approve milestones with one click",
    "Track all agreements in one dashboard",
    "Automatic dispute protection",
    "Manage global teams seamlessly",
  ],
  forFreelancers: [
    "Guaranteed payment via escrow",
    "100% transparent terms",
    "Instant stablecoin payouts",
    "Non-custodial - you control your funds",
    "Immutable work history proof",
    "Built-in dispute protection",
  ],
  forTeams: [
    "Multi-party agreement support",
    "Automated team payroll",
    "Collaborative milestone tracking",
    "Shared escrow management",
    "Team performance analytics",
    "Cross-border payment optimization",
  ],
};

// Rivo Core Features
export const coreFeatures = [
  {
    title: "Programmable Work Agreements",
    description: "Create smart contract-based work agreements with defined terms, milestones, and automatic execution. No manual intervention needed.",
    icon: "contract",
  },
  {
    title: "Escrow & Fund Locking",
    description: "Company deposits stablecoin into escrow. Funds locked on-chain, cannot be withdrawn unilaterally. Trust guaranteed by code.",
    icon: "lock",
  },
  {
    title: "Milestone & Payroll Logic",
    description: "Define milestones or monthly payroll. Payments auto-release upon completion or approval. Set it and forget it.",
    icon: "checklist",
  },
  {
    title: "Global Stablecoin Payout",
    description: "Freelancers receive stablecoin directly. Instant settlement, non-custodial, no bank needed. Work from anywhere, get paid anywhere.",
    icon: "globe",
  },
  {
    title: "Activity & Proof Log",
    description: "All submissions, approvals, and payments recorded on-chain. Transparent, immutable, and auditable. Your complete work history.",
    icon: "history",
  },
  {
    title: "Rule-Based Enforcement",
    description: "Auto-release if not approved within 7 days. Refund if no progress. Rules executed automatically. No human bias, no delays.",
    icon: "gavel",
  },
];

// Role-specific testimonials
export const freelancerTestimonials = [
  {
    quote:
      "As a freelancer, I finally have peace of mind. The escrow system guarantees I'll get paid, and milestone approvals are automatic. No more chasing invoices.",
    name: "Marcus Rodriguez",
    role: "Full-Stack Developer",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    rating: 5,
    stats: ["$180K Earned", "32 Projects", "Zero Disputes"],
  },
  {
    quote:
      "Rivo removed all the friction from international payments. I get paid instantly in stablecoin, no bank delays, no currency conversion headaches.",
    name: "Priya Sharma",
    role: "UI/UX Designer",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 5,
    stats: ["$95K Earned", "18 Projects", "100% On-time"],
  },
  {
    quote:
      "The transparency is incredible. Every milestone, every payment, every approval is recorded on-chain. Perfect for building trust with clients.",
    name: "James Liu",
    role: "Blockchain Developer",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 5,
    stats: ["$220K Earned", "45 Projects", "Full Audit Trail"],
  },
];

export const companyTestimonials = [
  {
    quote:
      "Rivo completely changed how we work with our global team. No more payment delays, no more trust issues. Everything is automated and transparent.",
    name: "Sarah Chen",
    role: "CEO, RemoteFirst Studios",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    stats: ["$250K Escrowed", "45 Agreements", "100% On-time"],
  },
  {
    quote:
      "The programmable agreements are genius. We set the rules once, and everything executes automatically. It's like having a neutral third party that never sleeps.",
    name: "Elena Popov",
    role: "Product Manager, TechVentures",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    stats: ["15 Team Members", "Monthly Payroll", "$500K+ Processed"],
  },
  {
    quote:
      "Managing escrow and approvals used to be a nightmare. Rivo made it simple, secure, and completely transparent. Our freelancers love it too.",
    name: "David Kim",
    role: "CTO, GlobalDesign Co",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    stats: ["8 Countries", "Real-time Payments", "50+ Freelancers"],
  },
];

// Role-specific quick actions
export const freelancerQuickActions = [
  {
    title: "View Earnings",
    description: "Track your payment history",
    icon: "wallet",
    href: "/dashboard/payments",
    color: "success",
  },
  {
    title: "My Agreements",
    description: "Manage active work agreements",
    icon: "briefcase",
    href: "/dashboard/agreements",
    color: "warning",
  },
];

export const companyQuickActions = [
  {
    title: "Create Agreement",
    description: "Start a new work agreement",
    icon: "plus",
    href: "/dashboard/agreements",
    color: "primary",
  },
  {
    title: "Manage Escrow",
    description: "Deposit and manage funds",
    icon: "lock",
    href: "/dashboard/escrow",
    color: "warning",
  },
  {
    title: "View Analytics",
    description: "Track team performance",
    icon: "chart",
    href: "/dashboard/analytics",
    color: "success",
  },
];
