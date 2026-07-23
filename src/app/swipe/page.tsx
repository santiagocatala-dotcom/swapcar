'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getCandidates, checkAndCreateMatch } from '@/lib/matching';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { SwipeCandidate } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';
import {
  Heart,
  X,
  Star,
  EyeOff,
  RefreshCw,
  MapPin,
  Gauge,
  Calendar,
  DollarSign,
  Loader2,
  Fuel,
  Cog,
  User,
} from 'lucide-react';

const SWIPE_THRESHOLD = 100;

export default function SwipePage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [matchModal, setMatchModal] = useState<{ name: string; compatibility: number; matchId: string } | null>(null);
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const fetchedRef = useRef(false);

  const fetchCandidates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getCandidates(user.id, supabase);
      setCandidates(result);
      setCurrentIndex(0);
      setExitX(0);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchCandidates();
    }
  }, [user, authLoading, router, fetchCandidates]);

  const currentCandidate = candidates[currentIndex];
  const hasMore = candidates.length > 0 && currentIndex < candidates.length;

  const recordSwipe = async (
    direction: 'like' | 'dislike' | 'favorite',
    targetUserId: string
  ) => {
    await (supabase.from('swipes') as any).insert({
      swiper_id: user!.id,
      target_user_id: targetUserId,
      direction,
    });
  };

  const handleSwipe = async (direction: 'like' | 'dislike' | 'favorite') => {
    if (!currentCandidate || actionLoading) return;
    setActionLoading(true);

    // Rate limit check
    const { allowed, message } = await checkRateLimit(supabase, user!.id, null, 'SWIPE');
    if (!allowed) {
      setActionLoading(false);
      console.warn('[swipe] Rate limited:', message);
      return;
    }

    const targetUserId = currentCandidate.user.id;

    // Record the swipe
    await recordSwipe(direction, targetUserId);

    // If like, check for match
    if (direction === 'like') {
      try {
        const matchResult = await checkAndCreateMatch(user!.id, targetUserId, supabase);
        if (matchResult && matchResult.isNew) {
          setMatchModal({
            name: currentCandidate.user.name,
            compatibility: currentCandidate.compatibility,
            matchId: matchResult.matchId,
          });
        }
      } catch (err) {
        console.error('Error checking match:', err);
      }
    }

    // Advance to next card
    setExitX(direction === 'like' ? 500 : -500);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setExitX(0);
      setActionLoading(false);
    }, 300);
  };

  const handleDragEnd = async (_: any, info: { offset: { x: number } }) => {
    setIsDragging(false);
    if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) return;
    const direction = info.offset.x > 0 ? 'like' : 'dislike';
    await handleSwipe(direction);
  };

  const closeMatchModal = () => {
    setMatchModal(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-3" />
          <p className="text-sm text-gray-400">Buscando vehículos...</p>
        </div>
      </div>
    );
  }

  // No candidates
  if (!hasMore) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <EyeOff className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            No hay más vehículos
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Por ahora no hay más vehículos para mostrarte. Volvé a buscar más tarde o ajustá tus preferencias.
          </p>
          <button
            onClick={fetchCandidates}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Buscar de nuevo
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const candidate = currentCandidate;
  const photo = candidate.user.vehicle.photos?.[0] || null;
  const compatClass =
    candidate.compatibility >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : candidate.compatibility >= 60
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-red-100 text-red-700 border-red-200';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-24">
        {/* Card stack */}
        <div className="relative w-full max-w-sm aspect-[3/4] mb-6">
          <AnimatePresence>
            <motion.div
              key={currentIndex}
              className="absolute inset-0 bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 cursor-grab active:cursor-grabbing"
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: exitX,
              }}
              exit={{
                x: exitX || 500,
                opacity: 0,
                transition: { duration: 0.3 },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Avatar + name top left */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  {candidate.user.avatar_url ? (
                    <img src={candidate.user.avatar_url} alt={candidate.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-white font-semibold text-sm leading-tight">{candidate.user.name}</p>
                  <p className="text-white/70 text-xs leading-tight">{candidate.user.city || candidate.user.province || ''}</p>
                </div>
              </div>

              {/* Photo */}
              <div className="relative h-2/3 bg-gray-100">
                {photo ? (
                  <img
                    src={photo}
                    alt={`${candidate.user.vehicle.brand} ${candidate.user.vehicle.model}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400">Sin foto</p>
                    </div>
                  </div>
                )}

                {/* Like / Dislike overlays */}
                <motion.div
                  className="absolute top-6 left-6 -rotate-12"
                  style={{ opacity: likeOpacity }}
                >
                  <span className="text-5xl font-bold text-green-500 border-4 border-green-500 rounded-xl px-3 py-1 bg-white/80 backdrop-blur-sm">
                    LIKE
                  </span>
                </motion.div>
                <motion.div
                  className="absolute top-6 right-6 rotate-12"
                  style={{ opacity: dislikeOpacity }}
                >
                  <span className="text-5xl font-bold text-red-500 border-4 border-red-500 rounded-xl px-3 py-1 bg-white/80 backdrop-blur-sm">
                    NOPE
                  </span>
                </motion.div>

                {/* Compatibility badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${compatClass}`}
                  >
                    {candidate.compatibility}%
                  </span>
                </div>

                {/* Distance badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                    <MapPin className="w-3 h-3" />
                    {candidate.distance > 0
                      ? `${candidate.distance} km`
                      : candidate.user.province || 'Sin ubicación'}
                  </span>
                </div>

                {/* Cash difference badge — bottom right */}
                {candidate.cashDifference.canCompute && candidate.cashDifference.amount !== null && (
                  <div className="absolute bottom-3 right-3 group">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                        candidate.cashDifference.amount > 0
                          ? 'bg-green-500/80 text-white'
                          : candidate.cashDifference.amount < 0
                          ? 'bg-orange-500/80 text-white'
                          : 'bg-gray-500/60 text-white'
                      }`}
                    >
                      {candidate.cashDifference.amount === 0 ? (
                        'Mano a mano'
                      ) : (
                        <>
                          {candidate.cashDifference.amount > 0 ? '+' : '−'}
                          {' '}USD {Math.abs(candidate.cashDifference.amount).toLocaleString()}
                        </>
                      )}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block group-active:block">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[200px] text-center whitespace-nowrap">
                        {candidate.cashDifference.amount > 0
                          ? `Recibirías este vehículo más USD ${candidate.cashDifference.amount.toLocaleString()}.`
                          : candidate.cashDifference.amount < 0
                          ? `Entregarías tu vehículo más USD ${Math.abs(candidate.cashDifference.amount).toLocaleString()}.`
                          : 'Intercambio sin diferencia económica.'}
                        <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {candidate.user.vehicle.brand} {candidate.user.vehicle.model}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {candidate.user.vehicle.version || candidate.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {candidate.user.vehicle.estimated_value
                        ? `$${candidate.user.vehicle.estimated_value.toLocaleString()}`
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    <Calendar className="w-3 h-3" />
                    {candidate.user.vehicle.year}
                  </span>
                  {candidate.user.vehicle.kilometers != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Gauge className="w-3 h-3" />
                      {candidate.user.vehicle.kilometers.toLocaleString()} km
                    </span>
                  )}
                  {candidate.user.vehicle.fuel_type && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Fuel className="w-3 h-3" />
                      {candidate.user.vehicle.fuel_type}
                    </span>
                  )}
                  {candidate.user.vehicle.transmission && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Cog className="w-3 h-3" />
                      {candidate.user.vehicle.transmission}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSwipe('dislike')}
            disabled={actionLoading}
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 transition-all disabled:opacity-50"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => handleSwipe('favorite')}
            disabled={actionLoading}
            className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500 active:scale-90 transition-all disabled:opacity-50"
          >
            <Star className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => handleSwipe('like')}
            disabled={actionLoading}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 active:scale-90 transition-all disabled:opacity-50"
          >
            <Heart className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => handleSwipe('dislike')}
            disabled={actionLoading}
            className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-500 active:scale-90 transition-all disabled:opacity-50"
          >
            <EyeOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MATCH! Modal */}
      <AnimatePresence>
        {matchModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMatchModal}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confetti-like decoration */}
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-10 h-10 text-green-500" fill="#22c55e" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Es un Match!</h2>
              <p className="text-gray-500 mb-1">
                Te gustó a {matchModal.name}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Compatibilidad: {matchModal.compatibility}%
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    closeMatchModal();
                    router.push(`/matches/${matchModal.matchId}`);
                  }}
                  className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
                >
                  Enviar mensaje
                </button>
                <button
                  onClick={closeMatchModal}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                >
                  Seguir explorando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
