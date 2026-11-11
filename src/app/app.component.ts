import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanService } from './services/loan.service';
import { Loan, AmortizationRow } from './models/loan.model';

type ActiveTab = 'dashboard' | 'rama-sbi' | 'gera-hdfc' | 'settings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public loanService = inject(LoanService);

  activeTab = signal<ActiveTab>('dashboard');
  loans = this.loanService.loans;

  editingRow = signal<{ loanId: string; row: AmortizationRow } | null>(null);
  editForm = {
    surajPrepay: 0,
    vrushaliPrepay: 0,
    bonusPrepay: 0,
    emi: 0,
    rate: 0,
    reason: ''
  };

  reasons = [
    'Paid as planned',
    'Annual Bonus Added',
    'Suraj 4.3L Lump Sum + Prepayment',
    'Vrushali 35k (Suraj 0)',
    'Missed: Advance Tax',
    'Missed: Medical Emergency',
    'Missed: Vacation/Festival Outflow',
    'Partial: Lower savings this month',
    'Rate adjusted'
  ];

  // Base Loan references
  ramaLoan = computed(() => this.loans().find(l => l.id === 'rama-sbi')!);
  geraLoan = computed(() => this.loans().find(l => l.id === 'gera-hdfc')!);

  // Real-time calculated schedules (starts Jan 2026)
  ramaData = computed(() => this.loanService.computeSchedule(this.ramaLoan()));
  geraData = computed(() => this.loanService.computeSchedule(this.geraLoan()));

  // Active November 2026 row for Rama
  ramaNovRow = computed(() => {
    return this.ramaData().schedule.find(r => r.monthKey === '2026-11') || this.ramaData().schedule[0];
  });

  // Active November 2026 row for Gera
  geraNovRow = computed(() => {
    return this.geraData().schedule.find(r => r.monthKey === '2026-11') || this.geraData().schedule[0];
  });

  // Dynamic Nov 2026 Balances (₹40.00L & ₹13.90L)
  ramaCurrentBalance = computed(() => this.ramaNovRow()?.endBalance ?? 0);
  geraCurrentBalance = computed(() => this.geraNovRow()?.endBalance ?? 0);

  // Dynamic Rate & EMI for Nov 2026
  ramaCurrentRate = computed(() => this.ramaNovRow()?.rate ?? this.ramaLoan()?.rate);
  geraCurrentRate = computed(() => this.geraNovRow()?.rate ?? this.geraLoan()?.rate);
  ramaCurrentEMI = computed(() => this.ramaNovRow()?.emi ?? this.ramaLoan()?.emi);
  geraCurrentEMI = computed(() => this.geraNovRow()?.emi ?? this.geraLoan()?.emi);

  // Dynamic Prepayments for Nov 2026
  ramaCurrentPrepay = computed(() => this.ramaNovRow()?.totalPrepayment ?? (this.ramaLoan()?.defaultSurajPrepay + this.ramaLoan()?.defaultVrushaliPrepay));
  geraCurrentPrepay = computed(() => this.geraNovRow()?.totalPrepayment ?? (this.geraLoan()?.defaultSurajPrepay + this.geraLoan()?.defaultVrushaliPrepay));

  // Executive Dashboard Metrics
  totalOutstanding = computed(() => this.ramaCurrentBalance() + this.geraCurrentBalance());
  totalEMI = computed(() => this.ramaCurrentEMI() + this.geraCurrentEMI());
  totalPlannedPrepayment = computed(() => this.ramaCurrentPrepay() + this.geraCurrentPrepay());

  portfolioDebtFree = computed(() => {
    const ramaMonths = this.ramaData().schedule.length;
    const geraMonths = this.geraData().schedule.length;
    return ramaMonths >= geraMonths ? this.ramaData().debtFreeMonth : this.geraData().debtFreeMonth;
  });

  setActiveTab(tab: ActiveTab) {
    this.activeTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEditModal(loanId: string, row: AmortizationRow) {
    this.editingRow.set({ loanId, row });
    this.editForm = {
      surajPrepay: row.surajPrepay,
      vrushaliPrepay: row.vrushaliPrepay,
      bonusPrepay: row.bonusPrepay,
      emi: row.emi,
      rate: row.rate,
      reason: row.reason || ''
    };
  }

  closeEditModal() {
    this.editingRow.set(null);
  }

  saveEditModal() {
    const current = this.editingRow();
    if (!current) return;

    this.loanService.updateLoanOverride(current.loanId, current.row.monthKey, {
      surajPrepayment: Number(this.editForm.surajPrepay),
      vrushaliPrepayment: Number(this.editForm.vrushaliPrepay),
      bonusPrepayment: Number(this.editForm.bonusPrepay),
      customEMI: Number(this.editForm.emi),
      customRate: Number(this.editForm.rate),
      reason: this.editForm.reason
    });

    this.closeEditModal();
  }

  setReason(reason: string) {
    this.editForm.reason = reason;
  }

  formatINR(val: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.round(val || 0));
  }

  exportBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.loans(), null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `loan-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  }

  importBackup(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed)) {
          this.loanService.persist(parsed);
          alert('Backup restored and synced successfully!');
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  }

  resetAll() {
    if (confirm('Are you sure you want to reset all data back to original defaults?')) {
      this.loanService.resetToDefault();
    }
  }
}
