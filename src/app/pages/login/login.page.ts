import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  constructor(private router: Router) {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

    async onLogin() {
    if (!this.email || !this.password) {
      alert('Por favor ingresa tu correo y contraseña');
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: this.email.trim(),
          password: this.password.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.data?.token || data.token;
        const user = data.data?.user || data.user;

        localStorage.setItem('auth_token', token);
        if (user) {
          localStorage.setItem('user_info', JSON.stringify(user));
        }

        this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
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