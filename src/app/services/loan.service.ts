import { Injectable, signal } from '@angular/core';
import { Loan, AmortizationRow } from '../models/loan.model';

const STORAGE_KEY = 'loan_tracker_angular_v1';

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'rama-sbi',
    name: 'Rama Home Loan',
    bank: 'State Bank of India (SBI)',
    currentPrincipal: 4060000, // ₹40.60L as of Nov 2026
    rate: 7.90, // from Nov 2026 (was 7.65% before)
    emi: 80000,
    emiDay: 5,
    prepayStartDay: 1,
    prepayEndDay: 3,
    defaultSurajPrepay: 45000,
    defaultVrushaliPrepay: 35000,
    color: 'emerald',
    overrides: {
      '2027-04': { bonusPrepayment: 200000, reason: 'Annual Bonus' },
      '2028-04': { bonusPrepayment: 200000, reason: 'Annual Bonus' },
    }
  },
  {
    id: 'gera-hdfc',
    name: 'Gera Home Loan',
    bank: 'HDFC Bank',
    currentPrincipal: 1421898, // ₹14,21,898 as of Nov 2026
    rate: 7.60, // from Nov 2026
    emi: 40000,
    emiDay: 5,
    prepayStartDay: 1,
    prepayEndDay: 3,
    defaultSurajPrepay: 0,
    defaultVrushaliPrepay: 0,
    color: 'blue',
    overrides: {}
  }
];

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  loans = signal<Loan[]>(this.loadInitial());
  syncStatus = signal<'synced' | 'saving' | 'offline'>('synced');

  constructor() {
    this.syncFromCloud();
  }

  private loadInitial(): Loan[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    return INITIAL_LOANS;
  }

  // Fetch latest JSON from Vercel Blob store
  async syncFromCloud() {
    try {
      const res = await fetch('/api/get-data');
      if (res.ok) {
        const cloudData = await res.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          this.loans.set(cloudData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          this.syncStatus.set('synced');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not sync from cloud, running with local data', e);
      this.syncStatus.set('offline');
    }
  }

  // Save to both localStorage and Vercel Blob
  async persist(updatedLoans: Loan[]) {
    this.loans.set(updatedLoans);
    this.syncStatus.set('saving');

    // 1. Instant local persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLoans));
    } catch (e) {
      console.error('Failed saving localStorage', e);
    }

    // 2. Cloud persistence via Vercel Blob
    try {
      const res = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLoans)
      });
      if (res.ok) {
        this.syncStatus.set('synced');
      } else {
        this.syncStatus.set('offline');
      }
    } catch (e) {
      console.warn('Cloud save failed, local data is safe', e);
      this.syncStatus.set('offline');
    }
  }

  updateLoanOverride(loanId: string, monthKey: string, partial: any) {
    const updated = this.loans().map(l => {
      if (l.id !== loanId) return l;
      const currentOverrides = { ...(l.overrides || {}) };
      const existing = currentOverrides[monthKey] || {};
      currentOverrides[monthKey] = { ...existing, ...partial };
      return { ...l, overrides: currentOverrides };
    });
    this.persist(updated);
  }

  resetToDefault() {
    this.persist(INITIAL_LOANS);
  }

  computeSchedule(loan: Loan): { schedule: AmortizationRow[]; debtFreeMonth: string; totalInterest: number; totalPrepayment: number } {
    const schedule: AmortizationRow[] = [];
    let balance = loan.currentPrincipal;
    let year = 2026;
    let month = 11; // Nov 2026

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let totalInterest = 0;
    let totalPrepayment = 0;
    let debtFreeMonth = 'Never';

    for (let i = 0; i < 360; i++) {
      if (balance <= 0) break;

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const override = loan.overrides?.[monthKey] || {};

      const currentRate = override.customRate ?? loan.rate;
      const currentEMI = override.customEMI ?? loan.emi;
      const suraj = override.surajPrepayment !== undefined ? override.surajPrepayment : loan.defaultSurajPrepay;
      const vrushali = override.vrushaliPrepayment !== undefined ? override.vrushaliPrepayment : loan.defaultVrushaliPrepay;
      const bonus = override.bonusPrepayment || 0;
      const prepay = suraj + vrushali + bonus;
      const reason = override.reason || '';

      const monthlyRate = currentRate / 12 / 100;
      const interestForMonth = Math.round(balance * monthlyRate);
      totalInterest += interestForMonth;

      let emiPrincipal = currentEMI - interestForMonth;
      if (emiPrincipal < 0) emiPrincipal = 0;

      let endBal = balance + interestForMonth - currentEMI - prepay;

      if (endBal < 0) {
        endBal = 0;
        debtFreeMonth = `${monthNames[month - 1]} ${year}`;
      }

      totalPrepayment += prepay;

      schedule.push({
        monthKey,
        displayDate: `${monthNames[month - 1]} ${year}`,
        year,
        monthName: monthNames[month - 1],
        startBalance: balance,
        rate: currentRate,
        emi: currentEMI,
        surajPrepay: suraj,
        vrushaliPrepay: vrushali,
        bonusPrepay: bonus,
        totalPrepayment: prepay,
        interestCharged: interestForMonth,
        principalPaid: balance - endBal,
        endBalance: endBal,
        reason
      });

      balance = endBal;
      if (balance <= 0) {
        debtFreeMonth = `${monthNames[month - 1]} ${year}`;
        break;
      }

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return { schedule, debtFreeMonth, totalInterest, totalPrepayment };
  }
}
