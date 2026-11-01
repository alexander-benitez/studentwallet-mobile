import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonProgressBar, IonFab, IonFabButton, IonIcon } from '@ionic/angular';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { TransactionService, Goal } from '../services/transaction';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonProgressBar, 
    IonFab, 
    IonFabButton, 
    IonIcon
  ]
})
export class Tab3Page implements OnInit, OnDestroy {
  goals: Goal[] = [];
  private sub!: Subscription;

  showNewGoalForm = false;
  newGoalTitle: string = '';
  newGoalTarget: number | null = null;

  constructor(private transactionService: TransactionService) {
    // Registramos el icono explícitamente para Ionic Standalone
    addIcons({ addOutline: add });
  }

  ngOnInit() {
    this.sub = this.transactionService.goals$.subscribe(data => {
      this.goals = data;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  getPercent(goal: Goal): number {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min(goal.currentAmount / goal.targetAmount, 1);
  }

  getPercentLabel(goal: Goal): number {
    return Math.round(this.getPercent(goal) * 100);
  }

  toggleNewGoalForm() {
    this.showNewGoalForm = !this.showNewGoalForm;
  }

  cancelNewGoal() {
    this.showNewGoalForm = false;
    this.newGoalTitle = '';
    this.newGoalTarget = null;
  }

  createGoal() {
    if (!this.newGoalTitle.trim() || !this.newGoalTarget || this.newGoalTarget <= 0) {
      return;
    }

    const newGoal: Goal = {
      id: Date.now(),
      title: this.newGoalTitle.trim(),
      targetAmount: this.newGoalTarget,
      currentAmount: 0,
      icon: '🎯'
    };

    this.transactionService.addGoal(newGoal);
    this.cancelNewGoal();
  }

  openContributionModal(goal: Goal) {
    const input = prompt(`Abonar a "${goal.title}"\nIngresa el monto a abonar ($):`, '10');
    if (input !== null) {
      const amount = parseFloat(input);
      if (!isNaN(amount) && amount > 0) {
        this.transactionService.addContribution(goal.id, amount);
      }
    }
  }
}