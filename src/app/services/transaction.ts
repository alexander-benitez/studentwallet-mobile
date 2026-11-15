import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movement {
  id: number;
  category: string;
  categoryId?: number;
  subtitle: string;
  amount: number;
  isExpense: boolean;
  icon: string;
  iconBg: string;
  period: 'week' | 'month';
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
      this.loadMovementsFromApi()
    ]);
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

          return {
            id: item.id,
            category: categoryName,
            categoryId: item.category?.id ?? item.category_id,
            subtitle: item.description || item.descripcion || 'Movimiento',
            amount: isExpense ? -absAmount : absAmount,
            isExpense: isExpense,
            icon: isExpense ? 'cash-outline' : 'cash-outline',
            iconBg: isExpense ? '#2a2216' : '#133023',
            period: 'week'
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
        amount: Number(item.amount),
        type: item.isExpense ? 'gasto' : 'ingreso',
        category_id: categoryId,
        description: item.subtitle || item.category,
        date: new Date().toISOString().split('T')[0]
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
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
