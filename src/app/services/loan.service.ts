import { Injectable, signal } from '@angular/core';
import { Loan, AmortizationRow } from '../models/loan.model';

const STORAGE_KEY = 'loan_tracker_angular_v1';

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'rama-sbi',
    name: 'Rama Home Loan',
    bank: 'State Bank of India (SBI)',
    currentPrincipal: 5395724, // Baseline starting Jan 2026 (yields exactly ₹40.00L post-Nov)
    rate: 7.90, // Effective Nov 2026 onwards (was 7.65% Jan-Oct)
    emi: 80000,
    emiDay: 5,
    prepayStartDay: 1,
    prepayEndDay: 3,
    defaultSurajPrepay: 45000,
    defaultVrushaliPrepay: 35000,
    color: 'emerald',
    overrides: {
      '2026-01': { surajPrepayment: 10000, vrushaliPrepayment: 10000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-02': { surajPrepayment: 10000, vrushaliPrepayment: 10000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-03': { surajPrepayment: 10000, vrushaliPrepayment: 10000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-04': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 50000, customEMI: 80000, customRate: 7.65, reason: 'Annual Bonus Added' },
      '2026-05': { surajPrepayment: 10000, vrushaliPrepayment: 10000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-06': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Partial: Lower savings this month' },
      '2026-07': { surajPrepayment: 45000, vrushaliPrepayment: 35000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-08': { surajPrepayment: 45000, vrushaliPrepayment: 35000, bonusPrepayment: 430000, customEMI: 80000, customRate: 7.65, reason: 'Suraj 4.3L Lump Sum + Prepayment' },
      '2026-09': { surajPrepayment: 0, vrushaliPrepayment: 35000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Vrushali 35k (Suraj 0)' },
      '2026-10': { surajPrepayment: 45000, vrushaliPrepayment: 35000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.65, reason: 'Paid as planned' },
      '2026-11': { surajPrepayment: 45000, vrushaliPrepayment: 35000, bonusPrepayment: 0, customEMI: 80000, customRate: 7.90, reason: 'Rate adjusted to 7.90%' },
      '2027-04': { bonusPrepayment: 200000, reason: 'Annual Bonus Added' },
      '2028-04': { bonusPrepayment: 200000, reason: 'Annual Bonus Added' }
    }
  },
  {
    id: 'gera-hdfc',
    name: 'Gera Home Loan',
    bank: 'HDFC Bank',
    currentPrincipal: 1721833, // Jan 2026 baseline yielding exactly ₹13,90,414 after Nov EMI
    rate: 7.60,
    emi: 40000,
    emiDay: 5,
    prepayStartDay: 1,
    prepayEndDay: 3,
    defaultSurajPrepay: 0,
    defaultVrushaliPrepay: 0,
    color: 'blue',
    overrides: {
      '2026-01': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-02': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-03': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-04': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-05': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-06': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-07': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-08': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-09': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-10': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.35, reason: 'Fixed EMI' },
      '2026-11': { surajPrepayment: 0, vrushaliPrepayment: 0, bonusPrepayment: 0, customEMI: 40000, customRate: 7.60, reason: 'Rate adjusted to 7.60%' }
    }
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

  async syncFromCloud() {
    try {
      const res = await fetch('/api/get-data');
      if (res.ok) {
        const cloudData = await res.json();
        if (Array.isArray(cloudData) && cloudData.length > 0 && cloudData[0].currentPrincipal !== undefined) {
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

  async persist(updatedLoans: Loan[]) {
    this.loans.set(updatedLoans);
    this.syncStatus.set('saving');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLoans));
    } catch (e) {
      console.error('Failed saving localStorage', e);
    }

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
  let month = 1;

  // 1. Initial rates & EMIs that will cascade forward across months
  let activeRate = loan.rate;
  let activeEMI = loan.emi;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let totalInterest = 0;
  let totalPrepayment = 0;
  let debtFreeMonth = 'Never';

  for (let i = 0; i < 360; i++) {
    if (balance <= 0) break;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const override = loan.overrides?.[monthKey] || {};

    // 2. If a month introduces a customRate, it overrides activeRate permanently forward
    if (override.customRate !== undefined && override.customRate !== null && !isNaN(override.customRate) && override.customRate > 0) {
      activeRate = Number(override.customRate);
    }

    if (override.customEMI !== undefined && override.customEMI !== null && !isNaN(override.customEMI) && override.customEMI > 0) {
      activeEMI = Number(override.customEMI);
    }

    const currentRate = activeRate;
    const currentEMI = activeEMI;

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

    // 3. Make sure 'rate: currentRate' (the active carried-forward rate) is assigned to the row
    schedule.push({
      monthKey,
      displayDate: `${monthNames[month - 1]} ${year}`,
      year,
      monthName: monthNames[month - 1],
      startBalance: balance,
      rate: currentRate, // ✅ Displays 7.8% on this row and all subsequent rows
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
