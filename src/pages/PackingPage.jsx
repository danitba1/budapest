import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainNav } from "../components/MainNav.jsx";
import { apiFetch, getAuthHeaders, getJsonHeaders, packApiTokenKey } from "../lib/api.js";

export function PackingPage() {
  const [state, setState] = useState({ categories: [] });
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiFetch("/api/pack", { method: "GET", headers: getAuthHeaders() });
      if (!data.categories || !Array.isArray(data.categories)) throw new Error("Invalid response");
      setState(data);
      setLoading(false);
    } catch (e) {
      if (e.message === "UNAUTHORIZED" || e.status === 401) {
        setLoadError("auth");
      } else {
        setLoadError(String(e.message || e));
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "רשימת אריזה – משפחת בן אדמון";
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function totalCounts() {
    let t = 0,
      p = 0;
    state.categories.forEach((c) => {
      c.items.forEach((i) => {
        t++;
        if (i.packed) p++;
      });
    });
    return { total: t, packed: p };
  }

  if (loading) {
    return (
      <>
        <PackingHero />
        <div className="wrap">
          <MainNav />
          <p className="pack-loading muted">טוען רשימה מהשרת…</p>
        </div>
      </>
    );
  }

  if (loadError === "auth") {
    return (
      <>
        <PackingHero />
        <div className="wrap">
          <MainNav />
          <div className="pack-token-box intro-box">
            <p>
              השרת דורש מפתח גישה. הזינו את אותו ערך כמו PACK_API_TOKEN בקובץ .env של השרת (או השאירו ריק בשרת ללא אימות).
            </p>
            <TokenForm
              onSave={() => {
                setLoadError(null);
                setLoading(true);
                refresh();
              }}
            />
          </div>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PackingHero />
        <div className="wrap">
          <MainNav />
          <div className="pack-error-box intro-box" style={{ borderColor: "#fecaca" }}>
            <p>שגיאה בטעינה מהשרת: {loadError}</p>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              ודאו שהשרת רץ (npm start), ש-DATABASE_URL נכון, ושאתם נכנסים דרך אותה כתובת (localhost או פריסת Vercel עם משתני סביבה). בדף 404 עם file:// פתחו דרך http או https.
            </p>
            <button type="button" className="pack-btn pack-btn--primary" style={{ marginTop: "0.75rem" }} onClick={() => { setLoading(true); refresh(); }}>
              נסו שוב
            </button>
          </div>
        </div>
      </>
    );
  }

  const counts = totalCounts();

  return (
    <>
      <PackingHero />
      <div className="wrap">
        <MainNav />

        <div className="pack-toolbar">
          <p className="pack-stat">
            {counts.total === 0
              ? "עדיין אין פריטים – הוסיפו פריטים למטה (הרשימה נטענת אוטומטית מהמסד בפתיחת הדף)."
              : "ארוז: " + counts.packed + " מתוך " + counts.total + " פריטים · מסד נתונים משותף"}
          </p>
          <AddCategoryRow onChanged={refresh} />
          <div className="pack-toolbar__tools">
            <button
              type="button"
              className="pack-btn pack-btn--ghost"
              onClick={() => {
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "packing-snapshot.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              ייצוא JSON (צילום מסך מקומי)
            </button>
            <button
              type="button"
              className="pack-btn pack-btn--danger"
              onClick={async () => {
                if (!window.confirm("למחוק הכל במסד הנתונים ולהחזיר קטגוריות ברירת מחדל + רשימת פריטים בסיסית?")) return;
                try {
                  await apiFetch("/api/pack/reset", {
                    method: "POST",
                    headers: getJsonHeaders(),
                    body: JSON.stringify({ confirm: true }),
                  });
                  await refresh();
                } catch (e) {
                  window.alert("שגיאה: " + (e.message || e));
                }
              }}
            >
              איפוס לרשימת התחלה (בשרת)
            </button>
            <button
              type="button"
              className="pack-btn pack-btn--ghost"
              onClick={() => {
                localStorage.removeItem(packApiTokenKey);
                window.alert("המפתח הוסר. טעינה מחדש.");
                setLoadError("auth");
              }}
            >
              ניקוי מפתח API בדפדפן
            </button>
          </div>
        </div>

        <div className="pack-cats">
          {state.categories.map((cat) => (
            <PackingCategoryCard key={cat.id} cat={cat} onChanged={refresh} />
          ))}
        </div>

        <footer className="site-footer">
          <a className="site-footer__top" href="#top">
            חזרה למעלה ↑
          </a>
          <p className="site-footer__line">
            רשימת אריזה משותפת (PostgreSQL) · <Link to="/">חזרה לדף הבית</Link>
          </p>
        </footer>
      </div>
    </>
  );
}

function PackingHero() {
  return (
    <header
      className="hero hero--compact"
      role="banner"
      style={{
        "--hero-image":
          "url('https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__kicker">לפני שסוגרים את המזוודה</p>
        <h1 className="hero__title">רשימת אריזה משפחתית</h1>
        <p className="hero__tagline">מסד נתונים משותף · סימון ארוז · קטגוריות ופריטים לעריכה</p>
        <Link className="hero__cta hero__cta--ghost" to="/">
          חזרה לתכנית הטיול
        </Link>
      </div>
    </header>
  );
}

function TokenForm({ onSave }) {
  const [val, setVal] = useState("");
  return (
    <>
      <input type="password" className="pack-input pack-input--grow" placeholder="מפתח API" style={{ marginTop: "0.75rem", width: "100%" }} value={val} onChange={(e) => setVal(e.target.value)} />
      <button
        type="button"
        className="pack-btn pack-btn--primary"
        style={{ marginTop: "0.75rem" }}
        onClick={() => {
          const v = val.trim();
          if (v) localStorage.setItem(packApiTokenKey, v);
          else localStorage.removeItem(packApiTokenKey);
          onSave();
        }}
      >
        שמירה וטעינה מחדש
      </button>
    </>
  );
}

function AddCategoryRow({ onChanged }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="pack-toolbar__row">
      <input
        type="text"
        className="pack-input"
        placeholder="שם קטגוריה חדשה"
        aria-label="שם קטגוריה חדשה"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        className="pack-btn pack-btn--primary"
        disabled={busy}
        onClick={async () => {
          const n = name.trim();
          if (!n) return;
          setBusy(true);
          try {
            await apiFetch("/api/pack/categories", {
              method: "POST",
              headers: getJsonHeaders(),
              body: JSON.stringify({ name: n }),
            });
            setName("");
            await onChanged();
          } catch (e) {
            window.alert("שגיאה: " + (e.message || e));
          }
          setBusy(false);
        }}
      >
        הוספת קטגוריה
      </button>
    </div>
  );
}

function PackingCategoryCard({ cat, onChanged }) {
  return (
    <section className="pack-cat" aria-labelledby={"pack-cat-" + cat.id}>
      <div className="pack-cat__head">
        <h2 className="pack-cat__title" id={"pack-cat-" + cat.id}>
          {cat.name}
        </h2>
        <button
          type="button"
          className="pack-icon-btn"
          aria-label={"מחיקת קטגוריה " + cat.name}
          onClick={async () => {
            if (!window.confirm('למחוק את הקטגוריה "' + cat.name + '" וכל הפריטים בה?')) return;
            try {
              await apiFetch("/api/pack/categories/" + encodeURIComponent(cat.id), {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
              await onChanged();
            } catch (e) {
              window.alert("שגיאה: " + (e.message || e));
            }
          }}
        >
          ✕
        </button>
      </div>
      <ul className="pack-items">
        {cat.items.map((item) => (
          <li key={item.id} className={"pack-item" + (item.packed ? " pack-item--packed" : "")}>
            <label className="pack-item__label">
              <input
                type="checkbox"
                className="pack-item__cb"
                checked={!!item.packed}
                aria-label={"סימון כארוז: " + item.text}
                onChange={async (e) => {
                  const val = e.target.checked;
                  try {
                    await apiFetch("/api/pack/items/" + encodeURIComponent(item.id), {
                      method: "PATCH",
                      headers: getJsonHeaders(),
                      body: JSON.stringify({ packed: val }),
                    });
                    await onChanged();
                  } catch (err) {
                    e.target.checked = !val;
                    window.alert("שגיאה: " + (err.message || err));
                  }
                }}
              />
              <span className="pack-item__text">{item.text}</span>
            </label>
            <button
              type="button"
              className="pack-icon-btn pack-icon-btn--item"
              aria-label="מחיקת פריט"
              onClick={async () => {
                if (!window.confirm("למחוק את הפריט?")) return;
                try {
                  await apiFetch("/api/pack/items/" + encodeURIComponent(item.id), {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  });
                  await onChanged();
                } catch (e) {
                  window.alert("שגיאה: " + (e.message || e));
                }
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <AddItemRow cat={cat} onChanged={onChanged} />
    </section>
  );
}

function AddItemRow({ cat, onChanged }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  async function doAdd() {
    const t = txt.trim();
    if (!t) return;
    setBusy(true);
    try {
      await apiFetch("/api/pack/categories/" + encodeURIComponent(cat.id) + "/items", {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({ text: t }),
      });
      setTxt("");
      await onChanged();
    } catch (e) {
      window.alert("שגיאה: " + (e.message || e));
    }
    setBusy(false);
  }
  return (
    <div className="pack-add">
      <input
        type="text"
        className="pack-input pack-input--grow"
        placeholder="פריט חדש באריזה…"
        aria-label={"פריט חדש ב" + cat.name}
        value={txt}
        disabled={busy}
        onChange={(e) => setTxt(e.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            doAdd();
          }
        }}
      />
      <button type="button" className="pack-btn pack-btn--primary" disabled={busy} onClick={doAdd}>
        הוספה
      </button>
    </div>
  );
}
