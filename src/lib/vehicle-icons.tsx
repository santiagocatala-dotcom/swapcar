'use client';

import { Gauge } from 'lucide-react';

// ============================================================
// Side-view vehicle SVG icons — each body type is clearly different
// ============================================================

export type VehicleTypeValue =
  | 'sedan' | 'hatchback' | 'suv' | 'pickup' | 'coupe'
  | 'cabrio' | 'rural' | 'furgon' | 'moto' | 'cuatriciclo';

export interface VehicleTypeOption {
  value: VehicleTypeValue;
  label: string;
  icon: any;
}

// Side view - three boxes (hood, cabin, trunk)
function SedanIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Hood → windshield → roof → rear window → trunk */}
      <path d="M2 16h2l1-2h2l1 2h12l-1-6H7L5 8H3l-1 4v4z" />
      <path d="M7 14v3H5v-3" />
      <path d="M17 14v3h2v-3" />
      <circle cx="6.5" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - two boxes (hood + cabin), steep hatch rear
function HatchbackIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 16h2l1-2 2-2h10l2 2 1 2h2l-2-7H7L5 9H3l-1 3v4z" />
      <path d="M7 14v3H5v-3" />
      <path d="M17 14v3h2v-3" />
      <circle cx="6.5" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - tall, boxy, high ground clearance
function SUVIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 15h2l1-2h2l4 2h8l-1-5H8L6 8H3L1 11v4z" />
      <path d="M6 13v4H4v-4" />
      <path d="M18 13v4h2v-4" />
      <path d="M10 11h6l1 2" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - cabin + open flat bed
function PickupIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 15h2l1-2h5l3 2h7l-2-5H9L7 8H3L1 11v4z" />
      <path d="M7 13v4H5v-4" />
      <path d="M17 13v4h2v-4" />
      {/* Flat bed */}
      <path d="M10 15v-3h7" />
      <circle cx="6.5" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - long hood, sloping roofline, short trunk
function CoupeIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 15h2l1-1 2-3h8l3 3 1 1h3l-3-8H6L4 7H2l-1 3v5z" />
      <path d="M8 13v4H6v-4" />
      <path d="M16 13v4h2v-4" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - no roof, windshield, two seats
function CabrioIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 16h2l1-2h12l1 2h2l-2-8H6L4 8H2l-1 4v4z" />
      <path d="M6 14v3H4v-3" />
      <path d="M16 14v3h2v-3" />
      {/* Windshield */}
      <path d="M6 12l2-3h6l2 3" />
      <circle cx="5.5" cy="17" r="1.5" fill="currentColor" />
      <circle cx="18.5" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - long roofline, boxy rear (station wagon)
function RuralIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 16h2l1-2 3-2h10l3 2 1 2h1l-2-8H7L5 8H2L1 11v5z" />
      <path d="M6 14v3H4v-3" />
      <path d="M18 14v3h2v-3" />
      {/* Long roof */}
      <path d="M6 10h12" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - tall box (delivery van)
function FurgonIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="9" width="19" height="7" rx="1" />
      <path d="M6 16v2H4v-2" />
      <path d="M18 16v2h2v-2" />
      {/* Tall cargo area */}
      <path d="M9 9V6h5v3" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Side view - two wheels, rider
function MotoIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="16" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M6 16l2-8h4" />
      <path d="M18 16l-3-5h-3" />
      <path d="M8 12h8" />
      {/* Handlebars */}
      <path d="M12 8h4l1 2" />
    </svg>
  );
}

// Side view - four wheels, no roof, off-road
function CuatriIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="5" rx="1" />
      <path d="M7 15v1h2v-1" />
      <path d="M15 15v1h2v-1" />
      {/* Big chunky tires */}
      <circle cx="7" cy="16" r="2.5" fill="none" />
      <circle cx="17" cy="16" r="2.5" fill="none" />
      {/* Handlebars */}
      <path d="M6 10V8" />
      <path d="M18 10V8" />
      <circle cx="6" cy="8" r="0.8" fill="currentColor" />
      <circle cx="18" cy="8" r="0.8" fill="currentColor" />
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
