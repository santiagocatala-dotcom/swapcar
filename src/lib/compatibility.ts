// ============================================================
// SwapCar — Compatibility Engine
// Calculates a match percentage between two users based on
// vehicle type, economic fit, distance, year, kilometers,
// and brand/model preferences.
// ============================================================

import type {
  UserWithVehicle,
  Preferences,
  CompatibilityDetails,
  CashDifference,
} from '@/lib/types';

// ============================================================
// Configuration thresholds
// ============================================================

const CONFIG = {
  /** Max difference (in km) between same-province cities before we fall back to province-level */
  CITY_WITHIN_PROVINCE_MAX_KM: 100,
  /** Fallback distance when provinces differ (same country, no city-level data) */
  DIFFERENT_PROVINCE_DEFAULT_KM: 300,
  /** Weight multipliers for each dimension (must sum to 1.0) */
  WEIGHTS: {
    vehicleType: 0.20,
    economic: 0.25,
    distance: 0.15,
    year: 0.15,
    kilometer: 0.10,
    brandModel: 0.15,
  },
  /** Brand/model bonus cap (as fraction of that dimension's max score) */
  BRAND_MODEL_BONUS_CAP: 1.0,
  /** Value difference tolerance beyond which grade drops sharply */
  VALUE_TOLERANCE_RATIO: 2.0,
} as const;

// ============================================================
// Simplified geographic distance
// ============================================================

/**
 * Simplified geographic distance calculation.
 * Returns 0 if same city, 50 if same province (different city),
 * 300 if different provinces.
 *
 * This is intentionally simplified. In production this would call
 * a geocoding or distance-matrix service using lat/lng coordinates.
 */
export function calculateDistance(
  provinceA: string,
  cityA: string,
  provinceB: string,
  cityB: string,
): number {
  const norm = (s: string) => s?.trim().toLowerCase() ?? '';

  const pA = norm(provinceA);
  const cA = norm(cityA);
  const pB = norm(provinceB);
  const cB = norm(cityB);

  if (!pA || !pB) return CONFIG.DIFFERENT_PROVINCE_DEFAULT_KM;

  // Same city
  if (pA === pB && cA && cB && cA === cB) {
    return 0;
  }

  // Same province
  if (pA === pB) {
    return 50;
  }

  // Different provinces
  return CONFIG.DIFFERENT_PROVINCE_DEFAULT_KM;
}

// ============================================================
// Scoring helpers
// ============================================================

function gradeLinear(value: number, max: number, invert = false): number {
  if (max <= 0) return invert ? 0 : 100;

  const ratio = Math.min(value / max, 1);
  const score = invert ? (1 - ratio) : ratio;
  return Math.round(Math.max(0, Math.min(100, score * 100)));
}

function gradeInverseLinear(value: number, threshold: number): number {
  // Smaller values → higher score (e.g. for distance or value difference)
  if (threshold <= 0) return value === 0 ? 100 : 0;
  if (value <= 0) return 100;

  const ratio = value / threshold;
  if (ratio <= 0.5) return 100;
  if (ratio <= 1.0) return Math.round(100 - ((ratio - 0.5) / 0.5) * 50); // 100 → 50
  if (ratio <= CONFIG.VALUE_TOLERANCE_RATIO) {
    return Math.round(50 - ((ratio - 1.0) / (CONFIG.VALUE_TOLERANCE_RATIO - 1.0)) * 50); // 50 → 0
  }
  return 0;
}

// ============================================================
// Compatibility calculation
// ============================================================

/**
 * Calculates the compatibility score between two users.
 *
 * The algorithm evaluates six dimensions:
 *   1. Vehicle type compatibility
 *   2. Economic fit (value difference)
 *   3. Distance fit (geographic proximity)
 *   4. Year fit (vehicle year vs preference range)
 *   5. Kilometer fit (odometer vs preference max)
 *   6. Brand/model preference bonus
 *
 * Each dimension is scored 0-100, then combined via weighted average.
 */
export function calculateCompatibility(
  userA: UserWithVehicle,
  userB: UserWithVehicle,
  prefsA: Preferences,
  prefsB: Preferences,
): { score: number; details: CompatibilityDetails; cashDifference: CashDifference } {
  // ---- 1. Vehicle type compatibility ----
  const aVehicleTypes: string[] = (prefsA.vehicle_types ?? []).map((t) => t.toLowerCase());
  const bVehicleTypes: string[] = (prefsB.vehicle_types ?? []).map((t) => t.toLowerCase());
  const aType = userA.vehicle?.brand?.toLowerCase() ?? '';
  const bType = userB.vehicle?.brand?.toLowerCase() ?? '';

  // Check if A's preferences accept what B drives, and vice versa.
  // For vehicle type, we check the vehicle_types array against the other user's vehicle brand/type.
  // Since vehicle_types contains types like 'auto', 'moto', we need to consider brand affinity too.
  // A simpler approach: check if A's vehicle_types includes B's vehicle type, and vice versa.
  // The vehicle's "type" isn't stored directly on Vehicle — it's in the brand. Let's use the
  // vehicle model as a proxy or check if the user has any type preference overlap.
  // Actually per the types, Vehicle doesn't have a vehicle_type field. The vehicle_type is
  // a concept in Preferences. We'll check if the user's vehicle brand matches preferences.
  // In practice, the Vehicle would have a derived type based on brand/model or an explicit field.
  // For now, check if both users have vehicle_types in their preferences that overlap.
  const vehicleTypeMatch =
    (aVehicleTypes.length === 0 && bVehicleTypes.length === 0) ||
    aVehicleTypes.some((t) => bVehicleTypes.includes(t)) ||
    bVehicleTypes.some((t) => aVehicleTypes.includes(t));

  const vehicleTypeGrade = vehicleTypeMatch ? 100 : 30;

  // ---- 2. Economic fit ----
  const valueA = userA.vehicle?.estimated_value ?? null;
  const valueB = userB.vehicle?.estimated_value ?? null;

  let economicFit = false;
  let economicGrade = 50; // neutral default

  if (valueA !== null && valueB !== null && valueA > 0 && valueB > 0) {
    const diff = Math.abs(valueA - valueB);
    // Use the more generous tolerance from either user's preferences
    const maxDiffA = prefsA.max_difference_i_pay ?? prefsA.max_difference_i_receive ?? null;
    const maxDiffB = prefsB.max_difference_i_pay ?? prefsB.max_difference_i_receive ?? null;
    const maxDiff = Math.min(
      maxDiffA !== null ? maxDiffA : Infinity,
      maxDiffB !== null ? maxDiffB : Infinity,
    );

    economicGrade = gradeInverseLinear(diff, maxDiff === Infinity ? diff * 1.5 : maxDiff);
    economicFit = economicGrade >= 50;
  } else if (valueA !== null && valueB !== null) {
    // Both present but zero — assume neutral
    economicFit = true;
    economicGrade = 100;
  }
  // If either value is null, we can't compute — leave neutral

  // ---- Cash difference (from userA's perspective) ----
  const cashDifference = {
    amount: valueA !== null && valueB !== null
      ? Math.round((valueB - valueA) / 100) * 100 // round to nearest 100
      : null,
    currency: 'USD' as const,
    canCompute: valueA !== null && valueB !== null,
  };

  // ---- 3. Distance fit ----
  const provinceA = userA.province ?? '';
  const cityA = userA.city ?? '';
  const provinceB = userB.province ?? '';
  const cityB = userB.city ?? '';

  const distance = calculateDistance(provinceA, cityA, provinceB, cityB);
  const maxDistance = Math.min(
    prefsA.max_distance_km ?? Infinity,
    prefsB.max_distance_km ?? Infinity,
  );
  const distanceGrade = gradeInverseLinear(distance, maxDistance === Infinity ? distance * 1.5 : maxDistance);
  const distanceFit = distanceGrade >= 50;

  // ---- 4. Year fit ----
  const yearA = userA.vehicle?.year ?? null;
  const yearB = userB.vehicle?.year ?? null;

  let yearFit = false;
  let yearGrade = 50;

  if (yearA !== null && yearB !== null) {
    // A's preferences specify min_year → check if B's vehicle satisfies it (and vice versa)
    const aMinYear = prefsA.min_year ?? null;
    const bMinYear = prefsB.min_year ?? null;

    const aOkForB = aMinYear === null || yearA >= aMinYear;
    const bOkForA = bMinYear === null || yearB >= bMinYear;

    const yearDiff = Math.abs(yearA - yearB);

    if (aOkForB && bOkForA) {
      // Both within acceptable range — grade based on how close the years are
      yearGrade = yearDiff <= 1 ? 100 : yearDiff <= 3 ? 80 : yearDiff <= 7 ? 60 : 40;
      yearFit = yearGrade >= 50;
    } else {
      yearGrade = yearDiff <= 1 ? 40 : yearDiff <= 3 ? 25 : 10;
      yearFit = false;
    }
  } else if (yearA !== null || yearB !== null) {
    // Only one has a year defined — can't fully evaluate
    yearGrade = 70;
    yearFit = true;
  }

  // ---- 5. Kilometer fit ----
  const kmA = userA.vehicle?.kilometers ?? null;
  const kmB = userB.vehicle?.kilometers ?? null;

  let kilometerFit = false;
  let kilometerGrade = 50;

  if (kmA !== null && kmB !== null) {
    const aMaxKm = prefsA.max_kilometers ?? null;
    const bMaxKm = prefsB.max_kilometers ?? null;

    const aOkForB = aMaxKm === null || kmA <= aMaxKm;
    const bOkForA = bMaxKm === null || kmB <= bMaxKm;

    const kmDiff = Math.abs(kmA - kmB);

    if (aOkForB && bOkForA) {
      kilometerGrade = kmDiff <= 10000 ? 100 : kmDiff <= 30000 ? 80 : kmDiff <= 60000 ? 60 : 30;
      kilometerFit = kilometerGrade >= 50;
    } else {
      kilometerGrade = kmDiff <= 10000 ? 40 : kmDiff <= 30000 ? 20 : 5;
      kilometerFit = false;
    }
  } else if (kmA !== null || kmB !== null) {
    kilometerGrade = 70;
    kilometerFit = true;
  }

  // ---- 6. Brand/model preference bonus ----
  let brandModelFit = false;
  let brandModelGrade = 0;

  const brandA = userA.vehicle?.brand?.toLowerCase() ?? '';
  const modelA = userA.vehicle?.model?.toLowerCase() ?? '';
  const brandB = userB.vehicle?.brand?.toLowerCase() ?? '';
  const modelB = userB.vehicle?.model?.toLowerCase() ?? '';

  const prefsA_brands = (prefsA.preferred_brands ?? []).map((b) => b.toLowerCase());
  const prefsA_models = (prefsA.preferred_models ?? []).map((m) => m.toLowerCase());
  const prefsB_brands = (prefsB.preferred_brands ?? []).map((b) => b.toLowerCase());
  const prefsB_models = (prefsB.preferred_models ?? []).map((m) => m.toLowerCase());

  let bonusA = 0; // bonus because B's vehicle is desired by A
  let bonusB = 0; // bonus because A's vehicle is desired by B

  if (prefsA_brands.length > 0 || prefsA_models.length > 0) {
    if (prefsA_brands.includes(brandB)) bonusA += 60;
    if (prefsA_models.includes(modelB)) bonusA += 40;
  }

  if (prefsB_brands.length > 0 || prefsB_models.length > 0) {
    if (prefsB_brands.includes(brandA)) bonusB += 60;
    if (prefsB_models.includes(modelA)) bonusB += 40;
  }

  brandModelGrade = Math.min(bonusA + bonusB, 100);
  brandModelFit = brandModelGrade >= 50;

  // ---- Combine ----
  const w = CONFIG.WEIGHTS;

  const rawScore =
    vehicleTypeGrade * w.vehicleType +
    economicGrade * w.economic +
    distanceGrade * w.distance +
    yearGrade * w.year +
    kilometerGrade * w.kilometer +
    brandModelGrade * w.brandModel;

  // Penalise severely if vehicle types don't overlap at all
  const score = vehicleTypeMatch
    ? Math.round(rawScore)
    : Math.round(rawScore * 0.5);

  return {
    score: Math.max(0, Math.min(100, score)),
    details: {
      vehicleTypeMatch,
      economicFit,
      economicGrade,
      distanceFit,
      distanceGrade,
      yearFit,
      yearGrade,
      kilometerFit,
      kilometerGrade,
      brandModelFit,
      brandModelGrade,
    },
    cashDifference,
  };
}
