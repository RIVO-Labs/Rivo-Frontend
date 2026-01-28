# RIVO - Role System Update Documentation

## 🎯 Overview

Aplikasi RIVO telah diperbaiki untuk mencerminkan flow bisnis yang sebenarnya sebagai **Account Payable & Payroll Payment System**, bukan freelancer marketplace.

---

## ✅ Changes Made

### 1. **User Roles** - Sesuai Smart Contract

Role sebelumnya (SALAH):
- ❌ Freelancer (Find work)
- ❌ Company (Hire talent)

Role sekarang (BENAR):
- ✅ **SME Owner** - Pay invoices & execute payroll
- ✅ **Vendor/Supplier** - Receive invoice payments
- ✅ **Staff/Agent** - Receive payroll payments

### 2. **Files Updated**

#### `types/user.ts`
```typescript
// Added:
export type UserRole = 'sme_owner' | 'vendor' | 'staff';

// Updated UserProfile interface
export interface UserProfile {
  role?: UserRole;
  // ... other fields
}
```

#### `app/(auth-pages)/signup/page.tsx`
**Changes:**
- Updated `ProfileData` interface dengan role baru
- Changed default role: `freelancer` → `sme_owner`
- Updated RadioGroup dengan 3 role options:
  - SME Owner (pay invoices & payroll)
  - Vendor (receive invoice payments)
  - Staff/Agent (receive payroll)
- Updated feature highlights di footer

**Before:**
```tsx
role: "freelancer" | "company"
```

**After:**
```tsx
role: "sme_owner" | "vendor" | "staff"
```

#### `hooks/useAuth.tsx`
**Changes:**
- Updated `User` interface dengan new roles
- Changed default role dari `freelancer` ke `sme_owner`
- Updated localStorage role handling

#### `app/constants.ts`
**Completely rewritten** dengan RIVO-specific content:

**New Exports:**
- `testimonials` - Updated untuk SME Owners, Vendors, dan Staff
- `featureCategories` - Split by role:
  - `forSMEOwners` - Invoice & payroll features
  - `forVendors` - Invoice receiving features
  - `forStaff` - Payroll receiving features
- `coreFeatures` - Updated ke RIVO features:
  - IDRX Invoice Payment
  - Batch Payroll Processing
  - Blockchain Verification
  - IDRX Stablecoin
  - One-Time Approval
  - Smart Contract Security
- `smeOwnerTestimonials` - Testimonials dari CFO, Finance Controllers
- `vendorTestimonials` - Testimonials dari international suppliers
- `staffTestimonials` - Testimonials dari logistics agents
- `smeOwnerQuickActions` - Pay Invoice, Execute Payroll, Analytics
- `vendorQuickActions` - Payment History, Profile
- `staffQuickActions` - Payroll History, Wallet

---

## 🎭 Role Definitions

### SME Owner (Payer)
**Who:** Pemilik bisnis UKM yang melakukan pembayaran

**Capabilities:**
1. Approve IDRX untuk RivoHub contract (one-time)
2. Pay invoices ke Vendors:
   - Input Invoice ID, Vendor Address, Amount
   - Execute `payInvoice(invoiceId, vendor, amount)`
3. Execute batch payroll ke Staff/Agents:
   - Select multiple recipients
   - Execute `payPayroll(recipients[], amounts[])`
4. View payment history dari blockchain events
5. Manage vendors dan employees

**Smart Contract Functions:**
- `approve(rivoHub, unlimited)` - IDRX contract
- `payInvoice(invoiceId, vendor, amount)` - RivoHub
- `payPayroll(recipients[], amounts[])` - RivoHub

### Vendor/Supplier (Invoice Receiver)
**Who:** Pihak luar negeri atau penyedia barang yang menerima pembayaran faktur

**Capabilities:**
1. Receive IDRX invoice payments
2. View payment history (invoices where they are vendor)
3. Check IDRX balance
4. Update profile & wallet address

**Smart Contract Interaction:**
- Passive recipient - receives IDRX from `payInvoice` calls

### Staff/Agent (Payroll Receiver)
**Who:** Tim lapangan, kurir, agen pelabuhan yang menerima pembayaran masal

**Capabilities:**
1. Receive IDRX payroll payments
2. View payroll history (batches where they are recipient)
3. Check IDRX balance
4. Update profile & wallet address

**Smart Contract Interaction:**
- Passive recipient - receives IDRX from `payPayroll` calls

---

## 📊 Smart Contract Flow

### Prosedur 1: IDRX Approval (SME Owner)
```solidity
// IDRX Token Contract
IDRX.approve(RivoHub, MAX_UINT256)
```
- **Who:** SME Owner
- **Frequency:** One-time (atau ketika allowance habis)
- **Purpose:** Memberikan izin RivoHub untuk transfer IDRX

### Prosedur 2: Pay Invoice (SME Owner → Vendor)
```solidity
// RivoHub Contract
RivoHub.payInvoice(
  bytes32 invoiceId,    // Hash dari "INV-001"
  address vendor,       // Vendor wallet address
  uint256 amount        // Amount dalam wei (18 decimals)
)
```
- **Who:** SME Owner (payer)
- **Receives:** Vendor (passive)
- **Event:** `InvoicePaid(invoiceId, payer, vendor, amount, timestamp)`

### Prosedur 3: Execute Payroll (SME Owner → Staff[])
```solidity
// RivoHub Contract
RivoHub.payPayroll(
  address[] recipients,  // [staff1, staff2, staff3]
  uint256[] amounts      // [amount1, amount2, amount3]
)
```
- **Who:** SME Owner (payer)
- **Receives:** Staff/Agents (passive, multiple)
- **Event:** `PayrollExecuted(payer, totalRecipients, totalAmount, timestamp)`

---

## 🔄 User Journey per Role

### SME Owner Journey
```
1. Connect Wallet (Xellar/MetaMask)
   ↓
2. Signup → Select "SME Owner"
   ↓
3. Dashboard → See quick actions:
   - Pay Invoice
   - Execute Payroll
   - View Analytics
   ↓
4. First time → Approve IDRX
   ↓
5a. Pay Invoice:
    - Input: Invoice ID, Vendor Address, Amount
    - Click "Pay Invoice"
    - Transaction broadcast
    - Invoice appears in history
    ↓
5b. Execute Payroll:
    - Add employees (name, wallet, salary)
    - Select employees to pay
    - Click "Execute Payroll"
    - Batch transaction broadcast
    - Payroll appears in history
```

### Vendor Journey
```
1. Connect Wallet
   ↓
2. Signup → Select "Vendor"
   ↓
3. Dashboard → See:
   - Payment History (invoices received)
   - IDRX Balance
   ↓
4. Receive Payment:
   - SME Owner pays invoice
   - Vendor receives IDRX automatically
   - Payment appears in history
   - On-chain verification
```

### Staff Journey
```
1. Connect Wallet
   ↓
2. Signup → Select "Staff/Agent"
   ↓
3. Dashboard → See:
   - Payroll History
   - IDRX Balance
   ↓
4. Receive Payroll:
   - SME Owner executes payroll batch
   - Staff receives IDRX automatically
   - Payment appears in history
   - On-chain verification
```

---

## 🎨 UI/UX Changes

### Signup Page
**Before:**
```
┌─────────────┬─────────────┐
│ Freelancer  │  Company    │
│ Find work   │ Hire talent │
└─────────────┴─────────────┘
```

**After:**
```
┌────────────┬────────────┬────────────┐
│ SME Owner  │  Vendor    │ Staff/Agent│
│ Pay        │  Receive   │  Receive   │
│ invoices & │  invoice   │  payroll   │
│ payroll    │  payments  │            │
└────────────┴────────────┴────────────┘
```

### Features Highlights (Signup Footer)
**Before:**
- Smart Contracts
- Escrow Protected
- Global Payments
- Trustless

**After:**
- IDRX Payments
- On-Chain Verified
- Batch Payroll
- Instant Settlement

---

## 📁 Role-Based Content

### Testimonials

**SME Owner Testimonials:**
- Focus: Batch payroll efficiency, invoice payment ease
- Example: "RIVO's batch payroll saved us from 50+ individual transfers"

**Vendor Testimonials:**
- Focus: Instant payment, no bank delays
- Example: "Indonesian clients pay me in IDRX instantly - game changer!"

**Staff Testimonials:**
- Focus: Instant salary, blockchain transparency
- Example: "My salary arrives instantly without bank delays"

### Quick Actions

**SME Owner:**
- Pay Invoice
- Execute Payroll
- View Analytics

**Vendor:**
- Payment History
- My Profile

**Staff:**
- Payroll History
- My Wallet

---

## 🧪 Testing Guide

### Test with 3 Different Wallets

**Wallet 1: SME Owner**
```
1. Connect wallet
2. Signup as "SME Owner"
3. Approve IDRX
4. Add test employee (use Wallet 3 address)
5. Execute payroll to Wallet 3
6. Pay invoice to Wallet 2
7. Verify:
   - Payroll history shows batch
   - Invoice history shows payment
   - Balance decreased
```

**Wallet 2: Vendor**
```
1. Connect different wallet
2. Signup as "Vendor"
3. Check payment history
4. Should see invoice from Wallet 1
5. Verify:
   - Payment appears in history
   - Balance increased by invoice amount
```

**Wallet 3: Staff**
```
1. Connect third wallet
2. Signup as "Staff/Agent"
3. Check payroll history
4. Should see payroll batch from Wallet 1
5. Verify:
   - Payroll appears in history
   - Balance increased by payroll amount
```

---

## ⚠️ Important Notes

### Role Selection is Permanent
- User memilih role saat signup
- Role tersimpan di localStorage dan IPFS
- Untuk test different role, gunakan wallet berbeda atau incognito mode

### Smart Contract Addresses
```
RivoHub: 0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5
IDRX:    0x70df9208f44Ec74f800Caf803174F8C80Bc68162
Network: Lisk Sepolia Testnet
```

### Required Tokens for Testing
- **Lisk Sepolia ETH** - untuk gas fees
- **IDRX tokens** - untuk payments (contact blockchain engineer)

---

## 🔗 Related Documentation

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Blockchain integration guide
- [XELLAR_SETUP_GUIDE.md](./XELLAR_SETUP_GUIDE.md) - Xellar wallet setup

---

## 📝 Summary

✅ **Fixed:**
- Role system sesuai RIVO business model
- Signup page dengan role yang benar
- Constants dengan RIVO-specific content
- User types dan auth system

🎯 **Flow sekarang:**
1. SME Owner → Pays (invoices & payroll)
2. Vendor → Receives (invoices)
3. Staff → Receives (payroll)

Semua sesuai dengan smart contract `payInvoice` dan `payPayroll` functions! 🚀
