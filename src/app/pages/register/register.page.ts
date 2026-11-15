import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  eyeOffOutline,
  eyeOutline,
} from 'ionicons/icons';

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
    FormsModule,
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

  constructor(private router: Router) {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToWelcome() {
    this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }

  async onRegister() {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      alert('Por favor completa todos los campos.');
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

      const res = await response.json();

      if (response.ok) {
        const token = res.data?.token || res.data?.access_token;
        const user = res.data?.user;

        if (token) {
          localStorage.setItem('auth_token', token);
        }
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
        }

        this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      } else {
        alert(res.message || 'Error al registrarse');
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      alert('No se pudo conectar con el servidor backend.');
    } finally {
      this.isLoading = false;
    }
  }
}