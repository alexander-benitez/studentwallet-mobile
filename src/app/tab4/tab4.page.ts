import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonFab, IonFabButton, ModalController } from '@ionic/angular';
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
export class Tab4Page implements OnInit, OnDestroy {
  movements: Movement[] = [];
  totalIncome = 0;
  totalExpense = 0;
  totalSavings = 0;
  
  categoryStats: CategoryStat[] = [];
  monthlyStats: MonthlyStat[] = [];
  savingsPoints: string = '';
  Math = Math;

  private sub!: Subscription;

  constructor(
    private transactionService: TransactionService,
    private modalController: ModalController
  ) {
    // Añadimos addOutline para que coincida con el icono
    addIcons({ barChartOutline, add, addOutline, fastFoodOutline, busOutline, bookOutline, gameControllerOutline, homeOutline });
  }

  ngOnInit() {
    this.sub = this.transactionService.movements$.subscribe(data => {
      this.movements = data;
      this.calculateDynamicStats();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  calculateDynamicStats() {
    this.totalIncome = this.movements
      .filter(m => !m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    this.totalExpense = this.movements
      .filter(m => m.isExpense)
      .reduce((sum, m) => sum + Math.abs(m.amount), 0);

    this.totalSavings = this.totalIncome - this.totalExpense;

    const expenses = this.movements.filter(m => m.isExpense);
    const map = new Map<string, number>();
    
    expenses.forEach(m => {
      const cat = m.category || 'Otros';
      const current = map.get(cat) || 0;
      map.set(cat, current + Math.abs(m.amount));
    });

    const categoryIcons: { [key: string]: { color: string, icon: string } } = {
      'Alimentación': { color: '#3b82f6', icon: 'fast-food-outline' },
      'Transporte': { color: '#8b5cf6', icon: 'bus-outline' },
      'Estudios': { color: '#10b981', icon: 'book-outline' },
      'Entretenimiento': { color: '#f59e0b', icon: 'game-controller-outline' },
      'Otros': { color: '#64748b', icon: 'home-outline' }
    };

    this.categoryStats = [];
    map.forEach((amount, name) => {
      const percentage = this.totalExpense > 0 ? (amount / this.totalExpense) : 0;
      const meta = categoryIcons[name] || { color: '#64748b', icon: 'home-outline' };
      this.categoryStats.push({
        name,
        amount,
        percentage,
        color: meta.color,
        icon: meta.icon
      });
    });

    const months = ['Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
    let runningSavings = 100;
    const points: { x: number, y: number }[] = [];

    this.monthlyStats = months.map((m, index) => {
      const factor = 1 + (index * 0.15);
      const inc = Math.round((this.totalIncome / 5) * factor);
      const exp = Math.round((this.totalExpense / 5) * (1.2 - (index * 0.05)));
      const net = inc - exp;
      runningSavings += net;

      const x = 15 + (index * 68);
      const y = Math.max(15, Math.min(85, 80 - (runningSavings / 50)));
      points.push({ x, y });

      const maxVal = Math.max(this.totalIncome, this.totalExpense, 1);
      const hInc = Math.min(90, Math.round((inc / maxVal) * 90));
      const hExp = Math.min(90, Math.round((exp / maxVal) * 90));

      return {
        monthName: m,
        income: inc,
        expense: exp,
        maxHeightIncome: Math.max(15, hInc),
        maxHeightExpense: Math.max(15, hExp)
      };
    });

    this.savingsPoints = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }

  // Método idéntico al de Tab1 para abrir el modal estilizado con el selector Ingreso/Gasto
  async openAddMovement() {
    const modal = await this.modalController.create({
      component: AddMovementModalComponent,
      componentProps: { type: 'gasto' }
    });
    
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.transactionService.addMovement(data);
      await this.transactionService.refreshData();
    }
  }
}