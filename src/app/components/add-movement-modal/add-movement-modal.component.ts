import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { TransactionService } from '../../services/transaction';

interface Category {
  id: number;
  name: string;
  type: 'ingreso' | 'gasto';
  icon?: string;
}

@Component({
  selector: 'app-add-movement-modal',
  templateUrl: './add-movement-modal.component.html',
  styleUrls: ['./add-movement-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AddMovementModalComponent implements OnInit {
  @Input() initialType: 'ingreso' | 'gasto' = 'gasto';

  type: 'ingreso' | 'gasto' = 'gasto';
  amount: number = 0;
  selectedCategoryId: number | null = null;
  date: string = new Date().toISOString().split('T')[0];
  description: string = '';
  categories: Category[] = [];

  constructor(
    private modalCtrl: ModalController,
    private transactionService: TransactionService
  ) {}

  async ngOnInit() {
    await this.loadCategories();
    if (this.initialType) {
      this.setType(this.initialType);
    }
  }

  private async loadCategories() {
    const categories = await this.transactionService.getCategories();
    this.categories = categories.map((cat: any) => ({
      id: Number(cat.id),
      name: cat.name,
      type: cat.type,
      icon: this.getCategoryEmoji(cat.name)
    }));
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

  private get selectedCategoryName(): string {
    const match = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return match ? match.name : '';
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (!this.amount || this.amount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    if (!this.selectedCategoryId) {
      alert('Debes seleccionar una categoría');
      return;
    }

    const categoryName = this.selectedCategoryName;
    const newMovement = {
      categoryId: Number(this.selectedCategoryId),
      category: categoryName,
      subtitle: this.description ? `Hoy · ${this.description}` : 'Hoy · Movimiento',
      amount: this.type === 'gasto' ? -Math.abs(this.amount) : Math.abs(this.amount),
      isExpense: this.type === 'gasto',
      icon: this.getIconForCategory(categoryName),
      iconBg: this.type === 'gasto' ? '#2a2216' : '#133023',
      period: 'week' as const
    };

    this.modalCtrl.dismiss(newMovement, 'created');
  }

  private getCategoryEmoji(cat: string): string {
    switch (cat) {
      case 'Alimentación':
      case 'Comida': return '🍔';
      case 'Transporte': return '🚌';
      case 'Estudios': return '📚';
      case 'Entretenimiento': return '🎮';
      case 'Beca': return '💰';
      case 'Mesada': return '🛡️';
      default: return '🏠';
    }
  }

  private getIconForCategory(cat: string): string {
    switch (cat) {
      case 'Alimentación':
      case 'Comida': return 'fast-food-outline';
      case 'Transporte': return 'bus-outline';
      case 'Estudios': return 'book-outline';
      case 'Entretenimiento': return 'game-controller-outline';
      case 'Beca': return 'cash-outline';
      case 'Mesada': return 'wallet-outline';
      default: return 'home-outline';
    }
  }
}