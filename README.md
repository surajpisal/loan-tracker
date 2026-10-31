# Loan Tracker (Angular 18+ Standalone)

Mobile-friendly loan prepayment & multi-year amortization tracker for:
- **Rama Home Loan (SBI)**: ₹40.60L starting balance (Nov 2026), 7.90% interest rate, ₹80k EMI due 5th, Suraj (₹45k) + Vrushali (₹35k) prepayments between 1st-3rd, and April lump-sum bonuses.
- **Gera Home Loan (HDFC)**: ₹14.21L starting balance, 7.60% interest rate, ₹40k EMI due 5th.

## Features
- **Standalone Angular 18+** with Signal-driven reactive state management.
- **Full Cascading Recalculation**: Change any month's prepayment, EMI, or interest rate, and every downstream balance, interest, and debt-free date recalculates instantly.
- **Mobile Bottom Navigation**: 4 dedicated tabs (Dashboard, Rama SBI, Gera HDFC, Backup).
- **Persistent Storage & JSON Backups**: Saves automatically to `localStorage` + one-click Export/Restore JSON backups for multi-year safety.
- **Vercel Ready**: Contains `vercel.json` configured for zero-setup 1-click deployment.

## Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm start
# App runs at http://localhost:4200/
```

## Production Build & Vercel Deploy
```bash
# Build
npm run build

# Deploy via Vercel CLI (or push to GitHub)
npx vercel
```
