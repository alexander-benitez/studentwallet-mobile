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

  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
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
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (!this.email.trim().toLowerCase().endsWith('@gmail.com')) {
      alert('El correo debe terminar en @gmail.com.');
      return;
    }

    if (this.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading = true;
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
        alert(data.message || 'No se pudo completar el registro.');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('No se pudo conectar con el servidor.');
    } finally {
      this.isLoading = false;
    }
  }
}