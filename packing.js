(function () {
  var root = document.getElementById("pack-root");
  if (!root) return;

  var API_BASE = typeof window.PACK_API_BASE !== "undefined" ? window.PACK_API_BASE : "";
  var TOKEN_KEY = "pack_api_token";

  function apiUrl(path) {
    return API_BASE + path;
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

  var state = { categories: [] };
  var loadError = null;

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

  function totalCounts() {
    var t = 0,
      p = 0;
    state.categories.forEach(function (c) {
      c.items.forEach(function (i) {
        t++;
        if (i.packed) p++;
      });
    });
    return { total: t, packed: p };
  }

  async function apiFetch(path, options) {
    var res = await fetch(apiUrl(path), options);
    var bodyText = await res.text();
    if (res.status === 401) {
      var err401 = new Error("UNAUTHORIZED");
      err401.status = 401;
      throw err401;
    }
    if (!res.ok) {
      var msg = bodyText;
      try {
        var ej = JSON.parse(bodyText);
        if (ej && ej.error) msg = ej.error;
      } catch (parseErr) {}
      var err = new Error((res.status + " " + (msg || res.statusText)).trim());
      err.status = res.status;
      throw err;
    }
    var ct = res.headers.get("content-type") || "";
    if (ct.indexOf("application/json") === -1 && bodyText.charAt(0) !== "{") {
      throw new Error(
        "Expected JSON from /api — is the Node server running? First characters: " + bodyText.slice(0, 120)
      );
    }
    try {
      return JSON.parse(bodyText);
    } catch (e2) {
      throw new Error("Invalid JSON: " + bodyText.slice(0, 200));
    }
  }

  async function loadState() {
    loadError = null;
    var data = await apiFetch("/api/pack", { method: "GET", headers: getAuthHeaders() });
    if (!data.categories || !Array.isArray(data.categories)) throw new Error("Invalid response");
    state = data;
  }

  async function refresh() {
    try {
      await loadState();
      render();
    } catch (e) {
      if (e.message === "UNAUTHORIZED" || e.status === 401) {
        loadError = "auth";
      } else {
        loadError = String(e.message || e);
      }
      render();
    }
  }

  function renderTokenForm() {
    root.textContent = "";
    var box = el("div", "pack-token-box intro-box");
    var p = el("p", "");
    p.textContent =
      "השרת דורש מפתח גישה. הזינו את אותו ערך כמו PACK_API_TOKEN בקובץ .env של השרת (או השאירו ריק בשרת ללא אימות).";
    var inp = el("input", "pack-input pack-input--grow");
    inp.type = "password";
    inp.placeholder = "מפתח API";
    inp.style.marginTop = "0.75rem";
    inp.style.width = "100%";
    var btn = el("button", "pack-btn pack-btn--primary", { type: "button" });
    btn.textContent = "שמירה וטעינה מחדש";
    btn.style.marginTop = "0.75rem";
    btn.addEventListener("click", function () {
      var v = inp.value.trim();
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
      loadError = null;
      refresh();
    });
    box.appendChild(p);
    box.appendChild(inp);
    box.appendChild(btn);
    root.appendChild(box);
  }

  function renderError(msg) {
    root.textContent = "";
    var box = el("div", "pack-error-box intro-box");
    box.style.borderColor = "#fecaca";
    var p = el("p", "");
    p.textContent = "שגיאה בטעינה מהשרת: " + msg;
    var hint = el("p", "muted");
    hint.style.marginTop = "0.5rem";
    hint.textContent =
      "ודאו שהשרת רץ (npm start), ש-DATABASE_URL נכון, ושאתם נכנסים דרך אותה כתובת (localhost או פריסת Vercel עם משתני סביבה). בדף 404 עם file:// פתחו דרך http או https.";
    var retry = el("button", "pack-btn pack-btn--primary", { type: "button" });
    retry.textContent = "נסו שוב";
    retry.style.marginTop = "0.75rem";
    retry.addEventListener("click", function () {
      refresh();
    });
    box.appendChild(p);
    box.appendChild(hint);
    box.appendChild(retry);
    root.appendChild(box);
  }

  function render() {
    if (loadError === "auth") {
      renderTokenForm();
      return;
    }
    if (loadError) {
      renderError(loadError);
      return;
    }

    root.textContent = "";
    var counts = totalCounts();

    var toolbar = el("div", "pack-toolbar");
    var stat = el("p", "pack-stat");
    stat.textContent =
      counts.total === 0
        ? "עדיין אין פריטים – הוסיפו פריטים למטה (הרשימה נטענת אוטומטית מהמסד בפתיחת הדף)."
        : "ארוז: " + counts.packed + " מתוך " + counts.total + " פריטים · מסד נתונים משותף";
    toolbar.appendChild(stat);

    var addCatWrap = el("div", "pack-toolbar__row");
    var catInput = el("input", "pack-input");
    catInput.type = "text";
    catInput.placeholder = "שם קטגוריה חדשה";
    catInput.setAttribute("aria-label", "שם קטגוריה חדשה");
    var catBtn = el("button", "pack-btn pack-btn--primary", { type: "button" });
    catBtn.textContent = "הוספת קטגוריה";
    catBtn.addEventListener("click", async function () {
      var name = catInput.value.trim();
      if (!name) return;
      catBtn.disabled = true;
      try {
        await apiFetch("/api/pack/categories", {
          method: "POST",
          headers: getJsonHeaders(),
          body: JSON.stringify({ name: name }),
        });
        catInput.value = "";
        await refresh();
      } catch (e) {
        window.alert("שגיאה: " + (e.message || e));
      }
      catBtn.disabled = false;
    });
    addCatWrap.appendChild(catInput);
    addCatWrap.appendChild(catBtn);
    toolbar.appendChild(addCatWrap);

    var tools = el("div", "pack-toolbar__tools");
    var expBtn = el("button", "pack-btn pack-btn--ghost", { type: "button" });
    expBtn.textContent = "ייצוא JSON (צילום מסך מקומי)";
    expBtn.addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
      var a = el("a", "", { href: URL.createObjectURL(blob), download: "packing-snapshot.json" });
      a.click();
      URL.revokeObjectURL(a.href);
    });
    var resetBtn = el("button", "pack-btn pack-btn--danger", { type: "button" });
    resetBtn.textContent = "איפוס לרשימת התחלה (בשרת)";
    resetBtn.addEventListener("click", async function () {
      if (
        !window.confirm(
          "למחוק הכל במסד הנתונים ולהחזיר קטגוריות ברירת מחדל + רשימת פריטים בסיסית?"
        )
      )
        return;
      resetBtn.disabled = true;
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
      resetBtn.disabled = false;
    });
    var clearTok = el("button", "pack-btn pack-btn--ghost", { type: "button" });
    clearTok.textContent = "ניקוי מפתח API בדפדפן";
    clearTok.addEventListener("click", function () {
      localStorage.removeItem(TOKEN_KEY);
      window.alert("המפתח הוסר. טעינה מחדש.");
      loadError = "auth";
      render();
    });
    tools.appendChild(expBtn);
    tools.appendChild(resetBtn);
    tools.appendChild(clearTok);
    toolbar.appendChild(tools);
    root.appendChild(toolbar);

    var list = el("div", "pack-cats");
    state.categories.forEach(function (cat) {
      var card = el("section", "pack-cat");
      card.setAttribute("aria-labelledby", "pack-cat-" + cat.id);

      var head = el("div", "pack-cat__head");
      var title = el("h2", "pack-cat__title", { id: "pack-cat-" + cat.id });
      title.textContent = cat.name;
      var delCat = el("button", "pack-icon-btn", { type: "button", "aria-label": "מחיקת קטגוריה " + cat.name });
      delCat.textContent = "✕";
      delCat.addEventListener("click", async function () {
        if (!window.confirm('למחוק את הקטגוריה "' + cat.name + '" וכל הפריטים בה?')) return;
        delCat.disabled = true;
        try {
          await apiFetch("/api/pack/categories/" + encodeURIComponent(cat.id), {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          await refresh();
        } catch (e) {
          window.alert("שגיאה: " + (e.message || e));
        }
        delCat.disabled = false;
      });
      head.appendChild(title);
      head.appendChild(delCat);
      card.appendChild(head);

      var ul = el("ul", "pack-items");
      cat.items.forEach(function (item) {
        var li = el("li", "pack-item" + (item.packed ? " pack-item--packed" : ""));
        var lab = el("label", "pack-item__label");
        var cb = el("input", "pack-item__cb");
        cb.type = "checkbox";
        cb.checked = !!item.packed;
        cb.setAttribute("aria-label", "סימון כארוז: " + item.text);
        cb.addEventListener("change", async function () {
          var val = cb.checked;
          cb.disabled = true;
          try {
            await apiFetch("/api/pack/items/" + encodeURIComponent(item.id), {
              method: "PATCH",
              headers: getJsonHeaders(),
              body: JSON.stringify({ packed: val }),
            });
            await refresh();
          } catch (e) {
            cb.checked = !val;
            window.alert("שגיאה: " + (e.message || e));
          }
          cb.disabled = false;
        });
        var span = el("span", "pack-item__text");
        span.textContent = item.text;
        lab.appendChild(cb);
        lab.appendChild(span);
        var delIt = el("button", "pack-icon-btn pack-icon-btn--item", {
          type: "button",
          "aria-label": "מחיקת פריט",
        });
        delIt.textContent = "✕";
        delIt.addEventListener("click", async function () {
          if (!window.confirm("למחוק את הפריט?")) return;
          delIt.disabled = true;
          try {
            await apiFetch("/api/pack/items/" + encodeURIComponent(item.id), {
              method: "DELETE",
              headers: getAuthHeaders(),
            });
            await refresh();
          } catch (e) {
            window.alert("שגיאה: " + (e.message || e));
          }
          delIt.disabled = false;
        });
        li.appendChild(lab);
        li.appendChild(delIt);
        ul.appendChild(li);
      });
      card.appendChild(ul);

      var addRow = el("div", "pack-add");
      var inp = el("input", "pack-input pack-input--grow");
      inp.type = "text";
      inp.placeholder = "פריט חדש באריזה…";
      inp.setAttribute("aria-label", "פריט חדש ב" + cat.name);
      var addBtn = el("button", "pack-btn pack-btn--primary", { type: "button" });
      addBtn.textContent = "הוספה";
      async function doAdd() {
        var txt = inp.value.trim();
        if (!txt) return;
        addBtn.disabled = true;
        inp.disabled = true;
        try {
          await apiFetch("/api/pack/categories/" + encodeURIComponent(cat.id) + "/items", {
            method: "POST",
            headers: getJsonHeaders(),
            body: JSON.stringify({ text: txt }),
          });
          inp.value = "";
          await refresh();
        } catch (e) {
          window.alert("שגיאה: " + (e.message || e));
        }
        addBtn.disabled = false;
        inp.disabled = false;
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
      card.appendChild(addRow);

      list.appendChild(card);
    });
    root.appendChild(list);
  }

  root.textContent = "";
  var loading = el("p", "pack-loading muted");
  loading.textContent = "טוען רשימה מהשרת…";
  root.appendChild(loading);

  refresh();
})();
