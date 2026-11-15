import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  briefcaseOutline,
  busOutline,
  cartOutline,
  cashOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  fastFoodOutline,
  gameControllerOutline,
  giftOutline,
  heartOutline,
  homeOutline,
  laptopOutline,
  pricetagOutline,
  pricetagsOutline,
  refreshOutline,
  saveOutline,
  schoolOutline,
  searchOutline,
  trashOutline,
  trendingDownOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ApiService, Category, CategoryPayload } from '../../services/api.service';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  toIonicon,
} from '../../utils/category-icons';

type CategoryType = 'ingreso' | 'gasto';
type MessageType = 'success' | 'error' | 'info';

interface CategoryForm {
  nombre: string;
  tipo: CategoryType;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class CategoriesPage implements OnInit, OnDestroy, ViewWillEnter {
  categories: Category[] = [];
  loading = false;
  guardando = false;
  mostrarFormulario = false;
  editandoId: number | null = null;
  tipoActivo: CategoryType = 'gasto';
  busqueda = '';
  mensaje = '';
  tipoMensaje: MessageType = 'info';

  form: CategoryForm = this.nuevoFormulario();

  readonly iconos = CATEGORY_ICONS;
  readonly colores = CATEGORY_COLORS;

  private api = inject(ApiService);
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = false;
  private mensajeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    addIcons({
      addOutline,
      alertCircleOutline,
      briefcaseOutline,
      busOutline,
      cartOutline,
      cashOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      fastFoodOutline,
      gameControllerOutline,
      giftOutline,
      heartOutline,
      homeOutline,
      laptopOutline,
      pricetagOutline,
      pricetagsOutline,
      refreshOutline,
      saveOutline,
      schoolOutline,
      searchOutline,
      trashOutline,
      trendingDownOutline,
      trendingUpOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    void this.cargarCategorias();
  }

  ionViewWillEnter(): void {
    if (!this.loading) {
      void this.cargarCategorias();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.mensajeTimer) {
      clearTimeout(this.mensajeTimer);
    }
  }

  get categoriasFiltradas(): Category[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.categories.filter(
      (categoria) =>
        categoria.type === this.tipoActivo &&
        categoria.name.toLowerCase().includes(texto),
    );
  }

  // ts compat helper
  private _resData(res: any): any {
    return res?.data;
  }

  get totalGastos(): number {
    return this.categories.filter((categoria) => categoria.type === 'gasto').length;
  }

  get totalIngresos(): number {
    return this.categories.filter((categoria) => categoria.type === 'ingreso').length;
  }

  async cargarCategorias(): Promise<void> {
    this.loading = true;

    try {
      const res = await firstValueFrom(this.api.getCategories());
      this.categories = res.data ?? [];
      this.limpiarNotificacion();
    } catch (error) {
      this.mostrarNotificacion(this.mensajeDeError(error), 'error');
    } finally {
      this.loading = false;

      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }
  }

  abrirCrear(): void {
    this.editandoId = null;
    this.form = this.nuevoFormulario();
    this.mostrarFormulario = true;
    this.limpiarNotificacion();
  }

  abrirEditar(categoria: Category): void {
    this.editandoId = categoria.id;
    this.form = {
      nombre: categoria.name,
      tipo: categoria.type,
      icono: categoria.icon || DEFAULT_CATEGORY_ICON,
      color: categoria.color || DEFAULT_CATEGORY_COLOR,
    };
    this.mostrarFormulario = true;
    this.limpiarNotificacion();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
  }

  seleccionarTipo(tipo: CategoryType): void {
    this.tipoActivo = tipo;
  }

  iconoDe(categoria: Category): string {
    return toIonicon(categoria.icon);
  }

  colorDe(categoria: Category): string {
    return categoria.color || DEFAULT_CATEGORY_COLOR;
  }

  esCategoriaDelSistema(categoria: Category): boolean {
    return categoria.is_default === true || categoria.user_id == null;
  }

  async guardarCategoria(): Promise<void> {
    const nombre = this.form.nombre.trim();

    if (!nombre) {
      this.mostrarNotificacion('El nombre de la categoría es obligatorio.', 'error');
      return;
    }

    const payload: CategoryPayload = {
      name: nombre,
      type: this.form.tipo,
      color: this.form.color,
      icon: this.form.icono,
    };

    this.guardando = true;

    try {
      const editando = this.editandoId !== null;
      const res = editando
        ? await firstValueFrom(this.api.updateCategory(this.editandoId as number, payload))
        : await firstValueFrom(this.api.createCategory(payload));

      const categoria = res.data;

      if (categoria) {
        this.reemplazarCategoria(categoria, editando);
      } else {
        await this.cargarCategorias();
      }

      this.tipoActivo = this.form.tipo;
      this.mostrarFormulario = false;
      this.editandoId = null;
      this.mostrarNotificacion(
        editando
          ? 'Categoría actualizada correctamente.'
          : 'Categoría creada correctamente.',
        'success',
      );
    } catch (error) {
      this.mostrarNotificacion(this.mensajeDeError(error), 'error');
    } finally {
      this.guardando = false;
    }
  }

  async eliminarCategoria(categoria: Category): Promise<void> {
    if (this.esCategoriaDelSistema(categoria)) {
      this.mostrarNotificacion(
        'Las categorías del sistema no se pueden eliminar.',
        'error',
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar categoría',
      message: `¿Deseas eliminar "${categoria.name}"? No se podrá eliminar si tiene movimientos o presupuestos asociados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role !== 'destructive') {
      return;
    }

    try {
      await firstValueFrom(this.api.deleteCategory(categoria.id));
      this.categories = this.categories.filter((item) => item.id !== categoria.id);
      this.mostrarNotificacion('Categoría eliminada correctamente.', 'success');
    } catch (error) {
      this.mostrarNotificacion(this.mensajeDeError(error), 'error');
    }
  }

  mostrarNotificacion(mensaje: string, tipo: MessageType): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;

    if (this.mensajeTimer) {
      clearTimeout(this.mensajeTimer);
    }

    this.mensajeTimer = setTimeout(() => {
      this.mensaje = '';

      if (!this.destroyed) {
        this.cdr.detectChanges();
      }
    }, 5000);
  }

  private nuevoFormulario(): CategoryForm {
    return {
      nombre: '',
      tipo: this.tipoActivo ?? 'gasto',
      icono: DEFAULT_CATEGORY_ICON,
      color: DEFAULT_CATEGORY_COLOR,
    };
  }

  private reemplazarCategoria(categoria: Category, editando: boolean): void {
    const index = this.categories.findIndex((item) => item.id === categoria.id);

    if (index === -1) {
      this.categories = [categoria, ...this.categories];
      return;
    }

    if (editando) {
      this.categories = this.categories.map((item) =>
        item.id === categoria.id ? categoria : item,
      );
    }
  }

  private limpiarNotificacion(): void {
    if (this.mensajeTimer) {
      clearTimeout(this.mensajeTimer);
    }
    this.mensaje = '';
  }

  private mensajeDeError(error: any): string {
    if (error?.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en responder. Intenta nuevamente.';
    }

    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.';
    }

    if (error?.status === 401) {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }

    const errores = error?.error?.errors;
    if (errores && typeof errores === 'object') {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero) && primero.length > 0) {
        return String(primero[0]);
      }
    }

    return error?.error?.message
      || 'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.';
  }
}
