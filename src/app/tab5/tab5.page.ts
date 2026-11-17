import { Preferences } from '@capacitor/preferences';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonInput,
  IonIcon,
  IonButton,
  ViewWillEnter
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
export class Tab5Page implements OnInit, ViewWillEnter {
  profile: Profile = {
    name: '',
    apellido: '',
    universidad: '',
    carrera: ''
  };

  email: string = '';
  rol: string = 'Estudiante';
  saving: boolean = false;

  private router = inject(Router);
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ logOutOutline, saveOutline });
  }

  ngOnInit() {
    this.hydrateFromLocal();
    void this.loadUser();
  }

  ionViewWillEnter() {
    this.hydrateFromLocal();
    void this.loadUser();
  }

  private hydrateFromLocal(): void {
    try {
      const raw = localStorage.getItem('user_info') || localStorage.getItem('user_data');
      if (!raw) return;
      const u = JSON.parse(raw);
      if (u && typeof u === 'object') {
        this.profile = {
          name: u.name || this.profile.name || '',
          apellido: u.apellido || this.profile.apellido || '',
          universidad: u.universidad || this.profile.universidad || '',
          carrera: u.carrera || this.profile.carrera || ''
        };
        if (u.email) this.email = u.email;
        if (u.rol) this.rol = u.rol;
        this.cdr.detectChanges();
      }
    } catch {
      // ignorar JSON inválido
    }
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

      if (res.status === 401) {
        try { localStorage.removeItem('auth_token'); localStorage.removeItem('user_data'); localStorage.removeItem('user_info'); await Preferences.remove({ key: 'auth_token' }); await Preferences.remove({ key: 'user_info' }); } catch { /* */ }
        this.router.navigate(['/login']);
        return;
      }

      if (res.ok) {
        const json = await res.json();
        const user = json.data ?? json;
        this.profile = {
          name: user?.name || '',
          apellido: user?.apellido || '',
          universidad: user?.universidad || '',
          carrera: user?.carrera || ''
        };
        this.email = user?.email || this.email || '';
        this.rol = user?.rol || 'Estudiante';
        try {
          localStorage.setItem('user_info', JSON.stringify(user));
          await Preferences.set({ key: 'user_info', value: JSON.stringify(user) });
        } catch { /* */ }
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Error al cargar el perfil:', err);
    } finally {
      this.cdr.detectChanges();
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

      if (res.status === 401) {
        try { localStorage.removeItem('auth_token'); localStorage.removeItem('user_data'); localStorage.removeItem('user_info'); await Preferences.remove({ key: 'auth_token' }); await Preferences.remove({ key: 'user_info' }); } catch { /* */ }
        this.router.navigate(['/login']);
        return;
      }

      if (res.ok) {
        await this.loadUser();
        await this.showStyledAlert(
          'Perfil actualizado',
          'Tus datos personales se guardaron correctamente.',
          'success'
        );
      } else {
        const errorBody = await res.json().catch(() => null);
        await this.showStyledAlert(
          'No se pudo guardar',
          errorBody?.message || 'No se pudo actualizar el perfil.',
          'danger'
        );
      }
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      await this.showStyledAlert(
        'Error de conexión',
        'No se pudo conectar con el servidor al guardar tu perfil.',
        'danger'
      );
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  private async showStyledAlert(
    header: string,
    message: string,
    variant: 'success' | 'danger' = 'success'
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: ['sw-alert', `sw-alert-${variant}`],
      buttons: [{ text: 'OK', role: 'confirm' }],
    });
    await alert.present();
  }

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'user_info' });
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
