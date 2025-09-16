(async () => {
  // Minimal QA check using your Supabase Edge Functions
  const sb = window.supabase || window._qa_sb;
  if (!sb) { console.error('No Supabase client on page. Tell me: NO CLIENT'); return; }

  const out = [];
  const log = (name, ok, info='') => out.push({ check: name, status: ok ? 'PASS' : 'FAIL', info });

  // Try to grab a JWT if you're logged in (optional)
  let token = null;
  try {
    const { data } = await sb.auth.getSession();
    token = data?.session?.access_token || null;
  } catch {}

  const invoke = async (fn, body={}) => {
    try {
      const { data, error } = await sb.functions.invoke(fn, {
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return error ? { ok:false, status:500, data:{ message:error.message }} : { ok:true, status:200, data };
    } catch (e) {
      return { ok:false, status:'NETWORK', data:{ message:String(e?.message||e) }};
    }
  };

  const me    = await invoke('auth-whoami');
  log('auth-whoami', me.ok, `status=${me.status}; user=${me.data?.user?.id ?? 'n/a'}`);

  const org   = await invoke('org-current');
  log('org-current', org.ok && !!org.data?.id, `status=${org.status}; org=${JSON.stringify(org.data||{})}`);

  const sales = await invoke('reports-sales-summary', { days: 30 });
  const rows  = Array.isArray(sales.data?.rows) ? sales.data.rows.length
             : Array.isArray(sales.data) ? sales.data.length : 0;
  log('reports-sales-summary', sales.ok, `status=${sales.status}; rows=${rows}; msg=${sales.data?.message ?? ''}`);

  const audit = await invoke('audit-run', { scope: 'smoke' });
  const checks = Array.isArray(audit.data?.checks) ? audit.data.checks.length : 0;
  log('audit-run', audit.ok, `status=${audit.status}; result=${audit.data?.result ?? ''}; checks=${checks}`);

  console.table(out);
  window.__qa = { me, org, sales, audit, out };
  console.log('Details stored at window.__qa — expand it and copy/paste here.');
  return out;
})();