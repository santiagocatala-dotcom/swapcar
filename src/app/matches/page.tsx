'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getMatches } from '@/lib/matching';
import type { MatchWithUsers } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';
import {
  MessageCircle,
  Heart,
  Loader2,
  ChevronRight,
} from 'lucide-react';

export default function MatchesPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [matches, setMatches] = useState<MatchWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getMatches(user.id, supabase);
      setMatches(result);
    } catch (err) {
      console.error('Error fetching matches:', err);
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
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando matches...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-pink-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Todavía no tenés matches
          </h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Empezá a explorar vehículos y dale like a los que te gusten.
            Si a ellos también les gusta tu vehículo, ¡es match!
          </p>
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all"
          >
            Explorar vehículos
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Matches</h1>
          <p className="text-sm text-gray-400 mt-1">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        <div className="space-y-3">
          {matches.map((match) => {
            const otherVehicle = match.otherUser.vehicle;
            const photo = otherVehicle?.photos?.[0] || null;
            const lastMsg = match.lastMessage?.content || '';
            const compatColor =
              (match.compatibility_score ?? 0) >= 80
                ? 'text-green-600 bg-green-50'
                : (match.compatibility_score ?? 0) >= 60
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-red-600 bg-red-50';

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all"
              >
                {/* Photo */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${otherVehicle?.brand || ''} ${otherVehicle?.model || ''}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {match.otherUser.name}
                    </h3>
                    {match.compatibility_score != null && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${compatColor}`}
                      >
                        {match.compatibility_score}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {otherVehicle?.brand} {otherVehicle?.model}
                    {otherVehicle?.year ? ` · ${otherVehicle.year}` : ''}
                  </p>
                  {lastMsg ? (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {lastMsg}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1">
                      Enviá tu primer mensaje
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
