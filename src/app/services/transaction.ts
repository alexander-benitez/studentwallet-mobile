import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService, Budget } from './api.service';

export interface Movement {
  id: number;
  category: string;
  categoryId?: number;
  subtitle: string;
  concepto?: string;
  amount: number;
  isExpense: boolean;
  icon: string;
  iconBg: string;
  period: 'week' | 'month';
  date?: string;
}

export interface Goal {
  id: number | string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon?: string;
  deadline?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private movementsSubject = new BehaviorSubject<Movement[]>([]);
  movements$ = this.movementsSubject.asObservable();

  private balanceSubject = new BehaviorSubject<number>(0);
  balance$ = this.balanceSubject.asObservable();

  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  goals$ = this.goalsSubject.asObservable();

  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  budgets$ = this.budgetsSubject.asObservable();

  get budgetsValue(): Budget[] {
    return this.budgetsSubject.value;
  }

  get movementsValue(): Movement[] {
    return this.movementsSubject.value;
  }

  get goalsValue(): Goal[] {
    return this.goalsSubject.value;
  }

  get balanceValue(): number {
    return this.balanceSubject.value;
  }

  private recommendationsSubject = new BehaviorSubject<any[]>([]);
  recommendations$ = this.recommendationsSubject.asObservable();

  private api = inject(ApiService);

  constructor() {
    this.refreshData();
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async refreshData() {
    await Promise.all([
      this.loadBalanceFromApi(),
      this.loadMovementsFromApi(),
      this.loadBudgetsFromApi(),
      this.loadRecommendationsFromApi()
    ]);
  }

  async loadBudgetsFromApi(): Promise<Budget[]> {
    try {
      const res = await fetch(`${environment.apiUrl}/budgets`, {
        headers: this.getHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data ?? [];
        this.budgetsSubject.next(data);
        return data;
      }
    } catch (err) {
      console.error('Error al obtener presupuestos:', err);
    }
    return this.budgetsSubject.value;
  }

  async loadRecommendationsFromApi(): Promise<any[]> {
    try {
      const res = await fetch(`${environment.apiUrl}/recommendations`, {
        headers: this.getHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data ?? [];
        this.recommendationsSubject.next(data);
        return data;
      }
    } catch (err) {
      console.error('Error al obtener recomendaciones:', err);
    }
    return this.recommendationsSubject.value;
  }

  async loadBalanceFromApi(): Promise<number> {
    try {
      const res = await fetch(`${environment.apiUrl}/balance`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const totalIncomes = Number(json.data?.total_incomes ?? 0);
        const totalExpenses = Number(json.data?.total_expenses ?? 0);
        const saldo = Number(json.data?.balance ?? (totalIncomes - totalExpenses));
        this.balanceSubject.next(saldo);
        return saldo;
      }
    } catch (err) {
      console.error('Error al consultar balance:', err);
    }
    return this.balanceSubject.value;
  }

  async loadMovementsFromApi(): Promise<Movement[]> {
    try {
      const res = await fetch(`${environment.apiUrl}/transactions`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || json || [];

        const mapped: Movement[] = rawList.map((item: any) => {
          const isExpense = item.type === 'gasto' || item.type === 'expense' || Number(item.amount) < 0;
          const absAmount = Math.abs(Number(item.amount));
          const categoryName = item.category?.name || item.category || 'General';

          const movementDate = item.date ? new Date(item.date) : new Date();
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          const startOfDay = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
          const endOfDay = new Date(startOfDay);
          endOfDay.setDate(endOfDay.getDate() + 1);

          const period = startOfDay >= startOfMonth && startOfDay <= endOfMonth
            ? 'month'
            : startOfDay >= startOfWeek && startOfDay <= endOfWeek
              ? 'week'
              : 'month';

          return {
            id: item.id,
            category: categoryName,
            categoryId: item.category?.id ?? item.category_id,
            subtitle: item.description || item.descripcion || 'Movimiento',
            amount: isExpense ? -absAmount : absAmount,
            isExpense: isExpense,
            icon: isExpense ? 'cash-outline' : 'cash-outline',
            iconBg: isExpense ? '#2a2216' : '#133023',
            period
          };
        });

        this.movementsSubject.next(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('Error al obtener movimientos:', err);
    }
    return [];
  }

  async getCategories(): Promise<any[]> {
    try {
      const res = await fetch(`${environment.apiUrl}/categories`, {
        headers: this.getHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }

      const errorBody = await res.text();
      console.error('Error al obtener categorías:', res.status, errorBody);
    } catch (err) {
      console.error('Error al obtener categorías:', err);
    }
    return [];
  }

  async addMovement(item: Movement): Promise<boolean> {
    try {
      const categoryId = Number(item.categoryId);

      if (!categoryId || categoryId <= 0) {
        throw new Error('Debes seleccionar una categoría válida');
      }

      const body = {
        amount: Math.abs(Number(item.amount)),
        type: item.isExpense ? 'gasto' : 'ingreso',
        category_id: categoryId,
        description: item.subtitle || item.category,
        concepto: item.concepto || null,
        date: item.date || new Date().toISOString().split('T')[0]
      };

      const res = await fetch(`${environment.apiUrl}/transactions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await this.refreshData();
        return true;
      }

      const errorBody = await res.text();
      console.error('RESPUESTA DEL BACKEND:', res.status, errorBody);
    } catch (err) {
      console.error('Error al guardar movimiento en Laravel:', err);
    }
    return false;
  }

  async loadGoalsFromApi(): Promise<Goal[]> {
    try {
      const res = await fetch(`${environment.apiUrl}/goals`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || [];
        
        const mapped: Goal[] = rawList.map((item: any) => ({
          id: item.id,
          title: item.name,
          targetAmount: Number(item.target_amount),
          currentAmount: Number(item.current_amount),
          icon: '🎯',
          deadline: item.deadline
        }));

        this.goalsSubject.next(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('Error al cargar metas:', err);
    }
    return [];
  }

  async addGoal(goal: Goal): Promise<boolean> {
    try {
      const body = {
        name: goal.title,
        target_amount: goal.targetAmount,
        deadline: goal.deadline ?? null
      };

      const res = await fetch(`${environment.apiUrl}/goals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await this.loadGoalsFromApi();
        return true;
      }
      const errorBody = await res.text();
      console.error('Error al crear meta:', res.status, errorBody);
    } catch (err) {
      console.error('Error al crear meta:', err);
    }
    return false;
  }

  async addContribution(goalId: number | string, amount: number): Promise<boolean> {
    try {
      const body = {
        amount: amount,
        note: 'Aporte desde app móvil'
      };

      const res = await fetch(`${environment.apiUrl}/goals/${goalId}/contributions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await this.loadGoalsFromApi();
        return true;
      }
      const errorBody = await res.text();
      console.error('Error al aportar:', res.status, errorBody);
    } catch (err) {
      console.error('Error al aportar:', err);
    }
    return false;
  }
}
