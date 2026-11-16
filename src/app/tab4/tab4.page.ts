import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonFab, IonFabButton, ModalController, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barChartOutline, add, addOutline, fastFoodOutline, busOutline, bookOutline, gameControllerOutline, homeOutline, calendarOutline, trendingUpOutline, trendingDownOutline, walletOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { TransactionService, Movement } from '../services/transaction';
import { AddMovementModalComponent } from '../components/add-movement-modal/add-movement-modal.component';

interface CategoryStat {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

interface MonthlyStat {
  monthName: string;
  income: number;
  expense: number;
  maxHeightIncome: number;
  maxHeightExpense: number;
}

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonFab, IonFabButton]
})
export class Tab4Page implements OnInit, OnDestroy, ViewWillEnter {
  movements: Movement[] = [];
  anioSeleccionado = new Date().getFullYear();

  totalIncome = 0;
  totalExpense = 0;
  totalSavings = 0;

  categoryStats: CategoryStat[] = [];
  monthlyStats: MonthlyStat[] = [];
  Math = Math;

  private sub!: Subscription;
  private transactionService = inject(TransactionService);
  private modalController = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ barChartOutline, add, addOutline, fastFoodOutline, busOutline, bookOutline, gameControllerOutline, homeOutline, calendarOutline, trendingUpOutline, trendingDownOutline, walletOutline });
  }

  ngOnInit() {
    this.sub = this.transactionService.movements$.subscribe(data => {
      this.movements = data ?? [];
      this.calculateDynamicStats();
      this.cdr.detectChanges();
    });
  }

  ionViewWillEnter(): void {
    void (async () => {
      await this.transactionService.refreshData();
      const bal = await this.transactionService.loadBalanceFromApi();
      this.totalSavings = bal;
      this.cdr.detectChanges();
    })();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  onYearChange(): void {
    this.calculateDynamicStats();
    this.cdr.detectChanges();
  }

  calculateDynamicStats() {
    const year = this.anioSeleccionado;

    this.totalIncome = this.movements
      .filter(m => !m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    this.totalExpense = this.movements
      .filter(m => m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    const yearMovements = this.movements.filter(m => (m.date ?? '').startsWith(String(year)));
    const expensesYear = yearMovements.filter(m => m.isExpense);
    const categoryMap = new Map<string, { amount: number; icon: string; iconBg: string }>();

    expensesYear.forEach(m => {
      const categoryName = m.category || 'Sin categoría';
      const current = categoryMap.get(categoryName) ?? { amount: 0, icon: m.icon || 'cash-outline', iconBg: m.iconBg || '#64748b' };
      current.amount += Math.abs(m.amount);
      if (m.icon) current.icon = m.icon;
      if (m.iconBg) current.iconBg = m.iconBg;
      categoryMap.set(categoryName, current);
    });

    const totalExpenseYear = expensesYear.reduce((s, m) => s + Math.abs(m.amount), 0);
    this.categoryStats = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        amount: value.amount,
        percentage: totalExpenseYear > 0 ? (value.amount / totalExpenseYear) * 100 : 0,
        color: value.iconBg || '#64748b',
        icon: value.icon || 'cash-outline',
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyAggregates = new Map<string, { income: number; expense: number }>();
    yearMovements.forEach(m => {
      const key = (m.date ?? '').slice(0, 7);
      if (!key) return;
      const current = monthlyAggregates.get(key) ?? { income: 0, expense: 0 };
      if (m.isExpense) {
        current.expense += Math.abs(m.amount);
      } else {
        current.income += Math.abs(m.amount);
      }
      monthlyAggregates.set(key, current);
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      const totals = monthlyAggregates.get(key) ?? { income: 0, expense: 0 };
      const maxValue = Math.max(totals.income, totals.expense, 1);
      const incomeHeight = Math.min(90, Math.round((totals.income / maxValue) * 90));
      const expenseHeight = Math.min(90, Math.round((totals.expense / maxValue) * 90));
      return {
        monthName: monthNames[i],
        income: totals.income,
        expense: totals.expense,
        maxHeightIncome: Math.max(totals.income > 0 ? 6 : 2, incomeHeight),
        maxHeightExpense: Math.max(totals.expense > 0 ? 6 : 2, expenseHeight),
      };
    });
  }

  async openAddMovement() {
    const modal = await this.modalController.create({
      component: AddMovementModalComponent,
      componentProps: { initialType: 'gasto' }
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'created' && data) {
      await this.transactionService.addMovement(data);
    }
  }
}