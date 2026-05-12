import { NavLink } from "react-router-dom";

export function MainNav() {
  return (
    <nav className="main-nav" aria-label="ניווט ראשי">
      <NavLink end className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/">
        תכנית הטיול
      </NavLink>
      <NavLink
        className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")}
        to="/trip-day/1"
        isActive={(_, loc) => loc.pathname.startsWith("/trip-day")}
      >
        ימים בטיול
      </NavLink>
      <NavLink className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/tasks">
        משימות
      </NavLink>
      <NavLink className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/kosher">
        כשרות בבודפשט
      </NavLink>
      <NavLink className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/synagogues">
        בתי כנסת
      </NavLink>
      <NavLink className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/hotels">
        מקומות לינה
      </NavLink>
      <NavLink className={({ isActive }) => "main-nav__link" + (isActive ? " main-nav__link--current" : "")} to="/packing">
        רשימת אריזה
      </NavLink>
    </nav>
  );
}
