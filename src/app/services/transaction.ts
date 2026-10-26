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

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly STORAGE_KEY_MOVEMENTS = 'studentwallet_movements';
  private readonly STORAGE_KEY_BALANCE = 'studentwallet_balance';

  // Datos base que aparecen la primera vez que se abre la app
  private defaultMovements: Movement[] = [
    {
      id: 1,
      category: 'Alimentación',
      subtitle: 'Hoy · Almuerzo',
      amount: -8.50,
      isExpense: true,
      icon: 'fast-food-outline',
      iconBg: '#2a2216',
      period: 'week'
    },
    {
      id: 2,
      category: 'Beca',
      subtitle: 'Ayer · Beca mensual',
      amount: 250.00,
      isExpense: false,
      icon: 'cash-outline',
      iconBg: '#133023',
      period: 'week'
    },
    {
      id: 3,
      category: 'Transporte',
      subtitle: '02 oct · Bus',
      amount: -3.00,
      isExpense: true,
      icon: 'bus-outline',
      iconBg: '#162b3a',
      period: 'week'
    },
    {
      id: 4,
      category: 'Mesada',
      subtitle: '01 oct · Mesada',
      amount: 950.00,
      isExpense: false,
      icon: 'wallet-outline',
      iconBg: '#2d1b22',
      period: 'month'
    },
    {
      id: 5,
      category: 'Alimentación',
      subtitle: '01 oct · Comidas del mes',
      amount: -126.50,
      isExpense: true,
      icon: 'fast-food-outline',
      iconBg: '#2a2216',
      period: 'month'
    },
    {
      id: 6,
      category: 'Transporte',
      subtitle: '01 oct · Pasajes',
      amount: -57.00,
      isExpense: true,
      icon: 'bus-outline',
      iconBg: '#162b3a',
      period: 'month'
    },
    {
      id: 7,
      category: 'Estudios',
      subtitle: '30 sept · Libros y copias',
      amount: -55.00,
      isExpense: true,
      icon: 'book-outline',
      iconBg: '#1b2a24',
      period: 'month'
    },
    {
      id: 8,
      category: 'Entretenimiento',
      subtitle: '29 sept · Cine y salidas',
      amount: -45.00,
      isExpense: true,
      icon: 'game-controller-outline',
      iconBg: '#211d2d',
      period: 'month'
    },
    {
      id: 9,
      category: 'Otros',
      subtitle: '28 sept · Varios',
      amount: -25.00,
      isExpense: true,
      icon: 'home-outline',
      iconBg: '#2b2123',
      period: 'month'
    }
  ];

  private movementsSubject = new BehaviorSubject<Movement[]>(this.loadMovements());
  movements$ = this.movementsSubject.asObservable();

  private balanceSubject = new BehaviorSubject<number>(this.loadBalance());
  balance$ = this.balanceSubject.asObservable();

  constructor() {}

  private loadMovements(): Movement[] {
    const data = localStorage.getItem(this.STORAGE_KEY_MOVEMENTS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error al cargar movimientos:', e);
      }
    }
    this.saveMovements(this.defaultMovements);
    return this.defaultMovements;
  }

  private loadBalance(): number {
    const val = localStorage.getItem(this.STORAGE_KEY_BALANCE);
    if (val !== null) {
      return parseFloat(val);
    }
    const initial = 880.00;
    localStorage.setItem(this.STORAGE_KEY_BALANCE, initial.toString());
    return initial;
  }

  private saveMovements(movements: Movement[]) {
    localStorage.setItem(this.STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  }

  private saveBalance(balance: number) {
    localStorage.setItem(this.STORAGE_KEY_BALANCE, balance.toString());
  }

  // Agrega movimiento, recalcula saldo y notifica a tab1 y tab2
  addMovement(item: Movement) {
    const current = this.movementsSubject.value;
    const updated = [item, ...current];
    this.saveMovements(updated);
    this.movementsSubject.next(updated);

    const newBalance = this.balanceSubject.value + item.amount;
    this.saveBalance(newBalance);
    this.balanceSubject.next(newBalance);
  }
}