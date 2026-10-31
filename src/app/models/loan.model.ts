export interface MonthlyOverride {
  surajPrepayment?: number;
  vrushaliPrepayment?: number;
  bonusPrepayment?: number;
  customEMI?: number;
  customRate?: number;
  reason?: string;
  strategy?: 'tenure' | 'emi';
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  currentPrincipal: number; // as of Nov 2026
  rate: number; // annual percentage
  emi: number; // monthly EMI
  emiDay: number; // e.g. 5
  prepayStartDay: number; // e.g. 1
  prepayEndDay: number; // e.g. 3
  defaultSurajPrepay: number;
  defaultVrushaliPrepay: number;
  color: string;
  overrides: Record<string, MonthlyOverride>; // key: 'YYYY-MM'
}

export interface AmortizationRow {
  monthKey: string;
  displayDate: string;
  year: number;
  monthName: string;
  startBalance: number;
  rate: number;
  emi: number;
  surajPrepay: number;
  vrushaliPrepay: number;
  bonusPrepay: number;
  totalPrepayment: number;
  interestCharged: number;
  principalPaid: number;
  endBalance: number;
  reason: string;
}
