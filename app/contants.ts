// RIVO Platform Testimonials

export const testimonials = [
  {
    quote:
      "RIVO transformed our payroll process completely. Our remote Indonesian team gets paid in IDRX instantly, no more bank delays or expensive transfer fees.",
    name: "Sarah Chen",
    role: "CEO, TechStart Indonesia",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    stats: ["2.5B IDRX Processed", "45 Employees", "100% On-time"],
  },
  {
    quote:
      "As a supplier working with Indonesian startups, RIVO's QR invoice system is game-changing. I just scan, click pay, and get settled in IDRX immediately.",
    name: "Marcus Rodriguez",
    role: "Overseas Supplier",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    rating: 5,
    stats: ["1.8B IDRX Received", "32 Invoices", "Zero Errors"],
  },
  {
    quote:
      "The AI assistant makes creating payroll batches so easy. I just tell it who to pay and how much, and it handles everything. Perfect for our monthly operations.",
    name: "Priya Sharma",
    role: "Finance Manager, Digital Agency",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 5,
    stats: ["15 Team Members", "Monthly Payroll", "5B+ IDRX Processed"],
  },
  {
    quote:
      "No more currency conversion headaches or expensive international transfers. RIVO's IDRX settlement is transparent, fast, and perfect for our global suppliers.",
    name: "James Liu",
    role: "CFO, Export Company",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 5,
    stats: ["8 Countries", "Real-time Settlement", "50+ Suppliers"],
  },
  {
    quote:
      "On-chain transparency gives us complete audit trails for all payments. Our accounting team loves the automatic reconciliation and compliance features.",
    name: "Elena Popov",
    role: "Finance Director, UKM Export",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    stats: ["Full Audit Trail", "Compliance Ready", "10B+ IDRX Volume"],
  },
];

// RIVO Feature Categories
export const featureCategories = {
  forCompanies: [
    "Create and send QR invoices to suppliers",
    "Process batch payroll in IDRX stablecoin",
    "One-click payment execution",
    "Track all payments in real-time",
    "Automatic on-chain settlement",
    "Manage global suppliers and employees",
  ],
  forSuppliers: [
    "Receive QR invoices instantly",
    "Scan and pay with one click",
    "Get paid in IDRX stablecoin",
    "Real-time payment confirmation",
    "Transparent transaction history",
    "No wallet address copy-paste errors",
  ],
  forEmployees: [
    "Receive salary in IDRX stablecoin",
    "Instant payroll settlement",
    "Transparent payment tracking",
    "Mobile-friendly payment interface",
    "On-chain payment verification",
    "Cross-border payment optimization",
  ],
};

// RIVO Core Features
export const coreFeatures = [
  {
    title: "QR Invoice Generation",
    description: "Create instant QR invoices for suppliers. Similar to QRIS experience - familiar UX for Indonesian users with zero learning curve.",
    icon: "qr",
  },
  {
    title: "One-Click IDRX Payment",
    description: "Suppliers scan QR and pay instantly. No wallet address copying, no errors. Settlement happens on Base chain using IDRX stablecoin.",
    icon: "payment",
  },
  {
    title: "Batch Payroll Processing",
    description: "Create payroll batches for multiple employees. Add recipients and amounts, then execute all payments simultaneously with one click.",
    icon: "batch",
  },
  {
    title: "Real-time Payment Status",
    description: "Track all payments in real-time with on-chain verification. Transparent status updates and automatic confirmation for all parties.",
    icon: "status",
  },
  {
    title: "AI Payment Assistant",
    description: "Use natural language to create invoices and payroll. AI helps with data entry while keeping manual control over execution.",
    icon: "ai",
  },
  {
    title: "Sponsored Gas & UX",
    description: "Users don't need to worry about gas fees or blockchain complexity. Consumer-grade UX powered by Base and OnchainKit integration.",
    icon: "gas",
  },
];

// Role-specific testimonials
export const supplierTestimonials = [
  {
    quote:
      "Getting paid by Indonesian startups used to be complicated. Now with RIVO's QR invoices, I just scan and get paid in IDRX instantly. So simple!",
    name: "Marcus Rodriguez",
    role: "Overseas Supplier",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    rating: 5,
    stats: ["1.8B IDRX Received", "32 Invoices", "Zero Errors"],
  },
  {
    quote:
      "No more dealing with Indonesian bank transfers or currency conversion. RIVO's IDRX payments are fast, transparent, and exactly what we needed.",
    name: "Priya Sharma",
    role: "Software Vendor",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 5,
    stats: ["950M IDRX Received", "18 Clients", "100% On-time"],
  },
  {
    quote:
      "The transparency is incredible. I can see payment status in real-time and have complete on-chain proof of every transaction. Perfect for our business.",
    name: "James Liu",
    role: "Equipment Supplier",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 5,
    stats: ["2.2B IDRX Received", "45 Orders", "Full Audit Trail"],
  },
];

export const companyTestimonials = [
  {
    quote:
      "RIVO transformed our supplier payment process. QR invoices are so familiar to our Indonesian team, and IDRX settlement eliminates all the banking friction.",
    name: "Sarah Chen",
    role: "CEO, TechStart Indonesia",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    stats: ["2.5B IDRX Processed", "45 Suppliers", "100% On-time"],
  },
  {
    quote:
      "Batch payroll with RIVO is incredible. Our entire remote team gets paid in IDRX with one click. No more expensive international transfers or delays.",
    name: "Elena Popov",
    role: "Finance Director, Digital Agency",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    stats: ["15 Employees", "Monthly Payroll", "5B+ IDRX Processed"],
  },
  {
    quote:
      "The AI assistant makes creating invoices and payroll so easy. I just tell it what I need, and it handles all the data entry. Saves hours every month.",
    name: "David Kim",
    role: "CFO, Export Company",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    stats: ["8 Countries", "Real-time Payments", "50+ Suppliers"],
  },
];

// Role-specific quick actions
export const supplierQuickActions = [
  {
    title: "Scan QR Invoice",
    description: "Pay received invoices instantly",
    icon: "qr",
    href: "/dashboard/payments",
    color: "success",
  },
  {
    title: "Payment History",
    description: "View all IDRX transactions",
    icon: "history",
    href: "/dashboard/history",
    color: "warning",
  },
];

export const companyQuickActions = [
  {
    title: "Create Invoice",
    description: "Generate QR invoice for suppliers",
    icon: "invoice",
    href: "/dashboard/invoices",
    color: "primary",
  },
  {
    title: "Process Payroll",
    description: "Create and execute payroll batch",
    icon: "payroll",
    href: "/dashboard/payroll",
    color: "success",
  },
  {
    title: "View Analytics",
    description: "Track payment performance",
    icon: "chart",
    href: "/dashboard/analytics",
    color: "warning",
  },
];
