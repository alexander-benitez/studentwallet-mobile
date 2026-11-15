import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonProgressBar,
  IonIcon,
  IonSpinner,
  IonButton,
  ViewWillEnter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  walletOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  trendingUpOutline
} from 'ionicons/icons';
import { finalize, firstValueFrom } from 'rxjs';
import { ApiService, Budget, BudgetCategory } from '../../services/api.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonProgressBar,
    IonIcon,
    IonSpinner,
    IonButton
  ]
})
export class BudgetsPage implements OnInit, OnDestroy, ViewWillEnter {
  budgets: Budget[] = [];
  loading = false;

  mostrarFormulario = false;
  categoriasDisponibles: BudgetCategory[] = [];
  nuevaCategoriaId: number | null = null;
  nuevoLimite: number | null = null;
  nuevoMes: number = new Date().getMonth() + 1;
  nuevoAnio: number = new Date().getFullYear();
  guardando = false;
  errorMessage: string | null = null;

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = false;

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

  ionViewWillEnter(): void {
    if (!this.loading) {
      this.loadBudgets();
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  loadBudgets() {
    this.loading = true;
    this.api.getBudgets()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshView();
        }),
      )
      .subscribe({
        next: (res) => {
          this.budgets = res.data ?? [];
        },
        error: (error) => {
          console.error('Error al obtener presupuestos:', error);
          this.errorMessage = 'No se pudieron obtener los presupuestos.';
        },
      });
  }

  async cargarCategorias(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getCategories());
      this.categoriasDisponibles = (res.data ?? []) as any;
    } catch (error) {
      console.error('Error al obtener categorias:', error);
    } finally {
      this.refreshView();
    }
  }

  abrirFormulario(): void {
    this.nuevaCategoriaId = null;
    this.nuevoLimite = null;
    this.nuevoMes = new Date().getMonth() + 1;
    this.nuevoAnio = new Date().getFullYear();
    this.mostrarFormulario = true;
    this.errorMessage = null;
    this.cargarCategorias();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  async guardarPresupuesto(): Promise<void> {
    if (this.nuevaCategoriaId == null || !this.nuevoLimite || this.nuevoLimite <= 0) {
      this.errorMessage = 'Selecciona una categoria y un limite mayor a cero.';
      return;
    }

    this.guardando = true;
    try {
      const res = await firstValueFrom(
        this.api.createBudget({
          category_id: this.nuevaCategoriaId,
          amount: Number(this.nuevoLimite),
          month: this.nuevoMes,
          year: this.nuevoAnio,
        }),
      );

      if (!res) {
        throw new Error('empty response');
      }

      await this.loadBudgets();
      this.mostrarFormulario = false;
      this.errorMessage = null;
    } catch (error) {
      console.error('Error al crear presupuesto:', error);
      this.errorMessage = 'No se pudo crear el presupuesto. Revisa la categoria y el limite.';
    } finally {
      this.guardando = false;
    }
  }

  async eliminarPresupuesto(id: number): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteBudget(id));
      await this.loadBudgets();
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
    }
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

  get currentBudgets(): Budget[] {
    const now = new Date();
    return this.budgets.filter(
      budget => budget.year === now.getFullYear() && budget.month === now.getMonth() + 1,
    );
  }

  get totalLimit(): number {
    return this.currentBudgets.reduce((sum, budget) => sum + this.getLimit(budget), 0);
  }

  get totalSpent(): number {
    return this.currentBudgets.reduce((sum, budget) => sum + this.getSpent(budget), 0);
  }

  get overallProgress(): number {
    if (this.totalLimit <= 0) {
      return 0;
    }

    return Math.min(this.totalSpent / this.totalLimit, 1);
  }

  private refreshView(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }
}
