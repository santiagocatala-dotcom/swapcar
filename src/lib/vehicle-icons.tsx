'use client';

export type VehicleTypeValue =
  | 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'coupe'
  | 'cabrio' | 'rural' | 'furgon' | 'moto' | 'cuatriciclo';

export interface VehicleTypeOption {
  value: VehicleTypeValue;
  label: string;
  icon: any;
}

/* ── Base helper colors ── */
const styles = { width: 28, height: 20, fill: 'currentColor' };

/* ── Sedán ── */
function SedanIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="11" y="4" width="13" height="7" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
    </svg>
  );
}

/* ── Hatchback ── Cabina llega hasta atrás ── */
function HatchbackIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="11" y="4" width="14" height="7" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
    </svg>
  );
}

/* ── SUV ── Más alto, despeje del suelo ── */
function SUVIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="8" width="28" height="6" rx="1.5" />
      <rect x="11" y="2" width="13" height="7" rx="1" />
      <rect x="2" y="10" width="6" height="5" rx="1" />
      <rect x="26" y="10" width="6" height="5" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
      <rect x="6" y="14" width="2" height="2" />
      <rect x="26" y="14" width="2" height="2" />
    </svg>
  );
}

/* ── Pick up ── Cabina + cama atrás ── */
function PickupIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="9" y="4" width="11" height="7" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
      <rect x="20" y="10" width="10" height="1" />
    </svg>
  );
}

/* ── Coupé ── Capó largo, cabina atrás ── */
function CoupeIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="16" y="5" width="10" height="6" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
      <path d="M12 10l5-5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/* ── Cabrio ── Sin techo, solo parabrisas ── */
function CabrioIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="12" y="6" width="8" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
    </svg>
  );
}

/* ── Rural ── Techo largo hasta el fondo ── */
function RuralIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="10" width="28" height="5" rx="1.5" />
      <rect x="10" y="4" width="16" height="7" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
    </svg>
  );
}

/* ── Furgón ── Caja alta, van ── */
function FurgonIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="3" y="6" width="28" height="9" rx="1" />
      <rect x="2" y="11" width="6" height="4" rx="1" />
      <rect x="26" y="11" width="6" height="4" rx="1" />
      <circle cx="5" cy="16" r="2.5" />
      <circle cx="29" cy="16" r="2.5" />
      <rect x="8" y="6" width="2" height="4" />
    </svg>
  );
}

/* ── Moto ── Dos ruedas, manubrio ── */
function MotoIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <circle cx="7" cy="15" r="4" />
      <circle cx="27" cy="15" r="4" />
      <rect x="10" y="10" width="14" height="3" rx="1" />
      <rect x="17" y="5" width="4" height="6" rx="0.5" />
      <rect x="14" y="5" width="4" height="2" rx="0.5" />
      <rect x="21" y="6" width="4" height="2" rx="0.5" />
    </svg>
  );
}

/* ── Cuatriciclo ── 4 ruedas, abierto ── */
function CuatriIcon(p: any) {
  return (
    <svg viewBox="0 0 34 20" {...styles} {...p}>
      <rect x="6" y="7" width="22" height="5" rx="1" />
      <circle cx="8" cy="16" r="3" />
      <circle cx="26" cy="16" r="3" />
      <rect x="4" y="6" width="4" height="2" rx="0.5" />
      <rect x="26" y="6" width="4" height="2" rx="0.5" />
    </svg>
  );
}

export const VEHICLE_TYPE_ICONS: Record<VehicleTypeValue, any> = {
  sedan: SedanIcon,
  hatchback: HatchbackIcon,
  suv: SUVIcon,
  pickup: PickupIcon,
  coupe: CoupeIcon,
  cabrio: CabrioIcon,
  rural: RuralIcon,
  furgon: FurgonIcon,
  moto: MotoIcon,
  cuatriciclo: CuatriIcon,
};

export const VEHICLE_TYPES: VehicleTypeOption[] = [
  { value: 'sedan', label: 'Sedán', icon: SedanIcon },
  { value: 'hatchback', label: 'Hatchback', icon: HatchbackIcon },
  { value: 'suv', label: 'SUV / Todoterreno', icon: SUVIcon },
  { value: 'pickup', label: 'Pick up', icon: PickupIcon },
  { value: 'coupe', label: 'Coupé', icon: CoupeIcon },
  { value: 'cabrio', label: 'Cabrio / Convertible', icon: CabrioIcon },
  { value: 'rural', label: 'Rural / Familiar', icon: RuralIcon },
  { value: 'furgon', label: 'Furgón / Utilitario', icon: FurgonIcon },
  { value: 'moto', label: 'Moto', icon: MotoIcon },
  { value: 'cuatriciclo', label: 'Cuatriciclo / ATV', icon: CuatriIcon },
];
