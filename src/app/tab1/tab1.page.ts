import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonProgressBar, 
  IonIcon, 
  IonFab, 
  IonFabButton, 
  ModalController 
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
import { TransactionService, Movement } from '../services/transaction';

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
export class Tab1Page implements OnInit, OnDestroy {
  userName: string = 'Karla';
  availableBalance: number = 880.00;
  monthlyIncome: number = 1200;
  monthlyExpense: number = 320;
  savings: number = 880;

  budgetUsed: number = 320;
  budgetTotal: number = 500;
  budgetPercent: number = 0.64;

  recentMovements: Movement[] = [];
  private sub: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private transactionService: TransactionService
  ) {
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
    this.sub.add(
      this.transactionService.balance$.subscribe(bal => {
        this.availableBalance = bal;
        this.savings = bal;
      })
    );

    this.sub.add(
      this.transactionService.movements$.subscribe(movs => {
        this.recentMovements = movs.slice(0, 3);
        this.recalculateTotals(movs);
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
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
    this.budgetUsed = exp;
    this.budgetPercent = Math.min(this.budgetUsed / this.budgetTotal, 1);
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
      alert(`¡Meta "${data.name}" creada con éxito!`);
    }
  }
}