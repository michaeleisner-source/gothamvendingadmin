export type RouteCheck = { path: string; status: 'OK'|'TIMEOUT'|'NAV_ERROR'; ms: number; breadcrumb: string; hasTable: boolean; hasCard: boolean; };

const norm = (p: string) => (p || '/').replace(/\/+$/, '') || '/';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function checkRoutes(expected: string[]): Promise<RouteCheck[]> {
  const mainSel = '.gv-page', crumbSel = '#gv-breadcrumb-slot', startPath = norm(location.pathname);
  const out: RouteCheck[] = [];
  
  async function goto(path: string): Promise<RouteCheck> {
    const target = norm(path);
    const main = document.querySelector(mainSel) as HTMLElement | null;
    const crumb = document.querySelector(crumbSel) as HTMLElement | null;
    const prevMainHTML = main ? main.innerHTML : '';
    const prevCrumbText = crumb ? (crumb.textContent || '') : '';
    let status: RouteCheck['status'] = 'TIMEOUT';
    const started = performance.now();
    
    const obs = main ? new MutationObserver(() => {
      const contentChanged = main!.innerHTML !== prevMainHTML;
      const crumbChanged = (document.querySelector(crumbSel)?.textContent || '') !== prevCrumbText;
      if (contentChanged || crumbChanged) finish('OK');
    }) : null;
    
    function finish(s: RouteCheck['status']) { status = s; obs?.disconnect(); }
    
    if (obs && main) obs.observe(main, { childList: true, subtree: true });
    
    try { 
      history.pushState({}, '', target); 
      dispatchEvent(new PopStateEvent('popstate')); 
    } catch { 
      finish('NAV_ERROR'); 
    }
    
    const deadline = Date.now() + 5000;
    while (status === 'TIMEOUT' && Date.now() < deadline) {
      await sleep(120);
      const contentChanged = main && main.innerHTML !== prevMainHTML;
      const crumbChanged = (document.querySelector(crumbSel)?.textContent || '') !== prevCrumbText;
      if (contentChanged || crumbChanged) finish('OK');
    }
    
    if (status === 'TIMEOUT') finish('TIMEOUT');
    
    const hasTable = !!document.querySelector('.gv-table');
    const hasCard = !!document.querySelector('.card');
    const breadcrumb = (document.querySelector(crumbSel)?.textContent || '').trim();
    const ms = Math.round(performance.now() - started);
    
    return { path: target, status, ms, breadcrumb, hasTable, hasCard };
  }
  
  for (const p of expected) out.push(await goto(p));
  await goto(startPath);
  return out;
}

export function getSidebarPaths(): string[] {
  const links = Array.from(document.querySelectorAll('.gv-nav .gv-nav-item'));
  const hrefs = links.map(a => (a as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[];
  return Array.from(new Set(hrefs.map(norm)));
}