// ============================================================
// SwapCar — Tipos compartidos
// ============================================================

export type VehicleType = 'auto' | 'moto' | 'camioneta' | 'cuatriciclo';
export type FuelType = 'nafta' | 'diesel' | 'gnc' | 'electrico' | 'hibrido';
export type Transmission = 'manual' | 'automatica';
export type SwipeDirection = 'like' | 'dislike' | 'favorite';

// ======== Database row types ========

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  province: string | null;
  city: string | null;
  created_at: string;
  last_seen: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  kilometers: number | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;
  photos: string[];
  video_url: string | null;
  description: string | null;
  estimated_value: number | null;
  license_plate: string | null;
  vin: string | null;
  created_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  vehicle_types: VehicleType[];
  preferred_brands: string[];
  preferred_models: string[];
  min_year: number | null;
  max_kilometers: number | null;
  fuel_types: FuelType[];
  transmission_types: Transmission[];
  max_distance_km: number;
  min_value: number | null;
  max_value: number | null;
  max_difference_i_pay: number | null;
  max_difference_i_receive: number | null;
  accept_multiple_vehicles: boolean;
  accept_cash: boolean;
  accept_financing: boolean;
  only_in_person: boolean;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  target_user_id: string;
  direction: SwipeDirection;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number | null;
  swapped_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  location: { lat: number; lng: number } | null;
  phone_shared: boolean;
  whatsapp_shared: boolean;
  created_at: string;
}

// ======== Frontend composite types ========

export interface UserWithVehicle extends User {
  vehicle: Vehicle;
  preferences: Preferences;
}

export interface SwipeCandidate {
  user: UserWithVehicle;
  compatibility: number;
  compatibilityDetails: CompatibilityDetails;
  distance: number;
}

export interface CompatibilityDetails {
  vehicleTypeMatch: boolean;
  economicFit: boolean;
  economicGrade: number; // 0-100
  distanceFit: boolean;
  distanceGrade: number; // 0-100
  yearFit: boolean;
  yearGrade: number;
  kilometerFit: boolean;
  kilometerGrade: number;
  brandModelFit: boolean;
  brandModelGrade: number;
}

export interface MatchWithUsers extends Match {
  otherUser: UserWithVehicle;
  currentUser: UserWithVehicle;
  lastMessage?: Message;
}
