import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonIcon, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  busOutline,
  cartOutline,
  cashOutline,
  fastFoodOutline,
  gameControllerOutline,
  giftOutline,
  heartOutline,
  homeOutline,
  laptopOutline,
  pricetagOutline,
  saveOutline,
  schoolOutline,
  settingsOutline,
  walletOutline,
} from 'ionicons/icons';
import { TransactionService } from '../../services/transaction';
import {
  DEFAULT_CATEGORY_COLOR,
  toIonicon,
} from '../../utils/category-icons';

interface Category {
  id: number;
  name: string;
  type: 'ingreso' | 'gasto';
  icon: string;
  color: string;
}

@Component({
  selector: 'app-add-movement-modal',
  templateUrl: './add-movement-modal.component.html',
  styleUrls: ['./add-movement-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
})
export class AddMovementModalComponent implements OnInit {
  @Input() initialType: 'ingreso' | 'gasto' = 'gasto';

  type: 'ingreso' | 'gasto' = 'gasto';
  amount: number = 0;
  selectedCategoryId: number | null = null;
  date: string = new Date().toISOString().split('T')[0];
  description: string = '';
  concepto: string = '';
  categories: Category[] = [];
  isLoadingCategories = true;

  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      briefcaseOutline,
      busOutline,
      cartOutline,
      cashOutline,
      fastFoodOutline,
      gameControllerOutline,
      giftOutline,
      heartOutline,
      homeOutline,
      laptopOutline,
      pricetagOutline,
      saveOutline,
      schoolOutline,
      settingsOutline,
      walletOutline,
    });
  }

  async ngOnInit() {
    await this.loadCategories();
    this.setType(this.initialType || 'gasto');
    this.cdr.detectChanges();
  }

  private async loadCategories() {
    this.isLoadingCategories = true;
    try {
      const categories = await this.transactionService.getCategories();
      this.categories = categories.map((cat: any) => ({
        id: Number(cat.id),
        name: cat.name,
        type: cat.type,
        icon: toIonicon(cat.icon),
        color: cat.color || DEFAULT_CATEGORY_COLOR,
      }));
    } finally {
      this.isLoadingCategories = false;
    }
  }

  get currentCategories(): Category[] {
    return this.categories.filter(cat => cat.type === this.type);
  }

  setType(selectedType: 'ingreso' | 'gasto') {
    this.type = selectedType;
    const firstCategory = this.currentCategories[0];
    this.selectedCategoryId = firstCategory ? firstCategory.id : null;
  }

  selectCategory(id: number) {
    this.selectedCategoryId = id;
  }

  private get selectedCategory(): Category | undefined {
    return this.categories.find(cat => cat.id === this.selectedCategoryId);
  }

  private get selectedCategoryName(): string {
    return this.selectedCategory?.name ?? '';
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async manageCategories() {
    await this.modalCtrl.dismiss(null, 'cancel');
    await this.router.navigate(['/tabs/categories']);
  }

  private async showValidationAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Dato requerido',
      message,
      cssClass: ['sw-alert', 'sw-alert-danger'],
      buttons: [{ text: 'OK', role: 'confirm' }],
    });
    await alert.present();
  }

  async save() {
    if (!this.amount || this.amount <= 0) {
      await this.showValidationAlert('Ingresa un monto válido mayor a 0.');
      return;
    }

    if (!this.selectedCategoryId) {
      await this.showValidationAlert('Debes seleccionar una categoría.');
      return;
    }

    const category = this.selectedCategory;
    const categoryName = this.selectedCategoryName;
    const color = category?.color || DEFAULT_CATEGORY_COLOR;

    const movementDate = this.date ? new Date(this.date) : new Date();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const startOfDay = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const period = startOfDay >= startOfMonth && startOfDay <= endOfMonth
      ? 'month'
      : startOfDay >= startOfWeek && startOfDay <= endOfWeek
        ? 'week'
        : 'month';

    const newMovement = {
      categoryId: Number(this.selectedCategoryId),
      category: categoryName,
      subtitle: this.description ? `${this.date} · ${this.description}` : this.date,
      concepto: this.concepto,
      amount: this.type === 'gasto' ? -Math.abs(this.amount) : Math.abs(this.amount),
      isExpense: this.type === 'gasto',
      icon: category?.icon || 'pricetag-outline',
      iconBg: `${color}22`,
      period: period as 'week' | 'month',
      date: this.date
    };

    this.modalCtrl.dismiss(newMovement, 'created');
  }
}