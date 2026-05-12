import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

function useMediaMobile() {
  const [m, setM] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 899px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const fn = () => setM(mq.matches);
    fn();
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", fn);
    else mq.addListener(fn);
    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", fn);
      else mq.removeListener(fn);
    };
  }, []);
  return m;
}

function DrawerLink({ to, children, onNavigate, ...rest }) {
  return (
    <Link to={to} onClick={onNavigate} {...rest}>
      {children}
    </Link>
  );
}

export function SiteLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaMobile();
  const location = useLocation();

  const close = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (!isMobile) return;
    setDrawerOpen((v) => !v);
  }, [isMobile]);

  const closeIfMobile = useCallback(() => {
    if (isMobile) close();
  }, [isMobile, close]);

  useEffect(() => {
    if (!isMobile) close();
  }, [isMobile, close]);

  useEffect(() => {
    close();
  }, [location.pathname, location.search, close]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && drawerOpen) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, close]);

  useEffect(() => {
    if (drawerOpen) document.body.classList.add("drawer-open");
    else document.body.classList.remove("drawer-open");
    return () => document.body.classList.remove("drawer-open");
  }, [drawerOpen]);

  const drawerClass = "site-drawer" + (drawerOpen ? " is-open" : "");
  const overlayClass = "site-drawer-overlay" + (drawerOpen ? " is-open" : "");

  return (
    <>
      <button
        type="button"
        className={"menu-toggle" + (drawerOpen ? " menu-toggle--open" : "")}
        id="menu-toggle"
        data-menu-toggle
        aria-expanded={drawerOpen ? "true" : "false"}
        aria-controls="site-drawer"
        onClick={toggle}
      >
        <span className="menu-toggle__bars" aria-hidden="true" />
        <span className="visually-hidden">פתיחה וסגירה של תפריט האתר</span>
      </button>

      <div
        className={overlayClass}
        data-menu-overlay
        aria-hidden={drawerOpen ? "false" : "true"}
        onClick={close}
      />

      <nav id="site-drawer" className={drawerClass} data-menu-drawer aria-label="תפריט צד">
        <div className="site-drawer__head">
          <span className="site-drawer__title">ניווט</span>
          <button type="button" className="site-drawer__close" data-menu-close aria-label="סגירת תפריט" onClick={close}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <ul className="site-drawer__list">
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} end to="/" onClick={closeIfMobile}>
              דף הבית – תכנית הטיול
            </NavLink>
          </li>
          <li>
            <DrawerLink to="/#prep-title" onNavigate={closeIfMobile} className="site-drawer__link">
              דגשים לפני שיוצאים
            </DrawerLink>
          </li>
          <li>
            <DrawerLink to="/#plan-title" onNavigate={closeIfMobile} className="site-drawer__link">
              תכנית לפי ימים
            </DrawerLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/trip-day/1" onClick={closeIfMobile}>
              עמוד מפורט לכל יום
            </NavLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/tasks" onClick={closeIfMobile}>
              משימות להזמנה מראש
            </NavLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/kosher" onClick={closeIfMobile}>
              כשרות בבודפשט
            </NavLink>
          </li>
          <li>
            <DrawerLink to="/kosher#stores-title" onNavigate={closeIfMobile} className="site-drawer__link">
              סופרים כשרים (בודפשט)
            </DrawerLink>
          </li>
          <li>
            <DrawerLink to="/kosher#eateries-title" onNavigate={closeIfMobile} className="site-drawer__link">
              מסעדות ומאפיות (בודפשט)
            </DrawerLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/synagogues" onClick={closeIfMobile}>
              בתי כנסת בבודפשט (שבת)
            </NavLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/hotels" onClick={closeIfMobile}>
              מקומות לינה
            </NavLink>
          </li>
          <li>
            <NavLink className={({ isActive }) => "site-drawer__link" + (isActive ? " site-drawer__link--current" : "")} to="/packing" onClick={closeIfMobile}>
              רשימת אריזה
            </NavLink>
          </li>
        </ul>
      </nav>

      <Outlet />
    </>
  );
}
