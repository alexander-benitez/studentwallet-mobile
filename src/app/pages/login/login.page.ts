import { Component, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { alertCircleOutline, chevronBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
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
    FormsModule
  ],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ alertCircleOutline, chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  goBack() {
    this.ngZone.run(() => {
      this.router.navigateByUrl('/welcome').then(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      });
    });
  }

  goToRegister() {
    this.ngZone.run(() => {
      this.router.navigateByUrl('/register').then(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      });
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    this.errorMessage = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.email.trim().toLowerCase().endsWith('@gmail.com')) {
      this.errorMessage = 'El correo debe terminar en @gmail.com (no se admiten otros dominios).';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
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
          await Preferences.set({ key: 'auth_token', value: token });
        }
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
          await Preferences.set({ key: 'user_info', value: JSON.stringify(user) });
        }

        await this.ngZone.run(() =>
          this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true }).then(() => {
            setTimeout(() => this.cdr.detectChanges(), 50);
          })
        );
      } else {
        const rawMsg = String(data?.message || '').toLowerCase();
        if (response.status === 429 || rawMsg.includes('too many') || rawMsg.includes('many attempts')) {
          this.errorMessage = 'Demasiados intentos fallidos. Por seguridad, espera un momento antes de volver a intentarlo.';
        } else if (response.status === 401) {
          this.errorMessage = 'Correo o contraseña incorrectos.';
        } else {
          this.errorMessage = data.message || 'Correo o contraseña incorrectos.';
        }
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      this.errorMessage = 'No se pudo conectar con el servidor. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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
          placeholder: 'usuario@gmail.com',
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
    this.errorMessage = '';

    if (!email) {
      this.errorMessage = 'Debes ingresar tu correo electrónico para recuperar tu contraseña.';
      this.cdr.detectChanges();
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      this.errorMessage = 'El correo de recuperación debe terminar en @gmail.com.';
      this.cdr.detectChanges();
      return;
    }

    await this.submitForgotPassword(email);
  }

  async submitForgotPassword(email: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
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

      if (response.ok) {
        await this.ngZone.run(() =>
          this.router.navigate(['/reset-password'], { queryParams: { email } })
        );
      } else {
        this.errorMessage = data.message || 'No se pudo procesar la solicitud de recuperación.';
      }
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      this.errorMessage = 'No se pudo conectar con el servidor. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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