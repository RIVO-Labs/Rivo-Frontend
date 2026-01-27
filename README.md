# Rivo Frontend

Rivo is a programmable work agreements platform on Lisk. This repository contains the Next.js web app and a standalone WebSocket server for chat.

## Problem
- Cross-border payments are slow, costly, and hard to reconcile.
- Trust between companies and freelancers is fragile without clear enforcement.
- Traditional escrow and dispute flows are manual and opaque.

## Solution
- Agreements are encoded in smart contracts with escrowed funds.
- Milestones and payroll release automatically on-chain based on rules.
- Activity and proof are recorded for transparency and auditability.

## Key Features
- Programmable work agreements
- Escrow and fund locking
- Milestone and payroll logic
- Global stablecoin payouts
- Activity and proof logs
- Rule-based enforcement
- Real-time chat with AI assistant and attachments

## Smart Contracts (Lisk Sepolia)
- RivoHub: `0x2040C1AB25d6B92fD6C84c04088D52dB11d8b857`
- MockUSDC: `0xadCf27CB81007962F01E543e2984fdbf299742d6`
- Faucet: `0x50d9d8C49b624e8cc935D509e47B35b96464c6Be`
- Default arbitrator (fallback): `0xBc861Aa65DcaF788e1fd7daD97A428f221b4120F`

## Testnet Faucets (Lisk Sepolia)
You will need ETH for gas and MockUSDC for escrow testing.

ETH Faucet
- URL: `https://console.optimism.io/faucet`
- Steps:
  1) Switch your wallet to Lisk Sepolia
  2) Paste your wallet address
  3) Request test ETH

MockUSDC Faucet / Mint
- URL: `https://sepolia-blockscout.lisk.com/address/0x50d9d8C49b624e8cc935D509e47B35b96464c6Be?tab=read_write_contract`
- Faucet contract: `0x50d9d8C49b624e8cc935D509e47B35b96464c6Be`
- Steps:
  1) Make sure your wallet has Lisk Sepolia ETH for gas
  2) Open the faucet/mint page
  3) Call the `drip` function to request MockUSDC


## Tech Stack
- Next.js 16 (App Router), React 18, TypeScript
- Tailwind CSS, Radix UI, Framer Motion
- wagmi + viem + Xellar Kit (wallet)
- Prisma + PostgreSQL
- WebSocket server (ws)
- Pinata IPFS
- Google Gemini AI

## Architecture
- Web app: Next.js (port `PORT`)
- WebSocket server: `server/ws-server.ts` (port `WS_PORT`, default 8080)
- Database: PostgreSQL (used by web + WS)
- Chain: Lisk Sepolia (via `viem/chains`)

## Getting Started
1) Install dependencies

   npm install

2) Configure environment variables (see below).

3) Run in dev

   npm run dev
   npm run ws:dev

   Or run both:

   npm run dev:all

## Environment Variables
Required
- PORT
- WS_PORT
- DATABASE_URL
- NEXT_PUBLIC_WS_URL
- NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
- NEXT_PUBLIC_XELLAR_APP_ID
- NEXT_PUBLIC_XELLAR_ENV
- NEXT_PUBLIC_APP_NAME
- GEMINI_API_KEY

Optional (IPFS)
- NEXT_PUBLIC_PINATA_JWT
- NEXT_PUBLIC_PINATA_GATEWAY
- NEXT_PUBLIC_PINATA_API_KEY
- NEXT_PUBLIC_PINATA_SECRET_KEY

Optional (Contracts)
- NEXT_PUBLIC_ARBITRATOR_ADDRESS

## Scripts
- npm run dev: Next.js dev server
- npm run ws:dev: WebSocket server (watch mode)
- npm run dev:all: run web + WS in parallel
- npm run build: Next.js production build
- npm run start: Next.js production server
- npm run ws:start: WebSocket server (prod)
- npm run lint: Next.js lint
- npm run db:migrate / db:push / db:studio: Prisma helpers

## WebSocket Notes
- The WS server runs separately from Next.js.
- Path is `/` and uses query string `?address=...` (dev) or `?auth=...` (signed).
- Frontend connects via `NEXT_PUBLIC_WS_URL` (use `wss://` in production).
- Health check: `http://host:WS_PORT/health`

## Deployment Notes
- Deploy web and WS as separate services.
- Both services must access the same `DATABASE_URL`.
- If your production install skips devDependencies, move `tsx` to dependencies or prebuild the WS server.
