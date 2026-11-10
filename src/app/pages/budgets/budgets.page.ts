import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonProgressBar,
  IonIcon,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  walletOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  trendingUpOutline
} from 'ionicons/icons';
import { ApiService, Budget } from '../../services/api.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonProgressBar,
    IonIcon,
    IonSpinner
  ]
})
export class BudgetsPage implements OnInit {
  budgets: Budget[] = [];
  loading = false;

  private api = inject(ApiService);

  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor() {
    addIcons({
      walletOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      trendingUpOutline
    });
  }

  ngOnInit() {
    this.loadBudgets();
  }

  loadBudgets() {
    this.loading = true;
    this.api.getBudgets().subscribe({
      next: (res) => {
        this.budgets = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getCategoryName(budget: Budget): string {
    return budget.category?.name ?? 'Sin categoría';
  }

  getLimit(budget: Budget): number {
    return Number(budget.amount) || 0;
  }

  getSpent(budget: Budget): number {
    return Number(budget.spent) || 0;
  }

  getPercentage(budget: Budget): number {
    return Number(budget.percentage) || 0;
  }

  getProgress(budget: Budget): number {
    const limit = this.getLimit(budget);
    if (limit <= 0) {
      return 0;
    }

    return Math.min(this.getSpent(budget) / limit, 1);
  }

  getAlertColor(alert: Budget['alert']): string {
    switch (alert) {
      case 'limite_excedido':
        return 'danger';
      case 'advertencia':
        return 'warning';
      default:
        return 'success';
    }
  }

  getAlertLabel(alert: Budget['alert']): string {
    switch (alert) {
      case 'limite_excedido':
        return 'Límite excedido';
      case 'advertencia':
        return 'Advertencia';
      default:
        return 'Normal';
    }
  }

  getAlertIcon(alert: Budget['alert']): string {
    return alert === 'normal' ? 'checkmark-circle-outline' : 'alert-circle-outline';
  }

  getMonthName(month: number): string {
    return this.monthNames[month - 1] ?? '';
  }

  get totalLimit(): number {
    return this.budgets.reduce((sum, budget) => sum + this.getLimit(budget), 0);
  }

  get totalSpent(): number {
    return this.budgets.reduce((sum, budget) => sum + this.getSpent(budget), 0);
  }

  get overallProgress(): number {
    if (this.totalLimit <= 0) {
      return 0;
    }

    return Math.min(this.totalSpent / this.totalLimit, 1);
  }
}
