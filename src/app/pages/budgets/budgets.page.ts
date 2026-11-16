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
  IonButtons,
  IonModal,
  ViewWillEnter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  trashOutline,
  trendingDownOutline,
  walletOutline
} from 'ionicons/icons';
import { finalize, firstValueFrom } from 'rxjs';
import { ApiService, Budget, Category } from '../../services/api.service';

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
    IonButton,
    IonButtons,
    IonModal
  ]
})
export class BudgetsPage implements OnInit, OnDestroy, ViewWillEnter {
  budgets: Budget[] = [];
  categories: Category[] = [];
  loading = false;
  guardando = false;
  errorMessage: string | null = null;

  showForm = false;
  showMonthPicker = false;
  showFormMonthPicker = false;

  selectedMonth = this.currentMonthValue();
  formMonth = this.currentMonthValue();
  pickerYear = Number(this.selectedMonth.slice(0, 4));
  formPickerYear = Number(this.formMonth.slice(0, 4));

  nuevaCategoriaId: number | null = null;
  nuevoLimite: number | null = null;

  snackbar = '';
  snackbarType: 'success' | 'error' = 'success';
  private snackbarTimer?: any;

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = false;

  readonly meses = [
    { nombre: 'Enero', valor: '01' },
    { nombre: 'Febrero', valor: '02' },
    { nombre: 'Marzo', valor: '03' },
    { nombre: 'Abril', valor: '04' },
    { nombre: 'Mayo', valor: '05' },
    { nombre: 'Junio', valor: '06' },
    { nombre: 'Julio', valor: '07' },
    { nombre: 'Agosto', valor: '08' },
    { nombre: 'Septiembre', valor: '09' },
    { nombre: 'Octubre', valor: '10' },
    { nombre: 'Noviembre', valor: '11' },
    { nombre: 'Diciembre', valor: '12' },
  ];

  constructor() {
    addIcons({
      addOutline,
      alertCircleOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
      closeOutline,
      trashOutline,
      trendingDownOutline,
      walletOutline
    });
  }

  ngOnInit() {
    void this.loadAll();
  }

  ionViewWillEnter(): void {
    void this.loadAll();
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (this.snackbarTimer) clearTimeout(this.snackbarTimer);
  }

  private currentMonthValue(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  async loadAll(): Promise<void> {
    await Promise.all([this.loadCategories(), this.loadBudgets()]);
  }

  async loadCategories(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getCategories());
      this.categories = res.data ?? [];
    } catch (e) {
      console.error('Error al cargar categorías:', e);
    } finally {
      this.refreshView();
    }
  }

  loadBudgets(): Promise<void> {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    this.loading = true;
    this.errorMessage = null;
    return new Promise((resolve) => {
      this.api.getBudgets(month, year)
        .pipe(finalize(() => {
          this.loading = false;
          this.refreshView();
          resolve();
        }))
        .subscribe({
          next: (res) => {
            this.budgets = res.data ?? [];
          },
          error: (error) => {
            console.error('Error al obtener presupuestos:', error);
            this.errorMessage = 'No se pudieron obtener los presupuestos.';
          }
        });
    });
  }

  async onMonthChange(): Promise<void> {
    await this.loadBudgets();
  }

  nombreMes(valor: string): string {
    if (!valor) return 'Seleccionar mes';
    const [anio, mesNum] = valor.split('-');
    const m = this.meses.find(x => x.valor === mesNum);
    return m ? `${m.nombre} ${anio}` : valor;
  }

  openMonthPicker(): void {
    this.pickerYear = Number(this.selectedMonth.slice(0, 4));
    this.showMonthPicker = true;
  }

  selectMonth(valor: string): void {
    this.selectedMonth = `${this.pickerYear}-${valor}`;
    this.showMonthPicker = false;
    void this.onMonthChange();
  }

  openFormMonthPicker(): void {
    this.formPickerYear = Number(this.formMonth.slice(0, 4));
    this.showFormMonthPicker = true;
  }

  selectFormMonth(valor: string): void {
    this.formMonth = `${this.formPickerYear}-${valor}`;
    this.showFormMonthPicker = false;
  }

  abrirFormulario(): void {
    this.nuevaCategoriaId = null;
    this.nuevoLimite = null;
    this.formMonth = this.selectedMonth;
    this.formPickerYear = Number(this.formMonth.slice(0, 4));
    this.showForm = true;
    this.errorMessage = null;
  }

  cerrarFormulario(): void {
    this.showForm = false;
  }

  async guardarPresupuesto(): Promise<void> {
    if (this.nuevaCategoriaId == null || !this.nuevoLimite || Number(this.nuevoLimite) <= 0) {
      this.showSnack('Selecciona una categoría y un límite mayor a cero.', 'error');
      return;
    }
    const [year, month] = this.formMonth.split('-').map(Number);
    this.guardando = true;
    try {
      await firstValueFrom(this.api.createBudget({
        category_id: Number(this.nuevaCategoriaId),
        amount: Number(this.nuevoLimite),
        month,
        year,
      }));
      this.showForm = false;
      this.selectedMonth = this.formMonth;
      await this.loadBudgets();
      this.showSnack('Presupuesto guardado correctamente', 'success');
    } catch (e) {
      console.error('Error al guardar presupuesto:', e);
      this.showSnack('No se pudo guardar el presupuesto.', 'error');
    } finally {
      this.guardando = false;
      this.refreshView();
    }
  }

  async eliminarPresupuesto(budget: Budget): Promise<void> {
    if (!budget?.id) return;
    try {
      await firstValueFrom(this.api.deleteBudget(budget.id));
      await this.loadBudgets();
      this.showSnack('Presupuesto eliminado correctamente', 'success');
    } catch (e) {
      console.error('Error al eliminar presupuesto:', e);
      this.showSnack('No se pudo eliminar el presupuesto.', 'error');
    }
  }

  getCategoryName(budget: Budget): string {
    return budget.category?.name ?? this.categories.find(c => c.id === budget.category_id)?.name ?? 'Categoría';
  }

  getLimit(budget: Budget): number { return Number(budget.amount) || 0; }
  getSpent(budget: Budget): number { return Number(budget.spent) || 0; }
  getPercentage(budget: Budget): number {
    const pct = Number(budget.percentage);
    if (!isNaN(pct) && pct > 0) return pct;
    const limit = this.getLimit(budget);
    return limit > 0 ? (this.getSpent(budget) / limit) * 100 : 0;
  }
  getAvailable(budget: Budget): number { return Math.max(0, this.getLimit(budget) - this.getSpent(budget)); }
  getProgress(budget: Budget): number { return Math.min(this.getPercentage(budget) / 100, 1); }

  get totalPresupuestado(): number { return this.budgets.reduce((s, b) => s + this.getLimit(b), 0); }
  get totalGastado(): number { return this.budgets.reduce((s, b) => s + this.getSpent(b), 0); }
  get totalDisponible(): number { return Math.max(0, this.totalPresupuestado - this.totalGastado); }

  getAlertColor(alert?: Budget['alert'], pct?: number): string {
    if (alert === 'limite_excedido' || (pct ?? 0) >= 100) return 'danger';
    if (alert === 'advertencia' || (pct ?? 0) >= 80) return 'warning';
    return 'success';
  }
  getEstadoLabel(pct: number): string {
    if (pct >= 100) return 'Límite superado';
    if (pct >= 80) return 'Cerca del límite';
    return 'Bajo control';
  }

  showSnack(msg: string, type: 'success' | 'error'): void {
    this.snackbar = msg;
    this.snackbarType = type;
    if (this.snackbarTimer) clearTimeout(this.snackbarTimer);
    this.snackbarTimer = setTimeout(() => { this.snackbar = ''; this.refreshView(); }, 3500);
    this.refreshView();
  }

  money(v: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(v || 0);
  }

  private refreshView(): void {
    if (!this.destroyed) this.cdr.detectChanges();
  }
}
