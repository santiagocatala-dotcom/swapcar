'use client';

import { useState } from 'react';
import { Check, Copy, Database, Globe } from 'lucide-react';

export default function SetupPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ Configurar SwapCar
          </h1>
          <p className="text-gray-500">
            Seguí estos pasos para conectar Supabase y levantar el proyecto
          </p>
        </div>

        <div className="space-y-6">
          {/* Paso 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">1</div>
              <Globe size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Crear proyecto en Supabase</h2>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Andá a{' '}
              <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a>{' '}
              y creá un nuevo proyecto. Elegí la región más cercana a Argentina.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">2</div>
              <Database size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Obtener credenciales</h2>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              En Project Settings {'>'} API, copiá la Project URL y Anon Key.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Project URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono">https://xxxxxxxxxxxx.supabase.co</code>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Anon Public Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono truncate">eyJhbG...VCJ9...</code>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">3</div>
              <Database size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Configurar .env.local</h2>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm font-mono overflow-x-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key...`}</pre>
              <button onClick={() => copyToClipboard("NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key...", 'env')}
                className="absolute top-3 right-3 p-2 hover:bg-gray-700 rounded-lg transition-colors">
                {copied === 'env' ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">4</div>
              <Database size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Ejecutar migración</h2>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              En el SQL Editor de Supabase, ejecutá el contenido de:
            </p>
            <code className="block bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono mb-3">supabase/migrations/00001_schema.sql</code>
            <p className="text-gray-600 text-sm">O con la CLI: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">supabase db push</code></p>
          </div>

          {/* Paso 5 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">5</div>
              <Globe size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">Configurar Auth</h2>
            </div>
            <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5">
              <li>Habilitar Email/Password sign-up</li>
              <li>Site URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code></li>
              <li>Redirect URLs: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">http://localhost:3000/auth/callback</code></li>
              <li>Deshabilitar confirmación de email para desarrollo</li>
            </ul>
          </div>

          {/* Paso 6 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">6</div>
              <Globe size={20} className="text-gray-400" />
              <h2 className="font-semibold text-lg">¡A levantar!</h2>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm font-mono">cd ~/swapcar &amp;&amp; npm run dev</pre>
            <p className="text-gray-600 text-sm mt-3">La app corre en <code className="bg-gray-100 px-2 py-0.5 rounded">http://localhost:3000</code></p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-black text-white rounded-2xl text-center">
          <h2 className="text-xl font-bold mb-2">🎉 ¡Todo listo!</h2>
          <p className="text-gray-300 mb-4">Una vez configurado, la app está lista para usar.</p>
          <a href="/auth/signup" className="inline-block bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Ir a registrarse
          </a>
        </div>
      </div>
    </div>
  );
}
