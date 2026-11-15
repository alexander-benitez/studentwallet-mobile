import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonFab, IonFabButton, ModalController, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { barChartOutline, add, addOutline, fastFoodOutline, busOutline, bookOutline, gameControllerOutline, homeOutline } from 'ionicons/icons';
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
  imports: [CommonModule, IonContent, IonIcon, IonFab, IonFabButton]
})
export class Tab4Page implements OnInit, OnDestroy, ViewWillEnter {
  movements: Movement[] = [];
  totalIncome = 0;
  totalExpense = 0;
  totalSavings = 0;
  
  categoryStats: CategoryStat[] = [];
  monthlyStats: MonthlyStat[] = [];
  savingsPoints: string = '';
  Math = Math;

  private sub!: Subscription;
  private transactionService = inject(TransactionService);
  private modalController = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ barChartOutline, add, addOutline, fastFoodOutline, busOutline, bookOutline, gameControllerOutline, homeOutline });
  }

  ngOnInit() {
    this.sub = this.transactionService.movements$.subscribe(data => {
      this.movements = data;
      this.calculateDynamicStats();
      this.cdr.detectChanges();
    });
  }

  ionViewWillEnter(): void {
    void this.transactionService.refreshData();
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  calculateDynamicStats() {
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const monthMovements = this.movements.filter(m => (m.date ?? '').startsWith(currentMonthKey));

    this.totalIncome = monthMovements
      .filter(m => !m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    this.totalExpense = monthMovements
      .filter(m => m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    this.totalSavings = this.totalIncome - this.totalExpense;

    const expenses = monthMovements.filter(m => m.isExpense);
    const categoryMap = new Map<string, { amount: number; icon: string; iconBg: string }>();

    expenses.forEach(m => {
      const categoryName = m.category || 'Sin categoría';
      const current = categoryMap.get(categoryName) ?? { amount: 0, icon: m.icon || 'cash-outline', iconBg: m.iconBg };
      current.amount += Math.abs(m.amount);
      categoryMap.set(categoryName, current);
    });

    this.categoryStats = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        amount: value.amount,
        percentage: this.totalExpense > 0 ? (value.amount / this.totalExpense) * 100 : 0,
        color: value.iconBg || '#64748b',
        icon: value.icon || 'cash-outline',
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyAggregates = new Map<string, { income: number; expense: number }>();
    this.movements.forEach(m => {
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

    const monthlyStats = Array.from(monthlyAggregates.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, totals]) => {
        const maxValue = Math.max(totals.income, totals.expense, 1);
        const incomeHeight = Math.min(90, Math.round((totals.income / maxValue) * 90));
        const expenseHeight = Math.min(90, Math.round((totals.expense / maxValue) * 90));

        return {
          monthName: this.getMonthName(Number(key.slice(5, 7))),
          income: totals.income,
          expense: totals.expense,
          maxHeightIncome: Math.max(15, incomeHeight),
          maxHeightExpense: Math.max(15, expenseHeight)
        };
      });

    this.monthlyStats = monthlyStats;

    let cumulativeSavings = 0;
    let savingsPath = '';
    this.monthlyStats.forEach((stat, index) => {
      const savings = stat.income - stat.expense;
      cumulativeSavings += savings;
      const x = 15 + index * 68;
      const y = Math.max(15, Math.min(85, 80 - (cumulativeSavings / 50)));
      savingsPath = index === 0 ? `M ${x} ${y}` : `${savingsPath} L ${x} ${y}`;
    });

    this.savingsPoints = savingsPath;
  }

  getMonthName(month: number): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[(month - 1) % 12] ?? '';
  }

  // Método idéntico al de Tab1 para abrir el modal estilizado con el selector Ingreso/Gasto
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