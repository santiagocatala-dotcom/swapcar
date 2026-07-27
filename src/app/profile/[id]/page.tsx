'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getVehicleCategory } from '@/lib/constants';
import { BottomNav } from '@/components/bottom-nav';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  DollarSign,
  MessageCircle,
  Loader2,
  Heart,
  User,
} from 'lucide-react';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useSupabase();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    const fetchProfile = async () => {
      setLoading(true);
      // Fetch user
      const { data: u } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      // Fetch vehicles
      const { data: v } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      setProfileUser(u);
      setVehicles(v || []);
      setLoading(false);
    };

    fetchProfile();
  }, [user, id, supabase]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <User className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Usuario no encontrado</h2>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white font-bold text-[8px]">R</div>
          <span className="font-bold text-xs text-gray-900">REVE</span>
          <div className="flex-1" />
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-24">

        {/* User info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {profileUser.avatar_url ? (
              <img src={profileUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{profileUser.name}</h1>
            {(profileUser.province || profileUser.city) && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {[profileUser.city, profileUser.province].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Vehicles */}
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Este usuario no tiene vehículos publicados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {vehicles.length === 1 ? 'Su vehículo' : 'Sus vehículos'}
            </h2>
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Photos */}
                {v.photos && v.photos.length > 0 ? (
                  <div className="relative aspect-[16/9] bg-gray-100">
                    <img
                      src={selectedPhoto || v.photos[0]}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(selectedPhoto ? null : null)}
                    />
                    {v.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {v.photos.map((p: string, i: number) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(p); }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              (selectedPhoto || v.photos[0]) === p ? 'bg-white scale-125' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-200" />
                  </div>
                )}

                {/* Vehicle info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{v.brand} {v.model}</h3>
                      {v.version && <p className="text-xs text-gray-400">{v.version}</p>}
                    </div>
                    {getVehicleCategory(v.year) === 'clasico' && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">Clásico</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {v.year && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {v.year}
                      </div>
                    )}
                    {v.kilometers != null && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        {v.kilometers.toLocaleString()} km
                      </div>
                    )}
                    {v.horsepower && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Cog className="w-3.5 h-3.5 text-gray-400" />
                        {v.horsepower} HP
                      </div>
                    )}
                    {v.fuel_type && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Fuel className="w-3.5 h-3.5 text-gray-400" />
                        {v.fuel_type === 'gasolina' ? 'Nafta' : v.fuel_type === 'diesel' ? 'Diesel' : v.fuel_type === 'electric' ? 'Eléctrico' : v.fuel_type === 'hybrid' ? 'Híbrido' : v.fuel_type}
                      </div>
                    )}
                    {v.transmission && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Cog className="w-3.5 h-3.5 text-gray-400" />
                        {v.transmission === 'manual' ? 'Manual' : v.transmission === 'automatic' ? 'Automático' : v.transmission}
                      </div>
                    )}
                    {v.color && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: v.color }} />
                        {v.color}
                      </div>
                    )}
                    {v.estimated_value != null && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                        USD {v.estimated_value.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {v.description && (
                    <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-2">
                      {v.description}
                    </p>
                  )}

                  {/* Cash difference */}
                  {v.cash_adjustment != null && v.cash_adjustment > 0 && (
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
                      v.cash_adjustment_direction === 'pay'
                        ? 'bg-red-50 text-red-600'
                        : v.cash_adjustment_direction === 'receive'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}>
                      {v.cash_adjustment_direction === 'pay'
                        ? `Paga ${v.cash_currency} ${v.cash_adjustment.toLocaleString()}`
                        : v.cash_adjustment_direction === 'receive'
                        ? `Recibe ${v.cash_currency} ${v.cash_adjustment.toLocaleString()}`
                        : 'Sin diferencia económica'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat button */}
        <Link
          href={`/matches/${id}`}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar mensaje
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
