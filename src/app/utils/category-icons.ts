export const CATEGORY_ICONS = [
  { mdi: 'pricetag-outline', ion: 'pricetag-outline', label: 'Etiqueta' },
  { mdi: 'cash-outline', ion: 'cash-outline', label: 'Dinero' },
  { mdi: 'cart-outline', ion: 'cart-outline', label: 'Compras' },
  { mdi: 'fast-food-outline', ion: 'fast-food-outline', label: 'Comida' },
  { mdi: 'bus-outline', ion: 'bus-outline', label: 'Transporte' },
  { mdi: 'home-outline', ion: 'home-outline', label: 'Hogar' },
  { mdi: 'school-outline', ion: 'school-outline', label: 'Educación' },
  { mdi: 'laptop-outline', ion: 'laptop-outline', label: 'Tecnología' },
  { mdi: 'heart-outline', ion: 'heart-outline', label: 'Salud' },
  { mdi: 'gift-outline', ion: 'gift-outline', label: 'Regalo' },
  { mdi: 'briefcase-outline', ion: 'briefcase-outline', label: 'Trabajo' },
  { mdi: 'game-controller-outline', ion: 'game-controller-outline', label: 'Ocio' },
  { mdi: 'wallet-outline', ion: 'wallet-outline', label: 'Billetera' },
];

export const CATEGORY_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#f59e0b',
  '#7c3aed',
  '#0ea5e9',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#64748b',
];

export const DEFAULT_CATEGORY_ICON = 'pricetag-outline';
export const DEFAULT_CATEGORY_COLOR = '#2563eb';

export function toIonicon(icon?: string | null): string {
  if (!icon) return DEFAULT_CATEGORY_ICON;
  return icon;
}
