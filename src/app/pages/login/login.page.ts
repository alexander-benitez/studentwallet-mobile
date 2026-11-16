import { Component, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  AlertController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private ngZone = inject(NgZone);

  constructor() {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (!this.email || !this.password) {
      await this.showToast('Por favor ingresa tu correo y contraseña', 'danger');
      return;
    }

    this.isLoading = true;
    try {
      const response = await fetch(`${environment.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: this.email.trim(),
          password: this.password.trim(),
          plataforma: 'movil'
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const token = data.data?.token || data.token;
        const user = data.data?.user || data.user;

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
        }

        await this.ngZone.run(() => this.router.navigate(['/tabs/tab1'], { replaceUrl: true }));
      } else {
        await this.showToast(data.message || 'Credenciales incorrectas', 'danger');
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      await this.showToast('No se pudo conectar con el servidor', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async openForgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar contraseña',
      message: 'Ingresa tu correo para recibir un código de recuperación.',
      cssClass: 'forgot-password-alert',
      backdropDismiss: true,
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tu@correo.com',
          value: this.email?.trim() || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Enviar', role: 'confirm' }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role === 'cancel' || result.role === 'backdrop') {
      return;
    }

    const values = (result.data && (result.data.values ?? result.data)) || {};
    const email = (values.email || '').toString().trim();
    if (!email) {
      await this.showToast('Debes ingresar un correo.', 'danger');
      return;
    }

    await this.submitForgotPassword(email);
  }

  async submitForgotPassword(email: string) {
    this.isLoading = true;
    try {
      const response = await fetch(`${environment.apiUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => ({}));
      const message =
        data.message || 'Código de recuperación enviado. Revisa tu correo.';

      if (response.ok) {
        await this.ngZone.run(() =>
          this.router.navigate(['/reset-password'], { queryParams: { email } })
        );
        void this.showToast(message, 'success');
      } else {
        await this.showToast(data.message || 'No se pudo procesar la solicitud.', 'danger');
      }
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      await this.showToast('No se pudo conectar con el servidor.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      color,
      position: 'top',
      cssClass: 'toast-notice'
    });
    await toast.present();
  }
}