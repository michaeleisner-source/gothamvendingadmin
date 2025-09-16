(async () => {
  // === Supabase Edge Functions endpoints ===
  const SUPABASE_URL = "https://wmbrnfocnlkhqflliaup.supabase.co";
  const endpoints = {
    whoami: `${SUPABASE_URL}/functions/v1/auth-whoami`,
    org: `${SUPABASE_URL}/functions/v1/org-current`,
    salesSummary: `${SUPABASE_URL}/functions/v1/reports-sales-summary?days=30`,
    audit: `${SUPABASE_URL}/functions/v1/audit-run`,
  };

  const out = [];
  const log = (name, ok, extra='') => out.push({ check: name, status: ok ? 'PASS' : 'FAIL', info: extra });

  const fetchJSON = async (url, opts) => {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnJuZm9jbmxraHFmbGxpYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODIwNjEsImV4cCI6MjA3MzM1ODA2MX0.Wzt4HcA_I6xEV9CfvxrC4X97Z1dlUU4OGkX1t5m0rWE'
        },
        ...opts
      });
      const text = await res.text();
      let data; try { data = text ? JSON.parse(text) : null; } catch {
        data = { parseError: text?.slice(0, 300) };
      }
      return { ok: res.ok, status: res.status, url, data };
    } catch (e) {
      return { ok: false, status: 'NETWORK', url, error: String(e?.message || e) };
    }
  };

  // 1) Auth present?
  const me = await fetchJSON(endpoints.whoami);
  log('Auth: user session', me.ok && me.data && me.data.user?.id, `status=${me.status}`);

  // 2) Org selected & propagated?
  const org = await fetchJSON(endpoints.org);
  log('Org: selected org present', org.ok && org.data && org.data.id, JSON.stringify(org.data || {}));

  // 3) Sales summary (handle empty dataset gracefully)
  const sales = await fetchJSON(endpoints.salesSummary);
  const rows = (Array.isArray(sales.data?.rows) ? sales.data.rows : (Array.isArray(sales.data) ? sales.data : []));
  log('Data: sales summary endpoint', sales.ok, `status=${sales.status}; rows=${Array.isArray(rows) ? rows.length : 'n/a'}; message=${sales.data?.message ?? ''}`);

  // 4) Audit POST
  const audit = await fetchJSON(endpoints.audit, { method: 'POST', body: JSON.stringify({ scope: 'smoke' }) });
  const auditChecks = Array.isArray(audit.data?.checks) ? audit.data.checks.length : 0;
  log('Audit: POST audit endpoint', audit.ok, `status=${audit.status}; result=${audit.data?.result ?? ''}; checks=${auditChecks}`);

  console.table(out);
  // Expose details for copy/paste
  window.__qa = { me, org, sales, audit, out };
  console.log('Details stored on window.__qa — expand it and copy/paste here.');
  
  return out;
})();