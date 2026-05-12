/**
 * Trip tasks state (GET/PUT /api/tasks) — shared by Express (app.js) and lean Vercel entry api/tasks.js.
 */
"use strict";

var TRIP_TASKS_DDL_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS public.trip_tasks_state (" +
    "id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)," +
    "payload JSONB NOT NULL DEFAULT '{\"done\":{},\"hidden\":[],\"custom\":[]}'::jsonb," +
    "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()" +
    ")",
];

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

async function ensureTripTasksSchema(pool) {
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

async function getTripTasksJson(pool) {
  await ensureTripTasksSchema(pool);
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
  return {
    done: norm.done,
    hidden: norm.hidden,
    custom: norm.custom,
    updatedAt: row.updated_at,
    dbHost: databaseUrlHostHint(),
  };
}

/**
 * @returns {Promise<object>} JSON body for 200, or { badRequest: true, error: string } for 400
 */
async function putTripTasksJson(pool, body) {
  var norm = sanitizeTasksPayload(body);
  if (!norm) return { badRequest: true, error: "body must include done, hidden, custom (JSON)" };
  await ensureTripTasksSchema(pool);
  var up = await pool.query(
    "INSERT INTO public.trip_tasks_state (id, payload, updated_at) VALUES (1, $1::jsonb, now()) " +
      "ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now() " +
      "RETURNING updated_at",
    [JSON.stringify(norm)]
  );
  return {
    done: norm.done,
    hidden: norm.hidden,
    custom: norm.custom,
    updatedAt: up.rows[0].updated_at,
    dbHost: databaseUrlHostHint(),
  };
}

module.exports = {
  sanitizeTasksPayload,
  ensureTripTasksSchema,
  databaseUrlHostHint,
  getTripTasksJson,
  putTripTasksJson,
};
