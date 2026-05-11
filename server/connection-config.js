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

module.exports = { sanitizeDatabaseUrl, getPoolOptions, getDatabaseUserFromUrl };
