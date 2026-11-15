import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonProgressBar, 
  IonIcon, 
  IonFab, 
  IonFabButton, 
  ModalController,
  ViewWillEnter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowUpOutline, 
  arrowDownOutline, 
  addOutline, 
  removeOutline, 
  discOutline, 
  fastFoodOutline, 
  schoolOutline,
  cashOutline,
  busOutline,
  walletOutline,
  bookOutline,
  gameControllerOutline,
  homeOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AddMovementModalComponent } from '../components/add-movement-modal/add-movement-modal.component';
import { AddGoalModalComponent } from '../components/add-goal-modal/add-goal-modal.component';
import { TransactionService, Movement, Goal } from '../services/transaction';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonProgressBar, 
    IonIcon, 
    IonFab, 
    IonFabButton, 
    CommonModule, 
    DecimalPipe,
    RouterLink
  ],
  providers: [ModalController],
})
export class Tab1Page implements OnInit, OnDestroy, ViewWillEnter {
  usuario: string = 'Estudiante';
  availableBalance: number = 0;
  monthlyIncome: number = 0;
  monthlyExpense: number = 0;
  savings: number = 0;
  goals: Goal[] = [];
  recommendation: string = '';

  budgetUsed: number = 0;
  budgetTotal: number = 0;
  budgetPercent: number = 0;

  recentMovements: Movement[] = [];
  private sub: Subscription = new Subscription();
  private goalsSub: Subscription = new Subscription();
  private recommendationsSub: Subscription = new Subscription();
  private modalCtrl = inject(ModalController);
  private transactionService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      arrowUpOutline,
      arrowDownOutline,
      addOutline,
      removeOutline,
      discOutline,
      fastFoodOutline,
      schoolOutline,
      cashOutline,
      busOutline,
      walletOutline,
      bookOutline,
      gameControllerOutline,
      homeOutline
    });
  }

  ngOnInit() {
    try {
      const user = JSON.parse(localStorage.getItem('user_info') || '{}');
      this.usuario = user.name || 'Estudiante';
    } catch {
      this.usuario = 'Estudiante';
    }

    this.sub.add(
      this.transactionService.balance$.subscribe(bal => {
        this.availableBalance = bal;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.transactionService.movements$.subscribe(movs => {
        this.recentMovements = movs.slice(0, 3);
        this.recalculateTotals(movs);
        this.cdr.detectChanges();
      })
    );

    this.goalsSub = this.transactionService.goals$.subscribe(goals => {
      this.goals = goals;
      this.cdr.detectChanges();
    });

    this.recommendationsSub = this.transactionService.recommendations$.subscribe(recommendations => {
      this.recommendation = recommendations?.[0]?.message ?? '';
      this.cdr.detectChanges();
    });
  }

  ionViewWillEnter(): void {
    void this.transactionService.refreshData().then(() => this.updateBudget());
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.goalsSub.unsubscribe();
    this.recommendationsSub.unsubscribe();
  }

  private recalculateTotals(movs: Movement[]) {
    let inc = 0;
    let exp = 0;

    for (const m of movs) {
      if (m.isExpense) {
        exp += Math.abs(m.amount);
      } else {
        inc += m.amount;
      }
    }

    this.monthlyIncome = inc;
    this.monthlyExpense = exp;
    this.savings = inc - exp;
  }

  private updateBudget(): void {
    const now = new Date();
    const budgets = (this.transactionService.budgetsValue as any[]).filter(
      budget => budget.year === now.getFullYear() && budget.month === now.getMonth() + 1
    );

    const limit = budgets.reduce((sum: number, budget: any) => sum + Number(budget.amount || 0), 0);
    const spent = budgets.reduce((sum: number, budget: any) => sum + Number(budget.spent || 0), 0);

    this.budgetTotal = limit;
    this.budgetUsed = spent;
    this.budgetPercent = limit > 0 ? Math.min(spent / limit, 1) : 0;
  }

  async openMovementModal(type: 'ingreso' | 'gasto' = 'gasto') {
    const modal = await this.modalCtrl.create({
      component: AddMovementModalComponent,
      componentProps: { initialType: type },
      breakpoints: [0, 0.85, 1],
      initialBreakpoint: 0.85,
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'created' && data) {
      this.transactionService.addMovement({
        id: Date.now(),
        ...data
      });
    }
  }

  async openGoalModal() {
    const modal = await this.modalCtrl.create({
      component: AddGoalModalComponent,
      breakpoints: [0, 0.55, 0.8],
      initialBreakpoint: 0.55,
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'created' && data) {
      await this.transactionService.addGoal({
        id: Number(data.id ?? 0),
        title: data.title,
        targetAmount: Number(data.target),
        currentAmount: Number(data.saved ?? 0),
        deadline: data.deadline,
      });
    }
  }
}
