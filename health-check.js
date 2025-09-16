// Define global QA smoke test function
window.runQASmoke = async () => {
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
};

// ---- CSV Export Helpers ----
function toCSV(rows) {
  if (!rows || !rows.length) return "id,org_id,machine_id,product_id,quantity,price,cost,created_at\n";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(","))
  ];
  return lines.join("\n");
}

async function fetchSalesForCSV(days = 30) {
  const sb = window.supabase || window._qa_sb;
  if (!sb) throw new Error("Supabase client not found on page.");

  // Pick up the current session token if present (same pattern as runQASmoke)
  let accessToken = null;
  try {
    const { data } = await sb.auth.getSession();
    accessToken = data?.session?.access_token || null;
  } catch { /* ignore */ }

  const { data, error } = await sb.functions.invoke("reports-sales-summary", {
    body: { days },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error) throw new Error(error.message || "Failed to fetch sales.");
  // Accept either { rows: [...] } or an array
  const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
  return rows;
}

window.exportSalesCSV = async function(days = 30) {
  try {
    const rows = await fetchSalesForCSV(days);
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    a.href = url;
    a.download = `gotham-sales-last-${days}-days-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log(`Exported ${rows.length} rows to CSV.`);
  } catch (e) {
    console.error("CSV export failed:", e?.message || e);
    alert(`CSV export failed: ${e?.message || e}`);
  }
};

// Wire the button automatically if present
(function wireCsvButton() {
  const btn = document.getElementById("exportCsvBtn");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    // Check for days input field
    const daysInput = document.getElementById("exportDays");
    const days = daysInput ? parseInt(daysInput.value) || 30 : 30;
    window.exportSalesCSV(days);
  });
  
  console.log("Export CSV button wired with dynamic days input.");
})();

// === DIAGNOSTIC SUGGESTIONS (append below your runQASmoke) ===
window.runQADiagnose = () => {
  const qa = window.__qa || {};
  const out = qa.out || [];
  const advice = [];

  const find = (name) => out.find(x => x.check === name) || { status:'', info:'' };

  // 1) auth-whoami
  {
    const a = find('auth-whoami');
    if (a.status === 'FAIL') {
      advice.push({
        title: 'auth-whoami failing',
        why: 'Likely not logged in or function deployed with wrong JWT settings.',
        fix: [
          'Make sure you are logged in on the QA page.',
          'Deploy with JWT verification ON:',
          '  supabase functions deploy auth-whoami',
        ].join('\n')
      });
    }
  }

  // 2) org-current
  {
    const a = find('org-current');
    if (a.status === 'FAIL') {
      advice.push({
        title: 'org-current failing',
        why: 'No default org mapped for the current user, or memberships/orgs table mismatch.',
        fix: [
          '-- In SQL editor, seed org + membership (replace YOUR_USER_ID if needed):',
          "insert into orgs (id, name) values (gen_random_uuid(), 'Gotham Vending') on conflict do nothing;",
          "insert into memberships (user_id, org_id, is_default)",
          "select auth.uid(), id, true from orgs where name='Gotham Vending' limit 1",
          "on conflict (user_id, org_id) do update set is_default = excluded.is_default;",
        ].join('\n')
      });
    }
  }

  // 3) reports-sales-summary
  {
    const a = find('reports-sales-summary');
    const rowsMatch = a.info?.match(/rows=(\d+)/);
    const rows = rowsMatch ? Number(rowsMatch[1]) : NaN;

    if (a.status === 'FAIL') {
      advice.push({
        title: 'reports-sales-summary failing',
        why: 'Function error, wrong payload, or RLS/policies blocking.',
        fix: [
          'Redeploy function:',
          '  supabase functions deploy reports-sales-summary',
          'Ensure request body is JSON with { days: 30 } and Authorization header is Bearer <token>.',
          'Check RLS: the current user must be a member of the org whose sales are queried.'
        ].join('\n')
      });
    } else if (!isNaN(rows) && rows === 0) {
      advice.push({
        title: 'reports-sales-summary has 0 rows',
        why: 'No recent data for your org — seed a couple of rows to validate the pipeline.',
        fix: [
          "-- Replace org_id with real one or use the subselect:",
          "insert into sales (org_id, machine_id, product_id, quantity, price, cost, created_at) values",
          "((select id from orgs where name='Gotham Vending' limit 1), 'M-001','P-COKE', 2, 2.00, 0.75, now() - interval '1 day'),",
          "((select id from orgs where name='Gotham Vending' limit 1), 'M-001','P-CHIPS',1, 1.50, 0.50, now() - interval '2 hours');"
        ].join('\n')
      });
    }
  }

  // 4) audit-run
  {
    const a = find('audit-run');
    if (a.status === 'FAIL') {
      advice.push({
        title: 'audit-run failing',
        why: 'This function is meant to be callable without JWT. If it 401/NETWORKs, deploy with no-verify-jwt.',
        fix: [
          'Deploy with JWT OFF:',
          '  supabase functions deploy audit-run --no-verify-jwt'
        ].join('\n')
      });
    }
  }

  // 5) Generic org_id null guard
  const anyOrgNullHint = /org_id/.test(
    [qa.sales?.data?.message, qa.me?.data?.message, qa.org?.data?.message].filter(Boolean).join(' ')
  );
  if (anyOrgNullHint) {
    advice.push({
      title: 'org_id NULL risk detected',
      why: 'Writes missing org_id cause NOT NULL or policy failures.',
      fix: [
        '-- Add trigger to default org_id from user mapping:',
        'create table if not exists user_org_default (',
        '  user_id uuid primary key references auth.users(id) on delete cascade,',
        '  org_id uuid not null references orgs(id)',
        ');',
        'create or replace function set_org_id_from_default()',
        'returns trigger language plpgsql as $$',
        'begin',
        '  if NEW.org_id is null then',
        '    select uod.org_id into NEW.org_id from user_org_default uod where uod.user_id = auth.uid();',
        '  end if;',
        '  return NEW;',
        'end; $$;',
        'drop trigger if exists trg_sales_set_org on public.sales;',
        'create trigger trg_sales_set_org',
        'before insert on public.sales',
        'for each row execute function set_org_id_from_default();'
      ].join('\n')
    });
  }

  // Print nicely
  if (!advice.length) {
    console.log('%cAll checks look good. Nothing to fix ✅', 'color: green; font-weight: bold;');
  } else {
    console.log('%cSuggested next actions:', 'color:#0af; font-weight:bold;');
    advice.forEach((a, i) => {
      console.group(`${i+1}) ${a.title}`);
      console.log('Why:', a.why);
      console.log('Fix:\n' + a.fix);
      console.groupEnd();
    });
  }
};

// Auto-run on script load (optional - comment out if you only want manual calls)
// window.runQASmoke();