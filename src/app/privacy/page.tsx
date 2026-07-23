'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-blue-500 hover:text-blue-600 mb-6 inline-block">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold mb-6">Política de privacidad</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-gray-600">
          <p><strong>Última actualización:</strong> Julio 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">1. Datos que recopilamos</h2>
          <p>Recopilamos la siguiente información cuando usás SwapCar:</p>
          <ul className="list-disc pl-5">
            <li><strong>Registro:</strong> nombre, email, contraseña (encriptada por Supabase Auth)</li>
            <li><strong>Perfil:</strong> provincia, ciudad</li>
            <li><strong>Vehículo:</strong> marca, modelo, año, km, fotos, valor estimado</li>
            <li><strong>Preferencias:</strong> tipos de vehículo, marcas, rangos de valor/distancia/año</li>
            <li><strong>Uso:</strong> swipes, matches, mensajes</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">2. Cómo usamos tus datos</h2>
          <p>Usamos tus datos para:</p>
          <ul className="list-disc pl-5">
            <li>Operar la plataforma (registro, swipe, matching, chat)</li>
            <li>Calcular compatibilidad entre usuarios</li>
            <li>Mostrar perfiles y vehículos a otros usuarios</li>
            <li>Mejorar el servicio</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">3. Datos visibles para otros usuarios</h2>
          <p>Tu nombre, provincia, ciudad, fotos y datos del vehículo son visibles para otros usuarios autenticados. Tu email y datos de contacto privados <strong>no</strong> se muestran públicamente.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">4. Fotos</h2>
          <p>Las fotos que subís se almacenan en Supabase Storage. Al subir una foto, eliminamos automáticamente los metadatos EXIF (incluyendo ubicación GPS).</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">5. Base legal</h2>
          <p>Procesamos tus datos bajo tu consentimiento al registrarte en la plataforma. Podés retirar tu consentimiento en cualquier momento eliminando tu cuenta.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">6. Eliminación de datos</h2>
          <p>Podés solicitar la eliminación de tu cuenta y todos tus datos contactándonos a <a href="mailto:santiagocatala@gmail.com" className="text-blue-500">santiagocatala@gmail.com</a>. Eliminaremos tus datos personales, vehículos, preferencias, swipes, matches y mensajes en un plazo de 7 días.</p>
          <p>Las fotos en Storage se eliminarán como parte del proceso de limpieza de datos huérfanos.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">7. Almacenamiento de datos</h2>
          <p>Tus datos se almacenan en servidores de Supabase (AWS us-east-1). Podés solicitar una copia de tus datos en cualquier momento.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">8. Terceros</h2>
          <p>Usamos los siguientes servicios de terceros:</p>
          <ul className="list-disc pl-5">
            <li><strong>Supabase</strong> (autenticación, base de datos, almacenamiento, realtime)</li>
            <li><strong>Vercel</strong> (hosting de la aplicación)</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">9. Cookies</h2>
          <p>Usamos localStorage del navegador para mantener tu sesión iniciada y preferencias de tema. No usamos cookies de tracking ni de terceros.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">10. Cambios</h2>
          <p>Podemos actualizar esta política. Te notificaremos de cambios significativos a través de la plataforma o por email.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">11. Contacto</h2>
          <p><a href="mailto:santiagocatala@gmail.com" className="text-blue-500">santiagocatala@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
