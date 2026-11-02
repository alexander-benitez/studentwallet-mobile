import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Movement {
  id: number;
  category: string;
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
  private readonly API_BASE = 'http://127.0.0.1:8000/api';

  private movementsSubject = new BehaviorSubject<Movement[]>([]);
  movements$ = this.movementsSubject.asObservable();

  private balanceSubject = new BehaviorSubject<number>(0);
  balance$ = this.balanceSubject.asObservable();

  // Estados reactivos para Metas
  private goalsSubject = new BehaviorSubject<Goal[]>([
    { id: 1, title: 'Comprar una laptop', targetAmount: 700, currentAmount: 420, icon: '💻' },
    { id: 2, title: 'Fondo de emergencia', targetAmount: 300, currentAmount: 150, icon: '🛡️' }
  ]);
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
      const res = await fetch(`${this.API_BASE}/balance`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        const saldo = Number(json.data?.saldo_total ?? json.saldo_total ?? 0);
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
      const res = await fetch(`${this.API_BASE}/transactions`, {
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
            subtitle: item.description || item.descripcion || 'Movimiento',
            amount: isExpense ? -absAmount : absAmount,
            isExpense: isExpense,
            icon: isExpense ? 'cart-outline' : 'cash-outline',
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

  async addMovement(item: Movement): Promise<boolean> {
    try {
      const body = {
        amount: Math.abs(item.amount),
        type: item.isExpense ? 'gasto' : 'ingreso',
        description: item.subtitle || item.category,
        category: item.category
      };

      const res = await fetch(`${this.API_BASE}/transactions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await this.refreshData();
        return true;
      }
    } catch (err) {
      console.error('Error al guardar movimiento en Laravel:', err);
    }
    return false;
  }

  // Métodos para la gestión de Metas
  addGoal(goal: Goal) {
    const current = this.goalsSubject.getValue();
    const updated = [ { ...goal, id: Date.now() }, ...current ];
    this.goalsSubject.next(updated);
  }

  addContribution(goalId: number | string, amount: number) {
    const current = this.goalsSubject.getValue();
    const updated = current.map(g => {
      if (g.id === goalId) {
        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        return { ...g, currentAmount: newAmount };
      }
      return g;
    });
    this.goalsSubject.next(updated);

    // Registramos automáticamente el aporte como movimiento
    this.addMovement({
      id: Date.now(),
      category: 'Ahorro',
      subtitle: `Aporte a meta`,
      amount: -Math.abs(amount),
      isExpense: true,
      icon: 'disc-outline',
      iconBg: '#2a2216',
      period: 'week'
    });
  }
}