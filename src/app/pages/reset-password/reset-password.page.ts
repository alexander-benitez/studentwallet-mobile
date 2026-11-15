import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterLink
  ],
})
export class ResetPasswordPage {
  email: string = '';
  code: string = '';
  password: string = '';
  passwordConfirmation: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private ngZone: NgZone
  ) {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.email = emailParam;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    const email = this.email.trim();
    const code = this.code.trim();

    if (!email || !code || !this.password || !this.passwordConfirmation) {
      await this.showToast('Por favor completa todos los campos.', 'danger');
      return;
    }

    if (this.password.length < 6) {
      await this.showToast('La contraseña debe tener al menos 6 caracteres.', 'danger');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      await this.showToast('Las contraseñas no coinciden.', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const response = await fetch(`${environment.apiUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          code,
          password: this.password,
          password_confirmation: this.passwordConfirmation
        })
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        await this.showToast(data.message || 'Contraseña actualizada correctamente.', 'success');
        await this.ngZone.run(() => this.router.navigate(['/login'], { replaceUrl: true }));
      } else {
        await this.showToast(data.message || 'No se pudo restablecer la contraseña.', 'danger');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      await this.showToast('No se pudo conectar con el servidor.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
