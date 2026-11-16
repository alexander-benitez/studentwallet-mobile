import { Component, NgZone, inject } from '@angular/core';
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

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private ngZone = inject(NgZone);

  constructor() {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
    this.route.queryParamMap.subscribe((params) => {
      const emailParam = params.get('email');
      if (emailParam) {
        this.email = emailParam;
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    if (this.isLoading) return;

    const email = this.email.trim();
    const code = this.code.trim();
    const password = this.password.trim();
    const passwordConfirmation = this.passwordConfirmation.trim();

    if (!email || !code || !password || !passwordConfirmation) {
      await this.showToast('Por favor completa todos los campos.', 'danger');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await this.showToast('Ingresa un correo electrónico válido.', 'danger');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      await this.showToast('Ingresa el código de 6 dígitos.', 'danger');
      return;
    }

    if (password.length < 8) {
      await this.showToast('La contraseña debe tener al menos 8 caracteres.', 'danger');
      return;
    }

    if (password !== passwordConfirmation) {
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
          password,
          password_confirmation: passwordConfirmation
        })
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        await this.showToast(
          data.message || 'Contraseña actualizada. Redirigiendo al inicio de sesión...',
          'success'
        );
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
