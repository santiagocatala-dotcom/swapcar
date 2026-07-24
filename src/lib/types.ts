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
  horsepower: number | null;
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
  min_hp: number | null;
  max_hp: number | null;
  preferred_categories: string[];
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
  cashDifference: CashDifference;
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

// ======== Cash / Offer types ========

export interface CashDifference {
  amount: number | null;
  currency: string;
  canCompute: boolean;
  /** From viewer's perspective: positive = viewer receives cash, negative = viewer pays */
}

export interface Offer {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  sender_vehicle_id: string | null;
  receiver_vehicle_id: string | null;
  cash_difference: number | null;
  cash_currency: string;
  cash_direction: 'sender_pays' | 'receiver_pays' | 'none';
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'countered';
  is_counter: boolean;
  parent_offer_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ======== Verification types ========

export interface UserVerification {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  vehicle_verified: boolean;
  phone: string | null;
}

export interface TrustScore {
  score: number;
  account_age_days: number;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  vehicle_verified: boolean;
}

export type VerificationBadge = 'email' | 'phone' | 'identity' | 'vehicle';
