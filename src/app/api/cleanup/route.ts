// ============================================================
// SwapCar — Cleanup orphaned images
// Called by cron job to process deletion_log and remove photos
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Get pending deletions
  const { data: pending, error: fetchError } = await supabase
    .rpc('get_pending_deletions');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const logIds: string[] = [];
  let removedCount = 0;

  for (const entry of pending) {
    if (!entry.storage_paths || entry.storage_paths.length === 0) continue;

    // Extract filenames from public URLs
    const pathsToRemove: string[] = [];
    for (const url of entry.storage_paths) {
      // URL format: https://{ref}.supabase.co/storage/v1/object/public/vehicle-photos/{path}
      const match = url.match(/\/vehicle-photos\/(.+)$/);
      if (match) pathsToRemove.push(match[1]);
    }

    if (pathsToRemove.length > 0) {
      const { error: removeError } = await supabase.storage
        .from('vehicle-photos')
        .remove(pathsToRemove);

      if (!removeError) {
        removedCount += pathsToRemove.length;
        logIds.push(entry.log_id);
      }
    }
  }

  // Mark as processed
  if (logIds.length > 0) {
    await supabase.rpc('mark_deletions_processed', { p_log_ids: logIds });
  }

  return NextResponse.json({ cleaned: removedCount, processed: logIds.length });
}
