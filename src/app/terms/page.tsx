'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-blue-500 hover:text-blue-600 mb-6 inline-block">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold mb-6">Términos y condiciones</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-gray-600">
          <p><strong>Última actualización:</strong> Julio 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">1. Aceptación de términos</h2>
          <p>Al usar SwapCar aceptás estos términos. Si no estás de acuerdo, no uses la plataforma.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">2. Descripción del servicio</h2>
          <p>SwapCar es una plataforma que conecta personas interesadas en intercambiar vehículos. No somos parte de ninguna transacción ni garantizamos la veracidad de la información publicada por los usuarios.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">3. Cuentas de usuario</h2>
          <p>Los usuarios deben registrar una cuenta con información veraz. Cada persona puede tener una sola cuenta. Sos responsable de mantener la confidencialidad de tu contraseña.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">4. Conducta del usuario</h2>
          <p>No podés:</p>
          <ul className="list-disc pl-5">
            <li>Publicar información falsa o engañosa</li>
            <li>Subir contenido ofensivo, ilegal o que infrinja derechos de terceros</li>
            <li>Acosar, estafar o engañar a otros usuarios</li>
            <li>Usar la plataforma para fines comerciales no autorizados</li>
            <li>Intentar vulnerar la seguridad del sistema</li>
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">5. Publicaciones de vehículos</h2>
          <p>Los usuarios son los únicos responsables de la veracidad de los datos y fotos que publican. SwapCar no verifica la información ni realiza inspecciones de los vehículos.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">6. Intercambios</h2>
          <p>SwapCar facilita el contacto entre usuarios pero no participa, garantiza ni se responsabiliza por las transacciones, intercambios o acuerdos que realicen los usuarios. Todo intercambio de vehículos es responsabilidad exclusiva de las partes.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">7. Limitación de responsabilidad</h2>
          <p>SwapCar no se responsabiliza por daños directos o indirectos derivados del uso de la plataforma, incluyendo pero no limitado a: transacciones fallidas, información incorrecta, o conducta de otros usuarios.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">8. Modificaciones</h2>
          <p>Podemos modificar estos términos en cualquier momento. Los cambios entran en vigor al publicarse en la plataforma.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">9. Contacto</h2>
          <p>Para consultas: <a href="mailto:santiagocatala@gmail.com" className="text-blue-500">santiagocatala@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
