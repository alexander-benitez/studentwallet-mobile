import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bulbOutline,
  cashOutline,
  downloadOutline,
  notificationsOutline,
  personOutline,
  refreshOutline,
  swapHorizontalOutline,
  walletOutline,
} from 'ionicons/icons';
import { jsPDF } from 'jspdf';
import { environment } from '../../../environments/environment';
import { TransactionService } from '../../services/transaction';

type PreferenceKey = 'notificaciones' | 'alertasPresupuesto' | 'mostrarConsejos';

interface Preferences {
  notificaciones: boolean;
  alertasPresupuesto: boolean;
  mostrarConsejos: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  notificaciones: true,
  alertasPresupuesto: true,
  mostrarConsejos: true,
};

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToggle,
    IonToolbar,
  ]
})
export class ConfiguracionPage implements OnInit, ViewWillEnter {
  private static readonly STORAGE_KEY = 'studentwallet_config';

  preferences: Preferences = { ...DEFAULT_PREFERENCES };

  private router = inject(Router);
  private transactionService = inject(TransactionService);

  constructor() {
    addIcons({
      alertCircleOutline,
      bulbOutline,
      cashOutline,
      downloadOutline,
      notificationsOutline,
      personOutline,
      refreshOutline,
      swapHorizontalOutline,
      walletOutline,
    });
  }

  ngOnInit() {
    this.loadPreferences();
  }

  ionViewWillEnter() {
    void this.transactionService.refreshData();
    void this.transactionService.loadGoalsFromApi();
  }

  get movimientos(): number {
    return this.transactionService.movementsValue.length;
  }

  get presupuestos(): number {
    return this.transactionService.budgetsValue.length;
  }

  get metas(): number {
    return this.transactionService.goalsValue.length;
  }

  get saldo(): number {
    return this.transactionService.balanceValue;
  }

  togglePreference(key: PreferenceKey, event: CustomEvent): void {
    const value = Boolean(event?.detail?.checked);
    this.preferences[key] = value;
    localStorage.setItem(
      ConfiguracionPage.STORAGE_KEY,
      JSON.stringify(this.preferences)
    );
  }

  async exportBackup(): Promise<void> {
    try {
      const res = await fetch(`${environment.apiUrl}/user/backup`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (!res.ok) {
        throw new Error('No se pudo generar el respaldo');
      }

      const json = await res.json();
      const data = json.data ?? json;
      await this.generateBackupPdf(data);
      alert('Respaldo PDF generado correctamente');
    } catch (err) {
      console.error('Error al generar el respaldo:', err);
      alert('No se pudo generar el respaldo en PDF');
    }
  }

  private async generateBackupPdf(data: any): Promise<void> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const ensureSpace = (needed = 20) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addTitle = (text: string) => {
      ensureSpace(26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 64, 175);
      doc.text(text, margin, y);
      y += 18;
      doc.setTextColor(30, 41, 59);
    };

    const addLine = (text: string, bold = false) => {
      ensureSpace(16);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14;
    };

    try {
      const logo = await this.loadImageAsDataUrl('assets/icon/favicon.png');
      doc.addImage(logo, 'PNG', margin, y, 36, 36);
    } catch {
      // continuar sin logo si no se puede cargar
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('StudentWallet', margin + 48, y + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Respaldo de datos - ${new Date().toLocaleString()}`, margin + 48, y + 40);
    y += 64;
    doc.setTextColor(30, 41, 59);

    const user = data?.user || {};
    addTitle('Perfil');
    addLine(`Nombre: ${user.name || ''} ${user.apellido || ''}`.trim() || 'Nombre: -');
    if (user.email) addLine(`Correo: ${user.email}`);
    addLine(`Universidad: ${user.universidad || '-'}`);
    addLine(`Carrera: ${user.carrera || '-'}`);
    y += 6;

    const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
    addTitle(`Movimientos (${transactions.length})`);
    if (transactions.length === 0) {
      addLine('Sin movimientos registrados.');
    } else {
      transactions.slice(0, 60).forEach((t: any) => {
        const tipo = t.type === 'ingreso' ? 'Ingreso' : 'Gasto';
        const monto = Number(t.amount || 0).toFixed(2);
        const fecha = t.date ? new Date(t.date).toLocaleDateString() : '-';
        const desc = t.description || t.concepto || 'Sin descripción';
        addLine(`• [${fecha}] ${tipo} $${monto} - ${desc}`);
      });
      if (transactions.length > 60) addLine(`... y ${transactions.length - 60} movimientos más.`);
    }
    y += 6;

    const budgets = Array.isArray(data?.budgets) ? data.budgets : [];
    addTitle(`Presupuestos (${budgets.length})`);
    if (budgets.length === 0) {
      addLine('Sin presupuestos registrados.');
    } else {
      budgets.forEach((b: any) => {
        addLine(`• ${b.category?.name || b.category_name || 'Categoría'}: $${Number(b.amount || 0).toFixed(2)} (${b.period || '-'})`);
      });
    }
    y += 6;

    const goals = Array.isArray(data?.savings_goals) ? data.savings_goals : (Array.isArray(data?.goals) ? data.goals : []);
    addTitle(`Metas de ahorro (${goals.length})`);
    if (goals.length === 0) {
      addLine('Sin metas registradas.');
    } else {
      goals.forEach((g: any) => {
        addLine(`• ${g.name || g.title || 'Meta'}: $${Number(g.current_amount || g.currentAmount || 0).toFixed(2)} / $${Number(g.target_amount || g.targetAmount || 0).toFixed(2)}`);
      });
    }

    doc.save(`studentwallet-respaldo-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private loadImageAsDataUrl(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = path;
    });
  }

  resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    localStorage.setItem(
      ConfiguracionPage.STORAGE_KEY,
      JSON.stringify(this.preferences)
    );
    alert('Configuración restablecida correctamente');
  }

  goToProfile(): void {
    this.router.navigate(['/tabs/tab5']);
  }

  private loadPreferences(): void {
    const raw = localStorage.getItem(ConfiguracionPage.STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch (err) {
      console.error('Error al leer las preferencias:', err);
    }
  }
}
