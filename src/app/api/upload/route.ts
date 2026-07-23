// ============================================================
// SwapCar — API Route for Secure Image Upload
// POST /api/upload
// Server-side validation: MIME type, size, dimensions, ownership
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { IMAGE_CONFIG, validateImageFile } from '@/lib/image-security';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Read auth token from request header (sent by client)
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verify token via admin client
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // Create user-authenticated client for DB/storage operations
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'Authorization': `Bearer ${token}` } },
    }
  );

  // Rate limit check
  const rateResult = await checkRateLimit(supabaseAdmin, user.id, null, 'PHOTO_UPLOAD');
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: rateResult.message || 'Demasiadas subidas. Esperá unos minutos.' },
      { status: 429 }
    );
  }

  // Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  const files = formData.getAll('photos') as File[];
  const vehicleId = formData.get('vehicle_id') as string | null;

  // Validate vehicle_id if provided (ensure ownership)
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

  // Check total photos per vehicle limit
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

  // Validate each file
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const validationError = validateImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (validationError) {
      return NextResponse.json({ error: `Archivo "${file.name}": ${validationError}` }, { status: 400 });
    }

    // Read and validate actual content header (magic bytes)
    const buffer = Buffer.from(await file.arrayBuffer());
    const header = buffer.slice(0, 12).toString('hex');

    const isValidContent =
      header.startsWith('ffd8ff') ||
      header.startsWith('89504e47') ||
      (header.includes('57454250') && header.startsWith('52494646'));

    if (!isValidContent) {
      return NextResponse.json({
        error: `Archivo "${file.name}": el contenido no coincide con una imagen válida (JPEG/PNG/WebP).`
      }, { status: 400 });
    }

    // Generate secure filename
    const { generateSecureFilename } = await import('@/lib/image-security');
    const securePath = generateSecureFilename(user.id, file.name);

    // Compute SHA-256 hash for duplicate detection
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Check for exact duplicate across ALL users
    const { data: existingHash } = await supabaseAdmin
      .from('photo_verifications')
      .select('id, user_id')
      .eq('file_hash', fileHash)
      .maybeSingle();

    if (existingHash && existingHash.user_id !== user.id) {
      // Log the duplicate for review
      console.warn(`[upload] Duplicate photo detected: ${fileHash} already used by user ${existingHash.user_id}`);
    }

    // Log verification attempt (fire-and-forget)
    try {
      await supabaseAdmin.from('photo_verifications').insert({
        photo_url: securePath,
        user_id: user.id,
        file_hash: fileHash,
        status: 'pending',
        ai_provider: null,
      });
    } catch (e) {
      // Non-critical — don't block upload
      console.warn('[upload] Failed to log verification:', e);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-photos')
      .upload(securePath, buffer, {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload] Error uploading:', uploadError.message);
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
