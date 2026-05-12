/**
 * Neon URLs often include channel_binding=require — node-pg can fail with that.
 * We strip it and force SSL for remote hosts.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

function sanitizeDatabaseUrl(url) {
  if (!url || typeof url !== "string") return url;
  try {
    var u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.href;
  } catch (e) {
    return url.replace(/[?&]channel_binding=[^&]*/gi, "").replace(/\?&/g, "?").replace(/[?]$/g, "");
  }
}

function getPoolOptions() {
  var raw = process.env.DATABASE_URL;
  if (!raw) return null;
  var connectionString = sanitizeDatabaseUrl(raw);
  var rejectUnauthorized = process.env.PG_SSL_REJECT_UNAUTHORIZED !== "0";
  var ssl = /^postgres/i.test(connectionString) ? { rejectUnauthorized: rejectUnauthorized } : false;
  var opts = { connectionString: connectionString, ssl: ssl };
  /* Vercel serverless: one connection per invocation avoids pooler exhaustion. */
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    opts.max = 1;
    opts.idleTimeoutMillis = 20000;
    opts.connectionTimeoutMillis = 20000;
  }
  return opts;
}

/** User part of DATABASE_URL (for GRANT … TO "role"); no password. */
function getDatabaseUserFromUrl() {
  var raw = process.env.DATABASE_URL;
  if (!raw || typeof raw !== "string") return null;
  try {
    var u = new URL(sanitizeDatabaseUrl(raw));
    if (!u.username) return null;
    return decodeURIComponent(u.username.replace(/\+/g, " "));
  } catch (e) {
    return null;
  }
}

/**
 * For Vercel Runtime Logs only — never logs password or full connection string.
 * @param {string} [label] prefix e.g. "[api/server] "
 */
function logDatabaseEnvDiagnostics(label) {
  label = label || "[budapest-db] ";
  var raw = process.env.DATABASE_URL;
  var has = !!(raw && typeof raw === "string" && raw.length > 0);
  console.log(label + "DATABASE_URL present: " + has + (has ? " (char length " + raw.length + ")" : ""));
  if (!has) return;
  try {
    var normalized = sanitizeDatabaseUrl(raw).replace(/^postgres(ql)?:/i, "https:");
    var u = new URL(normalized);
    var user = u.username ? decodeURIComponent(u.username.replace(/\+/g, " ")) : "";
    var sslm = u.searchParams.get("sslmode") || "";
    console.log(
      label +
        "DATABASE_URL parsed host=" +
        (u.hostname || "?") +
        " user=" +
        (user || "?") +
        (sslm ? " sslmode=" + sslm : "")
    );
  } catch (e) {
    console.log(label + "DATABASE_URL could not be parsed as URL (check Neon string): " + (e && e.message ? e.message : e));
  }
  console.log(
    label +
      "runtime VERCEL=" +
      String(!!process.env.VERCEL) +
      " region=" +
      (process.env.VERCEL_REGION || "(n/a)") +
      " deployment=" +
      (process.env.VERCEL_DEPLOYMENT_ID ? "set" : "(n/a)")
  );
}

module.exports = { sanitizeDatabaseUrl, getPoolOptions, getDatabaseUserFromUrl, logDatabaseEnvDiagnostics };
