(async () => {
  /******************************************************************
   * QA Smoke Test for Supabase Edge Functions
   * Tries to use your existing Supabase client if available.
   * If not, it will load @supabase/supabase-js from CDN and ask
   * for your SUPABASE_URL and ANON_KEY (one-time prompts).
   *
   * Functions expected (already created in Lovable):
   *  - auth-whoami
   *  - org-current
   *  - reports-sales-summary
   *  - audit-run
   ******************************************************************/

  // ---- 0) Helpers -------------------------------------------------
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });

  const out = [];
  const log = (name, ok, extra='') => out.push({ check: name, status: ok ? 'PASS' : 'FAIL', info: extra });

  // ---- 1) Ensure Supabase client ---------------------------------
  // Try to reuse an existing client on the page
  let sb = window._qa_sb || window.supabase;

  // Try to discover existing config (some apps stash it on window.__env or similar)
  const guessUrl = window.__env?.SUPABASE_URL || window.SUPABASE_URL || window.__supabase?.url;
  const guessAnon = window.__env?.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || window.__supabase?.anon;

  if (!sb) {
    // Load UMD build of @supabase/supabase-js v2
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js');

    const url = guessUrl || prompt('Enter your SUPABASE_URL (e.g., https://xxxx.supabase.co)');
    const anon = guessAnon || prompt('Enter your SUPABASE_ANON_KEY');

    if (!url || !anon) {
      console.warn('Supabase URL/ANON KEY missing — cannot continue.');
      console.table([{check:'Supabase client', status:'FAIL', info:'missing url/anon'}]);
      return;
    }
    sb = window._qa_sb = window.supabase.createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  // ---- 2) Get an access token (for auth-protected functions) -----
  let accessToken = null;
  try {
    const { data } = await sb.auth.getSession();
    accessToken = data?.session?.access_token || null;
    log('Auth: session present', !!accessToken, accessToken ? 'using user access token' : 'no session found');
  } catch (e) {
    log('Auth: session present', false, String(e?.message || e));
  }

  // Helper to invoke a function with proper headers
  async function invoke(fnName, body) {
    // Prefer functions.invoke which handles base URL & headers
    try {
      const { data, error } = await sb.functions.invoke(fnName, {
        body: body || {},
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (error) {
        return { ok: false, status: '500', data: { message: error.message, details: error } };
      }
      return { ok: true, status: 200, data };
    } catch (err) {
      return { ok: false, status: 'NETWORK', data: { message: String(err?.message || err) } };
    }
  }

  // ---- 3) Hit each Edge Function ---------------------------------
  const me     = await invoke('auth-whoami');
  log('auth-whoami', me.ok, `status=${me.status}; user=${me.data?.user?.id ?? 'n/a'}`);

  const org    = await invoke('org-current');
  log('org-current', org.ok && !!org.data?.id, `status=${org.status}; org=${JSON.stringify(org.data || {})}`);

  // Use 30 days window for reports (adjust if your function expects different)
  const sales  = await invoke('reports-sales-summary', { days: 30 });
  const rowCount =
    (Array.isArray(sales.data?.rows) && sales.data.rows.length) ||
    (Array.isArray(sales.data) && sales.data.length) || 0;
  log('reports-sales-summary', sales.ok, `status=${sales.status}; rows=${rowCount}; msg=${sales.data?.message ?? ''}`);

  const audit  = await invoke('audit-run', { scope: 'smoke' });
  const checks = Array.isArray(audit.data?.checks) ? audit.data.checks.length : 0;
  const result = audit.data?.result ?? '';
  log('audit-run', audit.ok, `status=${audit.status}; result=${result}; checks=${checks}`);

  // ---- 4) Print results + stash details ---------------------------
  console.table(out);
  window.__qa = { me, org, sales, audit, out };
  console.log('Details stored at window.__qa — expand it and copy/paste here.');
})();