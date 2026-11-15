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
  ],
})
export class LoginPage {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(private router: Router) {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToWelcome() {
    this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }

  goToRegister() {
    this.router.navigateByUrl('/register', { replaceUrl: true });
  }

  async onLogin() {
    if (!this.email || !this.password) {
      alert('Por favor ingresa tu correo y contraseña');
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

      const data = await response.json();

      if (response.ok) {
        const token = data.data?.token || data.token;
        const user = data.data?.user || data.user;

        if (user?.rol === 'administrador') {
          alert('Acceso restringido: solo estudiantes pueden usar la app móvil.');
          return;
        }

        localStorage.setItem('auth_token', token);
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
        }

        this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      } else {
        alert(data.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      alert('No se pudo conectar con el servidor backend en el puerto 8000');
    } finally {
      this.isLoading = false;
    }
  }
}