// ============================================================
// SwapCar — Rate Limiting Utility
// Uses Supabase RPC for server-side rate limiting
// ============================================================

export const RATE_LIMITS = {
  SIGNUP: { max: 3, window: 3600, label: 'signup' },           // 3 por hora
  LOGIN: { max: 10, window: 300, label: 'login' },             // 10 cada 5 min
  PASSWORD_RESET: { max: 3, window: 3600, label: 'reset' },    // 3 por hora
  SWIPE: { max: 200, window: 3600, label: 'swipe' },           // 200 por hora
  MESSAGE: { max: 60, window: 300, label: 'message' },         // 60 cada 5 min
  PHOTO_UPLOAD: { max: 20, window: 3600, label: 'upload' },    // 20 por hora
  SEARCH: { max: 100, window: 300, label: 'search' },          // 100 cada 5 min
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Checks rate limit via Supabase RPC.
 * Returns { allowed: boolean, message?: string }
 */
export async function checkRateLimit(
  supabase: any,
  userId: string | null,
  ipAddress: string | null,
  action: RateLimitAction
): Promise<{ allowed: boolean; message?: string }> {
  const config = RATE_LIMITS[action];
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_ip_address: ipAddress || 'unknown',
      p_action_type: config.label,
      p_max_requests: config.max,
      p_window_seconds: config.window,
    });
    if (error) {
      console.warn(`[rateLimit] RPC error: ${error.message}`);
      return { allowed: true }; // fail open if RPC fails
    }
    if (data === false) {
      return { allowed: false, message: `Demasiadas solicitudes. Esperá unos minutos.` };
    }
    return { allowed: true };
  } catch (err) {
    console.warn('[rateLimit] Exception:', err);
    return { allowed: true }; // fail open
  }
}
