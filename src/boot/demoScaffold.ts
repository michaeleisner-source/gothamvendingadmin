// src/boot/demoScaffold.ts
// Purpose: If a route renders an empty page (no cards/tables), inject a small demo table
// so the page is never blank during demos. Only runs when the page is "empty".

type Renderer = (root: HTMLElement) => void;

const SEL_MAIN = 'main, #app-main, #main, [data-main], .main-content, [role="main"]';

function findMain(): HTMLElement | null {
  return document.querySelector(SEL_MAIN) as HTMLElement | null;
}

function isEmptyMain(el: HTMLElement | null): boolean {
  if (!el) return true;
  // Empty if there are no obvious content widgets
  const hasCard = el.querySelector('.card,[data-card]');
  const hasTable = el.querySelector('table,.gv-table,[data-table]');
  const hasContent = el.textContent?.trim().length! > 40;
  return !(hasCard || hasTable || hasContent);
}

function table(htmlRows: string, title: string, hint?: string) {
  return `
    <div class="p-4">
      <div class="mb-3">
        <h1 class="text-xl font-semibold">${title}</h1>
        ${hint ? `<p class="text-sm text-muted-foreground">${hint}</p>` : ''}
      </div>
      <div class="overflow-x-auto border rounded-lg">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-left">
              ${htmlRows.split('\n')[0]}
            </tr>
          </thead>
          <tbody>
            ${htmlRows.split('\n').slice(1).join('\n')}
          </tbody>
        </table>
      </div>
    </div>
  `.trim();
}

// ---- Route-specific demo renderers (adjust copy later if you want) ----
const RENDERERS: Record<string, Renderer> = {
  '#/contracts': (root) => {
    root.innerHTML = table(
`<th class="p-2">Contract</th><th class="p-2">Location</th><th class="p-2">Split</th><th class="p-2">Start</th><th class="p-2">Status</th>
<tr><td class="p-2">CN-2025-001</td><td class="p-2">Manhattan Tech Hub</td><td class="p-2">80/20</td><td class="p-2">2025-06-01</td><td class="p-2">Active</td></tr>
<tr class="bg-gray-50/60"><td class="p-2">CN-2025-002</td><td class="p-2">Brooklyn Hospital</td><td class="p-2">85/15</td><td class="p-2">2025-07-10</td><td class="p-2">Active</td></tr>
<tr><td class="p-2">CN-2025-003</td><td class="p-2">Queens University</td><td class="p-2">90/10</td><td class="p-2">2025-08-05</td><td class="p-2">Pending</td></tr>`,
      'Contracts',
      'Demo scaffold — replace with real data when ready.'
    );
  },

  '#/restock': (root) => {
    root.innerHTML = table(
`<th class="p-2">Date</th><th class="p-2">Route</th><th class="p-2">Machine</th><th class="p-2">SKU</th><th class="p-2">Qty</th>
<tr><td class="p-2">2025-09-17</td><td class="p-2">Route A</td><td class="p-2">M-001</td><td class="p-2">Water 16oz</td><td class="p-2">24</td></tr>
<tr class="bg-gray-50/60"><td class="p-2">2025-09-17</td><td class="p-2">Route B</td><td class="p-2">M-004</td><td class="p-2">Candy Bar</td><td class="p-2">36</td></tr>
<tr><td class="p-2">2025-09-16</td><td class="p-2">Route A</td><td class="p-2">M-005</td><td class="p-2">Coke 12oz</td><td class="p-2">12</td></tr>`,
      'Restock Entry',
      'Demo scaffold — quick view of recent restocks.'
    );
  },

  '#/cash': (root) => {
    root.innerHTML = table(
`<th class="p-2">Date</th><th class="p-2">Collector</th><th class="p-2">Route</th><th class="p-2">Machines</th><th class="p-2">Amount</th>
<tr><td class="p-2">2025-09-17</td><td class="p-2">E. Ramirez</td><td class="p-2">Route A</td><td class="p-2">4</td><td class="p-2">$382.00</td></tr>
<tr class="bg-gray-50/60"><td class="p-2">2025-09-16</td><td class="p-2">T. Chen</td><td class="p-2">Route B</td><td class="p-2">3</td><td class="p-2">$261.50</td></tr>
<tr><td class="p-2">2025-09-15</td><td class="p-2">K. Patel</td><td class="p-2">Route C</td><td class="p-2">5</td><td class="p-2">$501.75</td></tr>`,
      'Cash Collection',
      'Demo scaffold — daily pickups by route.'
    );
  },

  '#/routes': (root) => {
    root.innerHTML = table(
`<th class="p-2">Route</th><th class="p-2">Stops</th><th class="p-2">Est. Time</th><th class="p-2">Driver</th><th class="p-2">Status</th>
<tr><td class="p-2">Route A</td><td class="p-2">Manhattan Tech Hub → Queens University</td><td class="p-2">2h 10m</td><td class="p-2">E. Ramirez</td><td class="p-2">Planned</td></tr>
<tr class="bg-gray-50/60"><td class="p-2">Route B</td><td class="p-2">Brooklyn Hospital → Jersey Logistics</td><td class="p-2">1h 45m</td><td class="p-2">T. Chen</td><td class="p-2">In Progress</td></tr>
<tr><td class="p-2">Route C</td><td class="p-2">Queens University → Midtown Offices</td><td class="p-2">2h 30m</td><td class="p-2">K. Patel</td><td class="p-2">Planned</td></tr>`,
      'Delivery Routes',
      'Demo scaffold — optimize routes with real data later.'
    );
  },

  '#/maintenance/health': (root) => {
    root.innerHTML = table(
`<th class="p-2">Machine</th><th class="p-2">Location</th><th class="p-2">Status</th><th class="p-2">Last Check</th><th class="p-2">Notes</th>
<tr><td class="p-2">M-001</td><td class="p-2">Manhattan Tech Hub</td><td class="p-2">Online</td><td class="p-2">10m ago</td><td class="p-2">OK</td></tr>
<tr class="bg-gray-50/60"><td class="p-2">M-004</td><td class="p-2">Queens University</td><td class="p-2">Offline</td><td class="p-2">1h 12m ago</td><td class="p-2">Check modem</td></tr>
<tr><td class="p-2">M-005</td><td class="p-2">Jersey Logistics</td><td class="p-2">Low Inventory</td><td class="p-2">35m ago</td><td class="p-2">Slot A3 at 1/10</td></tr>`,
      'Machine Health',
      'Demo scaffold — real-time monitor coming next.'
    );
  },
};

function renderFor(hash: string) {
  const main = findMain();
  if (!main) return;
  if (!isEmptyMain(main)) return;
  const key = Object.keys(RENDERERS).find(k => hash.startsWith(k));
  if (!key) return;
  RENDERERS[key](main);
}

export function installDemoScaffold() {
  const apply = () => renderFor(location.hash || '#/');
  // initial + route changes
  apply();
  window.addEventListener('hashchange', apply);
  // also run after React paints
  const mo = new MutationObserver(() => apply());
  mo.observe(document.documentElement, { childList: true, subtree: true });
}