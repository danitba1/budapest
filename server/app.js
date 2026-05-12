/**
 * אפליקציית Express: API אריזה + ארוחות + קבצים סטטיים (מקומי).
 * listen: ראה index.js · Vercel: api/server.js (serverless-http).
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { getPoolOptions, getDatabaseUserFromUrl } = require("./connection-config");

var PORT = parseInt(process.env.PORT || "3000", 10);
var PACK_API_TOKEN = process.env.PACK_API_TOKEN || "";

var poolOpts = getPoolOptions();
if (!poolOpts) {
  var vercelHint =
    "Missing DATABASE_URL. On Vercel: Project → Settings → Environment Variables → add DATABASE_URL (paste Neon connection string), Production + Preview as needed, then Redeploy. Local: create server/.env with DATABASE_URL=...";
  if (process.env.VERCEL) {
    throw new Error(vercelHint);
  }
  console.error("[budapest-api] " + vercelHint);
  process.exit(1);
}
var pool = new Pool(poolOpts);

/** Hostname from DATABASE_URL (no password) — compare Vercel vs local to confirm same Neon DB. */
function databaseUrlHostHint() {
  var raw = process.env.DATABASE_URL || "";
  if (!raw) return null;
  try {
    var normalized = raw.replace(/^postgres(ql)?:\/\//i, "https://");
    var u = new URL(normalized);
    return u.hostname || null;
  } catch (e) {
    return null;
  }
}

var _dbUrlUser = getDatabaseUserFromUrl();
if (_dbUrlUser && _dbUrlUser.toLowerCase() === "authenticator") {
  console.warn(
    "[budapest-api] DATABASE_URL login is \"authenticator\" (Neon pooled). For this app, copy the Direct (non-pooled) connection string from Neon so the URL user is your real role (e.g. neondb_owner); then GRANT … TO that same name."
  );
}

var DEFAULT_CATEGORY_NAMES = [
  "בגדים ונעליים",
  "היגיינה וטיפוח",
  "מסמכים, כסף וביטוח",
  "רכב וציוד (כולל צ׳ימיגג)",
  "אלקטרוניקה ומצלמה",
  "ילדים ובידור",
  "מזון לדרך (סלובניה/קרואטיה)",
];

/** פריטי אריזה בסיסיים — נטענים רק כשאין אף פריט בטבלה (מסד חדש או איפוס מלא). */
var DEFAULT_PACKING_ITEMS = {
  "בגדים ונעליים": [
    "בגדים לפי עונה (חם / קר / גשם)",
    "מעיל או מעיל גשם קליל",
    "נעלי הליכה נוחות",
    "סנדלים / נעלי ספורט",
    "גרביים",
    "כובעים / כיפה / כפות ראש",
    "פיג׳מות",
    "בגד ים (אם רלוונטי לפארקי מים)",
  ],
  "היגיינה וטיפוח": [
    "מברשות שיניים + משחה",
    "שמפו / סבון (לפי העדפה)",
    "דאודורנט",
    "מגבונים לחים",
    "תרופות אישיות (קבועות + כאב / חום / אלרגיה)",
    "קרם הגנה + משחה אחרי שמש",
    "מסרק / אביזרי שיער",
    "מגבות קטנות לדרך",
  ],
  "מסמכים, כסף וביטוח": [
    "דרכונים / תעודות זהות לכולם",
    "רישיון נהיגה + רישיון בינלאומי",
    "אישורי טיסה / הזמנות לינה (מודפסים או בטלפון)",
    "ביטוח נסיעות — פוליסה ומספר חירום",
    "כרטיסי אשראי / מזומן / אירו",
    "צילום/צילום של רישיון רכב והשכרה (שילר)",
    "רשימת טלפונים חשובים (מארחים, חב״ד, שילר)",
  ],
  "רכב וציוד (כולל צ׳ימיגג)": [
    "וידוא צ׳ימיגג מאושר ורצועות תקינות",
    "מטען לרכב + כבלי USB",
    "מחזיק טלפון לרכב",
    "מפת דרכים / הורדת מפות לאופליין",
    "צידנית קטנה + קרח / קרחומים",
    "מים לרכב (בקבוקים)",
    "שקיות אשפה לרכב",
  ],
  "אלקטרוניקה ומצלמה": [
    "טלפונים + מטענים לבית",
    "מתאמי שקע (אירופה — סוג C/F)",
    "פאוור־בנק",
    "מצלמה / מצלמת אקשן (אם יש)",
    "כרטיסי זיכרון נוספים",
  ],
  "ילדים ובידור": [
    "משחקים קטנים / צבעים לדרך",
    "ספרים / מחברות",
    "טאבלט / אוזניות (לילדים)",
    "בקבוקי שתייה / קערות לילדים קטנים",
    "מטריה קומפקטית",
  ],
  "מזון לדרך (סלובניה/קרואטיה)": [
    "חטיפים כשרים מהבית (לפני בודפשט)",
    "עוגיות / דגני בוקר אישורים",
    "שקיות תה / נס קפה",
    "כלי אכילה חד־פעמיים (אופציונלי)",
    "שקיות זיפלוק לאוכל",
  ],
};

/** Same as schema.sql — inlined so startup never depends on reading a file. */
var PACKING_DDL_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS public.packing_categories (" +
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid()," +
    "name TEXT NOT NULL," +
    "sort_order INT NOT NULL DEFAULT 0," +
    "created_at TIMESTAMPTZ NOT NULL DEFAULT now()" +
    ")",
  "CREATE TABLE IF NOT EXISTS public.packing_items (" +
    "id UUID PRIMARY KEY DEFAULT gen_random_uuid()," +
    "category_id UUID NOT NULL REFERENCES public.packing_categories (id) ON DELETE CASCADE," +
    "text TEXT NOT NULL," +
    "packed BOOLEAN NOT NULL DEFAULT false," +
    "created_at TIMESTAMPTZ NOT NULL DEFAULT now()," +
    "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()" +
    ")",
  "CREATE INDEX IF NOT EXISTS packing_items_category_id_idx ON public.packing_items (category_id)",
];

var TRIP_DAY_MEALS_DDL_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS public.trip_day_meals (" +
    "day_number INT PRIMARY KEY CHECK (day_number >= 1 AND day_number <= 10)," +
    "meal_1 TEXT NOT NULL DEFAULT ''," +
    "meal_2 TEXT NOT NULL DEFAULT ''," +
    "general_notes TEXT NOT NULL DEFAULT ''," +
    "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()" +
    ")",
  "ALTER TABLE public.trip_day_meals ADD COLUMN IF NOT EXISTS general_notes TEXT NOT NULL DEFAULT ''",
];

var TRIP_TASKS_DDL_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS public.trip_tasks_state (" +
    "id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)," +
    "payload JSONB NOT NULL DEFAULT '{\"done\":{},\"hidden\":[],\"custom\":[]}'::jsonb," +
    "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()" +
    ")",
];

async function ensureTripTasksSchema() {
  var client = await pool.connect();
  try {
    await client.query("SET search_path TO public");
    for (var t = 0; t < TRIP_TASKS_DDL_STATEMENTS.length; t++) {
      await client.query(TRIP_TASKS_DDL_STATEMENTS[t]);
    }
  } finally {
    client.release();
  }
}

async function ensureTripTasksSeed() {
  await ensureTripTasksSchema();
  await pool.query("INSERT INTO public.trip_tasks_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
}

/** מחזיר אובייקט { done, hidden, custom } תקין לשמירה ב־JSONB. */
function sanitizeTasksPayload(body) {
  if (!body || typeof body !== "object") return null;
  var done = {};
  if (body.done && typeof body.done === "object" && !Array.isArray(body.done)) {
    var keys = Object.keys(body.done);
    for (var di = 0; di < keys.length && di < 400; di++) {
      var dk = String(keys[di]).slice(0, 300);
      if (body.done[keys[di]] === true) done[dk] = true;
    }
  }
  var hidden = [];
  if (Array.isArray(body.hidden)) {
    for (var hi = 0; hi < body.hidden.length && hi < 250; hi++) {
      var hs = body.hidden[hi];
      if (typeof hs === "string" && hs.length <= 300) hidden.push(hs);
    }
  }
  var custom = [];
  if (Array.isArray(body.custom)) {
    for (var ci = 0; ci < body.custom.length && ci < 150; ci++) {
      var c = body.custom[ci];
      if (!c || typeof c !== "object") continue;
      var id = c.id != null ? String(c.id).trim().slice(0, 120) : "";
      var text = c.text != null ? String(c.text).trim().slice(0, 4000) : "";
      if (!id || !text) continue;
      custom.push({ id: id, text: text });
    }
  }
  return { done: done, hidden: hidden, custom: custom };
}

async function ensureTripDayMealsSchema() {
  var client = await pool.connect();
  try {
    await client.query("SET search_path TO public");
    for (var j = 0; j < TRIP_DAY_MEALS_DDL_STATEMENTS.length; j++) {
      await client.query(TRIP_DAY_MEALS_DDL_STATEMENTS[j]);
    }
  } finally {
    client.release();
  }
}

async function ensureTripDayMealsSeed() {
  await ensureTripDayMealsSchema();
  await pool.query(
    "INSERT INTO public.trip_day_meals (day_number, meal_1, meal_2) " +
      "SELECT g.n, '', '' FROM generate_series(1, 10) AS g(n) " +
      "ON CONFLICT (day_number) DO NOTHING"
  );
}

function logPackingPermissionHelp(title) {
  var role = getDatabaseUserFromUrl();
  var ident = role ? '"' + role.replace(/"/g, '""') + '"' : '"YOUR_APP_ROLE"';
  console.error("[budapest-api] " + (title || "Database permission fix") + ":");
  console.error("");
  console.error("  In Neon: SQL Editor → run as owner (the role that created the tables):");
  console.error("  Do NOT use GRANT ... TO CURRENT_USER — that grants the SQL Editor session, not your app.");
  console.error("");
  console.error("  GRANT USAGE ON SCHEMA public TO " + ident + ";");
  console.error(
    "  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_categories, public.packing_items, public.trip_day_meals, public.trip_tasks_state TO " +
      ident +
      ";"
  );
  console.error("");
  console.error(
    "  Alternatively, copy DATABASE_URL from Neon for the same role that owns those tables (connection string often contains neondb_owner or similar)."
  );
  console.error("");
}

async function logDbPermissionDiagnostics() {
  console.error("[budapest-api] Diagnostics (compare with Neon branch + role you granted):");
  var urlUser = getDatabaseUserFromUrl();
  console.error("  DATABASE_URL username (parsed, no password): " + (urlUser || "(could not parse URL)"));
  try {
    var me = await pool.query(
      "SELECT current_user::text AS cu, session_user::text AS su, current_database()::text AS db"
    );
    var r = me.rows[0];
    console.error("  Live session: current_user=" + r.cu + " session_user=" + r.su + " database=" + r.db);
    if (urlUser && r.cu.toLowerCase() !== urlUser.toLowerCase()) {
      console.error(
        "  *** Mismatch: URL user and current_user differ — fix server/.env or remove a conflicting system DATABASE_URL. ***"
      );
    }
  } catch (e) {
    console.error("  (session query failed: " + e.message + ")");
  }
  try {
    var own = await pool.query(
      "SELECT c.relname::text AS tablename, pg_catalog.pg_get_userbyid(c.relowner)::text AS owner " +
        "FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace " +
        "WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN ('packing_categories','packing_items','trip_day_meals','trip_tasks_state')"
    );
    console.error("  Table owners: " + JSON.stringify(own.rows));
    if (!own.rows.length) {
      console.error(
        "  *** No packing_* tables in public on THIS database — wrong Neon branch or DATABASE_URL points elsewhere. ***"
      );
    }
  } catch (e) {
    console.error("  (owner lookup failed: " + e.message + ")");
  }
  try {
    var gr = await pool.query(
      "SELECT table_name::text AS tbl, grantee::text AS grantee, string_agg(privilege_type::text, ', ' ORDER BY privilege_type::text) AS privs " +
        "FROM information_schema.role_table_grants " +
        "WHERE table_schema = 'public' AND table_name IN ('packing_categories','packing_items','trip_day_meals','trip_tasks_state') " +
        "GROUP BY table_name, grantee ORDER BY table_name, grantee"
    );
    console.error("  Grants on these tables: " + JSON.stringify(gr.rows));
  } catch (e) {
    console.error("  (grant listing failed: " + e.message + ")");
  }
  console.error("");
}

function authMiddleware(req, res, next) {
  if (!PACK_API_TOKEN) return next();
  var auth = req.headers.authorization || "";
  var bearer = auth.replace(/^Bearer\s+/i, "").trim();
  var headerToken = (req.headers["x-pack-token"] || "").trim();
  var token = bearer || headerToken;
  if (token === PACK_API_TOKEN) return next();
  return res.status(401).json({ error: "Unauthorized", hint: "Set Authorization: Bearer <token> or X-Pack-Token" });
}

async function fetchFullState() {
  var cats = await pool.query(
    "SELECT id, name, sort_order FROM public.packing_categories ORDER BY sort_order ASC, created_at ASC"
  );
  var items = await pool.query(
    "SELECT id, category_id, text, packed FROM public.packing_items ORDER BY created_at ASC"
  );
  var byCat = {};
  items.rows.forEach(function (row) {
    if (!byCat[row.category_id]) byCat[row.category_id] = [];
    byCat[row.category_id].push({ id: row.id, text: row.text, packed: row.packed });
  });
  return {
    categories: cats.rows.map(function (c) {
      return { id: c.id, name: c.name, items: byCat[c.id] || [] };
    }),
  };
}

async function ensureSchema() {
  try {
    await pool.query("SELECT 1 FROM public.packing_categories LIMIT 1");
    return;
  } catch (probeErr) {
    if (String(probeErr.code) === "42P01") {
      /* relation missing — try DDL below */
    } else if (String(probeErr.code) === "42501") {
      logPackingPermissionHelp("Cannot read packing tables");
      await logDbPermissionDiagnostics();
      throw new Error(probeErr.message + " — fix grants (see SQL above) or use the table owner in DATABASE_URL.");
    } else {
      throw probeErr;
    }
  }

  console.log("[budapest-api] Creating tables (inline DDL) …");

  var client = await pool.connect();
  try {
    await client.query("SET search_path TO public");
    for (var i = 0; i < PACKING_DDL_STATEMENTS.length; i++) {
      await client.query(PACKING_DDL_STATEMENTS[i]);
    }
    await client.query("SELECT 1 FROM public.packing_categories LIMIT 1");
    console.log("[budapest-api] Tables public.packing_categories / public.packing_items are ready.");
  } catch (ddlErr) {
    console.error("[budapest-api] DDL failed:", ddlErr.message);
    if (ddlErr.code === "42501") {
      console.error(
        "[budapest-api] This database user cannot CREATE in schema public. Use the primary Neon role in DATABASE_URL, or paste server/schema.sql into the Neon SQL Editor and run it once."
      );
    } else {
      console.error(
        "[budapest-api] Hint: In Neon, try the Direct (non-pooler) connection string for setup, or run SQL from schema.sql in the Neon SQL Editor."
      );
    }
    throw ddlErr;
  } finally {
    client.release();
  }
}

/** מקשר פריטי ברירת מחדל לפי סדר הקטגוריות במסד (לא לפי שם), כדי שלא ייכשלו התאמות Unicode/שינוי כותרת. */
function categoryRowForDefaultSlot(catsRows, index) {
  if (index < catsRows.length) return catsRows[index];
  return null;
}

/** מוסיף פריטי ברירת מחדל — קורא רק כשאין פריטים (אחרת ייווצרו כפילויות). */
async function insertDefaultPackingItemsForCategories() {
  var cats = await pool.query(
    "SELECT id, name, sort_order FROM public.packing_categories ORDER BY sort_order ASC, created_at ASC"
  );
  if (cats.rows.length === 0) return 0;
  var client = await pool.connect();
  var inserted = 0;
  try {
    await client.query("SET search_path TO public");
    await client.query("BEGIN");
    for (var i = 0; i < DEFAULT_CATEGORY_NAMES.length; i++) {
      var canonicalName = DEFAULT_CATEGORY_NAMES[i];
      var items = DEFAULT_PACKING_ITEMS[canonicalName];
      if (!items || !items.length) continue;
      var row = categoryRowForDefaultSlot(cats.rows, i);
      if (!row) continue;
      for (var j = 0; j < items.length; j++) {
        await client.query(
          "INSERT INTO public.packing_items (category_id, text, packed) VALUES ($1, $2, false)",
          [row.id, items[j]]
        );
        inserted++;
      }
    }
    await client.query("COMMIT");
    if (inserted > 0) {
      console.log("[budapest-api] נוספה רשימת אריזה בסיסית (" + inserted + " פריטים).");
    } else {
      console.warn(
        "[budapest-api] רשימת אריזה בסיסית: לא נוסף אף פריט — בדקו שיש קטגוריות בטבלה (רענון דף / GET /api/pack מנסה שוב)."
      );
    }
    return inserted;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function ensureDefaultPackingItemsIfEmpty() {
  var cnt = await pool.query("SELECT COUNT(*)::int AS c FROM public.packing_items");
  if (cnt.rows[0].c > 0) return;
  await insertDefaultPackingItemsForCategories();
}

async function ensureSeed() {
  await ensureSchema();
  var r = await pool.query("SELECT COUNT(*)::int AS c FROM public.packing_categories");
  if (r.rows[0].c === 0) {
    var client = await pool.connect();
    try {
      await client.query("SET search_path TO public");
      await client.query("BEGIN");
      for (var i = 0; i < DEFAULT_CATEGORY_NAMES.length; i++) {
        await client.query(
          "INSERT INTO public.packing_categories (name, sort_order) VALUES ($1, $2)",
          [DEFAULT_CATEGORY_NAMES[i], i]
        );
      }
      await client.query("COMMIT");
      console.log("נוספו קטגוריות ברירת מחדל.");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  await ensureDefaultPackingItemsIfEmpty();
}

var app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "512kb" }));

app.get("/api/health", async function (req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true, dbHost: databaseUrlHostHint() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message), dbHost: databaseUrlHostHint() });
  }
});

/* משימות טיול: ללא PACK_API_TOKEN — כדי שדף הבית יסתנכרן בין מכשירים בלי טופס מפתח (רשימת אריזה וארוחות עדיין מאובטחות). */
app.get("/api/tasks", async function (req, res) {
  try {
    await ensureTripTasksSchema();
    var q = await pool.query("SELECT payload, updated_at FROM public.trip_tasks_state WHERE id = 1");
    if (!q.rows.length) {
      await pool.query("INSERT INTO public.trip_tasks_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
      q = await pool.query("SELECT payload, updated_at FROM public.trip_tasks_state WHERE id = 1");
    }
    var row = q.rows[0];
    var payload = row.payload;
    if (payload != null && typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr) {
        payload = {};
      }
    }
    var norm = sanitizeTasksPayload({
      done: payload && payload.done,
      hidden: payload && payload.hidden,
      custom: payload && payload.custom,
    });
    res.json({
      done: norm.done,
      hidden: norm.hidden,
      custom: norm.custom,
      updatedAt: row.updated_at,
      dbHost: databaseUrlHostHint(),
    });
  } catch (e) {
    console.error(e);
    var msg = String(e.message || e);
    if (/relation .* does not exist/i.test(msg)) {
      msg += " — הריצו npm start או schema.sql ב־Neon.";
    }
    res.status(500).json({ error: msg });
  }
});

app.put("/api/tasks", async function (req, res) {
  var norm = sanitizeTasksPayload(req.body);
  if (!norm) return res.status(400).json({ error: "body must include done, hidden, custom (JSON)" });
  try {
    await ensureTripTasksSchema();
    var up = await pool.query(
      "INSERT INTO public.trip_tasks_state (id, payload, updated_at) VALUES (1, $1::jsonb, now()) " +
        "ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now() " +
        "RETURNING updated_at",
      [JSON.stringify(norm)]
    );
    res.json({
      done: norm.done,
      hidden: norm.hidden,
      custom: norm.custom,
      updatedAt: up.rows[0].updated_at,
      dbHost: databaseUrlHostHint(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.use(authMiddleware);

app.get("/api/trip-days/:dayNumber/meals", async function (req, res) {
  var d = parseInt(req.params.dayNumber, 10);
  if (d < 1 || d > 10 || String(d) !== String(req.params.dayNumber).trim()) {
    return res.status(400).json({ error: "dayNumber must be integer 1–10" });
  }
  try {
    var q = await pool.query(
      "SELECT day_number, meal_1, meal_2, general_notes, updated_at FROM public.trip_day_meals WHERE day_number = $1",
      [d]
    );
    if (!q.rows.length) {
      return res.json({ dayNumber: d, meal1: "", meal2: "", generalNotes: "", updatedAt: null });
    }
    var r = q.rows[0];
    res.json({
      dayNumber: r.day_number,
      meal1: r.meal_1,
      meal2: r.meal_2,
      generalNotes: r.general_notes != null ? r.general_notes : "",
      updatedAt: r.updated_at,
    });
  } catch (e) {
    console.error(e);
    var msg = String(e.message || e);
    if (/relation .* does not exist/i.test(msg)) {
      msg += " — Run server once after deploy (creates trip_day_meals) or run schema.sql in Neon.";
    }
    res.status(500).json({ error: msg });
  }
});

app.put("/api/trip-days/:dayNumber/meals", async function (req, res) {
  var d = parseInt(req.params.dayNumber, 10);
  if (d < 1 || d > 10 || String(d) !== String(req.params.dayNumber).trim()) {
    return res.status(400).json({ error: "dayNumber must be integer 1–10" });
  }
  var m1 = req.body && req.body.meal1 != null ? String(req.body.meal1) : "";
  var m2 = req.body && req.body.meal2 != null ? String(req.body.meal2) : "";
  var gn = req.body && req.body.generalNotes != null ? String(req.body.generalNotes) : "";
  if (m1.length > 8000 || m2.length > 8000 || gn.length > 8000) {
    return res.status(400).json({ error: "text fields max 8000 characters each" });
  }
  try {
    var up = await pool.query(
      "INSERT INTO public.trip_day_meals (day_number, meal_1, meal_2, general_notes, updated_at) VALUES ($1, $2, $3, $4, now()) " +
        "ON CONFLICT (day_number) DO UPDATE SET meal_1 = EXCLUDED.meal_1, meal_2 = EXCLUDED.meal_2, " +
        "general_notes = EXCLUDED.general_notes, updated_at = now() " +
        "RETURNING day_number, meal_1, meal_2, general_notes, updated_at",
      [d, m1, m2, gn]
    );
    var r = up.rows[0];
    res.json({
      dayNumber: r.day_number,
      meal1: r.meal_1,
      meal2: r.meal_2,
      generalNotes: r.general_notes != null ? r.general_notes : "",
      updatedAt: r.updated_at,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

async function ensurePackingReady(req, res, next) {
  try {
    await ensureSeed();
    next();
  } catch (e) {
    next(e);
  }
}
app.use("/api/pack", ensurePackingReady);

app.get("/api/pack", async function (req, res) {
  try {
    var state = await fetchFullState();
    res.json(state);
  } catch (e) {
    console.error(e);
    var msg = String(e.message || e);
    if (/relation .* does not exist/i.test(msg)) {
      msg += " — Run: npm run migrate (from the server folder)";
    }
    res.status(500).json({ error: msg });
  }
});

app.post("/api/pack/categories", async function (req, res) {
  try {
    var name = (req.body && String(req.body.name || "").trim()) || "";
    if (!name) return res.status(400).json({ error: "name required" });
    var max = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1)::int + 1 AS n FROM public.packing_categories"
    );
    var n = max.rows[0].n;
    var ins = await pool.query(
      "INSERT INTO public.packing_categories (name, sort_order) VALUES ($1, $2) RETURNING id, name",
      [name, n]
    );
    res.status(201).json({ category: ins.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete("/api/pack/categories/:id", async function (req, res) {
  try {
    await pool.query("DELETE FROM public.packing_categories WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/pack/categories/:categoryId/items", async function (req, res) {
  try {
    var text = (req.body && String(req.body.text || "").trim()) || "";
    if (!text) return res.status(400).json({ error: "text required" });
    var ins = await pool.query(
      "INSERT INTO public.packing_items (category_id, text, packed) VALUES ($1, $2, false) RETURNING id, category_id, text, packed",
      [req.params.categoryId, text]
    );
    res.status(201).json({ item: ins.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch("/api/pack/items/:itemId", async function (req, res) {
  try {
    var packed = req.body && typeof req.body.packed === "boolean" ? req.body.packed : null;
    var text = req.body && req.body.text != null ? String(req.body.text).trim() : null;
    if (packed === null && text === null) return res.status(400).json({ error: "packed or text required" });
    if (packed !== null && text !== null) {
      await pool.query(
        "UPDATE public.packing_items SET packed = $1, text = $2, updated_at = now() WHERE id = $3",
        [packed, text, req.params.itemId]
      );
    } else if (packed !== null) {
      await pool.query(
        "UPDATE public.packing_items SET packed = $1, updated_at = now() WHERE id = $2",
        [packed, req.params.itemId]
      );
    } else {
      if (!text) return res.status(400).json({ error: "empty text" });
      await pool.query("UPDATE public.packing_items SET text = $1, updated_at = now() WHERE id = $2", [
        text,
        req.params.itemId,
      ]);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete("/api/pack/items/:itemId", async function (req, res) {
  try {
    await pool.query("DELETE FROM public.packing_items WHERE id = $1", [req.params.itemId]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/pack/reset", async function (req, res) {
  try {
    if (!req.body || !req.body.confirm) return res.status(400).json({ error: "confirm: true required" });
    var client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET search_path TO public");
      await client.query("TRUNCATE public.packing_items, public.packing_categories CASCADE");
      for (var i = 0; i < DEFAULT_CATEGORY_NAMES.length; i++) {
        await client.query("INSERT INTO public.packing_categories (name, sort_order) VALUES ($1, $2)", [
          DEFAULT_CATEGORY_NAMES[i],
          i,
        ]);
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    await insertDefaultPackingItemsForCategories();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/pack/fill-defaults", async function (req, res) {
  try {
    var cnt = await pool.query("SELECT COUNT(*)::int AS c FROM public.packing_items");
    if (cnt.rows[0].c > 0) {
      return res.status(400).json({ error: "יש כבר פריטים במסד — לא ממלאים רשימת בסיס" });
    }
    var n = await insertDefaultPackingItemsForCategories();
    if (n === 0) {
      return res.status(400).json({
        error:
          "לא נוסף אף פריט. ודאו שיש קטגוריות; אם המסד ריק הפעילו מחדש את השרת (npm start) או «איפוס לרשימת התחלה».",
      });
    }
    res.json({ ok: true, inserted: n });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

var staticDir = path.join(__dirname, "..");
app.use(express.static(staticDir));

app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

var _prepared = false;
async function prepare() {
  if (_prepared) return;
  /* Packing uses ensurePackingReady on /api/pack only — do not run ensureSeed here or Vercel cold
   * starts (often 10s cap) time out before /api/tasks while creating categories + default items. */
  await ensureTripTasksSeed();
  await ensureTripDayMealsSeed();
  _prepared = true;
}

module.exports = { app, prepare, PORT, logPackingPermissionHelp, databaseUrlHostHint };
