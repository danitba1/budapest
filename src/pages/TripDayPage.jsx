import { Link, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { TRIP_DAY_PLAN, TRIP_DAY_EXTRAS } from "../../trip-days-data.js";
import { MainNav } from "../components/MainNav.jsx";
import { apiFetch, getAuthHeaders, getJsonHeaders } from "../lib/api.js";
import { DayPlanTable } from "../components/DayPlanTable.jsx";

export function TripDayPage() {
  const { day: dayParam } = useParams();
  const navigate = useNavigate();
  const d = parseInt(String(dayParam || "1"), 10);
  const currentDay = d >= 1 && d <= 10 ? d : 1;

  const plan = TRIP_DAY_PLAN[currentDay - 1];
  const extras = (TRIP_DAY_EXTRAS && TRIP_DAY_EXTRAS[String(currentDay)]) || {};

  const [meal1, setMeal1] = useState("");
  const [meal2, setMeal2] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [mealStatus, setMealStatus] = useState("טוען…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = (plan ? plan.title : "יום בטיול") + " – משפחת בן אדמון";
  }, [plan]);

  const loadMeals = useCallback(async () => {
    setMealStatus("טוען ארוחות…");
    try {
      const data = await apiFetch("/api/trip-days/" + currentDay + "/meals", {
        method: "GET",
        headers: getAuthHeaders(),
      });
      setMeal1(data.meal1 || "");
      setMeal2(data.meal2 || "");
      setGeneralNotes(data.generalNotes || "");
      if (data.updatedAt) {
        setMealStatus("עודכן לאחרונה: " + new Date(data.updatedAt).toLocaleString("he-IL"));
      } else {
        setMealStatus("אין עדיין נתונים — הזינו ושמרו.");
      }
    } catch (err) {
      if (err.message === "UNAUTHORIZED" || err.status === 401) {
        setMealStatus("auth_html");
      } else {
        setMealStatus("שגיאה: " + (err.message || err));
      }
    }
  }, [currentDay]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  async function saveMeals() {
    setSaving(true);
    setMealStatus("שומר…");
    try {
      const data = await apiFetch("/api/trip-days/" + currentDay + "/meals", {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({ meal1, meal2, generalNotes }),
      });
      setMealStatus("נשמר. עודכן: " + new Date(data.updatedAt).toLocaleString("he-IL"));
    } catch (err) {
      if (err.message === "UNAUTHORIZED" || err.status === 401) {
        setMealStatus("אין הרשאה — הגדירו מפתח API (ראו למעלה).");
      } else {
        setMealStatus("שגיאה בשמירה: " + (err.message || err));
      }
    } finally {
      setSaving(false);
    }
  }

  if (!plan) {
    return (
      <div className="wrap">
        <MainNav />
        <p>יום לא קיים.</p>
      </div>
    );
  }

  return (
    <>
      <header
        className="hero hero--compact"
        role="banner"
        style={{
          "--hero-image":
            "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="hero__bg" aria-hidden="true" />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__inner">
          <p className="hero__kicker">טיול משפחתי · לפי ימים</p>
          <h1 className="hero__title" id="trip-day-hero-title">
            {plan.title}
          </h1>
          <p className="hero__tagline">תכנית כמו בדף הבית · המלצות · כבישים · ארוחות והערות במסד נתונים</p>
          <Link className="hero__cta hero__cta--ghost" to="/#plan-title">
            כל הימים בדף הבית
          </Link>
        </div>
      </header>

      <div className="wrap">
        <MainNav />

        <div className="trip-day-root">
          <div className="trip-day-controls">
            <label className="trip-day-controls__label" htmlFor="trip-day-select">
              בחירת יום:
            </label>
            <select
              id="trip-day-select"
              className="trip-day-select"
              value={String(currentDay)}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v >= 1 && v <= 10) navigate("/trip-day/" + v);
              }}
            >
              {TRIP_DAY_PLAN.map((p, i) => (
                <option key={p.day} value={String(i + 1)}>
                  {"יום " + (i + 1) + " — " + (p.title.split("–")[1] || p.title).trim()}
                </option>
              ))}
            </select>
          </div>

          <p className="page-lede trip-day-lede">
            זהו <strong>אותו יום</strong> כמו ב
            <Link to={"/#day" + currentDay}>תכנית בדף הבית</Link>. למסמך המלא:{" "}
            <Link to="/#prep-title">דגשים לפני שיוצאים</Link> · <Link to="/#tasks-title">משימות להזמנה מראש</Link> ·{" "}
            <Link to="/#plan-title">כל הימים בטבלה אחת</Link>.
          </p>

          <p className="table-legend" role="note">
            <strong>חובה</strong> – יש לרכוש כרטיס/כניסה מראש באתר הרשמי · <strong>מומלץ</strong> – כדאי להזמין מראש ·{" "}
            <strong>לא</strong> – בדרך כלל במקום · <strong>—</strong> – לא רלוונטי לכרטיס
          </p>

          <article className="day-card" id={"day" + currentDay}>
            <div className="day-head-row">
              <div className="day-head">{plan.title}</div>
              <Link className="day-head-link" to={"/#day" + currentDay}>
                ← בדף הבית
              </Link>
            </div>
            <DayPlanTable plan={plan} />
          </article>

          {extras.navigation ? (
            <section className="trip-extra-section" aria-labelledby={"trip-nav-time-title-" + currentDay}>
              <h2 className="section-heading" id={"trip-nav-time-title-" + currentDay}>
                ניווט וזמן
              </h2>
              <div className="trip-nav-time-body" dangerouslySetInnerHTML={{ __html: extras.navigation }} />
            </section>
          ) : null}

          {extras.recommendations && extras.recommendations.length ? (
            <section className="trip-extra-section" aria-labelledby="trip-rec-title">
              <h2 className="section-heading" id="trip-rec-title">
                המלצות נוספות באזור / בדרך
              </h2>
              <ul className="trip-extra-list">
                {extras.recommendations.map((t, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
                ))}
              </ul>
            </section>
          ) : null}

          {extras.roads ? (
            <section className="trip-extra-section" aria-labelledby="trip-roads-title">
              <h2 className="section-heading" id="trip-roads-title">
                כבישים ונסיעה ביום זה
              </h2>
              <p className="trip-extra-prose" dangerouslySetInnerHTML={{ __html: extras.roads }} />
            </section>
          ) : null}

          {extras.misc ? (
            <section className="trip-extra-section" aria-labelledby="trip-misc-title">
              <h2 className="section-heading" id="trip-misc-title">
                עוד ליום זה
              </h2>
              <p className="trip-extra-prose" dangerouslySetInnerHTML={{ __html: extras.misc }} />
            </section>
          ) : null}

          <section className="trip-meals-section" aria-labelledby="trip-meals-title">
            <h2 className="section-heading" id="trip-meals-title">
              תכנון ארוחות והערות (נשמר בשרת)
            </h2>
            <p className="page-lede trip-meals-lede">
              שתי ארוחות ו<strong>הערות כלליות</strong> ליום זה נשמרות ב<strong>PostgreSQL</strong> (טבלת <code>trip_day_meals</code>
              ). יש לפתוח את האתר דרך השרת (כמו <Link to="/packing">רשימת האריזה</Link>). אם מוגדר <code>PACK_API_TOKEN</code> —
              אותו מפתח בדפדפן נדרש לשמירה.
            </p>
            <div className="trip-meals-form intro-box">
              <label className="trip-meals-label" htmlFor="meal-1">
                ארוחה 1 (למשל צהריים)
              </label>
              <textarea
                id="meal-1"
                className="trip-meals-textarea"
                rows={4}
                value={meal1}
                onChange={(e) => setMeal1(e.target.value)}
              />
              <label className="trip-meals-label" htmlFor="meal-2">
                ארוחה 2 (למשל ערב)
              </label>
              <textarea id="meal-2" className="trip-meals-textarea" rows={4} value={meal2} onChange={(e) => setMeal2(e.target.value)} />
              <label className="trip-meals-label" htmlFor="meal-general">
                הערות כלליות ליום (מזון, קניות, העדפות, תזכורות)
              </label>
              <textarea
                id="meal-general"
                className="trip-meals-textarea"
                rows={4}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
              <p className="trip-meals-status muted">
                {mealStatus === "auth_html" ? (
                  <>
                    נדרש מפתח API (כמו ברשימת האריזה). פתחו את <Link to="/packing">רשימת האריזה</Link>, הזינו את ערך{" "}
                    <code>PACK_API_TOKEN</code>, וחזרו לכאן.
                  </>
                ) : (
                  mealStatus
                )}
              </p>
              <div className="trip-meals-actions">
                <button type="button" className="pack-btn pack-btn--primary" disabled={saving} onClick={saveMeals}>
                  שמירה לשרת
                </button>
              </div>
            </div>
          </section>

          <nav className="trip-day-pager" aria-label="מעבר בין ימים">
            {currentDay > 1 ? (
              <Link className="trip-day-pager__link" to={"/trip-day/" + (currentDay - 1)}>
                ← יום {currentDay - 1}
              </Link>
            ) : null}
            {currentDay < 10 ? (
              <Link className="trip-day-pager__link" to={"/trip-day/" + (currentDay + 1)}>
                יום {currentDay + 1} →
              </Link>
            ) : null}
          </nav>
        </div>

        <footer className="site-footer">
          <a className="site-footer__top" href="#top">
            חזרה למעלה ↑
          </a>
          <p className="site-footer__line">אתר פרטי למשפחה בן אדמון · עמוד יום בטיול</p>
        </footer>
      </div>
    </>
  );
}
