import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-goal-modal',
  templateUrl: './add-goal-modal.component.html',
  styleUrls: ['./add-goal-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AddGoalModalComponent {
  goalName: string = '';
  targetAmount: number | null = null;

  constructor(private modalCtrl: ModalController) {}

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  createGoal() {
    if (!this.goalName.trim()) {
      alert('Por favor ingresa un nombre para la meta');
      return;
    }
    if (!this.targetAmount || this.targetAmount <= 0) {
      alert('Por favor ingresa un monto a ahorrar válido');
      return;
    }

    this.modalCtrl.dismiss(
      {
        name: this.goalName,
        target: this.targetAmount,
        saved: 0
      },
      'created'
    );
  }
}
