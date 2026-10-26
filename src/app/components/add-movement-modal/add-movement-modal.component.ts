import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';

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
  selectedCategory: string = 'Alimentación';
  date: string = '2026-10-07';
  description: string = '';

  expenseCategories = [
    { name: 'Alimentación', icon: '🍔' },
    { name: 'Transporte', icon: '🚌' },
    { name: 'Estudios', icon: '📚' },
    { name: 'Entretenimiento', icon: '🎮' },
    { name: 'Otros', icon: '🏠' },
  ];

  incomeCategories = [
    { name: 'Beca', icon: '💰' },
    { name: 'Mesada', icon: '🛡️' },
    { name: 'Otros', icon: '🏠' },
  ];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.initialType) {
      this.setType(this.initialType);
    }
  }

  get currentCategories() {
    return this.type === 'gasto' ? this.expenseCategories : this.incomeCategories;
  }

  setType(selectedType: 'ingreso' | 'gasto') {
    this.type = selectedType;
    if (this.type === 'ingreso') {
      this.selectedCategory = 'Beca';
    } else {
      this.selectedCategory = 'Alimentación';
    }
  }

  selectCategory(name: string) {
    this.selectedCategory = name;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (!this.amount || this.amount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    const newMovement = {
      category: this.selectedCategory,
      subtitle: this.description ? `Hoy · ${this.description}` : 'Hoy · Movimiento',
      amount: this.type === 'gasto' ? -Math.abs(this.amount) : Math.abs(this.amount),
      isExpense: this.type === 'gasto',
      icon: this.getIconForCategory(this.selectedCategory),
      iconBg: this.type === 'gasto' ? '#2a2216' : '#133023',
      period: 'week' as const
    };

    this.modalCtrl.dismiss(newMovement, 'created');
  }

  private getIconForCategory(cat: string): string {
    switch (cat) {
      case 'Alimentación': return 'fast-food-outline';
      case 'Transporte': return 'bus-outline';
      case 'Estudios': return 'book-outline';
      case 'Entretenimiento': return 'game-controller-outline';
      case 'Beca': return 'cash-outline';
      case 'Mesada': return 'wallet-outline';
      default: return 'home-outline';
    }
  }
}