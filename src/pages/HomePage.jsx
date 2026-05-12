import { Link } from "react-router-dom";
import { TRIP_DAY_PLAN, TRIP_DAY_EXTRAS } from "../../trip-days-data.js";
import { MainNav } from "../components/MainNav.jsx";
import { TzClocks } from "../components/TzClocks.jsx";
import { DayPlanCard } from "../components/DayPlanTable.jsx";
import { TasksPanel } from "../components/TasksPanel.jsx";

const UNSPLASH_IX = "ixlib=rb-4.0.3";
const HERO_BUDAPEST =
  "https://images.unsplash.com/photo-1541342423680-622c5b6f8200?auto=format&fit=crop&w=1920&q=85&" + UNSPLASH_IX;

export function HomePage() {
  return (
    <>
      <header className="hero hero--compact hero--home" role="banner">
        <img
          className="hero__bg-img"
          src={HERO_BUDAPEST}
          alt=""
          width="1920"
          height="1080"
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__kicker">טיול משפחתי · שלוש מדינות · זיכרונות בדרך</p>
          <h1 className="hero__title">משפחת בן אדמון – טיול בודפשט והסביבה</h1>
          <p className="hero__tagline">הורים ושלושה ילדים · כשרות · מדריך בעברית</p>
          <div className="hero__badges">
            <span className="hero__badge">הונגריה</span>
            <span className="hero__badge">סלובניה</span>
            <span className="hero__badge">קרואטיה</span>
          </div>
          <a className="hero__cta" href="#prep-title">
            <span className="hero__cta-text">בואו נתכנן</span>
            <span className="hero__cta-icon" aria-hidden="true">
              ↓
            </span>
          </a>
        </div>
      </header>

      <div className="wrap">
        <MainNav />
        <TzClocks />

        <section className="route-mosaic" aria-label="יעדי המסלול בקצרה">
          <h2 className="route-mosaic__heading">המסלול במבט אחד</h2>
          <div className="route-mosaic__grid">
            <figure className="route-tile">
              <img
                className="route-tile__img"
                src={"https://images.unsplash.com/photo-1541342423680-622c5b6f8200?auto=format&fit=crop&w=800&q=80&" + UNSPLASH_IX}
                width="800"
                height="600"
                alt="נוף בודפשט והפרלמנט מעל הדנובה"
                loading="lazy"
              />
              <figcaption className="route-tile__cap">
                <span className="route-tile__label">בודפשט</span>
                <span className="route-tile__sub">סופ״ש כשר, אקווריום, נוף</span>
              </figcaption>
            </figure>
            <figure className="route-tile">
              <img
                className="route-tile__img"
                src={"https://images.unsplash.com/photo-1596436889106-b888f5030d1b?auto=format&fit=crop&w=800&q=80&" + UNSPLASH_IX}
                width="800"
                height="600"
                alt="אגם בלד ואי עם כנסייה בסלובניה"
                loading="lazy"
              />
              <figcaption className="route-tile__cap">
                <span className="route-tile__label">סלובניה</span>
                <span className="route-tile__sub">בלד, סוצ׳ה, אלפים</span>
              </figcaption>
            </figure>
            <figure className="route-tile">
              <img
                className="route-tile__img"
                src={"https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80&" + UNSPLASH_IX}
                width="800"
                height="600"
                alt="מפלים ואגמים בטבע ירוק"
                loading="lazy"
              />
              <figcaption className="route-tile__cap">
                <span className="route-tile__label">קרואטיה</span>
                <span className="route-tile__sub">פליטביצה ודרך חזרה</span>
              </figcaption>
            </figure>
          </div>
          <p className="route-mosaic__credit">
            תמונות לווי:{" "}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>{" "}
            (שימוש לפי רישיון המצלמים)
          </p>
        </section>

        <section className="prep-section" aria-labelledby="prep-title">
          <h2 id="prep-title" className="section-heading">
            דגשים חשובים לפני שיוצאים
          </h2>
          <p className="section-lede">רגע לפני שעולים לרכב – שלושה דברים שחוסכים התעצבות בדרך.</p>
          <div className="prep-split">
            <div className="intro-box prep-split__box">
              <h3>מעבר גבול ואוטוסטרדות</h3>
              <ul>
                <li>
                  <strong>וינייטה:</strong> בנסיעה להונגריה–סלובניה–קרואטיה חובה מדבקת אוטוסטרדה (וינייטה) לכל מדינה. אצל{" "}
                  <a href="https://schillerrent.hu/hu/">שילר</a> תקבלו את ההונגרית; את הסלובנית והקרואטית קונים בתחנות דלק לפני הגבול.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="plan-title" className="plan-section">
          <h2 id="plan-title" className="section-heading">
            תכנית הטיול – לפי ימים
          </h2>
          {TRIP_DAY_PLAN.map((plan) => (
            <DayPlanCard key={plan.day} plan={plan} extras={TRIP_DAY_EXTRAS[String(plan.day)]} />
          ))}
        </section>

        <section aria-labelledby="tasks-title" className="tasks-section">
          <h2 id="tasks-title" className="section-heading">
            רשימת משימות להזמנה מראש
          </h2>
          <p className="section-lede">
            <Link to="/tasks">עמוד משימות נפרד ←</Link>
          </p>
          <TasksPanel />
          <p className="closing">תכנית מאוזנת בין נהיגה מאומצת בימים הראשונים לסופ״ש רגוע וכשר בבודפשט – תהנו!</p>
        </section>

        <footer className="site-footer">
          <a className="site-footer__top" href="#top">
            חזרה למעלה ↑
          </a>
          <p className="site-footer__line">אתר פרטי למשפחה בן אדמון · נוצר לטיול 2026</p>
        </footer>
      </div>
    </>
  );
}
