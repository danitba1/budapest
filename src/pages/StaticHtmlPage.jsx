import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNav } from "../components/MainNav.jsx";

/**
 * Rewrite legacy .html links to React routes (same-origin navigation handled separately).
 * @param {HTMLElement} root
 */
function rewriteStaticAnchors(root) {
  if (!root) return;
  const pairs = [
    ["index.html", "/"],
    ["kosher-budapest.html", "/kosher"],
    ["synagogues-budapest.html", "/synagogues"],
    ["hotels.html", "/hotels"],
    ["packing.html", "/packing"],
  ];
  root.querySelectorAll("a[href]").forEach((a) => {
    const raw = a.getAttribute("href");
    if (!raw) return;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("mailto:")) return;
    const trip = raw.match(/^\/?trip-day\.html/i);
    if (trip) {
      const m = raw.match(/[?&]day=(\d+)/i);
      if (m) {
        const d = parseInt(m[1], 10);
        if (d >= 1 && d <= 10) a.setAttribute("href", "/trip-day/" + d);
      }
      return;
    }
    for (const [file, route] of pairs) {
      if (raw === file) {
        a.setAttribute("href", route);
        return;
      }
      if (raw.startsWith(file + "#")) {
        a.setAttribute("href", route + raw.slice(file.length));
        return;
      }
    }
    if (raw.startsWith("#")) {
      a.setAttribute("href", window.location.pathname + raw);
    }
  });
}

/**
 * @param {{ src: string }} props  e.g. "/kosher-budapest.html"
 */
export function StaticHtmlPage({ src }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const restRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [injectTick, setInjectTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    if (heroRef.current) heroRef.current.innerHTML = "";
    if (restRef.current) restRef.current.innerHTML = "";
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "text/html");
        const hero = doc.querySelector("header.hero");
        const wrap = doc.querySelector(".wrap");
        if (!hero || !wrap) throw new Error("מבנה HTML לא צפוי (חסר hero או wrap)");

        const mainNav = wrap.querySelector("nav.main-nav");
        const parts = [];
        for (const child of wrap.children) {
          if (child === mainNav) continue;
          parts.push(child.outerHTML);
        }

        if (cancelled) return;
        const t = doc.querySelector("title")?.textContent?.trim();
        if (t) document.title = t;

        if (!heroRef.current || !restRef.current) return;
        heroRef.current.innerHTML = hero.outerHTML;
        restRef.current.innerHTML = parts.join("");

        requestAnimationFrame(() => {
          if (cancelled || !pageRef.current) return;
          rewriteStaticAnchors(pageRef.current);
          setInjectTick((x) => x + 1);
        });
      } catch (e) {
        if (!cancelled) setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (error || !pageRef.current) return;
    const root = pageRef.current;
    function onClick(e) {
      const a = e.target.closest("a");
      if (!a || !root.contains(a)) return;
      if (a.target === "_blank") return;
      const href = a.getAttribute("href");
      if (!href || /^mailto:/i.test(href)) return;
      if (/^https?:\/\//i.test(href)) return;
      if (!href.startsWith("/")) return;
      const u = new URL(href, window.location.origin);
      if (u.origin !== window.location.origin) return;
      e.preventDefault();
      navigate(u.pathname + u.search + u.hash);
    }
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [error, navigate, injectTick]);

  useEffect(() => {
    if (error || loading) return;
    const id = location.hash?.replace(/^#/, "");
    if (!id) return;
    const t = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(t);
  }, [error, loading, location.hash, injectTick]);

  if (error) {
    return (
      <div className="wrap">
        <MainNav />
        <p className="intro-box" role="alert">
          לא ניתן לטעון את העמוד: {error}
        </p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="static-html-import">
      <div ref={heroRef} />
      <div className="wrap">
        <MainNav />
        {loading ? <p className="muted">טוען…</p> : null}
        <div ref={restRef} className="static-html-body" />
      </div>
    </div>
  );
}
