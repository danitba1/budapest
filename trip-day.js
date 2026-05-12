import { TRIP_DAY_PLAN, TRIP_DAY_EXTRAS, buildTripRowWazeHref } from "./trip-days-data.js";

(function () {
  var root = document.getElementById("trip-day-root");
  if (!root || !TRIP_DAY_PLAN || !TRIP_DAY_PLAN.length) return;

  var API_BASE = typeof window.PACK_API_BASE !== "undefined" ? window.PACK_API_BASE : "";
  var TOKEN_KEY = "pack_api_token";

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

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") e.textContent = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
    }
    return e;
  }

  function parseDay() {
    var q = new URLSearchParams(window.location.search).get("day");
    var d = q != null ? parseInt(q, 10) : NaN;
    if (d >= 1 && d <= 10) return d;
    var m = (window.location.hash || "").match(/^#day-(\d+)$/);
    if (m) {
      var h = parseInt(m[1], 10);
      if (h >= 1 && h <= 10) return h;
    }
    return 1;
  }

  var currentDay = parseDay();

  var TICKET_HTML = {
    must: { cls: "ticket-must", label: "חובה" },
    rec: { cls: "ticket-rec", label: "מומלץ" },
    no: { cls: "ticket-no", label: "לא" },
    na: { cls: "ticket-na", label: "—" },
  };

  function buildPlanTable(plan) {
    var wrap = el("div", "day-table-wrap");
    var table = el("table", "day-table");
    table.innerHTML =
      "<thead><tr>" +
      "<th scope=\"col\">חלק ביום</th>" +
      "<th scope=\"col\">מה עושים</th>" +
      "<th scope=\"col\">כרטיס מראש</th>" +
      "<th scope=\"col\" class=\"col-links\">קישורים</th>" +
      "<th scope=\"col\" class=\"col-waze\">ניווט (Waze)</th>" +
      "</tr></thead>";
    var tb = el("tbody");
    plan.rows.forEach(function (row) {
      var tr = el("tr");
      var th = el("th", null, { scope: "row", text: row.part });
      var td1 = el("td");
      td1.innerHTML = row.activity;
      var td2 = el("td", "ticket-cell");
      var tinfo = TICKET_HTML[row.ticket] || TICKET_HTML.na;
      var span = el("span", "ticket " + tinfo.cls, { text: tinfo.label });
      td2.appendChild(span);
      if (row.ticketNote) {
        var sp2 = el("span", "muted", { text: " " + row.ticketNote });
        td2.appendChild(sp2);
      }
      var td3 = el("td", "col-links");
      td3.innerHTML = row.links;
      var td4 = el("td", "col-waze");
      var wHref =
        typeof window.buildTripRowWazeHref === "function" ? window.buildTripRowWazeHref(row) : null;
      if (wHref) {
        var wa = el("a", "", {
          href: wHref,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "פתח ב-Waze",
        });
        td4.appendChild(wa);
      } else {
        td4.appendChild(el("span", "muted", { text: "—" }));
      }
      tr.appendChild(th);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    wrap.appendChild(table);
    return wrap;
  }

  function render() {
    var plan = TRIP_DAY_PLAN[currentDay - 1];
    if (!plan) {
      root.textContent = "יום לא קיים.";
      return;
    }

    var extras = (TRIP_DAY_EXTRAS && TRIP_DAY_EXTRAS[String(currentDay)]) || {};

    document.title = plan.title + " – משפחת בן אדמון";
    var heroTitle = document.getElementById("trip-day-hero-title");
    if (heroTitle) heroTitle.textContent = plan.title;

    root.textContent = "";

    var controls = el("div", "trip-day-controls");
    var lab = el("label", "trip-day-controls__label");
    lab.setAttribute("for", "trip-day-select");
    lab.textContent = "בחירת יום:";
    var sel = el("select", "trip-day-select", { id: "trip-day-select" });
    for (var i = 1; i <= 10; i++) {
      var p0 = TRIP_DAY_PLAN[i - 1];
      var opt = el("option", null, { value: String(i), text: "יום " + i + " — " + (p0.title.split("–")[1] || p0.title).trim() });
      if (i === currentDay) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", function () {
      var v = parseInt(sel.value, 10);
      if (v >= 1 && v <= 10) {
        window.location.href = "trip-day.html?day=" + v;
      }
    });
    controls.appendChild(lab);
    controls.appendChild(sel);
    root.appendChild(controls);

    var lede = el("p", "page-lede trip-day-lede");
    lede.innerHTML =
      "זהו <strong>אותו יום</strong> כמו ב<a href=\"index.html#day" +
      currentDay +
      "\">תכנית בדף הבית</a>. " +
      "למסמך המלא: <a href=\"index.html#prep-title\">דגשים לפני שיוצאים</a> · " +
      "<a href=\"index.html#tasks-title\">משימות להזמנה מראש</a> · " +
      "<a href=\"index.html#plan-title\">כל הימים בטבלה אחת</a>.";
    root.appendChild(lede);

    var legend = el("p", "table-legend", { role: "note" });
    legend.innerHTML =
      "<strong>חובה</strong> – יש לרכוש כרטיס/כניסה מראש באתר הרשמי · " +
      "<strong>מומלץ</strong> – כדאי להזמין מראש · " +
      "<strong>לא</strong> – בדרך כלל במקום · " +
      "<strong>—</strong> – לא רלוונטי לכרטיס";
    root.appendChild(legend);


    var card = el("article", "day-card", { id: "day" + currentDay });
    var headRow = el("div", "day-head-row");
    var head = el("div", "day-head", { text: plan.title });
    var back = el("a", "day-head-link", { href: "index.html#day" + currentDay });
    back.textContent = "← בדף הבית";
    headRow.appendChild(head);
    headRow.appendChild(back);
    card.appendChild(headRow);
    card.appendChild(buildPlanTable(plan));
    root.appendChild(card);

    if (extras.navigation) {
      var secNavT = el("section", "trip-extra-section", {
        "aria-labelledby": "trip-nav-time-title-" + currentDay,
      });
      secNavT.appendChild(
        el("h2", "section-heading", { id: "trip-nav-time-title-" + currentDay, text: "ניווט וזמן" })
      );
      var navWrap = el("div", "trip-nav-time-body");
      navWrap.innerHTML = extras.navigation;
      secNavT.appendChild(navWrap);
      root.appendChild(secNavT);
    }

    if (extras.recommendations && extras.recommendations.length) {
      var secR = el("section", "trip-extra-section", { "aria-labelledby": "trip-rec-title" });
      secR.appendChild(el("h2", "section-heading", { id: "trip-rec-title", text: "המלצות נוספות באזור / בדרך" }));
      var ul = el("ul", "trip-extra-list");
      extras.recommendations.forEach(function (t) {
        var li = el("li");
        li.innerHTML = t;
        ul.appendChild(li);
      });
      secR.appendChild(ul);
      root.appendChild(secR);
    }

    if (extras.roads) {
      var secRoad = el("section", "trip-extra-section", { "aria-labelledby": "trip-roads-title" });
      secRoad.appendChild(el("h2", "section-heading", { id: "trip-roads-title", text: "כבישים ונסיעה ביום זה" }));
      var pr = el("p", "trip-extra-prose");
      pr.innerHTML = extras.roads;
      secRoad.appendChild(pr);
      root.appendChild(secRoad);
    }

    if (extras.misc) {
      var secM = el("section", "trip-extra-section", { "aria-labelledby": "trip-misc-title" });
      secM.appendChild(el("h2", "section-heading", { id: "trip-misc-title", text: "עוד ליום זה" }));
      var pm = el("p", "trip-extra-prose");
      pm.innerHTML = extras.misc;
      secM.appendChild(pm);
      root.appendChild(secM);
    }

    var mealsSec = el("section", "trip-meals-section", { "aria-labelledby": "trip-meals-title" });
    mealsSec.appendChild(
      el("h2", "section-heading", {
        id: "trip-meals-title",
        text: "תכנון ארוחות והערות (נשמר בשרת)",
      })
    );
    var mealsNote = el("p", "page-lede trip-meals-lede");
    mealsNote.innerHTML =
      "שתי ארוחות ו<strong>הערות כלליות</strong> ליום זה נשמרות ב<strong>PostgreSQL</strong> (טבלת <code>trip_day_meals</code>). " +
      "יש לפתוח את האתר דרך השרת (כמו <a href=\"packing.html\">רשימת האריזה</a>). " +
      "אם מוגדר <code>PACK_API_TOKEN</code> — אותו מפתח בדפדפן נדרש לשמירה.";
    mealsSec.appendChild(mealsNote);

    var form = el("div", "trip-meals-form intro-box");
    var ta1L = el("label", "trip-meals-label", { for: "meal-1" });
    ta1L.textContent = "ארוחה 1 (למשל צהריים)";
    var ta1 = el("textarea", "trip-meals-textarea", { id: "meal-1", rows: "4", "aria-required": "false" });
    var ta2L = el("label", "trip-meals-label", { for: "meal-2" });
    ta2L.textContent = "ארוחה 2 (למשל ערב)";
    var ta2 = el("textarea", "trip-meals-textarea", { id: "meal-2", rows: "4" });
    var ta3L = el("label", "trip-meals-label", { for: "meal-general" });
    ta3L.textContent = "הערות כלליות ליום (מזון, קניות, העדפות, תזכורות)";
    var ta3 = el("textarea", "trip-meals-textarea", { id: "meal-general", rows: "4" });
    var status = el("p", "trip-meals-status muted");
    status.textContent = "טוען…";
    var btnRow = el("div", "trip-meals-actions");
    var saveBtn = el("button", "pack-btn pack-btn--primary", { type: "button", text: "שמירה לשרת" });
    btnRow.appendChild(saveBtn);
    form.appendChild(ta1L);
    form.appendChild(ta1);
    form.appendChild(ta2L);
    form.appendChild(ta2);
    form.appendChild(ta3L);
    form.appendChild(ta3);
    form.appendChild(status);
    form.appendChild(btnRow);
    mealsSec.appendChild(form);
    root.appendChild(mealsSec);

    var navFoot = el("nav", "trip-day-pager", { "aria-label": "מעבר בין ימים" });
    if (currentDay > 1) {
      var prev = el("a", "trip-day-pager__link", { href: "trip-day.html?day=" + (currentDay - 1) });
      prev.textContent = "← יום " + (currentDay - 1);
      navFoot.appendChild(prev);
    }
    if (currentDay < 10) {
      var next = el("a", "trip-day-pager__link", { href: "trip-day.html?day=" + (currentDay + 1) });
      next.textContent = "יום " + (currentDay + 1) + " →";
      navFoot.appendChild(next);
    }
    root.appendChild(navFoot);

    async function apiFetch(path, options) {
      var res = await fetch(apiUrl(path), options);
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
          if (ej && ej.error != null) {
            var er = ej.error;
            msg =
              typeof er === "string"
                ? er
                : er && typeof er.message === "string"
                  ? er.message
                  : JSON.stringify(er);
          }
        } catch (x) {
          if (res.status === 404 && (/Cannot GET|404/.test(bodyText) || /<!DOCTYPE/i.test(bodyText))) {
            msg =
              "השרת לא מכיר את הנתיב /api/trip-days/…/meals — כנראה תהליך Node ישן ללא הקוד העדכני. " +
              "עצרו את השרת והריצו שוב: npm start מתוך תיקיית server (או פריסה מחדש). " +
              "בדקו בטרמינל שמופיעה השורה: Trip meals API: GET|PUT /api/trip-days/1..10/meals";
          }
        }
        throw new Error((res.status + " " + msg).trim());
      }
      return JSON.parse(bodyText);
    }

    async function loadMeals() {
      status.textContent = "טוען ארוחות…";
      ta1.disabled = true;
      ta2.disabled = true;
      ta3.disabled = true;
      try {
        var data = await apiFetch("/api/trip-days/" + currentDay + "/meals", {
          method: "GET",
          headers: getAuthHeaders(),
        });
        ta1.value = data.meal1 || "";
        ta2.value = data.meal2 || "";
        ta3.value = data.generalNotes || "";
        if (data.updatedAt) {
          status.textContent = "עודכן לאחרונה: " + new Date(data.updatedAt).toLocaleString("he-IL");
        } else {
          status.textContent = "אין עדיין נתונים — הזינו ושמרו.";
        }
      } catch (err) {
        if (err.message === "UNAUTHORIZED" || err.status === 401) {
          status.innerHTML =
            "נדרש מפתח API (כמו ברשימת האריזה). פתחו את <a href=\"packing.html\">רשימת האריזה</a>, הזינו את ערך <code>PACK_API_TOKEN</code>, וחזרו לכאן.";
        } else {
          status.textContent = "שגיאה: " + (err.message || err);
        }
      } finally {
        ta1.disabled = false;
        ta2.disabled = false;
        ta3.disabled = false;
      }
    }

    saveBtn.addEventListener("click", async function () {
      status.textContent = "שומר…";
      saveBtn.disabled = true;
      try {
        var data = await apiFetch("/api/trip-days/" + currentDay + "/meals", {
          method: "PUT",
          headers: getJsonHeaders(),
          body: JSON.stringify({ meal1: ta1.value, meal2: ta2.value, generalNotes: ta3.value }),
        });
        status.textContent = "נשמר. עודכן: " + new Date(data.updatedAt).toLocaleString("he-IL");
      } catch (err) {
        if (err.message === "UNAUTHORIZED" || err.status === 401) {
          status.textContent = "אין הרשאה — הגדירו מפתח API (ראו למעלה).";
        } else {
          status.textContent = "שגיאה בשמירה: " + (err.message || err);
        }
      } finally {
        saveBtn.disabled = false;
      }
    });

    loadMeals();
  }

  render();
})();
