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
    let verificationId: string | null = null;
    try {
      const { data: vData } = await supabaseAdmin.from('photo_verifications').insert({
        photo_url: securePath,
        user_id: user.id,
        file_hash: fileHash,
        status: 'pending',
        ai_provider: process.env.AI_VISION_API_KEY ? 'google_cloud_vision' : null,
      }).select('id').single();
      if (vData) verificationId = vData.id;
    } catch (e) {
      console.warn('[upload] Failed to log verification:', e);
    }

    // AI analysis via Google Cloud Vision (if configured)
    if (process.env.AI_VISION_API_KEY && verificationId) {
      analyzeImageWithAI(buffer, fileHash, user.id, verificationId, supabaseAdmin).catch((err) => {
        console.error('[upload] AI analysis failed:', err);
      });
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

// ============================================================
// AI Image Analysis — Google Cloud Vision
// ============================================================

interface VisionResponse {
  labelAnnotations?: { description: string; score: number }[];
  safeSearchAnnotation?: { adult: string; violence: string; racy: string };
  textAnnotations?: { description: string }[];
  localizedObjectAnnotations?: { name: string; score: number }[];
}

async function analyzeImageWithAI(
  buffer: Buffer,
  fileHash: string,
  userId: string,
  verificationId: string,
  supabaseAdmin: any,
): Promise<void> {
  const apiKey = process.env.AI_VISION_API_KEY;
  if (!apiKey) return;

  const base64 = buffer.toString('base64');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            { type: 'TEXT_DETECTION', maxResults: 5 },
          ],
        }],
      }),
    }
  );

  if (!response.ok) {
    console.error(`[Vision API] HTTP ${response.status}: ${await response.text()}`);
    return;
  }

  const data: { responses: VisionResponse[] } = await response.json();
  const result = data.responses?.[0];
  if (!result) return;

  // Check: does the image contain a vehicle?
  const vehicleLabels = ['vehicle', 'car', 'truck', 'motorcycle', 'automotive', 'suv', 'pickup', 'van'];
  const labels = (result.labelAnnotations ?? []).map((l) => l.description.toLowerCase());
  const hasVehicle = labels.some((l) => vehicleLabels.some((v) => l.includes(v)));
  const maxLabelScore = Math.max(...(result.labelAnnotations ?? []).map((l) => l.score), 0);

  // Check: safe search flags
  const safe = result.safeSearchAnnotation;
  const isAdult = safe?.adult === 'LIKELY' || safe?.adult === 'VERY_LIKELY';
  const isViolent = safe?.violence === 'LIKELY' || safe?.violence === 'VERY_LIKELY';

  // Check: excessive text (could be screenshot/ad)
  const text = result.textAnnotations?.[0]?.description ?? '';
  const hasExcessiveText = text.length > 200;

  // Classify
  let status = 'approved';
  let reason: string | null = null;
  let confidence = hasVehicle ? maxLabelScore : maxLabelScore * 0.5;

  if (isAdult || isViolent) {
    status = 'rejected';
    reason = isAdult ? 'Contenido inapropiado detectado.' : 'Violencia detectada.';
    confidence = 0;
  } else if (!hasVehicle && maxLabelScore > 0.5) {
    status = 'manual_review';
    reason = 'No se detectó un vehículo claramente.';
  } else if (hasExcessiveText) {
    status = 'manual_review';
    reason = 'La imagen contiene texto excesivo (posible captura de pantalla).';
  } else if (maxLabelScore < 0.3) {
    status = 'manual_review';
    reason = 'La imagen está borrosa o no es reconocible.';
  }

  // Update verification record
  await supabaseAdmin
    .from('photo_verifications')
    .update({
      status,
      rejection_reason: reason,
      ai_confidence: Math.round(confidence * 100) / 100,
      ai_result: result as any,
    })
    .eq('id', verificationId);
}
