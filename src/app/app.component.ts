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

  // Current active operational month boundary
  readonly CURRENT_MONTH_KEY = '2026-11';

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
    'Suraj Lump Sum + Prepayment',
    'Partial: Lower savings this month',
    'Missed: Advance Tax',
    'Missed: Medical Emergency',
    'Rate adjusted'
  ];

  // Base Loan definitions
  ramaLoan = computed(() => this.loans().find(l => l.id === 'rama-sbi')!);
  geraLoan = computed(() => this.loans().find(l => l.id === 'gera-hdfc')!);

  // Full amortization schedule computed dynamically
  ramaData = computed(() => this.loanService.computeSchedule(this.ramaLoan()));
  geraData = computed(() => this.loanService.computeSchedule(this.geraLoan()));

  // Active Current Month (2026-11) rows directly extracted from schedule
  ramaCurrentRow = computed(() => {
    return this.ramaData().schedule.find(r => r.monthKey === this.CURRENT_MONTH_KEY) 
      || this.ramaData().schedule[this.ramaData().schedule.length - 1];
  });

  geraCurrentRow = computed(() => {
    return this.geraData().schedule.find(r => r.monthKey === this.CURRENT_MONTH_KEY) 
      || this.geraData().schedule[this.geraData().schedule.length - 1];
  });

  // Dynamic Dashboard Balances reflecting Current Month (Nov 2026)
  ramaCurrentBalance = computed(() => this.ramaCurrentRow()?.endBalance ?? 0);
  geraCurrentBalance = computed(() => this.geraCurrentRow()?.endBalance ?? 0);

  // Dynamic Rates & EMIs for Current Month
  ramaCurrentRate = computed(() => this.ramaCurrentRow()?.rate ?? this.ramaLoan()?.rate);
  geraCurrentRate = computed(() => this.geraCurrentRow()?.rate ?? this.geraLoan()?.rate);
  ramaCurrentEMI = computed(() => this.ramaCurrentRow()?.emi ?? this.ramaLoan()?.emi);
  geraCurrentEMI = computed(() => this.geraCurrentRow()?.emi ?? this.geraLoan()?.emi);

  // Dynamic Current Prepayments
  ramaCurrentPrepay = computed(() => this.ramaCurrentRow()?.totalPrepayment ?? 0);
  geraCurrentPrepay = computed(() => this.geraCurrentRow()?.totalPrepayment ?? 0);

  // Executive Top Summary Metrics
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

  isEditableMonth(monthKey: string): boolean {
    // Only current month ('2026-11') and later months are allowed to be edited
    return monthKey >= this.CURRENT_MONTH_KEY;
  }

  openEditModal(loanId: string, row: AmortizationRow) {
    if (!this.isEditableMonth(row.monthKey)) {
      alert(`Editing is locked for past historical months (${row.displayDate}). You can only edit from November 2026 onwards.`);
      return;
    }

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

    if (!this.isEditableMonth(current.row.monthKey)) {
      this.closeEditModal();
      return;
    }

    // Persist override to the selected month key.
    // LoanService will recalculate that month and every following month automatically.
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
