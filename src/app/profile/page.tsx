'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getUserStats } from '@/lib/matching';
import type { Vehicle, Preferences } from '@/lib/types';
import type { UserStats } from '@/lib/matching';
import { BottomNav } from '@/components/bottom-nav';
import {
  User,
  Settings,
  LogOut,
  Car,
  Heart,
  RefreshCw,
  Calendar,
  Loader2,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{
    name: string;
    avatar_url: string | null;
    city: string | null;
    province: string | null;
    last_seen: string;
  } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    try {
      // Profile data
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userErr && userErr.code !== 'PGRST116') {
        console.error('Profile fetch error:', userErr);
        setFetchError(userErr.message || 'Error al cargar perfil');
      }

      if (userData) {
        setProfile({
          name: userData.name,
          avatar_url: userData.avatar_url,
          city: userData.city,
          province: userData.province,
          last_seen: userData.last_seen,
        });
      } else {
        // No profile found → redirect to onboarding
        router.replace('/onboarding');
        return;
      }

      // Vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (vehiclesData) setVehicles(vehiclesData);

      // Preferences
      const { data: prefsData } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsData) setPreferences(prefsData);

      // Stats
      const userStats = await getUserStats(user.id, supabase);
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setFetchError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [user, supabase, router]);

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

  const handleLogout = async () => {
    await signOut();
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <p className="text-red-500 text-sm mb-4">{fetchError}</p>
          <button
            onClick={() => { fetchedRef.current = false; fetchData(); }}
            className="text-sm text-blue-500 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const vehiclePhoto = vehicles.length > 0 ? vehicles[0].photos?.[0] || null : null;
  const lastSeen = profile.last_seen
    ? new Date(profile.last_seen)
    : null;
  const lastSeenText = lastSeen
    ? formatLastSeen(lastSeen)
    : 'Desconocido';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-8 pb-24">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <User className="w-7 h-7 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {profile.name || 'Sin nombre'}
            </h1>
            {(profile.city || profile.province) && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {[profile.city, profile.province].filter(Boolean).join(', ')}
              </p>
            )}
            <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Última vez: {lastSeenText}
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard
              icon={<Heart className="w-5 h-5" />}
              value={stats.totalMatches}
              label="Matches"
              color="pink"
            />
            <StatCard
              icon={<RefreshCw className="w-5 h-5" />}
              value={stats.totalSwaps}
              label="Swaps"
              color="blue"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              value={stats.daysOnPlatform}
              label="Días"
              color="green"
            />
          </div>
        )}

        {/* My Vehicles */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Mis vehículos {vehicles.length > 0 ? `(${vehicles.length})` : ''}
            </h2>
            <Link
              href="/onboarding/vehicle"
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              + Agregar
            </Link>
          </div>
          {vehicles.length > 0 ? (
            <div className="space-y-3">
              {vehicles.map((v) => {
                const photo = v.photos?.[0] || null;
                return (
                  <Link
                    key={v.id}
                    href={`/profile/edit`}
                    className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {photo ? (
                          <img src={photo} alt={`${v.brand} ${v.model}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">
                          {v.brand} {v.model}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {v.year}
                          {v.kilometers != null ? ` · ${v.kilometers.toLocaleString()} km` : ''}
                        </p>
                        {v.estimated_value && (
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            ${v.estimated_value.toLocaleString()} USD
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">
                  No registraste vehículos todavía
                </p>
                <Link
                  href="/onboarding/vehicle"
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Agregar vehículo
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Preferences Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Preferencias</h2>
            <Link
              href="/profile/edit"
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              Editar
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            {preferences ? (
              <div className="space-y-2">
                {preferences.vehicle_types?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 shrink-0">
                      Tipos:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {preferences.vehicle_types.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.preferred_brands?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 shrink-0">
                      Marcas:
                    </span>
                    <p className="text-xs text-gray-600 truncate">
                      {preferences.preferred_brands.slice(0, 5).join(', ')}
                      {preferences.preferred_brands.length > 5
                        ? ` y ${preferences.preferred_brands.length - 5} más`
                        : ''}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-24 shrink-0">
                    Distancia:
                  </span>
                  <p className="text-xs text-gray-600">
                    {preferences.max_distance_km} km
                  </p>
                </div>
                {preferences.min_value != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 shrink-0">
                      Valor:
                    </span>
                    <p className="text-xs text-gray-600">
                      {preferences.min_value != null
                        ? `$${preferences.min_value.toLocaleString()}`
                        : '$0'}
                      {preferences.max_value != null
                        ? ` - $${preferences.max_value.toLocaleString()}`
                        : ' o más'}{' '}
                      USD
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin preferencias configuradas
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'pink' | 'blue' | 'green';
}) {
  const colorMap = {
    pink: 'bg-pink-50 text-pink-500',
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-green-50 text-green-500',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString('es-AR');
}
