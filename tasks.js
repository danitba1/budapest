/**
 * רשימת משימות להזמנה מראש — סימון בוצע, הוספה/הסרה.
 * מצב נשמר בשרת (PostgreSQL) ובמקביל ב-localStorage כגיבוי / מטמון.
 * פריטי "חובה" נמשכים מ-window.TRIP_DAY_PLAN (אחרי trip-days-data.js).
 */
(function () {
  var root = document.getElementById("tasks-root");
  if (!root) return;

  var STORAGE_KEY = "budapest_tasks_v1";
  var API_BASE = typeof window.PACK_API_BASE !== "undefined" ? window.PACK_API_BASE : "";
  var TOKEN_KEY = "pack_api_token";

  var memState = null;
  var remoteWritesEnabled = false;
  var syncLineText = "";
  var saveTimer = null;
  var lastServerUpdatedAt = null;
  /** Hostname from API — compare Vercel vs localhost; must match for one shared DB. */
  var lastDbHost = null;

  var CORE_TASK_SEEDS = [
    {
      id: "core-car",
      html:
        "<strong>רכב:</strong> סגירה מול שילר – ודאו שהצ׳ימיגג מאושר.",
    },
    {
      id: "core-bp-apt",
      html:
        "<strong>לינה בבודפשט:</strong> דירה ברובע 7 (קרוב לבית כנסת קזינצ׳י).",
    },
  ];

  function apiUrl(path) {
    var base = API_BASE || "";
    if (base.endsWith("/") && path.charAt(0) === "/") {
      return base.slice(0, -1) + path;
    }
    return base + path;
  }

  function getAuthHeaders() {
    var h = { Accept: "application/json" };
    var t = localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  function getJsonHeaders() {
    var h = getAuthHeaders();
    h["Content-Type"] = "application/json";
    return h;
  }

  async function apiFetch(path, options) {
    var res = await fetch(apiUrl(path), options || {});
    var bodyText = await res.text();
    if (res.status === 401) {
      var e401 = new Error("UNAUTHORIZED");
      e401.status = 401;
      throw e401;
    }
    if (!res.ok) {
      var msg = bodyText;
      try {
        var ej = JSON.parse(bodyText);
        if (ej && ej.error) msg = ej.error;
      } catch (x) {
        /* keep msg */
      }
      throw new Error((res.status + " " + msg).trim());
    }
    if (!bodyText) return {};
    return JSON.parse(bodyText);
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") e.textContent = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    return e;
  }

  function stripHtml(html) {
    if (!html) return "";
    var d = document.createElement("div");
    d.innerHTML = html;
    return (d.textContent || d.innerText || "").replace(/\s+/g, " ").trim();
  }

  function loadLocalState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { done: {}, hidden: [], custom: [] };
      var o = JSON.parse(raw);
      return {
        done: o.done && typeof o.done === "object" ? o.done : {},
        hidden: Array.isArray(o.hidden) ? o.hidden : [],
        custom: Array.isArray(o.custom) ? o.custom : [],
      };
    } catch (err) {
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

  function saveLocalOnly(state) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          done: state.done,
          hidden: state.hidden,
          custom: state.custom,
        })
      );
    } catch (err) {
      /* ignore quota */
    }
  }

  function updateSyncLineInDom() {
    var n = document.querySelector(".tasks-remote-status");
    if (n) n.textContent = syncLineText + (lastDbHost ? " · מאגר: " + lastDbHost : "");
  }

  function scheduleRemoteSave() {
    if (!remoteWritesEnabled || !memState) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      flushRemoteSave();
    }, 200);
  }

  /** שמירה לפני סגירת לשונית — מפסיקה איבוד עקב debounce. */
  function flushRemoteSaveKeepalive() {
    if (!remoteWritesEnabled || !memState) return;
    try {
      fetch(apiUrl("/api/tasks"), {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          done: memState.done,
          hidden: memState.hidden,
          custom: memState.custom,
        }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {
      /* ignore */
    }
  }

  function persistState(state) {
    saveLocalOnly(state);
    scheduleRemoteSave();
  }

  async function flushRemoteSave() {
    if (!remoteWritesEnabled || !memState) return;
    try {
      var putRes = await apiFetch("/api/tasks", {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          done: memState.done,
          hidden: memState.hidden,
          custom: memState.custom,
        }),
      });
      if (putRes && putRes.updatedAt) lastServerUpdatedAt = putRes.updatedAt;
      if (putRes && putRes.dbHost) lastDbHost = putRes.dbHost;
      syncLineText = lastServerUpdatedAt
        ? "נשמר בענן · עדכון אחרון בשרת: " + new Date(lastServerUpdatedAt).toLocaleString("he-IL")
        : "נשמר בענן.";
      updateSyncLineInDom();
    } catch (e) {
      syncLineText = "שמירה לשרת נכשלה — עדיין שמור מקומית.";
      updateSyncLineInDom();
    }
  }

  async function hydrateFromServer() {
    remoteWritesEnabled = false;
    syncLineText = "";
    lastDbHost = null;
    try {
      var data = await apiFetch("/api/tasks", {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (data && data.updatedAt) lastServerUpdatedAt = data.updatedAt;
      if (data && data.dbHost) lastDbHost = data.dbHost;
      var serverNorm = normalizeFromServer(data);
      var local = loadLocalState();
      if (isEmptyState(serverNorm) && !isEmptyState(local)) {
        memState = local;
        var putData = await apiFetch("/api/tasks", {
          method: "PUT",
          headers: getJsonHeaders(),
          body: JSON.stringify({
            done: memState.done,
            hidden: memState.hidden,
            custom: memState.custom,
          }),
        });
        if (putData && putData.updatedAt) lastServerUpdatedAt = putData.updatedAt;
        if (putData && putData.dbHost) lastDbHost = putData.dbHost;
        saveLocalOnly(memState);
        syncLineText = lastServerUpdatedAt
          ? "מצב מהדפדפן הועבר לשרת · " + new Date(lastServerUpdatedAt).toLocaleString("he-IL")
          : "מצב מהדפדפן הועבר לשרת.";
      } else {
        memState = serverNorm;
        saveLocalOnly(memState);
        syncLineText = lastServerUpdatedAt
          ? "מסונכרן עם השרת · נטען מעדכון: " + new Date(lastServerUpdatedAt).toLocaleString("he-IL")
          : "מסונכרן עם השרת — שינויים נשמרים בענן.";
      }
      remoteWritesEnabled = true;
    } catch (err) {
      lastDbHost = null;
      memState = loadLocalState();
      var reason = err && err.message ? String(err.message) : String(err);
      if (reason.length > 220) reason = reason.slice(0, 217) + "…";
      if (err && (err.message === "UNAUTHORIZED" || err.status === 401)) {
        syncLineText =
          "בעיית הרשאה ל־/api/tasks (נדיר). רעננו את הדף; אם נמשך — בדקו את השרת.";
      } else {
        syncLineText =
          "אין גישה לשרת — המשימות נשמרות רק בדפדפן זה. פרטים: " +
          reason +
          " · ב־Vercel: Settings → Environment Variables → DATABASE_URL (מחרוזת Neon), ואז Redeploy.";
      }
    }
  }

  function collectMustTasks(plan) {
    var out = [];
    if (!plan || !plan.length) return out;
    for (var d = 0; d < plan.length; d++) {
      var dayPlan = plan[d];
      var rows = dayPlan.rows || [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
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

  function isHidden(state, id) {
    return state.hidden.indexOf(id) !== -1;
  }

  function setHidden(state, id, hide) {
    var ix = state.hidden.indexOf(id);
    if (hide && ix === -1) state.hidden.push(id);
    if (!hide && ix !== -1) state.hidden.splice(ix, 1);
    persistState(state);
  }

  function toggleDone(state, id, checked) {
    if (checked) state.done[id] = true;
    else delete state.done[id];
    persistState(state);
  }

  function renderItem(state, item, opts) {
    opts = opts || {};
    var isDone = !!state.done[item.id];
    var li = el("li", "tasks-item" + (isDone ? " tasks-item--done" : ""));
    var cb = el("input", "tasks-item__cb", { type: "checkbox" });
    cb.checked = isDone;
    var ariaLabel =
      item.labelText ||
      stripHtml(item.html) ||
      ("יום " +
        item.day +
        " · " +
        item.part +
        " · " +
        stripHtml(item.activity) +
        (item.ticketNote ? " " + item.ticketNote : ""));
    cb.setAttribute("aria-label", "סימון כבוצע: " + ariaLabel);
    cb.addEventListener("change", function () {
      toggleDone(state, item.id, cb.checked);
      li.classList.toggle("tasks-item--done", cb.checked);
    });

    var body = el("div", "tasks-item__body");
    if (item.html) {
      var span = el("span", "tasks-item__line");
      span.innerHTML = item.html;
      body.appendChild(span);
    } else {
      var line = el("span", "tasks-item__line");
      line.textContent =
        "יום " +
        item.day +
        " · " +
        item.part +
        " · " +
        stripHtml(item.activity) +
        (item.ticketNote ? " " + item.ticketNote : "");
      body.appendChild(line);
      if (item.links && item.links.trim() && item.links.trim() !== "—") {
        var links = el("span", "tasks-item__links");
        links.innerHTML = " " + item.links;
        body.appendChild(links);
      }
      var wHref =
        typeof window.buildTripRowWazeHref === "function" ? window.buildTripRowWazeHref(item) : null;
      if (wHref) {
        var wRow = el("div", "tasks-item__waze");
        var wA = el("a", "", {
          href: wHref,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "פתח ב-Waze",
        });
        wRow.appendChild(wA);
        body.appendChild(wRow);
      }
    }

    var del = el("button", "tasks-item__del", { type: "button" });
    del.textContent = "הסר";
    del.setAttribute("aria-label", "הסרת פריט מן הרשימה");
    del.addEventListener("click", function () {
      if (opts.isCustom) {
        state.custom = state.custom.filter(function (c) {
          return c.id !== item.id;
        });
        delete state.done[item.id];
        persistState(state);
      } else {
        delete state.done[item.id];
        setHidden(state, item.id, true);
      }
      render();
    });

    li.appendChild(cb);
    li.appendChild(body);
    li.appendChild(del);
    return li;
  }

  function render() {
    if (!memState) return;
    var state = memState;
    var plan = window.TRIP_DAY_PLAN || [];
    var mustItems = collectMustTasks(plan);
    root.textContent = "";

    var hMust = el("h3", "tasks-subheading", { id: "tasks-must-heading" });
    hMust.textContent = "חובה – להזמין מראש (מתוך תכנית הימים, סימון «חובה»)";
    root.appendChild(hMust);
    var ulMust = el("ul", "tasks-list");
    ulMust.setAttribute("aria-labelledby", "tasks-must-heading");
    var anyMust = false;
    for (var i = 0; i < mustItems.length; i++) {
      if (isHidden(state, mustItems[i].id)) continue;
      anyMust = true;
      ulMust.appendChild(renderItem(state, mustItems[i], { isCustom: false }));
    }
    if (!anyMust) {
      var empty = el("li", "tasks-empty muted");
      empty.textContent =
        "אין פריטי חובה בתכנית, או שהוסרו מהרשימה. אפשר לשחזר בהוספת משימה ידנית.";
      ulMust.appendChild(empty);
    }
    root.appendChild(ulMust);

    var hCore = el("h3", "tasks-subheading", { id: "tasks-core-heading" });
    hCore.textContent = "משימות כלליות";
    root.appendChild(hCore);
    var ulCore = el("ul", "tasks-list");
    ulCore.setAttribute("aria-labelledby", "tasks-core-heading");
    for (var c = 0; c < CORE_TASK_SEEDS.length; c++) {
      var seed = CORE_TASK_SEEDS[c];
      if (isHidden(state, seed.id)) continue;
      ulCore.appendChild(
        renderItem(state, { id: seed.id, html: seed.html, labelText: stripHtml(seed.html) }, { isCustom: false })
      );
    }
    root.appendChild(ulCore);

    var hCustom = el("h3", "tasks-subheading", { id: "tasks-custom-heading" });
    hCustom.textContent = "משימות שהוספתם";
    root.appendChild(hCustom);
    var ulCustom = el("ul", "tasks-list");
    ulCustom.setAttribute("aria-labelledby", "tasks-custom-heading");
    if (!state.custom.length) {
      var li0 = el("li", "tasks-empty muted");
      li0.textContent = "עדיין אין — הוסיפו בשורה למטה.";
      ulCustom.appendChild(li0);
    } else {
      for (var j = 0; j < state.custom.length; j++) {
        var ct = state.custom[j];
        ulCustom.appendChild(
          renderItem(
            state,
            {
              id: ct.id,
              html: escapeHtml(ct.text),
              labelText: ct.text,
            },
            { isCustom: true }
          )
        );
      }
    }
    root.appendChild(ulCustom);

    var addRow = el("div", "tasks-add-row");
    var inp = el("input", "tasks-add-input", {
      type: "text",
      placeholder: "משימה חדשה…",
      "aria-label": "טקסט למשימה חדשה",
    });
    var addBtn = el("button", "tasks-add-btn", { type: "button" });
    addBtn.textContent = "הוספת משימה";
    function doAdd() {
      var t = inp.value.replace(/^\s+|\s+$/g, "");
      if (!t) return;
      state.custom.push({ id: "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), text: t });
      inp.value = "";
      persistState(state);
      render();
    }
    addBtn.addEventListener("click", doAdd);
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        doAdd();
      }
    });
    addRow.appendChild(inp);
    addRow.appendChild(addBtn);
    root.appendChild(addRow);

    var restore = el("button", "tasks-restore-hidden", { type: "button" });
    restore.textContent = "הצג שוב פריטים ברירת־מחדל שהוסרו";
    restore.addEventListener("click", function () {
      state.hidden = [];
      persistState(state);
      render();
    });
    root.appendChild(restore);

    var syncP = el("p", "muted tasks-remote-status");
    syncP.textContent = syncLineText + (lastDbHost ? " · מאגר: " + lastDbHost : "");
    root.appendChild(syncP);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  root.textContent = "";
  var loadingP = el("p", "muted");
  loadingP.textContent = "טוען משימות…";
  root.appendChild(loadingP);

  (async function boot() {
    try {
      await hydrateFromServer();
    } finally {
      loadingP.remove();
      render();
    }
  })();

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      clearTimeout(saveTimer);
      flushRemoteSaveKeepalive();
    }
  });
  window.addEventListener("pagehide", function () {
    clearTimeout(saveTimer);
    flushRemoteSaveKeepalive();
  });
})();
