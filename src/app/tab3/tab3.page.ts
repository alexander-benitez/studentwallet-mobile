import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar, IonFab, IonFabButton, IonIcon, ViewWillEnter } from '@ionic/angular';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { TransactionService, Goal } from '../services/transaction';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonProgressBar, IonFab, IonFabButton, IonIcon]
})
export class Tab3Page implements OnInit, OnDestroy, ViewWillEnter {
  goals: Goal[] = [];
  private sub!: Subscription;
  showNewGoalForm = false;
  newGoalTitle: string = '';
  newGoalTarget: number | null = null;
  creatingGoal = false;

  private transactionService = inject(TransactionService);
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ addOutline: add });
  }

  ngOnInit() {
    this.sub = this.transactionService.goals$.subscribe(data => {
      this.goals = data;
      this.cdr.detectChanges(); // Forzamos la actualización de la vista
    });
  }

  async ionViewWillEnter() {
    await this.transactionService.loadGoalsFromApi();
    this.cdr.detectChanges(); // Forzamos actualización al entrar
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  getPercent(goal: Goal): number {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min(goal.currentAmount / goal.targetAmount, 1);
  }

  getPercentLabel(goal: Goal): number {
    return Math.round(this.getPercent(goal) * 100);
  }

  toggleNewGoalForm() { this.showNewGoalForm = !this.showNewGoalForm; }

  cancelNewGoal() {
    this.showNewGoalForm = false;
    this.newGoalTitle = '';
    this.newGoalTarget = null;
    this.cdr.detectChanges();
  }

  async createGoal() {
    if (this.creatingGoal) return;
    if (!this.newGoalTitle.trim() || !this.newGoalTarget || this.newGoalTarget <= 0) return;

    this.creatingGoal = true;
    this.cdr.detectChanges();
    try {
      const newGoal: Goal = {
        id: 0,
        title: this.newGoalTitle.trim(),
        targetAmount: Number(this.newGoalTarget),
        currentAmount: 0,
        icon: '🎯',
      };
      const success = await this.transactionService.addGoal(newGoal);
      if (success) {
        this.cancelNewGoal();
      }
    } finally {
      this.creatingGoal = false;
      this.cdr.detectChanges();
    }
  }

  async openContributionModal(goal: Goal) {
    const alert = await this.alertController.create({
      header: `Abonar a "${goal.title}"`,
      message: 'Ingresa el monto que deseas abonar a esta meta ($):',
      cssClass: ['sw-alert'],
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Ej. 10',
          value: '10',
          min: 1,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Abonar', role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role === 'cancel' || result.role === 'backdrop') return;

    const raw = result.data?.values?.amount ?? result.data?.amount;
    const amount = parseFloat(raw);
    if (!isNaN(amount) && amount > 0) {
      await this.transactionService.addContribution(goal.id, amount);
      this.cdr.detectChanges();
    }
  }
}
