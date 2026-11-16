import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';

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
  deadline: string = '';

  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private async showValidationAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Dato requerido',
      message,
      cssClass: ['sw-alert', 'sw-alert-danger'],
      buttons: [{ text: 'OK', role: 'confirm' }],
    });
    await alert.present();
  }

  async createGoal() {
    if (!this.goalName.trim()) {
      await this.showValidationAlert('Por favor ingresa un nombre para la meta.');
      return;
    }
    if (!this.targetAmount || this.targetAmount <= 0) {
      await this.showValidationAlert('Por favor ingresa un monto a ahorrar válido.');
      return;
    }

    this.modalCtrl.dismiss(
      {
        title: this.goalName,
        target: this.targetAmount,
        saved: 0,
        deadline: this.deadline || undefined
      },
      'created'
    );
  }
}
