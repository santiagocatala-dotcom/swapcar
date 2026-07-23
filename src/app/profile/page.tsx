'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getUserStats } from '@/lib/matching';
import type { Vehicle, Preferences } from '@/lib/types';
import type { UserStats } from '@/lib/matching';
import {
  Settings, LogOut, Car, Heart, RefreshCw, Loader2, MapPin, Clock, User,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null; city: string | null; province: string | null; last_seen: string } | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    let mounted = true;
    const load = async () => {
      try {
        const [userRes, vehRes, prefRes] = await Promise.all([
          supabase.from('users').select('name, avatar_url, city, province, last_seen').eq('id', user.id).single(),
          supabase.from('vehicles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('preferences').select('*').eq('user_id', user.id).maybeSingle(),
        ]);

        if (!mounted) return;
        if (userRes.data) setProfile(userRes.data as typeof profile);
        if (vehRes.data) setVehicle(vehRes.data as Vehicle);
        if (prefRes.data) setPreferences(prefRes.data as Preferences);

        try {
          const s = await getUserStats(user.id, supabase);
          if (mounted) setStats(s);
        } catch { /* stats optional */ }
      } catch (err) {
        console.error('Profile error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user, authLoading, router, supabase]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f23] flex flex-col items-center justify-center p-6 text-center">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Perfil no encontrado</h2>
        <p className="text-sm text-gray-500 mb-4">Parece que tu perfil no se creó correctamente.</p>
        <button onClick={() => signOut()} className="px-6 py-2 bg-black text-white rounded-xl text-sm">Volver a iniciar sesión</button>
      </div>
    );
  }

  const fmtTime = (d: number) => d < 30 ? `${d} días` : `${Math.floor(d / 30)} ${Math.floor(d / 30) === 1 ? 'mes' : 'meses'}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f23]">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/profile/edit')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button onClick={signOut} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              <LogOut className="w-5 h-5 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black dark:bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {profile.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{profile.name}</h2>
              {(profile.province || profile.city) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />{[profile.city, profile.province].filter(Boolean).join(', ')}
                </p>
              )}
              {stats && <p className="text-xs text-gray-400 mt-1">{fmtTime(stats.daysOnPlatform)} en SwapCar</p>}
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalMatches}</p>
              <p className="text-[10px] text-gray-400">Matches</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <RefreshCw className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSwaps}</p>
              <p className="text-[10px] text-gray-400">Permutas</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
              <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
              <p className="text-[10px] text-gray-400">Mensajes</p>
            </div>
          </div>
        )}

        {vehicle && (
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-700 mb-4">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400" />Mi vehículo
              </h3>
              <button onClick={() => router.push('/profile/edit')} className="text-xs text-blue-600 font-medium">Editar</button>
            </div>
            <div className="p-4">
              {vehicle.photos?.[0] && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                  <img src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
                </div>
              )}
              <h4 className="font-semibold text-gray-900 dark:text-white">{vehicle.brand} {vehicle.model}{vehicle.version ? ` ${vehicle.version}` : ''}</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">{vehicle.year}</span>
                {vehicle.kilometers !== null && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">{vehicle.kilometers.toLocaleString()} km</span>}
                <span className="text-xs bg-black dark:bg-blue-600 text-white px-2.5 py-1 rounded-lg font-medium">${(vehicle.estimated_value ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {preferences && (
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-700 mb-4">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Preferencias</h3>
              <button onClick={() => router.push('/profile/edit')} className="text-xs text-blue-600 font-medium">Editar</button>
            </div>
            <div className="p-4">
              {preferences.vehicle_types?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">Busca:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.vehicle_types.map(t => (
                      <span key={t} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Radio: {preferences.max_distance_km} km</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
