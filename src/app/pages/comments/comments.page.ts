import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
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
  IonBadge,
  ViewWillEnter
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
export class CommentsPage implements OnInit, OnDestroy, ViewWillEnter {
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
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = false;

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

  ionViewWillEnter(): void {
    if (!this.loading) {
      this.loadSuggestions();
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
  }

  loadSuggestions() {
    this.loading = true;
    this.api.getSuggestions().subscribe({
      next: (res) => {
        this.suggestions = res.data ?? [];
        this.loading = false;
        this.refreshView();
      },
      error: () => {
        this.loading = false;
        this.showToast('No se pudieron cargar tus comentarios.', 'danger');
        this.refreshView();
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
        this.refreshView();
        this.loadSuggestions();
      },
      error: () => {
        this.sending = false;
        this.showToast('Ocurrió un error al enviar tu comentario.', 'danger');
        this.refreshView();
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

  private async showToast(message: string, color: string) {
    const isSuccess = color === 'success';
    const alert = await this.alertController.create({
      header: isSuccess ? '¡Listo!' : 'Atención',
      message,
      cssClass: ['sw-alert', isSuccess ? 'sw-alert-success' : 'sw-alert-danger'],
      buttons: [{ text: 'OK', role: 'confirm' }],
    });
    await alert.present();
  }

  private refreshView(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }
}
