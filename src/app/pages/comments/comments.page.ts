import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonIcon,
  IonList,
  IonSpinner,
  IonToast,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  sendOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  star,
  starOutline
} from 'ionicons/icons';
import { ApiService, Suggestion } from '../../services/api.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.page.html',
  styleUrls: ['./comments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonIcon,
    IonList,
    IonSpinner,
    IonToast,
    IonBadge
  ]
})
export class CommentsPage implements OnInit {
  readonly categories = ['Mejora', 'Error', 'Nueva función', 'Opinión'];

  category = '';
  message = '';
  rating: number = 0;

  suggestions: Suggestion[] = [];
  loading = false;
  sending = false;

  toastOpen = false;
  toastMessage = '';
  toastColor = 'success';

  private api = inject(ApiService);

  constructor() {
    addIcons({
      chatbubbleEllipsesOutline,
      sendOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      star,
      starOutline
    });
  }

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.loading = true;
    this.api.getSuggestions().subscribe({
      next: (res) => {
        this.suggestions = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('No se pudieron cargar tus comentarios.', 'danger');
      }
    });
  }

  setRating(value: number) {
    this.rating = value;
  }

  sendSuggestion() {
    if (!this.category || !this.message.trim()) {
      this.showToast('Selecciona una categoría y escribe tu comentario.', 'warning');
      return;
    }

    if (this.rating === 0) {
      this.showToast('Selecciona al menos 1 estrella para calificar.', 'danger');
      return;
    }

    this.sending = true;
    this.api.createSuggestion({
      title: this.category,
      message: `[Calificación: ${this.rating}/5] ${this.message.trim()}`
    }).subscribe({
      next: () => {
        this.sending = false;
        this.category = '';
        this.message = '';
        this.rating = 0;
        this.showToast('¡Comentario enviado con éxito!', 'success');
        this.loadSuggestions();
      },
      error: () => {
        this.sending = false;
        this.showToast('Ocurrió un error al enviar tu comentario.', 'danger');
      }
    });
  }

  statusLabel(status: Suggestion['status']): string {
    switch (status) {
      case 'leida':
        return 'Leída';
      case 'resuelta':
        return 'Resuelta';
      default:
        return 'Pendiente';
    }
  }

  statusColor(status: Suggestion['status']): string {
    switch (status) {
      case 'leida':
        return 'warning';
      case 'resuelta':
        return 'success';
      default:
        return 'medium';
    }
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private showToast(message: string, color: string) {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastOpen = true;
  }
}
