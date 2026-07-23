'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import {
  BRANDS,
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  MODELS_BY_BRAND,
} from '@/lib/constants';
import type { VehicleType, FuelType, Transmission } from '@/lib/types';
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
} from 'lucide-react';

export default function OnboardingPreferencesPage() {
  const { user } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [preferredBrands, setPreferredBrands] = useState<string[]>([]);
  const [preferredModels, setPreferredModels] = useState<string[]>([]);
  const [minYear, setMinYear] = useState<number>(2005);
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredBrands = BRANDS.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  ).filter((b) => !preferredBrands.includes(b));

  const selectedBrandModels = preferredBrands.length > 0
    ? Array.from(
        new Set(
          preferredBrands.flatMap((b) => MODELS_BY_BRAND[b] || [])
        )
      )
    : [];

  const filteredModels = selectedBrandModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  ).filter((m) => !preferredModels.includes(m));

  const currentYear = new Date().getFullYear();

  const toggleVehicleType = (type: VehicleType) => {
    setVehicleTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const toggleBrand = (brand: string) => {
    setPreferredBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleModel = (model: string) => {
    setPreferredModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    );
  };

  const toggleFuelType = (type: FuelType) => {
    setFuelTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const toggleTransmission = (type: Transmission) => {
    setTransmissionTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('preferences').insert({
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
      });

      if (insertError) throw insertError;

      router.push('/swipe');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar preferencias';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/onboarding/vehicle')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Preferencias de intercambio
          </h1>
          <p className="text-gray-500 text-sm">
            Decí qué estás buscando para encontrar el mejor match
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de vehículo que aceptás
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_TYPES.map((vt) => {
                const isSelected = vehicleTypes.includes(vt.value as VehicleType);
                return (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => toggleVehicleType(vt.value as VehicleType)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{vt.icon}</span>
                    <span className="font-medium text-sm">{vt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marcas preferidas
            </label>
            {preferredBrands.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {preferredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                  >
                    {brand}
                    <span className="ml-1">&times;</span>
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setShowBrandDropdown(true);
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  placeholder="Buscar marcas..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              {showBrandDropdown && brandSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredBrands.length === 0 ? (
                    <div className="px-4 py-2.5 text-sm text-gray-400">
                      Sin resultados
                    </div>
                  ) : (
                    filteredBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          toggleBrand(b);
                          setBrandSearch('');
                          setShowBrandDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {b}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preferred Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelos preferidos
            </label>
            {preferredModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {preferredModels.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => toggleModel(model)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-xs rounded-full"
                  >
                    {model}
                    <span className="ml-1">&times;</span>
                  </button>
                ))}
              </div>
            )}
            {preferredBrands.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Seleccioná marcas primero para ver modelos disponibles
              </p>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelDropdown(true);
                    }}
                    onFocus={() => setShowModelDropdown(true)}
                    placeholder="Buscar modelos..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                {showModelDropdown && modelSearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                      <div className="px-4 py-2.5 text-sm text-gray-400">
                        Sin resultados
                      </div>
                    ) : (
                      filteredModels.map((m) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Min Year */}
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

          {/* Max Kilometers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Máximo de kilómetros
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

          {/* Fuel Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de combustible
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

          {/* Transmission Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de transmisión
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

          {/* Max Distance Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Distancia máxima: <span className="font-semibold">{maxDistanceKm} km</span>
              </span>
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

          {/* Min / Max Value */}
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
                  placeholder="Ej: 5000"
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
                  placeholder="Ej: 50000"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Opciones avanzadas
          </button>

          {showAdvanced && (
            <div className="space-y-5 animate-fade-in">
              {/* Max Difference I Pay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Diferencia máxima que podés poner (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={maxDifferenceIPay}
                    onChange={(e) => setMaxDifferenceIPay(e.target.value)}
                    placeholder="Ej: 3000"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Max Difference I Receive */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Diferencia máxima que podés recibir (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={maxDifferenceIReceive}
                    onChange={(e) => setMaxDifferenceIReceive(e.target.value)}
                    placeholder="Ej: 3000"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Toggle switches */}
              <div className="space-y-3">
                <ToggleRow
                  label="Aceptar múltiples vehículos"
                  description="Permitir intercambios que incluyan más de un vehículo"
                  checked={acceptMultipleVehicles}
                  onChange={setAcceptMultipleVehicles}
                />
                <ToggleRow
                  label="Aceptar entrega de efectivo"
                  description="Aceptar que la otra persona ponga dinero además de su vehículo"
                  checked={acceptCash}
                  onChange={setAcceptCash}
                />
                <ToggleRow
                  label="Aceptar financiación"
                  description="Aceptar intercambios con financiación externa"
                  checked={acceptFinancing}
                  onChange={setAcceptFinancing}
                />
                <ToggleRow
                  label="Solo presencial"
                  description="Solo intercambios en persona, sin envíos"
                  checked={onlyInPerson}
                  onChange={setOnlyInPerson}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || vehicleTypes.length === 0}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Car className="w-4 h-4" />
                Empezar a explorar
              </>
            )}
          </button>
        </form>
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
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-white rounded-xl border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
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
