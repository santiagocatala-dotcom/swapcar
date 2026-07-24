'use client';

import { Car, Truck, Bike, Gauge } from 'lucide-react';

// ============================================================
// Vehicle type icons — SVG-based (consistent, scalable, professional)
// ============================================================

export type VehicleTypeValue =
  | 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'coupe'
  | 'cabrio' | 'rural' | 'furgon' | 'moto' | 'cuatriciclo';

export interface VehicleTypeOption {
  value: VehicleTypeValue;
  label: string;
  icon: any;
}

// Auto icon (generic car)
function AutoIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12h18M4 8l1-2h14l1 2M5 12v4h14v-4M7 16v2H5v-2M17 16v2h2v-2" />
      <circle cx="7" cy="14" r="1.5" fill="currentColor" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PickupIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 14h4l2-3h4l2 3h8v3H2v-3z" />
      <path d="M14 11l2-5h4l1 2" />
      <rect x="4" y="14" width="7" height="3" rx="1" />
      <circle cx="6" cy="17" r="1.5" fill="currentColor" />
      <circle cx="16" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function SUVIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 13h18" />
      <path d="M5 9l2-4h10l2 4" />
      <rect x="4" y="13" width="16" height="5" rx="1" />
      <path d="M6 18v2H4v-2" />
      <path d="M18 18v2h2v-2" />
      <circle cx="7" cy="16" r="1.5" fill="currentColor" />
      <circle cx="17" cy="16" r="1.5" fill="currentColor" />
      <path d="M17 9h2l1 4" />
    </svg>
  );
}

function CabrioIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 14h20" />
      <path d="M4 11l2-3h12l2 3" />
      <rect x="3" y="14" width="18" height="4" rx="1" />
      <path d="M5 18v2H3v-2" />
      <path d="M19 18v2h2v-2" />
      <path d="M8 11l1-4h6l1 4" />
      <circle cx="6" cy="16" r="1.5" fill="currentColor" />
      <circle cx="18" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function MotoIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="16" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M6 16l3-10h4" />
      <path d="M18 16l-3-6h-4" />
      <path d="M9 12h7" />
      <path d="M13 6h4l2 4" />
    </svg>
  );
}

function VanIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="8" width="20" height="10" rx="1" />
      <path d="M2 14h20" />
      <path d="M6 18v2H4v-2" />
      <path d="M18 18v2h2v-2" />
      <path d="M8 8V6h8v2" />
      <path d="M16 8l2 6" />
      <circle cx="7" cy="16" r="1.5" fill="currentColor" />
      <circle cx="17" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export const VEHICLE_TYPE_ICONS: Record<VehicleTypeValue, any> = {
  sedan: AutoIcon,
  hatchback: AutoIcon,
  suv: SUVIcon,
  pickup: PickupIcon,
  coupe: AutoIcon,
  cabrio: CabrioIcon,
  rural: VanIcon,
  furgon: VanIcon,
  moto: MotoIcon,
  cuatriciclo: Gauge,
};

export const VEHICLE_TYPES: VehicleTypeOption[] = [
  { value: 'sedan', label: 'Sedán', icon: AutoIcon },
  { value: 'hatchback', label: 'Hatchback', icon: AutoIcon },
  { value: 'suv', label: 'SUV / Todoterreno', icon: SUVIcon },
  { value: 'pickup', label: 'Pick up', icon: PickupIcon },
  { value: 'coupe', label: 'Coupé', icon: AutoIcon },
  { value: 'cabrio', label: 'Cabrio / Convertible', icon: CabrioIcon },
  { value: 'rural', label: 'Rural / Familiar', icon: VanIcon },
  { value: 'furgon', label: 'Furgón / Utilitario', icon: VanIcon },
  { value: 'moto', label: 'Moto', icon: MotoIcon },
  { value: 'cuatriciclo', label: 'Cuatriciclo / ATV', icon: Gauge },
];
