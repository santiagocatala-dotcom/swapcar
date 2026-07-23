'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import {
  BRANDS,
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  MODELS_BY_BRAND,
  PROVINCES,
  CITIES_BY_PROVINCE,
} from '@/lib/constants';
import type { VehicleType, FuelType, Transmission, Vehicle, Preferences } from '@/lib/types';
import {
  ArrowLeft,
  Loader2,
  Check,
  Search,
  DollarSign,
  Gauge,
  MapPin,
  Car,
  ChevronDown,
  ChevronUp,
  Save,
  User,
  Camera,
  X,
} from 'lucide-react';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  // Profile fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  // Vehicle fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [kilometers, setKilometers] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [color, setColor] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  // Photo management
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Preferences fields
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
  const [preferredModels, setPreferredModels] = useState<string[]>([]);
  const [minYear, setMinYear] = useState(2005);
  const [maxKilometers, setMaxKilometers] = useState('');
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [transmissionTypes, setTransmissionTypes] = useState<Transmission[]>([]);
  const [maxDistanceKm, setMaxDistanceKm] = useState(500);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [maxDifferenceIPay, setMaxDifferenceIPay] = useState('');
  const [maxDifferenceIReceive, setMaxDifferenceIReceive] = useState('');
  const [acceptMultipleVehicles, setAcceptMultipleVehicles] = useState(true);
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptFinancing, setAcceptFinancing] = useState(false);
  const [onlyInPerson, setOnlyInPerson] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const fetchedRef = useRef(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

  const filteredBrands = BRANDS.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const selectedBrandModels = preferredBrands.length > 0
    ? Array.from(new Set(preferredBrands.flatMap((b) => MODELS_BY_BRAND[b] || [])))
    : [];

  const filteredModels = selectedBrandModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  ).filter((m) => !preferredModels.includes(m));

  const availableCities = province ? CITIES_BY_PROVINCE[province] || [] : [];

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (userData) {
        setName(userData.name || '');
        setCity(userData.city || '');
        setProvince(userData.province || '');
        setAvatarUrl(userData.avatar_url || null);
      }

      // Vehicle
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (vehicleData) {
        setBrand(vehicleData.brand);
        setModel(vehicleData.model);
        setVersion(vehicleData.version || '');
        setYear(vehicleData.year);
        setKilometers(vehicleData.kilometers?.toString() || '');
        setFuelType(vehicleData.fuel_type || '');
        setTransmission(vehicleData.transmission || '');
        setColor(vehicleData.color || '');
        setEstimatedValue(vehicleData.estimated_value?.toString() || '');
        setExistingPhotos(vehicleData.photos || []);
      }

      // Preferences
      const { data: prefsData } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (prefsData) {
        setVehicleTypes(prefsData.vehicle_types || []);
        setPreferredBrands(prefsData.preferred_brands || []);
        setPreferredModels(prefsData.preferred_models || []);
        setMinYear(prefsData.min_year || 2005);
        setMaxKilometers(prefsData.max_kilometers?.toString() || '');
        setFuelTypes(prefsData.fuel_types || []);
        setTransmissionTypes(prefsData.transmission_types || []);
        setMaxDistanceKm(prefsData.max_distance_km || 500);
        setMinValue(prefsData.min_value?.toString() || '');
        setMaxValue(prefsData.max_value?.toString() || '');
        setMaxDifferenceIPay(prefsData.max_difference_i_pay?.toString() || '');
        setMaxDifferenceIReceive(prefsData.max_difference_i_receive?.toString() || '');
        setAcceptMultipleVehicles(prefsData.accept_multiple_vehicles ?? true);
        setAcceptCash(prefsData.accept_cash ?? true);
        setAcceptFinancing(prefsData.accept_financing ?? false);
        setOnlyInPerson(prefsData.only_in_person ?? true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Save profile
  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('users')
        .update({ name, city, province })
        .eq('id', user.id);
      if (err) throw err;
      showSuccess('Perfil actualizado');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save vehicle
  const saveVehicle = async () => {
    if (!user) return;
    setSavingVehicle(true);
    setError('');
    try {
      const { data: existing } = await supabase
        .from('vehicles')
        .select('id, photos')
        .eq('user_id', user.id)
        .single();

      // Upload new photos
      let allPhotos = [...existingPhotos];
      if (newPhotos.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        const formData = new FormData();
        newPhotos.forEach((photo) => formData.append('photos', photo));
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        });
        const result = await res.json();
        if (result.success) {
          allPhotos = [...allPhotos, ...result.urls];
        }
      }

      const vehicleData = {
        user_id: user.id,
        brand,
        model,
        version: version || null,
        year,
        kilometers: kilometers ? parseInt(kilometers) : null,
        fuel_type: fuelType || null,
        transmission: transmission || null,
        color: color || null,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        photos: allPhotos,
      };

      if (existing) {
        const { error: err } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', existing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('vehicles')
          .insert(vehicleData);
        if (err) throw err;
      }
      showSuccess('Vehículo actualizado');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingVehicle(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    setError('');
    try {
      const { data: existing } = await supabase
        .from('preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const prefsData = {
        user_id: user.id,
        vehicle_types: vehicleTypes,
        preferred_brands: preferredBrands,
        preferred_models: preferredModels,
        min_year: minYear,
        max_kilometers: maxKilometers ? parseInt(maxKilometers) : null,
        fuel_types: fuelTypes,
        transmission_types: transmissionTypes,
        max_distance_km: maxDistanceKm,
        min_value: minValue ? parseFloat(minValue) : null,
        max_value: maxValue ? parseFloat(maxValue) : null,
        max_difference_i_pay: maxDifferenceIPay ? parseFloat(maxDifferenceIPay) : null,
        max_difference_i_receive: maxDifferenceIReceive ? parseFloat(maxDifferenceIReceive) : null,
        accept_multiple_vehicles: acceptMultipleVehicles,
        accept_cash: acceptCash,
        accept_financing: acceptFinancing,
        only_in_person: onlyInPerson,
      };

      if (existing) {
        const { error: err } = await supabase
          .from('preferences')
          .update(prefsData)
          .eq('id', existing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('preferences')
          .insert(prefsData);
        if (err) throw err;
      }
      showSuccess('Preferencias actualizadas');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Toggle helpers
  const toggleVehicleType = (type: VehicleType) => {
    setVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const toggleBrand = (b: string) => {
    setPreferredBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };
  const toggleModel = (m: string) => {
    setPreferredModels((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };
  const toggleFuelType = (t: FuelType) => {
    setFuelTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };
  const toggleTransmission = (t: Transmission) => {
    setTransmissionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // Photo handlers
  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - (existingPhotos.length + newPhotos.length);
    const toAdd = files.slice(0, remaining);
    setNewPhotos((prev) => [...prev, ...toAdd]);
    setNewPhotoPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  const saveAvatar = async () => {
    if (!user || !avatarFile) return;
    setSavingAvatar(true);
    setError('');
    try {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const fileName = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      showSuccess('Foto de perfil actualizada');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir foto');
    } finally {
      setSavingAvatar(false);
    }
  };
  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };
  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar perfil</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            {success}
          </div>
        )}

        {/* ===== Profile Section ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Información personal</h2>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-full cursor-pointer hover:bg-gray-800 transition-all">
                  {avatarFile ? 'Cambiar foto' : 'Sacar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {avatarFile && (
                  <button
                    onClick={saveAvatar}
                    disabled={savingAvatar}
                    className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    {savingAvatar ? 'Subiendo...' : 'Guardar'}
                  </button>
                )}
                {avatarUrl && !avatarFile && (
                  <button
                    onClick={async () => {
                      await supabase.from('users').update({ avatar_url: null }).eq('id', user!.id);
                      setAvatarUrl(null);
                      showSuccess('Foto eliminada');
                    }}
                    className="px-4 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-full hover:bg-red-200 transition-all"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400">Usá la cámara para sacarte una foto</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity('');
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              >
                <option value="">Seleccionar provincia</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ciudad
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-50"
              >
                <option value="">Seleccionar ciudad</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile || !name}
              className="w-full py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar información
            </button>
          </div>
        </section>

        {/* ===== Vehicle Section ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Mi vehículo</h2>
          </div>

          <div className="space-y-4">
            {/* Brand */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Marca
              </label>
              <input
                type="text"
                value={brandSearch || brand}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  setShowBrandSuggestions(true);
                  setBrand('');
                }}
                onFocus={() => setShowBrandSuggestions(true)}
                placeholder="Buscar marca..."
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              {showBrandSuggestions && brandSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBrand(b);
                        setBrandSearch(b);
                        setShowBrandSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Modelo
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej: Corolla"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Versión <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ej: GLI, XLT"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            {/* Year + Km */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Año
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kilómetros
                </label>
                <input
                  type="number"
                  value={kilometers}
                  onChange={(e) => setKilometers(e.target.value)}
                  placeholder="Ej: 50000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Fuel + Transmission */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Combustible
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="">Seleccionar</option>
                  {FUEL_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Caja
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="">Seleccionar</option>
                  {TRANSMISSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej: Blanco"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Valor estimado (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="Ej: 15000"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              onClick={saveVehicle}
              disabled={savingVehicle || !brand || !model}
              className="w-full py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {savingVehicle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar vehículo
            </button>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos <span className="text-gray-400">(máx. 10)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {newPhotoPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <img src={url} alt={`Nueva foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {(existingPhotos.length + newPhotos.length) < 10 && (
                  <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Agregar</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* ===== Preferences Section ===== */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Preferencias</h2>
          </div>

          <div className="space-y-4">
            {/* Vehicle Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de vehículo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map((vt) => {
                  const isSelected = vehicleTypes.includes(vt.value as VehicleType);
                  return (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => toggleVehicleType(vt.value as VehicleType)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{vt.icon}</span>
                      <span className="font-medium text-xs">{vt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marcas preferidas
              </label>
              {preferredBrands.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {preferredBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBrand(b)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                    >
                      {b} <span className="ml-1">&times;</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setShowBrandSuggestions(true);
                  }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  placeholder="Buscar marcas..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                {showBrandSuggestions && brandSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {BRANDS.filter((b) =>
                      b.toLowerCase().includes(brandSearch.toLowerCase())
                    ).filter((b) => !preferredBrands.includes(b))
                      .map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            toggleBrand(b);
                            setBrandSearch('');
                            setShowBrandSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {b}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Models */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelos preferidos
              </label>
              {preferredModels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {preferredModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModel(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                    >
                      {m} <span className="ml-1">&times;</span>
                    </button>
                  ))}
                </div>
              )}
              {preferredBrands.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={modelSearch || ''}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelDropdown(true);
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    placeholder="Buscar modelos..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                  {showModelDropdown && modelSearch && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                      {filteredModels.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            toggleModel(m);
                            setModelSearch('');
                            setShowModelDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Min Year Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Año mínimo: <span className="font-semibold">{minYear}</span>
              </label>
              <input
                type="range"
                min={1980}
                max={currentYear}
                value={minYear}
                onChange={(e) => setMinYear(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1980</span>
                <span>{currentYear}</span>
              </div>
            </div>

            {/* Max Km */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Máximo km
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={maxKilometers}
                  onChange={(e) => setMaxKilometers(e.target.value)}
                  placeholder="Ej: 80000"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Fuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Combustible
              </label>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map((ft) => {
                  const isSelected = fuelTypes.includes(ft.value as FuelType);
                  return (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => toggleFuelType(ft.value as FuelType)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {ft.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transmisión
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSMISSION_TYPES.map((tt) => {
                  const isSelected = transmissionTypes.includes(tt.value as Transmission);
                  return (
                    <button
                      key={tt.value}
                      type="button"
                      onClick={() => toggleTransmission(tt.value as Transmission)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {tt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Distancia máxima: {maxDistanceKm} km
              </label>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50 km</span>
                <span>2000 km</span>
              </div>
            </div>

            {/* Min/Max Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valor mínimo (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valor máximo (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Advanced */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Opciones avanzadas
            </button>

            {showAdvanced && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Diferencia máxima que podés poner (USD)
                  </label>
                  <input
                    type="number"
                    value={maxDifferenceIPay}
                    onChange={(e) => setMaxDifferenceIPay(e.target.value)}
                    placeholder="3000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Diferencia máxima que podés recibir (USD)
                  </label>
                  <input
                    type="number"
                    value={maxDifferenceIReceive}
                    onChange={(e) => setMaxDifferenceIReceive(e.target.value)}
                    placeholder="3000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <ToggleRow
                  label="Aceptar múltiples vehículos"
                  description="Permitir intercambios con más de un vehículo"
                  checked={acceptMultipleVehicles}
                  onChange={setAcceptMultipleVehicles}
                />
                <ToggleRow
                  label="Aceptar efectivo"
                  description="Aceptar que la otra persona ponga dinero"
                  checked={acceptCash}
                  onChange={setAcceptCash}
                />
                <ToggleRow
                  label="Aceptar financiación"
                  checked={acceptFinancing}
                  onChange={setAcceptFinancing}
                />
                <ToggleRow
                  label="Solo presencial"
                  checked={onlyInPerson}
                  onChange={setOnlyInPerson}
                />
              </div>
            )}

            <button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="w-full py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {savingPrefs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar preferencias
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-black' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
