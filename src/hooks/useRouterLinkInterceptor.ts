import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Intercepts clicks on <a href="/internal"> and routes via React Router.
 * Works with both BrowserRouter and HashRouter.
 */
export function useRouterLinkInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // only left-click without modifier keys
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // find nearest anchor
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== "A") el = el.parentElement;
      const a = el as HTMLAnchorElement | null;
      if (!a) return;

      // ignore if: download, external target, rel external, no href
      if (a.hasAttribute("download") || a.getAttribute("target") === "_blank" || (a.getAttribute("rel") || "").includes("external")) return;
      const href = a.getAttribute("href");
      if (!href) return;

      // same-origin absolute OR app-relative (“/path”), not a hash-only “#”
      const isHashOnly = href.startsWith("#") && !href.startsWith("#/");
      const isInternal = href.startsWith("/") || (a.origin === window.location.origin);
      if (!isInternal || isHashOnly) return;

      // prevent full reload & route client-side
      e.preventDefault();

      // build the app path (keeps search/hash)
      let path: string;
      try {
        const u = href.startsWith("http") ? new URL(href) : new URL(href, window.location.origin);
        path = u.pathname + u.search + u.hash;
      } catch {
        path = href; // fallback
      }

      navigate(path);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}
