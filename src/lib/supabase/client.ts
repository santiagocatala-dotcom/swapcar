'use client';

let db: any = null;

export function createClient(): any {
  if (db) return db;

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const STORAGE_KEY = 'sb-swapcar-auth';

  function headers(extra: Record<string, string> = {}): Record<string, string> {
    return { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Accept': 'application/json', ...extra };
  }

  function store(u: any) {
    if (u?.user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u.user, access_token: u.access_token }));
  }
  function restore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }
  function clearStore() { localStorage.removeItem(STORAGE_KEY); }

  async function apiGet(path: string) {
    const r = await fetch(`${URL}/rest/v1/${path}`, { headers: headers() });
    if (!r.ok) { console.error(`[API] ${r.status}: ${path.substring(0,80)}`); return []; }
    const t = await r.text();
    try { return JSON.parse(t); } catch { return []; }
  }

  async function apiPost(path: string, body: any, prefer = '') {
    const h = headers({ 'Content-Type': 'application/json' });
    if (prefer) h['Prefer'] = prefer;
    const r = await fetch(`${URL}/rest/v1/${path}`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    const text = await r.text();
    try { return { data: text ? JSON.parse(text) : null, error: r.ok ? null : { message: `${r.status}` } }; }
    catch { return { data: null, error: r.ok ? null : { message: `${r.status}` } }; }
  }

  // Query builder
  function makeQuery(table: string) {
    const params = new URLSearchParams();
    const q: any = {
      select: (cols: string) => { params.set('select', cols); return q; },
      eq: (col: string, val: any) => { params.set(col, `eq.${val}`); return q; },
      neq: (col: string, val: any) => { params.set(col, `neq.${val}`); return q; },
      not: (col: string, op: string, val: any) => { params.set(col, `not.${op}.${val}`); return q; },
      order: (col: string, dir = 'asc') => { params.set('order', `${col}.${dir}`); return q; },
      limit: (n: number) => { params.set('limit', String(n)); return q; },
      in: (col: string, vals: any[]) => { params.set(col, `in.(${vals.join(',')})`); return q; },
    };
    q.single = async () => { params.set('limit','2'); const d = await apiGet(`${table}?${params}`); return { data: d[0]||null, error: d.length===0?{code:'PGRST116',message:'Not found'}:null }; };
    q.maybeSingle = async () => { params.set('limit','2'); const d = await apiGet(`${table}?${params}`); return { data: d[0]||null, error: null }; };
    q.then = async (resolve: (v: any) => any) => { const d = await apiGet(`${table}?${params}`); resolve({data:Array.isArray(d)?d:[],error:null}); };
    q.upsert = (body: any) => ({ then: async (resolve: (v: any) => any) => resolve(await apiPost(table, body, 'resolution=merge-duplicates')) });
    q.insert = (body: any) => ({ then: async (resolve: (v: any) => any) => resolve(await apiPost(table, body)) });
    q.update = (body: any) => ({ eq: (c: string, v: any) => ({ then: async (resolve: (v: any) => any) => {
      const h = headers({'Content-Type':'application/json','Prefer':'return=representation'});
      const r = await fetch(`${URL}/rest/v1/${table}?${c}=eq.${v}`, { method:'PATCH', headers:h, body: JSON.stringify(body) });
      const t = await r.text(); resolve({data:t?JSON.parse(t):null,error:r.ok?null:{message:`${r.status}`}});
    }}) });
    q.delete = () => ({ eq: (c: string, v: any) => ({ then: async (resolve: (v: any) => any) => {
      const r = await fetch(`${URL}/rest/v1/${table}?${c}=eq.${v}`, { method:'DELETE', headers:headers() });
      resolve({error:r.ok?null:{message:`${r.status}`}});
    }}) });
    return q;
  }

  db = {
    from: (t: string) => makeQuery(t),
    auth: {
      getSession: async () => ({ data: { session: restore() }, error: null }),
      getUser: async () => ({ data: { user: restore()?.user || null }, error: null }),
      onAuthStateChange: (cb: (e: string, s: any) => void) => {
        const s = restore();
        // Only fire once, not on every render
        if (s) setTimeout(() => cb('INITIAL', s), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: async (c: any) => {
        const r = await fetch(`${URL}/auth/v1/signup`, { method:'POST', headers:{'apikey':KEY,'Content-Type':'application/json'}, body: JSON.stringify({email:c.email,password:c.password,data:c.options?.data}) });
        const d = await r.json();
        if (d.user) { store(d); await apiPost('users', {id:d.user.id,email:d.user.email,name:c.options?.data?.name||d.user.email?.split('@')[0]||'Usuario'}, 'resolution=merge-duplicates'); }
        return { data:{user:d.user}, error:d.error_description?{message:d.error_description}:null };
      },
      signInWithPassword: async (c: any) => {
        const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method:'POST', headers:{'apikey':KEY,'Content-Type':'application/json'}, body: JSON.stringify({email:c.email,password:c.password}) });
        const d = await r.json();
        if (d.user) {
          store(d);
          await apiPost('users', {id:d.user.id,email:d.user.email,name:d.user.user_metadata?.name||d.user.email?.split('@')[0]||'Usuario'}, 'resolution=merge-duplicates');
        }
        return { data:{user:d.user}, error:d.error_description?{message:d.error_description}:null };
      },
      signInWithOAuth: async (c: any) => { window.location.href = `${URL}/auth/v1/authorize?provider=${c.provider}&redirect_to=${c.options?.redirectTo||window.location.origin}`; return { data:{}, error:null as any }; },
      signOut: async () => { clearStore(); return { error: null }; },
    },
    storage: {
      from: (b: string) => ({
        upload: async (path: string, file: File) => { const fd = new FormData(); fd.append('file',file); const r = await fetch(`${URL}/storage/v1/object/${b}/${path}`,{method:'POST',headers:{'apikey':KEY,'Authorization':`Bearer ${KEY}`},body:fd}); const d=await r.json(); return {data:d,error:r.ok?null:{message:d?.error||'Upload failed'}}; },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `${URL}/storage/v1/object/public/${b}/${path}` } }),
      }),
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
  };

  return db;
}
