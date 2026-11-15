import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  shieldCheckmarkOutline,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
  ]
})
export class Tab5Page implements OnInit {
  nombre: string = 'Estudiante';
  email: string = '';
  rol: string = 'Estudiante';
  iniciales: string = 'E';

  private router = inject(Router);

  constructor() {
    addIcons({ personOutline, mailOutline, shieldCheckmarkOutline, logOutOutline });
  }

  ngOnInit() {
    try {
      const user = JSON.parse(localStorage.getItem('user_info') || '{}');
      this.nombre = user.name || 'Estudiante';
      this.email = user.email || 'Sin correo';
      this.rol = user.rol || user.role || 'Estudiante';
      this.iniciales = this.getInitials(this.nombre);
    } catch {
      this.nombre = 'Estudiante';
      this.email = 'Sin correo';
      this.rol = 'Estudiante';
      this.iniciales = 'E';
    }
  }

  private getInitials(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'E';
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
