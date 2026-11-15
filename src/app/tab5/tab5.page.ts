import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonInput,
  IonIcon,
  IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  saveOutline
} from 'ionicons/icons';
import { environment } from '../../environments/environment';

interface Profile {
  name: string;
  apellido: string;
  universidad: string;
  carrera: string;
}

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonInput,
    IonIcon,
    IonButton
  ]
})
export class Tab5Page implements OnInit {
  profile: Profile = {
    name: '',
    apellido: '',
    universidad: '',
    carrera: ''
  };

  rol: string = 'Estudiante';
  saving: boolean = false;
  newPassword: string = '';
  confirmPassword: string = '';
  changingPassword: boolean = false;

  private router = inject(Router);

  constructor() {
    addIcons({ logOutOutline, saveOutline });
  }

  ngOnInit() {
    void this.loadUser();
  }

  get nombreCompleto(): string {
    return `${this.profile.name} ${this.profile.apellido}`.trim() || 'Estudiante';
  }

  get iniciales(): string {
    const nombre = this.profile.name.trim().charAt(0);
    const apellido = this.profile.apellido.trim().charAt(0);
    return `${nombre}${apellido}`.toUpperCase() || 'E';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    };
  }

  private async loadUser(): Promise<void> {
    try {
      const res = await fetch(`${environment.apiUrl}/user`, {
        headers: this.getHeaders()
      });

      if (res.ok) {
        const json = await res.json();
        const user = json.data;
        this.profile = {
          name: user?.name || '',
          apellido: user?.apellido || '',
          universidad: user?.universidad || '',
          carrera: user?.carrera || ''
        };
        this.rol = user?.rol || 'Estudiante';
      }
    } catch (err) {
      console.error('Error al cargar el perfil:', err);
    }
  }

  async saveProfile(): Promise<void> {
    this.saving = true;

    try {
      const res = await fetch(`${environment.apiUrl}/user`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(this.profile)
      });

      if (res.ok) {
        alert('Perfil actualizado correctamente');
        await this.loadUser();
      } else {
        const errorBody = await res.json().catch(() => null);
        alert(errorBody?.message || 'No se pudo actualizar el perfil');
      }
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      alert('Error de conexión al guardar el perfil');
    } finally {
      this.saving = false;
    }
  }

  async changePassword(): Promise<void> {
    const password = this.newPassword.trim();
    const confirm = this.confirmPassword.trim();

    if (!password || !confirm) {
      alert('Completa los campos de contraseña');
      return;
    }
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.changingPassword = true;
    try {
      const res = await fetch(`${environment.apiUrl}/user`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        this.newPassword = '';
        this.confirmPassword = '';
        alert('Contraseña actualizada correctamente');
      } else {
        const errorBody = await res.json().catch(() => null);
        alert(errorBody?.message || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      console.error('Error al cambiar la contraseña:', err);
      alert('Error de conexión al cambiar la contraseña');
    } finally {
      this.changingPassword = false;
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
