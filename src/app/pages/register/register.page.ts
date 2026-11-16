import { Preferences } from '@capacitor/preferences';
import { Component, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonSpinner 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  alertCircleOutline,
  chevronBackOutline, 
  eyeOutline, 
  eyeOffOutline 
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  emailAlreadyInUse: boolean = false;

  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ alertCircleOutline, chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
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

  goToLogin() {
    this.ngZone.run(() => {
      this.router.navigateByUrl('/login').then(() => {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      });
    });
  }

  async onRegister() {
    this.errorMessage = '';
    this.emailAlreadyInUse = false;

    if (!this.name.trim() || !this.email.trim() || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.email.trim().toLowerCase().endsWith('@gmail.com')) {
      this.errorMessage = 'El correo debe terminar en @gmail.com.';
      this.cdr.detectChanges();
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const response = await fetch(`${environment.apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password
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
        }
        await this.ngZone.run(() => this.router.navigate(['/tabs/tab1'], { replaceUrl: true }));
      } else {
        const emailErrors = Array.isArray(data?.errors?.email) ? data.errors.email.join(' ') : '';
        const rawMsg = `${data?.message || ''} ${emailErrors}`.toLowerCase();
        if (
          rawMsg.includes('ya está en uso') ||
          rawMsg.includes('ya existe') ||
          rawMsg.includes('already been taken') ||
          rawMsg.includes('duplicate')
        ) {
          this.emailAlreadyInUse = true;
          this.errorMessage = 'Este correo ya está en uso. Inicia sesión con tu cuenta.';
        } else {
          this.errorMessage = data.message || 'No se pudo completar el registro.';
        }
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      this.errorMessage = 'No se pudo conectar con el servidor. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}