# Xellar Wallet Setup Guide

## 🎯 Aplikasi Anda Sudah Menggunakan Xellar!

Xellar SDK sudah terintegrasi di:
- ✅ Package: `@xellar/kit` v2.5.0
- ✅ Provider: `XellarKitProvider`
- ✅ Config: `lib/web3/config.ts`

Sekarang Anda tinggal setup environment variables saja.

---

## 📝 Environment Variables yang Dibutuhkan

### 1. NEXT_PUBLIC_XELLAR_APP_ID (WAJIB)
Ini adalah App ID dari Xellar Dashboard.

### 2. NEXT_PUBLIC_XELLAR_ENV (WAJIB)
Environment mode: `sandbox` atau `production`

### 3. NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID (WAJIB)
Project ID dari WalletConnect Cloud.

### 4. PRIVATE_KEY (TIDAK PERLU UNTUK FRONTEND!)
⚠️ **PENTING**: Private key **TIDAK diperlukan** untuk frontend app!
- Frontend menggunakan wallet user (Xellar embedded wallet atau MetaMask)
- Private key hanya untuk backend scripts atau server-side operations
- **JANGAN masukkan private key Anda di frontend!**

---

## 🚀 Langkah-langkah Setup

### Step 1: Daftar di Xellar Dashboard

1. **Buka Xellar Dashboard**:
   ```
   https://dashboard.xellar.co
   ```

2. **Sign Up / Login**:
   - Gunakan email Anda
   - Atau login dengan Google/GitHub

3. **Verifikasi Email**:
   - Check inbox untuk verification email
   - Klik link verifikasi

### Step 2: Buat Project Baru di Xellar

1. **Di Xellar Dashboard**:
   - Klik "Create New Project" atau "New App"
   - Atau klik tombol "+ New Project"

2. **Isi Detail Project**:
   - **Project Name**: RIVO (atau nama lain)
   - **Description**: Payment & Payroll Platform
   - **Environment**: Pilih **Sandbox** untuk development

3. **Klik Create/Save**

4. **Copy App ID**:
   - Setelah project dibuat, Anda akan melihat **App ID**
   - Copy App ID ini
   - Format biasanya seperti: `app_xxxxxxxxxxxxxxxx`

### Step 3: Dapatkan WalletConnect Project ID

1. **Buka WalletConnect Cloud**:
   ```
   https://cloud.walletconnect.com
   ```

2. **Sign Up / Login**:
   - Bisa pakai GitHub, Google, atau email

3. **Create New Project**:
   - Klik "Create" atau "+ New Project"
   - Project Name: RIVO
   - Click "Create"

4. **Copy Project ID**:
   - Di project dashboard, Anda akan lihat **Project ID**
   - Copy Project ID ini
   - Format seperti: `a1b2c3d4e5f6...` (32-64 karakter)

### Step 4: Isi .env.local File

Buka file `.env.local` yang sudah saya buat, lalu isi seperti ini:

```env
# ============================================
# XELLAR WALLET CONFIGURATION (WAJIB)
# ============================================

# Dari Xellar Dashboard (Step 2)
NEXT_PUBLIC_XELLAR_APP_ID=app_xxxxxxxxxxxxxxxx

# Environment: sandbox untuk development, production untuk live
NEXT_PUBLIC_XELLAR_ENV=sandbox

# Dari WalletConnect Cloud (Step 3)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# App Name
NEXT_PUBLIC_APP_NAME=Rivo

# ============================================
# BLOCKCHAIN CONFIGURATION (SUDAH DI-SET)
# ============================================

# RPC URL untuk Lisk Sepolia
RPC_URL=https://rpc.sepolia-api.lisk.com

# Smart Contract Addresses (JANGAN DIUBAH)
NEXT_PUBLIC_RIVOHUB_ADDRESS=0x4f4728A078B7d4F11930DF26a65a6c5BE6b4bEc5
NEXT_PUBLIC_IDRX_ADDRESS=0x70df9208f44Ec74f800Caf803174F8C80Bc68162

# ============================================
# PRIVATE KEY (TIDAK PERLU UNTUK FRONTEND)
# ============================================
# CATATAN: Private key TIDAK diperlukan untuk frontend app!
# User akan connect dengan wallet mereka sendiri (Xellar/MetaMask)
# Kosongkan saja atau hapus baris ini
# PRIVATE_KEY=

# ============================================
# OPTIONAL: IPFS Configuration
# ============================================
# Hanya jika Anda pakai Pinata untuk IPFS storage
# NEXT_PUBLIC_PINATA_JWT=
# NEXT_PUBLIC_PINATA_GATEWAY_URL=
```

### Step 5: Restart Development Server

```bash
# Stop server yang sedang running (Ctrl+C)

# Restart
npm run dev
```

---

## 🔍 Cara Mendapatkan Setiap Environment Variable

### 1. NEXT_PUBLIC_XELLAR_APP_ID

**Lokasi**: Xellar Dashboard → Project Settings

**Langkah**:
1. Login ke https://dashboard.xellar.co
2. Pilih project Anda
3. Ke menu "Settings" atau "API Keys"
4. Copy "App ID" atau "Application ID"

**Contoh**:
```
NEXT_PUBLIC_XELLAR_APP_ID=app_1234567890abcdef
```

### 2. NEXT_PUBLIC_XELLAR_ENV

**Nilai**:
- `sandbox` - untuk development/testing
- `production` - untuk live/production

**Untuk sekarang, gunakan**:
```
NEXT_PUBLIC_XELLAR_ENV=sandbox
```

### 3. NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

**Lokasi**: WalletConnect Cloud → Project Dashboard

**Langkah**:
1. Login ke https://cloud.walletconnect.com
2. Pilih project Anda (atau buat baru)
3. Di dashboard, lihat "Project ID"
4. Copy Project ID

**Contoh**:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 4. PRIVATE_KEY (TIDAK PERLU!)

⚠️ **JANGAN ISI UNTUK FRONTEND APP**

**Mengapa tidak perlu?**
- Frontend app menggunakan wallet user
- User connect dengan Xellar embedded wallet atau MetaMask
- User sign transaction dengan wallet mereka sendiri
- Private key hanya untuk backend/scripts

**Kapan Private Key diperlukan?**
- Backend automation scripts
- Server-side transaction signing
- Smart contract deployment
- Testing scripts dengan hardhat/foundry

**Untuk frontend ini, KOSONGKAN saja atau hapus baris PRIVATE_KEY**

---

## 🧪 Testing Setup

Setelah setup env, test dengan cara:

### 1. Run Development Server
```bash
npm run dev
```

### 2. Buka Browser
```
http://localhost:3000
```

### 3. Test Connect Wallet

1. Klik tombol "Connect Wallet" (biasanya di navbar)
2. Pilih Xellar Wallet
3. Jika setup benar:
   - Modal Xellar akan muncul
   - Anda bisa create new wallet atau import existing
   - Atau connect dengan MetaMask/WalletConnect

### 4. Check Console

Buka browser console (F12), seharusnya TIDAK ada error seperti:
- ❌ "XELLAR_APP_ID is not set"
- ❌ "WALLET_CONNECT_PROJECT_ID is not set"

Jika ada error seperti itu, berarti env belum di-set dengan benar.

---

## 🎨 Xellar Features yang Tersedia

Dengan Xellar SDK, aplikasi Anda mendapat:

1. **Embedded Wallet**:
   - User tidak perlu install MetaMask
   - Wallet otomatis dibuat saat sign up
   - Private key di-manage oleh Xellar (secure)

2. **Social Login**:
   - Login dengan Google, Facebook, Twitter
   - Email magic link
   - Phone number OTP

3. **Gas Sponsorship** (optional):
   - User tidak perlu ETH untuk gas
   - Company bisa sponsor gas fees
   - Lebih user-friendly

4. **Multi-Chain Support**:
   - Support berbagai network (termasuk Lisk Sepolia)
   - Easy chain switching

---

## 📱 User Experience Flow

### Dengan Xellar:

```
1. User buka app pertama kali
   ↓
2. Klik "Connect Wallet"
   ↓
3. Modal Xellar muncul
   ↓
4. User pilih:
   - Create new wallet (dengan email/social)
   - Import existing wallet
   - Connect MetaMask
   ↓
5. Jika create new:
   - Input email
   - Verify email
   - Wallet otomatis dibuat
   ↓
6. User bisa langsung transaksi!
```

### Tanpa Install Extension:
- ✅ User tidak perlu install MetaMask extension
- ✅ Wallet embedded langsung di app
- ✅ Lebih mudah untuk new crypto users

---

## 🔧 Troubleshooting

### Error: "XELLAR_APP_ID is not set"

**Solusi**:
1. Check file `.env.local` ada dan sudah diisi
2. Pastikan nama variable tepat: `NEXT_PUBLIC_XELLAR_APP_ID`
3. Restart dev server (`npm run dev`)
4. Hard refresh browser (Ctrl+Shift+R)

### Error: "Invalid App ID"

**Solusi**:
1. Login ke Xellar Dashboard
2. Verify App ID benar
3. Pastikan environment (`sandbox` vs `production`) sesuai
4. Copy-paste ulang App ID (jangan ada extra space)

### Modal Xellar tidak muncul

**Solusi**:
1. Check browser console untuk error
2. Pastikan `@xellar/kit` package sudah di-install
3. Check `XellarKitProvider` ada di `Web3Provider.tsx`
4. Clear browser cache
5. Try incognito mode

### Connect Wallet tidak berfungsi

**Solusi**:
1. Check WalletConnect Project ID sudah benar
2. Check network connection
3. Try different wallet option (MetaMask/Xellar/WalletConnect)
4. Check browser console errors

---

## 📚 Dokumentasi Reference

- **Xellar Docs**: https://docs.xellar.co
- **Xellar Dashboard**: https://dashboard.xellar.co
- **WalletConnect Cloud**: https://cloud.walletconnect.com
- **Xellar GitHub**: https://github.com/Xellar-Protocol

---

## 🎯 Quick Checklist

Setup Xellar dengan checklist ini:

- [ ] Daftar di Xellar Dashboard
- [ ] Buat project baru
- [ ] Copy Xellar App ID
- [ ] Daftar di WalletConnect Cloud
- [ ] Buat project baru
- [ ] Copy WalletConnect Project ID
- [ ] Isi `.env.local`:
  - [ ] NEXT_PUBLIC_XELLAR_APP_ID
  - [ ] NEXT_PUBLIC_XELLAR_ENV (set ke `sandbox`)
  - [ ] NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
  - [ ] NEXT_PUBLIC_APP_NAME
- [ ] Restart dev server
- [ ] Test connect wallet di browser
- [ ] Verify tidak ada error di console

---

## 🚀 Next Steps

Setelah Xellar setup:

1. **Test Invoice Payment**:
   - Connect wallet
   - Approve IDRX
   - Pay invoice
   - Check transaction di explorer

2. **Test Payroll**:
   - Add employees
   - Execute batch payment
   - Verify semua recipients menerima

3. **Deploy to Testnet**:
   - Dapat IDRX tokens dari blockchain engineer
   - Dapat Lisk Sepolia ETH dari faucet
   - Test end-to-end flow

4. **Production Ready** (nanti):
   - Ubah `NEXT_PUBLIC_XELLAR_ENV` ke `production`
   - Update ke mainnet contracts
   - Enable gas sponsorship (optional)

---

## 💡 Tips

1. **Environment Sandbox vs Production**:
   - Sandbox: Untuk development, data terpisah
   - Production: Untuk live app, data real

2. **Security**:
   - JANGAN commit `.env.local` ke git
   - `.env.local` sudah ada di `.gitignore`
   - JANGAN share App ID secara publik

3. **Multiple Environments**:
   - Bisa buat multiple projects di Xellar:
     - RIVO Development (sandbox)
     - RIVO Staging (sandbox)
     - RIVO Production (production)

---

Selamat! Anda sekarang siap menggunakan Xellar Wallet di aplikasi RIVO! 🎉
