export interface CategoryIconOption {
  mdi: string;
  ion: string;
  label: string;
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  { mdi: 'mdi-tag-outline', ion: 'pricetag-outline', label: 'Etiqueta' },
  { mdi: 'mdi-food-outline', ion: 'fast-food-outline', label: 'Comida' },
  { mdi: 'mdi-bus', ion: 'bus-outline', label: 'Transporte' },
  { mdi: 'mdi-school-outline', ion: 'school-outline', label: 'Estudios' },
  { mdi: 'mdi-shopping-outline', ion: 'cart-outline', label: 'Compras' },
  { mdi: 'mdi-home-outline', ion: 'home-outline', label: 'Hogar' },
  { mdi: 'mdi-heart-outline', ion: 'heart-outline', label: 'Salud' },
  { mdi: 'mdi-gamepad-variant-outline', ion: 'game-controller-outline', label: 'Juegos' },
  { mdi: 'mdi-cash-multiple', ion: 'cash-outline', label: 'Efectivo' },
  { mdi: 'mdi-wallet-outline', ion: 'wallet-outline', label: 'Cartera' },
  { mdi: 'mdi-briefcase-outline', ion: 'briefcase-outline', label: 'Trabajo' },
  { mdi: 'mdi-gift-outline', ion: 'gift-outline', label: 'Regalos' },
  { mdi: 'mdi-piggy-bank-outline', ion: 'save-outline', label: 'Ahorro' },
  { mdi: 'mdi-laptop', ion: 'laptop-outline', label: 'Tecnología' },
];

export const CATEGORY_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
  '#64748B',
];

export const DEFAULT_CATEGORY_ICON = 'mdi-tag-outline';
export const DEFAULT_CATEGORY_COLOR = '#2563EB';

const ICON_BY_MDI = new Map(
  CATEGORY_ICONS.map((option) => [option.mdi, option.ion]),
);

const MDI_BY_ION = new Map(
  CATEGORY_ICONS.map((option) => [option.ion, option.mdi]),
);

export function toIonicon(icon?: string | null): string {
  if (!icon) {
    return 'pricetag-outline';
  }

  return ICON_BY_MDI.get(icon) ?? (MDI_BY_ION.has(icon) ? icon : 'pricetag-outline');
}

export function toMdiIcon(icon?: string | null): string {
  if (!icon) {
    return DEFAULT_CATEGORY_ICON;
  }

  return MDI_BY_ION.get(icon) ?? (ICON_BY_MDI.has(icon) ? icon : DEFAULT_CATEGORY_ICON);
}
