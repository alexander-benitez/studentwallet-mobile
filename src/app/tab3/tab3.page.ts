import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonProgressBar, IonFab, IonFabButton, IonIcon, ViewWillEnter } from '@ionic/angular';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { TransactionService, Goal } from '../services/transaction';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonProgressBar, IonFab, IonFabButton, IonIcon]
})
export class Tab3Page implements OnInit, OnDestroy, ViewWillEnter {
  goals: Goal[] = [];
  private sub!: Subscription;
  showNewGoalForm = false;
  newGoalTitle: string = '';
  newGoalTarget: number | null = null;

  private transactionService = inject(TransactionService);
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
  }

  async createGoal() {
    if (!this.newGoalTitle.trim() || !this.newGoalTarget || this.newGoalTarget <= 0) return;
    const newGoal: Goal = { id: 0, title: this.newGoalTitle.trim(), targetAmount: Number(this.newGoalTarget), currentAmount: 0, icon: '🎯' };
    const success = await this.transactionService.addGoal(newGoal);
    if (success) this.cancelNewGoal();
  }

  async openContributionModal(goal: Goal) {
    const input = prompt(`Abonar a "${goal.title}"\nIngresa el monto a abonar ($):`, '10');
    if (input !== null) {
      const amount = parseFloat(input);
      if (!isNaN(amount) && amount > 0) {
        await this.transactionService.addContribution(goal.id, amount);
        this.cdr.detectChanges(); // Forzamos actualización después del aporte
      }
    }
  }
}
