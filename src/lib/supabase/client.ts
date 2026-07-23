'use client';

// Minimal Supabase client - uses fetch with Accept: application/json
// to avoid PostgREST 406 errors from the Supabase project

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_KEY = 'sb-swapcar-auth';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Accept': 'application/json', ...extra };
}

function store(u: any) {
  if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}
function restore() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function clear() { localStorage.removeItem(STORAGE_KEY); }

async function get(path: string) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: headers() });
  if (!r.ok) { console.error(`[DB] ${r.status}: ${path}`); return r.status === 404 ? null : []; }
  const t = await r.text();
  if (!t) return [];
  try { return JSON.parse(t); } catch { return []; }
}

async function post(path: string, body: any, prefer = '') {
  const h = headers({ 'Content-Type': 'application/json' });
  if (prefer) h['Prefer'] = prefer;
  const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'POST', headers: h, body: JSON.stringify(body) });
  if (!r.ok) return { data: null, error: { message: `${r.status}` } };
  const text = await r.text();
  return { data: text ? JSON.parse(text) : null, error: null };
}

async function patch(path: string, body: any) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'PATCH', headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }), body: JSON.stringify(body) });
  if (!r.ok) return { data: null, error: { message: `${r.status}` } };
  return { data: await r.json(), error: null };
}

async function del(path: string) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'DELETE', headers: headers() });
  return { error: r.ok ? null : { message: `${r.status}` } };
}

const db = {
  from: (t: string) => {
    let params = '';
    const q = {
      select: (cols: string) => { params = `select=${encodeURIComponent(cols)}`; return q; },
      eq: (c: string, v: any) => { params += `&${c}=eq.${v}`; return q; },
      neq: (c: string, v: any) => { params += `&${c}=neq.${v}`; return q; },
      not: (c: string, op: string, v: any) => { params += `&${c}=not.${op}.${v}`; return q; },
      in: (c: string, v: any[]) => { params += `&${c}=in.(${v.join(',')})`; return q; },
      order: (c: string, d = 'asc') => { params += `&order=${c}.${d}`; return q; },
      limit: (n: number) => { params += `&limit=${n}`; return q; },
      single: async () => {
        params += '&limit=2';
        const data = await get(`${t}?${params}`);
        const arr = Array.isArray(data) ? data : [];
        return { data: arr[0] || null, error: arr.length === 0 ? { code: 'PGRST116', message: 'Not found' } : null };
      },
      maybeSingle: async () => {
        params += '&limit=2';
        const data = await get(`${t}?${params}`);
        const arr = Array.isArray(data) ? data : [];
        return { data: arr[0] || null, error: null };
      },
      then: async (resolve: (v: any) => any) => {
        const data = await get(`${t}?${params}`);
        resolve({ data: Array.isArray(data) ? data : [], error: null });
      },
      upsert: (body: any) => ({
        then: async (resolve: (v: any) => any) => resolve(await post(t, body, 'resolution=merge-duplicates')),
      }),
      insert: (body: any) => ({
        then: async (resolve: (v: any) => any) => resolve(await post(t, body)),
      }),
      update: (body: any) => ({
        eq: (c: string, v: any) => ({
          then: async (resolve: (v: any) => any) => resolve(await patch(`${t}?${c}=eq.${v}`, body)),
        }),
      }),
      delete: () => ({
        eq: (c: string, v: any) => ({
          then: async (resolve: (v: any) => any) => resolve(await del(`${t}?${c}=eq.${v}`)),
        }),
      }),
    };
    return q;
  },
  auth: {
    getSession: async () => ({ data: { session: restore() }, error: null }),
    getUser: async () => ({ data: { user: restore()?.user || null }, error: null }),
    onAuthStateChange: (cb: (e: string, s: any) => void) => {
      const s = restore();
      if (s) setTimeout(() => cb('INITIAL', s), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signUp: async (c: any) => {
      const r = await fetch(`${URL}/auth/v1/signup`, { method: 'POST', headers: { 'apikey': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: c.email, password: c.password, data: c.options?.data }) });
      const d = await r.json();
      if (d.user) {
        store(d);
        // Create profile in public.users immediately (even if email confirmation is ON)
        await post(`users`, {
          id: d.user.id,
          email: d.user.email,
          name: c.options?.data?.name || d.user.email?.split('@')[0] || 'Usuario',
        }, 'resolution=merge-duplicates');
      }
      return { data: { user: d.user }, error: d.error_description ? { message: d.error_description } : null };
    },
    signInWithPassword: async (c: any) => {
      const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'apikey': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: c.email, password: c.password }) });
      const d = await r.json();
      if (d.user) {
        store(d);
        // Create profile if doesn't exist (handles existing auth users without public.users row)
        await post(`users`, {
          id: d.user.id,
          email: d.user.email,
          name: d.user.user_metadata?.name || d.user.email?.split('@')[0] || 'Usuario',
        }, 'resolution=merge-duplicates');
      }
      return { data: { user: d.user }, error: d.error_description ? { message: d.error_description } : null };
    },
    signInWithOAuth: async (c: any) => {
      window.location.href = `${URL}/auth/v1/authorize?provider=${c.provider}&redirect_to=${c.options?.redirectTo || window.location.origin}`;
      return { data: {}, error: null as any };
    },
    signOut: async () => { clear(); return { error: null }; },
  },
  storage: {
    from: (b: string) => ({
      upload: async (path: string, file: File) => {
        const fd = new FormData(); fd.append('file', file);
        const r = await fetch(`${URL}/storage/v1/object/${b}/${path}`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }, body: fd });
        const d = await r.json();
        return { data: d, error: r.ok ? null : { message: d?.error || 'Upload failed' } };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `${URL}/storage/v1/object/public/${b}/${path}` } }),
    }),
  },
  channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
};

export function createClient(): any { return db; }
