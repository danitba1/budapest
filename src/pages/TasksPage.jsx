import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MainNav } from "../components/MainNav.jsx";
import { TasksPanel } from "../components/TasksPanel.jsx";

export function TasksPage() {
  useEffect(() => {
    document.title = "משימות להזמנה מראש – משפחת בן אדמון";
  }, []);

  return (
    <>
      <header
        className="hero hero--compact"
        role="banner"
        style={{
          "--hero-image":
            "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="hero__bg" aria-hidden="true" />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__kicker">לפני הטיול</p>
          <h1 className="hero__title">משימות להזמנה מראש</h1>
          <p className="hero__tagline">חובה מתוך התכנית · משימות כלליות · הוספה ידנית · סנכרון עם השרת</p>
          <Link className="hero__cta hero__cta--ghost" to="/">
            חזרה לתכנית הטיול
          </Link>
        </div>
      </header>

      <div className="wrap">
        <MainNav />

        <section aria-labelledby="tasks-page-title" className="tasks-section">
          <h2 id="tasks-page-title" className="section-heading">
            רשימת משימות להזמנה מראש
          </h2>
          <p className="section-lede">
            אותה רשימה כמו <Link to="/#tasks-title">בתחתית דף הבית</Link> — מצב משותף (שרת + דפדפן).
          </p>
          <TasksPanel />
        </section>

        <footer className="site-footer">
          <a className="site-footer__top" href="#top">
            חזרה למעלה ↑
          </a>
          <p className="site-footer__line">אתר פרטי למשפחה בן אדמון · משימות לטיול</p>
        </footer>
      </div>
    </>
  );
}
