# RIVO Frontend - Blockchain Integration Guide

## Overview

Frontend RIVO telah berhasil diintegrasikan dengan smart contract RivoHub di Lisk Sepolia Testnet. Aplikasi ini memungkinkan:

1. **Invoice Payment**: Membayar invoice kepada vendor menggunakan IDRX
2. **Payroll Batch Processing**: Membayar multiple employees sekaligus dalam satu transaksi
3. **Real-time Blockchain Events**: Menampilkan history transaksi dari blockchain
4. **IDRX Token Management**: Approval dan balance checking

---

## Smart Contract Details

### Networks
- **Network**: Lisk Sepolia Testnet
- **RPC URL**: https://rpc.sepolia-api.lisk.com

### Contract Addresses
- **RivoHub Contract**: `0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5`
- **IDRX Token**: `0x70df9208f44Ec74f800Caf803174F8C80Bc68162`

### Smart Contract Functions

#### 1. `payInvoice(bytes32 _invoiceId, address _vendor, uint256 _amount)`
Membayar invoice tunggal kepada vendor.
- **Parameters**:
  - `_invoiceId`: Hash unik dari invoice ID (bytes32)
  - `_vendor`: Alamat wallet vendor
  - `_amount`: Jumlah IDRX dalam wei (18 decimals)

#### 2. `payPayroll(address[] _recipients, uint256[] _amounts)`
Membayar batch payroll ke multiple employees.
- **Parameters**:
  - `_recipients`: Array alamat wallet employees
  - `_amounts`: Array jumlah IDRX untuk masing-masing employee (dalam wei)

#### 3. `paidInvoices(bytes32 invoiceId) returns (bool)`
Mengecek apakah invoice sudah dibayar.

#### 4. `idrxToken() returns (address)`
Mendapatkan address IDRX token yang digunakan.

---

## Environment Setup

### 1. File `.env.local`

Buat file `.env.local` di root project dengan konfigurasi berikut:

```env
# Xellar Wallet Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
NEXT_PUBLIC_XELLAR_APP_ID=your_xellar_app_id
NEXT_PUBLIC_XELLAR_ENV=sandbox
NEXT_PUBLIC_APP_NAME=Rivo

# RPC & API Keys
RPC_URL=https://rpc.sepolia-api.lisk.com

# Wallet Configuration (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Smart Contract Addresses on Lisk Sepolia
NEXT_PUBLIC_RIVOHUB_ADDRESS=0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5
NEXT_PUBLIC_IDRX_ADDRESS=0x70df9208f44Ec74f800Caf803174F8C80Bc68162

# Pinata IPFS Configuration (Optional)
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY_URL=your_pinata_gateway_url
```

### 2. Required API Keys

1. **WalletConnect Project ID**: Dapatkan dari [WalletConnect Cloud](https://cloud.walletconnect.com)
2. **Xellar App ID**: Dapatkan dari [Xellar Dashboard](https://dashboard.xellar.co)

---

## File Structure

### Hooks (Custom React Hooks)

#### 1. `hooks/useRivoHub.tsx`
Hook utama untuk berinteraksi dengan RivoHub contract.

**Functions**:
- `useRivoHub()`: Main hook untuk payInvoice dan payPayroll
  ```typescript
  const { payInvoice, payPayroll, isPending, isConfirming, isSuccess, hash } = useRivoHub();

  // Pay invoice
  payInvoice("INV-001", "0xVendorAddress...", "1000");

  // Pay payroll
  payPayroll(
    ["0xEmployee1...", "0xEmployee2..."],
    ["1000", "1500"]
  );
  ```

- `useCheckInvoiceStatus(invoiceId)`: Check apakah invoice sudah dibayar
  ```typescript
  const { isPaid, isLoading, refetch } = useCheckInvoiceStatus("INV-001");
  ```

- `useIDRXTokenAddress()`: Get IDRX token address dari contract
  ```typescript
  const { tokenAddress, isLoading } = useIDRXTokenAddress();
  ```

#### 2. `hooks/useIDRXApproval.tsx`
Hook untuk IDRX token approval dan balance management.

**Functions**:
- `useIDRXBalance(address)`: Get IDRX balance
  ```typescript
  const { balance, balanceFormatted, isLoading, refetch } = useIDRXBalance(address);
  ```

- `useIDRXAllowance(address)`: Check allowance untuk RivoHub
  ```typescript
  const { allowance, isLoading, refetch } = useIDRXAllowance(address);
  ```

- `useApproveIDRX()`: Approve IDRX spending
  ```typescript
  const { approve, isPending, isConfirming, isSuccess, hash } = useApproveIDRX();

  // Approve unlimited
  approve();

  // Approve specific amount
  approve("1000");
  ```

- `hasSufficientAllowance(allowance, requiredAmount)`: Helper function
- `formatIDRX(amount)`: Format BigInt ke string readable

#### 3. `hooks/useRivoHubEvents.tsx`
Hook untuk fetch blockchain events.

**Functions**:
- `useInvoicePaidEvents(fromBlock, toBlock)`: Fetch semua InvoicePaid events
  ```typescript
  const { events, isLoading, error, refetch } = useInvoicePaidEvents();
  ```

- `usePayrollExecutedEvents(fromBlock, toBlock)`: Fetch semua PayrollExecuted events
  ```typescript
  const { events, isLoading, error, refetch } = usePayrollExecutedEvents();
  ```

- `useUserInvoiceEvents(userAddress)`: Fetch invoice events untuk user tertentu
  ```typescript
  const { events, isLoading } = useUserInvoiceEvents(address);
  ```

- `useUserPayrollEvents(userAddress)`: Fetch payroll events untuk user tertentu
  ```typescript
  const { events, isLoading } = useUserPayrollEvents(address);
  ```

### Configuration Files

#### 1. `lib/web3/contracts.ts`
Contract configurations dengan ABI.

```typescript
export const CONTRACTS = {
  RivoHub: {
    address: "0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5",
    abi: RivoHubABI,
  },
  IDRX: {
    address: "0x70df9208f44Ec74f800Caf803174F8C80Bc68162",
    abi: ERC20ABI,
  },
};
```

#### 2. `lib/web3/tokens.ts`
Token configurations.

```typescript
export const TOKENS = {
  IDRX: {
    address: "0x70df9208f44Ec74f800Caf803174F8C80Bc68162",
    symbol: "IDRX",
    name: "Indonesian Rupiah X",
    decimals: 18,
  },
};
```

#### 3. `lib/web3/config.ts`
Wagmi dan Xellar configuration untuk Lisk Sepolia.

---

## Pages Implementation

### 1. Dashboard (`/dashboard`)
**File**: `app/dashboard/page.tsx`

**Features**:
- Menampilkan statistics dari blockchain:
  - Latest Payroll Amount
  - Total Invoice Payments
  - Total Amount Processed
- Recent Activity dari InvoicePaid dan PayrollExecuted events
- Quick actions ke Invoice dan Payroll pages

**Data Source**:
- `useUserInvoiceEvents(address)` - untuk invoice history
- `useUserPayrollEvents(address)` - untuk payroll history
- `useIDRXBalance(address)` - untuk balance

### 2. Invoice Page (`/dashboard/invoices`)
**File**: `app/dashboard/invoices/page.tsx`

**Features**:
- **IDRX Balance & Approval Status**: Menampilkan balance dan tombol approve
- **Pay Invoice Form**:
  - Input Invoice ID
  - Input Vendor Wallet Address
  - Input Amount (IDRX)
  - Description (optional)
- **Payment History**: List semua invoice payments dari blockchain
- **Statistics**: Total Paid, Total Invoices, Current Balance

**Workflow**:
1. User connect wallet (Xellar)
2. User approve IDRX jika belum (one-time)
3. User input invoice details dan pay
4. Transaction di-broadcast ke blockchain
5. History auto-refresh setelah transaksi sukses

**Data Source**:
- `useUserInvoiceEvents(address)` - untuk history
- `useIDRXBalance(address)` - untuk balance
- `useIDRXAllowance(address)` - untuk approval status
- `useRivoHub()` - untuk payInvoice function
- `useApproveIDRX()` - untuk approve function

### 3. Payroll Page (`/dashboard/payroll`)
**File**: `app/dashboard/payroll/page.tsx`

**Features**:
- **Employee Management**:
  - Add Employee (name, role, wallet, salary)
  - Edit Employee
  - Delete Employee
  - Data disimpan di localStorage
- **Payroll Batch Execution**:
  - Select employees dengan checkbox
  - Lihat total amount
  - Execute batch payment
- **Payroll History**: List semua batch executions dari blockchain
- **Statistics**: Total Employees, Total Paid, Last Payment Date

**Workflow**:
1. User add employees terlebih dahulu
2. User connect wallet
3. User approve IDRX jika belum
4. User select employees untuk dibayar
5. User execute payroll batch
6. Transaction di-broadcast ke blockchain
7. History auto-refresh setelah transaksi sukses

**Data Source**:
- `useUserPayrollEvents(address)` - untuk history
- `useIDRXBalance(address)` - untuk balance
- `useIDRXAllowance(address)` - untuk approval status
- `useRivoHub()` - untuk payPayroll function
- `useApproveIDRX()` - untuk approve function
- localStorage - untuk employee data

---

## User Flow

### A. Invoice Payment Flow

```
1. User opens /dashboard/invoices
2. Connect wallet (Xellar) if not connected
3. Click "Approve IDRX" (one-time, unlimited approval)
   └─> Wait for transaction confirmation
4. Click "Pay Invoice"
5. Fill form:
   - Invoice ID: INV-001
   - Vendor Address: 0x...
   - Amount: 1000 IDRX
   - Description: Optional
6. Click "Pay Invoice" button
   └─> Contract validates:
       - Invoice not already paid
       - User has sufficient IDRX balance
       - User has approved RivoHub
   └─> Transfer IDRX from user to vendor
   └─> Emit InvoicePaid event
7. Transaction confirmed
8. History auto-refresh, balance updated
9. Invoice appears in payment history
```

### B. Payroll Batch Flow

```
1. User opens /dashboard/payroll
2. Add employees (if not yet):
   - Click "Add Employee"
   - Input: name, role, wallet, salary
   - Save to localStorage
3. Connect wallet if not connected
4. Click "Approve IDRX" (one-time)
5. Click "Execute Payroll"
6. Select employees to pay
7. Review total amount
8. Click "Execute Payroll"
   └─> Contract validates:
       - Arrays length match
       - All addresses valid
       - All amounts > 0
       - User has sufficient balance
   └─> Transfer IDRX to all recipients (batch)
   └─> Emit PayrollExecuted event
9. Transaction confirmed
10. History auto-refresh
11. Batch appears in payroll history
```

---

## Development Guide

### Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   - Copy `.env.local` template
   - Fill in required API keys

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   ```
   http://localhost:3000
   ```

### Testing

#### Prerequisites
- Lisk Sepolia testnet ETH untuk gas fees
- IDRX tokens di wallet Anda

#### How to Get Testnet Tokens

1. **Lisk Sepolia ETH**:
   - Faucet: https://sepolia-faucet.lisk.com

2. **IDRX Tokens**:
   - Contact blockchain engineer untuk mint IDRX
   - Atau deploy IDRX contract sendiri

#### Testing Invoice Payment

1. Connect wallet di app
2. Pastikan punya IDRX balance
3. Approve IDRX
4. Create invoice payment:
   - Invoice ID: TEST-001
   - Vendor: 0x... (gunakan address lain yang Anda kontrol)
   - Amount: 100 IDRX
5. Pay invoice
6. Check Lisk Sepolia explorer: https://sepolia-blockscout.lisk.com
7. Verify transaksi dan event logs

#### Testing Payroll

1. Add 2-3 test employees dengan address yang berbeda
2. Approve IDRX
3. Select all employees
4. Execute payroll
5. Verify di explorer bahwa semua recipients menerima dana

---

## Blockchain Explorer

### Lisk Sepolia Blockscout
- **URL**: https://sepolia-blockscout.lisk.com
- **View Transaction**: `https://sepolia-blockscout.lisk.com/tx/{txHash}`
- **View Address**: `https://sepolia-blockscout.lisk.com/address/{address}`
- **View Contract**: `https://sepolia-blockscout.lisk.com/address/{contractAddress}`

### How to Verify Transactions

1. Setelah transaksi sukses, copy transaction hash
2. Buka `https://sepolia-blockscout.lisk.com/tx/{txHash}`
3. Check:
   - Status: Success ✓
   - From: Your address
   - To: RivoHub contract atau IDRX token
   - Logs: InvoicePaid atau PayrollExecuted event

---

## Smart Contract Events

### InvoicePaid Event

```solidity
event InvoicePaid(
    bytes32 indexed invoiceId,
    address indexed payer,
    address indexed vendor,
    uint256 amount,
    uint256 timestamp
);
```

**When emitted**: Saat invoice berhasil dibayar
**Frontend usage**: Ditampilkan di invoice history

### PayrollExecuted Event

```solidity
event PayrollExecuted(
    address indexed payer,
    uint256 totalRecipients,
    uint256 totalAmount,
    uint256 timestamp
);
```

**When emitted**: Saat payroll batch berhasil dieksekusi
**Frontend usage**: Ditampilkan di payroll history

---

## Token Format

### Amount Input (User-facing)
- Format: Decimal string
- Example: "1000" = 1000 IDRX
- Example: "1000.50" = 1000.50 IDRX

### Amount in Contract (wei)
- Format: BigInt dengan 18 decimals
- Conversion: `parseUnits(amount, 18)`
- Example: "1000" → 1000000000000000000000n

### Amount Display (UI)
- Format: Formatted string dengan locale
- Function: `formatIDRX(balance)`
- Example: 1000000000000000000000n → "1,000"

---

## Error Handling

### Common Errors

1. **"Invoice already paid"**
   - Cause: Invoice ID sudah pernah dibayar
   - Solution: Gunakan Invoice ID yang berbeda

2. **"Insufficient IDRX balance"**
   - Cause: Balance tidak cukup untuk payment
   - Solution: Top up IDRX balance

3. **"Approval Required"**
   - Cause: User belum approve IDRX untuk RivoHub
   - Solution: Click "Approve IDRX" button

4. **"Invalid Ethereum address"**
   - Cause: Address format salah
   - Solution: Pastikan address diawali dengan "0x" dan valid

5. **"User rejected transaction"**
   - Cause: User menolak di wallet
   - Solution: Accept transaction di wallet

---

## Security Considerations

1. **IDRX Approval**:
   - Default: Unlimited approval untuk UX yang smooth
   - Alternative: Approve specific amount setiap kali
   - Revoke: User bisa revoke approval kapan saja

2. **Invoice Duplicate Prevention**:
   - Contract mencegah double payment dengan mapping `paidInvoices`
   - Invoice ID harus unique

3. **Wallet Connection**:
   - Menggunakan Xellar Wallet SDK yang aman
   - Support MetaMask dan WalletConnect

4. **Private Key**:
   - JANGAN commit `.env.local` ke git
   - JANGAN share private key dengan siapa pun

---

## Troubleshooting

### Wallet tidak connect
- Clear browser cache
- Refresh page
- Check Xellar API keys di .env.local

### Transaction gagal
- Check gas balance (Lisk Sepolia ETH)
- Check IDRX balance
- Check IDRX approval status
- Verify contract addresses

### Events tidak muncul
- Wait beberapa detik untuk block confirmation
- Refresh page
- Check RPC connection

### Balance tidak update
- Klik tombol refresh
- Wait for block confirmation
- Check di blockchain explorer

---

## Next Steps & Future Improvements

1. **QR Code Generation**:
   - Generate QR code untuk invoice
   - Vendor bisa scan QR untuk auto-fill payment form

2. **Backend Integration**:
   - Simpan employee data di database
   - API untuk invoice management
   - Notification system

3. **Analytics Dashboard**:
   - Chart untuk payment trends
   - Monthly/yearly statistics
   - Export to CSV/Excel

4. **Multi-signature Support**:
   - Require multiple approvals untuk large payments
   - Company wallet management

5. **Scheduled Payments**:
   - Auto payroll setiap bulan
   - Recurring invoice payments

---

## Support

Jika ada pertanyaan atau issue:
1. Check documentation ini
2. Check blockchain explorer untuk transaction details
3. Check browser console untuk error logs
4. Contact blockchain engineer untuk contract issues

---

## Summary

✅ **Completed**:
- Smart contract integration (RivoHub + IDRX)
- Invoice payment functionality
- Payroll batch processing
- Blockchain event listening
- IDRX approval management
- Real-time balance tracking
- Payment history from blockchain
- Employee management (localStorage)
- Dashboard with live statistics

🎉 **Ready to Use**:
Aplikasi sudah siap untuk testing dan demo di Lisk Sepolia Testnet!
