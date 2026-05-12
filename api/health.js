/**
 * Lean GET /api/health — no Express; avoids loading full app for probes / dashboards.
 */
"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "server", ".env") });

const { Pool } = require("pg");
const { getPoolOptions, logDatabaseEnvDiagnostics } = require("../server/connection-config");

var cachedPool = null;
function getPool() {
  if (!cachedPool) {
    var opts = getPoolOptions();
    if (!opts) throw new Error("Missing DATABASE_URL");
    cachedPool = new Pool(opts);
  }
  return cachedPool;
}

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

module.exports = async function healthHandler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if ((req.method || "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    if (typeof logDatabaseEnvDiagnostics === "function") {
      logDatabaseEnvDiagnostics("[api/health] ");
    }
  } catch (eLog) {
    /* ignore */
  }

  try {
    var pool = getPool();
    await pool.query("SELECT 1");
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, db: true, dbHost: databaseUrlHostHint() }));
  } catch (e) {
    console.error("[api/health]", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: String(e.message || e), dbHost: databaseUrlHostHint() }));
  }
};
