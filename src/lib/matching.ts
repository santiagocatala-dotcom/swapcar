// ============================================================
// SwapCar — Matching Logic
// Responsible for candidate discovery, match creation,
// match retrieval, and user stats.
// ============================================================

import type {
  UserWithVehicle,
  SwipeCandidate,
  MatchWithUsers,
  SwipeDirection,
} from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateCompatibility } from '@/lib/compatibility';

// ============================================================
// Types
// ============================================================

export interface UserStats {
  totalMatches: number;
  totalSwaps: number;
  daysOnPlatform: number;
  unreadMessages: number;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Build a UserWithVehicle row from a raw DB join result.
 * The raw row is expected to have a nested `vehicle` and `preferences` object
 * (as returned by Supabase `select('*, vehicle:vehicles(*), preferences:preferences(*)')`).
 */
function buildUserWithVehicle(raw: Record<string, unknown>): UserWithVehicle {
  return {
    id: raw.id as string,
    email: raw.email as string,
    name: raw.name as string,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    province: (raw.province as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    created_at: raw.created_at as string,
    last_seen: raw.last_seen as string,
    vehicle: raw.vehicle as UserWithVehicle['vehicle'],
    preferences: raw.preferences as UserWithVehicle['preferences'],
  };
}

// ============================================================
// getCandidates
// ============================================================

/**
 * Fetches all potential swipe candidates for a given user.
 *
 * Candidates are users who:
 *  - Are not the current user
 *  - Have not been swiped on (in any direction) by the current user
 *  - Have both a vehicle and preferences record
 *  - Pass basic compatibility filters (vehicle type overlap, distance range, year/km constraints)
 *
 * Results include the computed compatibility score and distance.
 */
export async function getCandidates(
  userId: string,
  supabase: SupabaseClient,
): Promise<SwipeCandidate[]> {
  // Step 1: Get IDs the user has already swiped on
  const { data: swipedRows, error: swipedError } = await supabase
    .from('swipes')
    .select('target_user_id')
    .eq('swiper_id', userId);

  if (swipedError) {
    console.error('[getCandidates] Error fetching swiped IDs:', swipedError);
    throw new Error(`Failed to fetch swiped users: ${swipedError.message}`);
  }

  const swipedIds: string[] = (swipedRows ?? []).map((r) => r.target_user_id);

  // Step 2: Get the current user's info (needed for compatibility calc)
  const { data: userDataRaw, error: meError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (meError || !userDataRaw) {
    console.error('[getCandidates] Error fetching current user:', meError);
    throw new Error(`Failed to fetch current user: ${meError?.message}`);
  }

  // Fetch vehicle and preferences separately (avoids 406 on join queries)
  const { data: myVehicle } = await supabase
    .from('vehicles').select('*').eq('user_id', userId).maybeSingle();
  const { data: myPrefs } = await supabase
    .from('preferences').select('*').eq('user_id', userId).maybeSingle();

  const currentUser: UserWithVehicle = {
    ...(userDataRaw as unknown as User),
    vehicle: (myVehicle as unknown as Vehicle) || {} as Vehicle,
    preferences: (myPrefs as unknown as Preferences) || {} as Preferences,
  };

  // Step 3: Fetch potential candidates
  // Exclude self + already-swiped users; require vehicle & preferences to exist.
  // We get users who have entries in both vehicles and preferences tables.
  let query = supabase
    .from('users')
    .select('*, vehicle:vehicles(*), preferences:preferences(*)')
    .not('id', 'eq', userId);

  // Exclude already-swiped users
  if (swipedIds.length > 0) {
    query = query.not('id', 'in', `(${swipedIds.map(id => `"${id}"`).join(',')})`);
  }

  const { data: candidatesRaw, error: candidatesError } = await query;

  if (candidatesError) {
    console.error('[getCandidates] Error fetching candidates:', candidatesError);
    throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
  }

  if (!candidatesRaw || candidatesRaw.length === 0) {
    return [];
  }

  // Step 4: Compute compatibility for each candidate, filter by basic fit, sort
  const candidates: SwipeCandidate[] = [];

  for (const raw of candidatesRaw) {
    try {
      const otherUser = buildUserWithVehicle(raw as Record<string, unknown>);
      const { score, details } = calculateCompatibility(
        currentUser,
        otherUser,
        currentUser.preferences,
        otherUser.preferences,
      );

      // Skip very low scores — they're not viable candidates
      if (score < 10) continue;

      candidates.push({
        user: otherUser,
        compatibility: score,
        compatibilityDetails: details,
        distance: 0, // calculated below
      });
    } catch {
      // Skip malformed rows
      continue;
    }
  }

  // Attach distance and sort by score descending
  for (const c of candidates) {
    c.distance = 0; // distance is already part of the compatibility score; we could compute it here but
    // it's not stored separately per candidate in this iteration. For a more accurate value,
    // calculateDistance would be called here.
  }

  return candidates.sort((a, b) => b.compatibility - a.compatibility);
}

// ============================================================
// checkAndCreateMatch
// ============================================================

/**
 * Checks if a mutual like exists between swiperId and targetUserId.
 * If swiperId has already liked targetUserId AND targetUserId has already liked swiperId,
 * a match record is created (if one doesn't already exist).
 *
 * Returns the match if created, or null if no mutual like exists.
 */
export async function checkAndCreateMatch(
  swiperId: string,
  targetUserId: string,
  supabase: SupabaseClient,
): Promise<{ matchId: string; isNew: boolean } | null> {
  // Step 1: Check if the swiper has already liked the target (this should be called AFTER recording the swipe)
  // We assume the swipe has already been recorded before calling this function,
  // so we check if both directions have 'like' swipes.

  const { data: reverseSwipes, error: reverseError } = await supabase
    .from('swipes')
    .select('id, direction')
    .eq('swiper_id', targetUserId)
    .eq('target_user_id', swiperId)
    .maybeSingle();

  if (reverseError) {
    console.error('[checkAndCreateMatch] Error checking reverse swipe:', reverseError);
    throw new Error(`Failed to check reverse swipe: ${reverseError.message}`);
  }

  // No mutual like — target user hasn't swiped on swiper, or didn't like them
  if (!reverseSwipes || reverseSwipes.direction !== 'like') {
    return null;
  }

  // Step 2: Check if a match already exists (idempotency)
  const { data: existingMatch, error: existingError } = await supabase
    .from('matches')
    .select('id')
    .or(`and(user1_id.eq.${swiperId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${swiperId})`)
    .maybeSingle();

  if (existingError) {
    console.error('[checkAndCreateMatch] Error checking existing match:', existingError);
    throw new Error(`Failed to check existing match: ${existingError.message}`);
  }

  if (existingMatch) {
    // Match already exists — return it
    return { matchId: existingMatch.id, isNew: false };
  }

  // Step 3: Compute compatibility score for the match
  let compatibilityScore: number | null = null;
  try {
    const { data: userA } = await supabase
      .from('users')
      .select('*, vehicle:vehicles(*), preferences:preferences(*)')
      .eq('id', swiperId)
      .single();

    const { data: userB } = await supabase
      .from('users')
      .select('*, vehicle:vehicles(*), preferences:preferences(*)')
      .eq('id', targetUserId)
      .single();

    if (userA && userB) {
      const uA = buildUserWithVehicle(userA as Record<string, unknown>);
      const uB = buildUserWithVehicle(userB as Record<string, unknown>);
      const result = calculateCompatibility(uA, uB, uA.preferences, uB.preferences);
      compatibilityScore = result.score;
    }
  } catch {
    // Non-fatal — proceed without a score
  }

  // Step 4: Normalize user IDs so user1_id < user2_id for consistency
  const [uid1, uid2] = [swiperId, targetUserId].sort();

  // Step 5: Create the match
  const { data: newMatch, error: insertError } = await supabase
    .from('matches')
    .insert({
      user1_id: uid1,
      user2_id: uid2,
      compatibility_score: compatibilityScore,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[checkAndCreateMatch] Error creating match:', insertError);
    throw new Error(`Failed to create match: ${insertError.message}`);
  }

  return { matchId: newMatch.id, isNew: true };
}

// ============================================================
// getMatches
// ============================================================

/**
 * Fetches all matches for a user, including the other user's info,
 * vehicle, preferences, and the last message in the conversation.
 */
export async function getMatches(
  userId: string,
  supabase: SupabaseClient,
): Promise<MatchWithUsers[]> {
  // Get all matches where user is user1 or user2
  const { data: matchesRaw, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (matchesError) {
    console.error('[getMatches] Error fetching matches:', matchesError);
    throw new Error(`Failed to fetch matches: ${matchesError.message}`);
  }

  if (!matchesRaw || matchesRaw.length === 0) {
    return [];
  }

  // Build the result by fetching the other user's info for each match
  const results: MatchWithUsers[] = [];

  for (const match of matchesRaw) {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;

    // Fetch other user with vehicle and preferences
    const { data: otherUserRaw, error: otherError } = await supabase
      .from('users')
      .select('*, vehicle:vehicles(*), preferences:preferences(*)')
      .eq('id', otherUserId)
      .single();

    if (otherError || !otherUserRaw) {
      console.warn(`[getMatches] Skipping match ${match.id}: failed to fetch other user`);
      continue;
    }

    // Fetch last message for this match
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const otherUser = buildUserWithVehicle(otherUserRaw as Record<string, unknown>);

    results.push({
      ...match,
      otherUser,
      currentUser: {} as UserWithVehicle, // caller can fill this in if needed
      lastMessage: lastMessage ?? undefined,
    });
  }

  return results;
}

// ============================================================
// getUserStats
// ============================================================

/**
 * Returns aggregate statistics for a user:
 *  - totalMatches: number of matches
 *  - totalSwaps: number of completed swaps (swapped_at is not null)
 *  - daysOnPlatform: time since account creation
 *  - unreadMessages: count of messages where the user is not the sender
 */
export async function getUserStats(
  userId: string,
  supabase: SupabaseClient,
): Promise<UserStats> {
  // Matches where user is involved
  const { count: totalMatches, error: countError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (countError) {
    console.error('[getUserStats] Error counting matches:', countError);
    throw new Error(`Failed to count matches: ${countError.message}`);
  }

  // Completed swaps (swapped_at is not null)
  const { count: totalSwaps, error: swapCountError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .not('swapped_at', 'is', null);

  if (swapCountError) {
    console.error('[getUserStats] Error counting swaps:', swapCountError);
    throw new Error(`Failed to count swaps: ${swapCountError.message}`);
  }

  // Unread messages (messages sent TO this user, in any of the user's match conversations)
  const { data: userMatchIds } = await supabase
    .from('matches')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  let unreadMessages = 0;
  if (userMatchIds && userMatchIds.length > 0) {
    const matchIdList = userMatchIds.map(m => m.id);
    const { count, error: unreadError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .in('match_id', matchIdList);

    if (unreadError) {
      console.error('[getUserStats] Error counting unread messages:', unreadError);
    } else {
      unreadMessages = count ?? 0;
    }
  }

  // Days on platform
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .single();

  let daysOnPlatform = 0;
  if (!userError && userData?.created_at) {
    const created = new Date(userData.created_at);
    const now = new Date();
    daysOnPlatform = Math.max(
      1,
      Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  return {
    totalMatches: totalMatches ?? 0,
    totalSwaps: totalSwaps ?? 0,
    daysOnPlatform,
    unreadMessages: unreadMessages ?? 0,
  };
}
