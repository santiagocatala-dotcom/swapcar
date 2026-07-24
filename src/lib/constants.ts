// Lista de marcas de vehículos comunes en Argentina/Latinoamérica
export const BRANDS = [
  'Alfa Romeo',
  'Audi',
  'Beta',
  'BMW',
  'Chevrolet',
  'Chrysler',
  'Citroën',
  'Dodge',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Isuzu',
  'Iveco',
  'Jaguar',
  'Jeep',
  'Kia',
  'Lada',
  'Land Rover',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Peugeot',
  'Porsche',
  'Ram',
  'Renault',
  'Seat',
  'Subaru',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
];

// Modelos populares por marca (muestra representativa)
export const MODELS_BY_BRAND: Record<string, string[]> = {
  'Alfa Romeo': ['Giulia', 'Stelvio', 'MiTo', 'Giulietta', 'Tonale'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron', 'TT'],
  'Beta': ['RR', 'RR Racing', 'XTrainer', 'Enduro', 'Trial', 'Evo', 'RE', 'Alp'],
  'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X3', 'X5', 'X6', 'Z4', 'i3', 'i4'],
  Chevrolet: ['Onix', 'Cruze', 'Tracker', 'S10', 'Camaro', 'Spin', 'Joy', 'Montana', 'Equinox', 'Trailblazer'],
  Chrysler: ['300C', 'Town & Country', 'PT Cruiser'],
  Citroën: ['C3', 'C4', 'C5', 'Berlingo', 'DS3', 'DS4', 'DS5', 'C4 Cactus', 'C3 Aircross'],
  Dodge: ['Ram', 'Challenger', 'Charger', 'Durango', 'Journey'],
  Fiat: ['Cronos', 'Argo', 'Mobi', 'Pulse', 'Fastback', 'Strada', 'Toro', 'Ducato', 'Fiorino', 'Uno', 'Palio', 'Siena'],
  Ford: ['Focus', 'Fiesta', 'Ka', 'Ranger', 'Mustang', 'EcoSport', 'Territory', 'Maverick', 'Bronco', 'Explorer'],
  Honda: ['Civic', 'CR-V', 'HR-V', 'Fit', 'City', 'Accord', 'WR-V'],
  Hyundai: ['Tucson', 'Creta', 'HB20', 'Santa Fe', 'Elantra', 'i30', 'Veloster', 'Kona'],
  Isuzu: ['D-Max', 'MU-X'],
  Iveco: ['Daily', 'Tector'],
  Jaguar: ['F-PACE', 'E-PACE', 'XF', 'XE', 'F-TYPE', 'I-PACE'],
  Jeep: ['Renegade', 'Compass', 'Wrangler', 'Cherokee', 'Grand Cherokee', 'Gladiator'],
  Kia: ['Sportage', 'Seltos', 'Rio', 'Cerato', 'Sorento', 'Stonic', 'Picanto'],
  Lada: ['Niva', 'Samara'],
  'Land Rover': ['Range Rover', 'Discovery', 'Evoque', 'Velar', 'Defender', 'Freelander'],
  Lexus: ['NX', 'RX', 'UX', 'ES', 'IS', 'LX'],
  Mazda: ['Mazda 2', 'Mazda 3', 'Mazda 6', 'CX-3', 'CX-5', 'CX-30', 'MX-5'],
  'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'Clase S', 'GLA', 'GLC', 'GLE', 'GLS', 'Sprinter', 'Vito'],
  Mini: ['Cooper', 'Countryman', 'Clubman', 'Convertible'],
  Mitsubishi: ['L200', 'ASX', 'Outlander', 'Montero', 'Eclipse Cross'],
  Nissan: ['Versa', 'Sentra', 'Kicks', 'X-Trail', 'Frontier', 'Pathfinder', 'March', 'Altima'],
  Peugeot: ['208', '2008', '308', '3008', '408', '5008', 'Partner', 'Expert', 'Boxer', 'Landtrek'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Ram: ['RAM 1500', 'RAM 2500', 'RAM 3500', 'Rampage'],
  Renault: ['Sandero', 'Stepway', 'Logan', 'Kwid', 'Duster', 'Oroch', 'Alaskan', 'Master', 'Kangoo', 'Captur'],
  Seat: ['Ibiza', 'León', 'Arona', 'Ateca', 'Tarraco'],
  Subaru: ['Forester', 'Outback', 'XV', 'Impreza', 'WRX'],
  Suzuki: ['Swift', 'Vitara', 'Jimny', 'Baleno', 'Ertiga', 'Celerio'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Toyota: ['Corolla', 'Hilux', 'Etios', 'Yaris', 'SW4', 'RAV4', 'Land Cruiser', 'Hiace', 'Fortuner'],
  Volkswagen: ['Gol', 'Polo', 'T-Cross', 'Taos', 'Amarok', 'Virtus', 'Nivus', 'Saveiro', 'Passat', 'Tiguan', 'Jetta', 'Nuevo Gol'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60', 'V60', 'S90'],
};

// Tipos de vehículo
export const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedán', icon: '🚗' },
  { value: 'hatchback', label: 'Hatchback', icon: '🚙' },
  { value: 'suv', label: 'SUV / Todoterreno', icon: '🛻' },
  { value: 'pickup', label: 'Pick up', icon: '🛞' },
  { value: 'coupe', label: 'Coupé', icon: '🏎️' },
  { value: 'cabrio', label: 'Cabrio / Convertible', icon: '🚘' },
  { value: 'rural', label: 'Rural / Familiar', icon: '🚐' },
  { value: 'furgon', label: 'Furgón / Utilitario', icon: '🚐' },
  { value: 'moto', label: 'Moto', icon: '🏍️' },
  { value: 'cuatriciclo', label: 'Cuatriciclo / ATV', icon: '🏎️' },
] as const;

// Tipos de combustible
export const FUEL_TYPES = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'gnc', label: 'GNC' },
  { value: 'electrico', label: 'Eléctrico' },
  { value: 'hibrido', label: 'Híbrido' },
] as const;

// Tipos de transmisión
export const TRANSMISSION_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatica', label: 'Automática' },
] as const;

// Provincias de Argentina
export const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

// Ciudades principales por provincia
export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Buenos Aires': [
    'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Pergamino',
    'Olavarría', 'Junín', 'San Nicolás', 'Luján', 'Zárate', 'Campana',
    'Mercedes', 'Azul', 'Chivilcoy', 'Pehuajó', 'Necochea', 'Trenque Lauquen',
    'Lincoln', 'Balcarce', 'Dolores',
  ],
  CABA: ['Palermo', 'Belgrano', 'Recoleta', 'Nuñez', 'Caballito', 'Flores', 'Almagro', 'Villa Crespo'],
  Córdoba: ['Córdoba', 'Villa María', 'Río Cuarto', 'San Francisco', 'Villa Carlos Paz', 'Cruz del Eje', 'Jesús María'],
  'Santa Fe': ['Rosario', 'Santa Fe', 'Venado Tuerto', 'Rafaela', 'Sunchales', 'Reconquista', 'San Lorenzo', 'Casilda', 'Villa Constitución'],
  Mendoza: ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo', 'Maipú', 'Guaymallén'],
  Tucumán: ['San Miguel de Tucumán', 'Concepción', 'Yerba Buena', 'Tafí Viejo', 'Aguilares'],
};

// ============================================================
// Vehicle categories
// ============================================================

export type VehicleCategory = 'moderno' | 'clasico';

export function getVehicleCategory(year: number | null | undefined): VehicleCategory {
  if (year === null || year === undefined || year >= 1980) return 'moderno';
  return 'clasico';
}