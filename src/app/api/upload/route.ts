// ============================================================
// SwapCar — API Route for Secure Image Upload
// POST /api/upload
// Server-side validation: MIME type, size, dimensions, ownership
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { IMAGE_CONFIG, validateImageFile } from '@/lib/image-security';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // 1. Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  // 2. Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Formato inválido' },
      { status: 400 }
    );
  }

  const files = formData.getAll('photos') as File[];
  const vehicleId = formData.get('vehicle_id') as string | null;

  // 3. Validate vehicle_id if provided (ensure ownership)
  if (vehicleId) {
    const { data: vehicle, error: vehError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('user_id', user.id)
      .single();

    if (vehError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no te pertenece' },
        { status: 403 }
      );
    }
  }

  // 4. Check total photos per vehicle limit
  if (vehicleId) {
    const { data: currentVehicle } = await supabase
      .from('vehicles')
      .select('photos')
      .eq('id', vehicleId)
      .single();

    const existingCount = (currentVehicle?.photos as string[] ?? []).length;
    if (existingCount + files.length > IMAGE_CONFIG.MAX_PHOTOS_PER_VEHICLE) {
      return NextResponse.json({
        error: `Máximo ${IMAGE_CONFIG.MAX_PHOTOS_PER_VEHICLE} fotos por vehículo. Ya tenés ${existingCount}.`
      }, { status: 400 });
    }
  }

  // 5. Validate each file
  const uploadedUrls: string[] = [];

  for (const file of files) {
    // Basic validation
    const validationError = validateImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (validationError) {
      return NextResponse.json({ error: `Archivo "${file.name}": ${validationError}` }, { status: 400 });
    }

    // 6. Read and validate actual content header (beyond extension)
    const buffer = Buffer.from(await file.arrayBuffer());
    const header = buffer.slice(0, 12).toString('hex');

    // JPEG: ffd8ff
    // PNG: 89504e47
    // WebP: 52494646...57454250
    const isValidContent =
      header.startsWith('ffd8ff') ||           // JPEG
      header.startsWith('89504e47') ||          // PNG
      (header.includes('57454250') && header.startsWith('52494646')); // WebP (RIFF...WEBP)

    if (!isValidContent) {
      return NextResponse.json({
        error: `Archivo "${file.name}": el contenido no coincide con una imagen válida (JPEG/PNG/WebP).`
      }, { status: 400 });
    }

    // 7. Generate secure filename with random UUID
    const { generateSecureFilename } = await import('@/lib/image-security');
    const securePath = generateSecureFilename(user.id, file.name);

    // 8. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-photos')
      .upload(securePath, buffer, {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload] Error uploading:', uploadError.message);
      // Clean up already uploaded files
      for (const url of uploadedUrls) {
        const path = url.split('/').pop();
        if (path) {
          await supabase.storage.from('vehicle-photos').remove([`${user.id}/${path}`]);
        }
      }
      return NextResponse.json(
        { error: `Error al subir "${file.name}": ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 9. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicle-photos')
      .getPublicUrl(securePath);

    uploadedUrls.push(publicUrl);
  }

  return NextResponse.json({
    success: true,
    urls: uploadedUrls,
    count: uploadedUrls.length,
  });
}
