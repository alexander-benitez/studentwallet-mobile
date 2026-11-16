import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon, 
  IonFab, 
  IonFabButton, 
  ModalController,
  ViewWillEnter
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  chevronDownOutline, 
  addOutline,
  fastFoodOutline,
  cashOutline,
  busOutline,
  walletOutline,
  bookOutline,
  gameControllerOutline,
  homeOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AddMovementModalComponent } from '../components/add-movement-modal/add-movement-modal.component';
import { TransactionService, Movement } from '../services/transaction';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFab, IonFabButton, CommonModule, FormsModule, DecimalPipe],
  providers: [ModalController],
})
export class Tab2Page implements OnInit, OnDestroy, ViewWillEnter {
  typeFilter: 'all' | 'income' | 'expense' = 'all';
  selectedCategory: string = 'all';
  selectedDate: string = 'all';

  categories: string[] = [];

  movements: Movement[] = [];
  private sub: Subscription = new Subscription();
  private modalCtrl = inject(ModalController);
  private transactionService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      chevronDownOutline,
      addOutline,
      fastFoodOutline,
      cashOutline,
      busOutline,
      walletOutline,
      bookOutline,
      gameControllerOutline,
      homeOutline
    });
  }

  async ngOnInit() {
    this.sub.add(
      this.transactionService.movements$.subscribe(movs => {
        this.movements = movs;
        this.cdr.detectChanges();
      })
    );

    const categories = await this.transactionService.getCategories();
    this.categories = categories.map((cat: any) => cat.name);
    this.cdr.detectChanges();
  }

  ionViewWillEnter(): void {
    void this.transactionService.refreshData();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get filteredMovements(): Movement[] {
    return this.movements.filter((item) => {
      if (this.typeFilter === 'income' && item.isExpense) return false;
      if (this.typeFilter === 'expense' && !item.isExpense) return false;

      if (this.selectedCategory !== 'all' && item.category !== this.selectedCategory) {
        return false;
      }

      if (this.selectedDate === 'week' && item.period !== 'week') return false;
      if (this.selectedDate === 'month' && item.period !== 'month' && item.period !== 'week') return false;

      return true;
    });
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddMovementModalComponent,
      breakpoints: [0, 0.85, 1],
      initialBreakpoint: 0.85,
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'created' && data) {
      this.transactionService.addMovement({
        id: Date.now(),
        ...data
      });
    }
  }
}