// src/boot/killBanners.ts
export function installKillBanners() {
  const selectors = [
    '[data-dev-banner]','#dev-banner','.dev-banner',
    '#app-loading','.app-loading','[data-app-loading]',
    '#app-shell-banner','.app-shell-banner'
  ];
  const patterns = [/app\s*is\s*loading/i, /app\s*loading/i, /loading\.\.\./i];

  const hideMatches = (root = document.body) => {
    // Hide by selector
    selectors.forEach(sel =>
      document.querySelectorAll<HTMLElement>(sel).forEach(el => (el.style.display = 'none'))
    );

    // Hide by text content
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const txt = (n.nodeValue || '').trim();
      if (!txt) continue;
      if (patterns.some(r => r.test(txt))) {
        const el = (n as Text).parentElement as HTMLElement | null;
        if (el) {
          el.style.display = 'none';
          el.setAttribute('data-killed-dev-banner', '1');
        }
      }
    }
  };

  hideMatches();
  const mo = new MutationObserver(() => hideMatches());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => hideMatches());
}