import { Routes, Route, Navigate } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { TripDayPage } from "./pages/TripDayPage.jsx";
import { PackingPage } from "./pages/PackingPage.jsx";
import { TasksPage } from "./pages/TasksPage.jsx";
import { StaticHtmlPage } from "./pages/StaticHtmlPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="trip-day" element={<Navigate to="/trip-day/1" replace />} />
        <Route path="trip-day/:day" element={<TripDayPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="packing" element={<PackingPage />} />
        <Route path="kosher" element={<StaticHtmlPage src="/kosher-budapest.html" />} />
        <Route path="synagogues" element={<StaticHtmlPage src="/synagogues-budapest.html" />} />
        <Route path="hotels" element={<StaticHtmlPage src="/hotels.html" />} />
      </Route>
    </Routes>
  );
}
