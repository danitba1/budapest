import { useCallback, useEffect, useRef, useState } from "react";
import { TRIP_DAY_PLAN, buildTripRowWazeHref } from "../../trip-days-data.js";
import { apiFetch, getAuthHeaders, getJsonHeaders, apiUrl } from "../lib/api.js";

const STORAGE_KEY = "budapest_tasks_v1";

const CORE_TASK_SEEDS = [
  {
    id: "core-car",
    html: "<strong>רכב:</strong> סגירה מול שילר – ודאו שהצ׳ימיגג מאושר.",
  },
  {
    id: "core-bp-apt",
    html: "<strong>לינה בבודפשט:</strong> דירה ברובע 7 (קרוב לבית כנסת קזינצ׳י).",
  },
];

function stripHtml(html) {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || d.innerText || "").replace(/\s+/g, " ").trim();
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { done: {}, hidden: [], custom: [] };
    const o = JSON.parse(raw);
    return {
      done: o.done && typeof o.done === "object" ? o.done : {},
      hidden: Array.isArray(o.hidden) ? o.hidden : [],
      custom: Array.isArray(o.custom) ? o.custom : [],
    };
  } catch {
    return { done: {}, hidden: [], custom: [] };
  }
}

function normalizeFromServer(data) {
  if (!data || typeof data !== "object") return { done: {}, hidden: [], custom: [] };
  return {
    done: data.done && typeof data.done === "object" && !Array.isArray(data.done) ? data.done : {},
    hidden: Array.isArray(data.hidden) ? data.hidden : [],
    custom: Array.isArray(data.custom) ? data.custom : [],
  };
}

function isEmptyState(s) {
  if (!s) return true;
  if (s.custom && s.custom.length) return false;
  if (s.hidden && s.hidden.length) return false;
  if (s.done && Object.keys(s.done).length) return false;
  return true;
}

function collectMustTasks(plan) {
  const out = [];
  if (!plan || !plan.length) return out;
  for (let d = 0; d < plan.length; d++) {
    const dayPlan = plan[d];
    const rows = dayPlan.rows || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.ticket !== "must") continue;
      out.push({
        id: "must-" + dayPlan.day + "-r" + i,
        day: dayPlan.day,
        part: row.part,
        activity: row.activity,
        ticketNote: row.ticketNote || "",
        links: row.links || "",
        wazeLl: row.wazeLl,
        wazeQuery: row.wazeQuery,
      });
    }
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function syncFailureExtraHint(reason) {
  const r = String(reason || "").toLowerCase();
  if (/\b504\b|\b502\b|gateway|time\s*out|timed out|timeout|econnaborted|fetch failed/i.test(r)) {
    return (
      "504/timeout = לרוב מגבלת זמן של פונקציית Vercel או הקמת Neon ממצב שינה — לא בהכרח משתנה סביבה חסר. " +
      "נסו רענון; ב־Vercel → Deployment → Functions → Logs; בדיקה: /api/health."
    );
  }
  if (/missing\s+database_url|database_url.*required|no\s+database_url/i.test(r)) {
    return "אז כדאי לבדוק ב־Vercel: Settings → Environment Variables → DATABASE_URL (Neon) ל־Production, ואז Redeploy.";
  }
  return "אם נמשך: Vercel → Functions → Logs; בדיקה: /api/health.";
}

export function TasksPanel() {
  const [memState, setMemState] = useState(null);
  const [syncLineText, setSyncLineText] = useState("");
  const remoteWritesEnabled = useRef(false);
  const saveTimer = useRef(null);
  const lastServerUpdatedAt = useRef(null);
  const memStateRef = useRef(null);

  useEffect(() => {
    memStateRef.current = memState;
  }, [memState]);

  const saveLocalOnly = useCallback((state) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          done: state.done,
          hidden: state.hidden,
          custom: state.custom,
        })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const flushRemoteSave = useCallback(async () => {
    if (!remoteWritesEnabled.current || !memStateRef.current) return;
    const st = memStateRef.current;
    try {
      const putRes = await apiFetch("/api/tasks", {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          done: st.done,
          hidden: st.hidden,
          custom: st.custom,
        }),
      });
      if (putRes && putRes.updatedAt) lastServerUpdatedAt.current = putRes.updatedAt;
      setSyncLineText(
        lastServerUpdatedAt.current
          ? "נשמר בענן · עדכון אחרון בשרת: " + new Date(lastServerUpdatedAt.current).toLocaleString("he-IL")
          : "נשמר בענן."
      );
    } catch {
      setSyncLineText("שמירה לשרת נכשלה — עדיין שמור מקומית.");
    }
  }, []);

  const scheduleRemoteSave = useCallback(() => {
    if (!remoteWritesEnabled.current || !memStateRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flushRemoteSave();
    }, 200);
  }, [flushRemoteSave]);

  const persistState = useCallback(
    (state) => {
      setMemState(state);
      memStateRef.current = state;
      saveLocalOnly(state);
      scheduleRemoteSave();
    },
    [saveLocalOnly, scheduleRemoteSave]
  );

  const flushRemoteSaveKeepalive = useCallback(() => {
    if (!remoteWritesEnabled.current || !memStateRef.current) return;
    const st = memStateRef.current;
    try {
      fetch("/api/tasks", {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          done: st.done,
          hidden: st.hidden,
          custom: st.custom,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "hidden") {
        clearTimeout(saveTimer.current);
        flushRemoteSaveKeepalive();
      }
    }
    function onHide() {
      clearTimeout(saveTimer.current);
      flushRemoteSaveKeepalive();
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flushRemoteSaveKeepalive]);

  useEffect(() => {
    let cancelled = false;
    remoteWritesEnabled.current = false;
    setSyncLineText("");

    (async function hydrateFromServer() {
      try {
        const data = await apiFetch("/api/tasks", {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (cancelled) return;
        if (data && data.updatedAt) lastServerUpdatedAt.current = data.updatedAt;
        const serverNorm = normalizeFromServer(data);
        const local = loadLocalState();
        if (isEmptyState(serverNorm) && !isEmptyState(local)) {
          const merged = local;
          const putData = await apiFetch("/api/tasks", {
            method: "PUT",
            headers: getJsonHeaders(),
            body: JSON.stringify({
              done: merged.done,
              hidden: merged.hidden,
              custom: merged.custom,
            }),
          });
          if (putData && putData.updatedAt) lastServerUpdatedAt.current = putData.updatedAt;
          saveLocalOnly(merged);
          setMemState(merged);
          memStateRef.current = merged;
          setSyncLineText(
            lastServerUpdatedAt.current
              ? "מצב מהדפדפן הועבר לשרת · " + new Date(lastServerUpdatedAt.current).toLocaleString("he-IL")
              : "מצב מהדפדפן הועבר לשרת."
          );
        } else {
          setMemState(serverNorm);
          memStateRef.current = serverNorm;
          saveLocalOnly(serverNorm);
          setSyncLineText(
            lastServerUpdatedAt.current
              ? "מסונכרן עם השרת · נטען מעדכון: " + new Date(lastServerUpdatedAt.current).toLocaleString("he-IL")
              : "מסונכרן עם השרת — שינויים נשמרים בענן."
          );
        }
        remoteWritesEnabled.current = true;
      } catch (err) {
        if (cancelled) return;
        const local = loadLocalState();
        setMemState(local);
        memStateRef.current = local;
        let reason = err && err.message ? String(err.message) : String(err);
        if (reason.length > 220) reason = reason.slice(0, 217) + "…";
        if (err && (err.message === "UNAUTHORIZED" || err.status === 401)) {
          setSyncLineText("בעיית הרשאה ל־/api/tasks (נדיר). רעננו את הדף; אם נמשך — בדקו את השרת.");
        } else {
          const extraHint = syncFailureExtraHint(reason);
          setSyncLineText("אין גישה לשרת — המשימות נשמרות רק בדפדפן זה. פרטים: " + reason + " · " + extraHint);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [saveLocalOnly]);

  if (!memState) {
    return (
      <div className="tasks-box">
        <p className="muted">טוען משימות…</p>
      </div>
    );
  }

  const state = memState;
  const plan = TRIP_DAY_PLAN || [];
  const mustItems = collectMustTasks(plan);

  function isHidden(id) {
    return state.hidden.indexOf(id) !== -1;
  }

  function toggleDone(id, checked) {
    const done = { ...state.done };
    if (checked) done[id] = true;
    else delete done[id];
    persistState({ ...state, done });
  }

  function renderItem(item, opts) {
    const isDone = !!state.done[item.id];
    const ariaLabel =
      item.labelText ||
      stripHtml(item.html) ||
      ("יום " + item.day + " · " + item.part + " · " + stripHtml(item.activity) + (item.ticketNote ? " " + item.ticketNote : ""));

    const wHref = typeof buildTripRowWazeHref === "function" ? buildTripRowWazeHref(item) : null;

    return (
      <li key={item.id} className={"tasks-item" + (isDone ? " tasks-item--done" : "")}>
        <input
          type="checkbox"
          className="tasks-item__cb"
          checked={isDone}
          aria-label={"סימון כבוצע: " + ariaLabel}
          onChange={(e) => {
            toggleDone(item.id, e.target.checked);
          }}
        />
        <div className="tasks-item__body">
          {item.html ? (
            <span className="tasks-item__line" dangerouslySetInnerHTML={{ __html: item.html }} />
          ) : (
            <>
              <span className="tasks-item__line">
                {"יום " + item.day + " · " + item.part + " · " + stripHtml(item.activity) + (item.ticketNote ? " " + item.ticketNote : "")}
              </span>
              {item.links && item.links.trim() && item.links.trim() !== "—" ? (
                <span className="tasks-item__links" dangerouslySetInnerHTML={{ __html: " " + item.links }} />
              ) : null}
              {wHref ? (
                <div className="tasks-item__waze">
                  <a href={wHref} target="_blank" rel="noopener noreferrer">
                    פתח ב-Waze
                  </a>
                </div>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          className="tasks-item__del"
          aria-label="הסרת פריט מן הרשימה"
          onClick={() => {
            if (opts.isCustom) {
              const d = { ...state.done };
              delete d[item.id];
              persistState({
                ...state,
                custom: state.custom.filter((c) => c.id !== item.id),
                done: d,
              });
            } else {
              const d = { ...state.done };
              delete d[item.id];
              persistState({
                ...state,
                done: d,
                hidden: [...state.hidden, item.id],
              });
            }
          }}
        >
          הסר
        </button>
      </li>
    );
  }

  return (
    <div id="tasks-root" className="tasks-box">
      <h3 className="tasks-subheading" id="tasks-must-heading">
        חובה – להזמין מראש (מתוך תכנית הימים, סימון «חובה»)
      </h3>
      <ul className="tasks-list" aria-labelledby="tasks-must-heading">
        {(() => {
          const vis = mustItems.filter((it) => !isHidden(it.id));
          if (!vis.length) {
            return (
              <li className="tasks-empty muted">
                אין פריטי חובה בתכנית, או שהוסרו מהרשימה. אפשר לשחזר בהוספת משימה ידנית.
              </li>
            );
          }
          return vis.map((it) => renderItem(it, { isCustom: false }));
        })()}
      </ul>

      <h3 className="tasks-subheading" id="tasks-core-heading">
        משימות כלליות
      </h3>
      <ul className="tasks-list" aria-labelledby="tasks-core-heading">
        {CORE_TASK_SEEDS.filter((s) => !isHidden(s.id)).map((seed) =>
          renderItem({ id: seed.id, html: seed.html, labelText: stripHtml(seed.html) }, { isCustom: false })
        )}
      </ul>

      <h3 className="tasks-subheading" id="tasks-custom-heading">
        משימות שהוספתם
      </h3>
      <ul className="tasks-list" aria-labelledby="tasks-custom-heading">
        {!state.custom.length ? (
          <li className="tasks-empty muted">עדיין אין — הוסיפו בשורה למטה.</li>
        ) : (
          state.custom.map((ct) =>
            renderItem(
              {
                id: ct.id,
                html: escapeHtml(ct.text),
                labelText: ct.text,
              },
              { isCustom: true }
            )
          )
        )}
      </ul>

      <TasksAddRow
        onAdd={(text) => {
          persistState({
            ...state,
            custom: state.custom.concat([
              { id: "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), text },
            ]),
          });
        }}
      />

      <button
        type="button"
        className="tasks-restore-hidden"
        onClick={() => {
          persistState({ ...state, hidden: [] });
        }}
      >
        הצג שוב פריטים ברירת־מחדל שהוסרו
      </button>

      <p className="muted tasks-remote-status">{syncLineText}</p>
    </div>
  );
}

function TasksAddRow({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div className="tasks-add-row">
      <input
        type="text"
        className="tasks-add-input"
        placeholder="משימה חדשה…"
        aria-label="טקסט למשימה חדשה"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            const t = val.replace(/^\s+|\s+$/g, "");
            if (!t) return;
            onAdd(t);
            setVal("");
          }
        }}
      />
      <button
        type="button"
        className="tasks-add-btn"
        onClick={() => {
          const t = val.replace(/^\s+|\s+$/g, "");
          if (!t) return;
          onAdd(t);
          setVal("");
        }}
      >
        הוספת משימה
      </button>
    </div>
  );
}
