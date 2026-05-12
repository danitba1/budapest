/**
 * Vercel Serverless Function — מעביר בקשות /api/* ל־Express (אריזה, ארוחות, משימות, health).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "server", ".env") });

const serverless = require("serverless-http");

var handlerPromise;

/** אם rewrite הפנימי שינה את הנתיב, לפעמים מועבר הנתיב המקורי בכותרת. */
function patchUrlForInternalRewrite(req) {
  var fwd = req.headers["x-forwarded-uri"];
  if (typeof fwd !== "string" || fwd.indexOf("/api") !== 0) return;
  req.url = fwd;
}

function clearServerModuleCache() {
  try {
    var appPath = require.resolve("../server/app");
    delete require.cache[appPath];
  } catch (x) {
    /* ignore */
  }
  try {
    var cfgPath = require.resolve("../server/connection-config");
    delete require.cache[cfgPath];
  } catch (x2) {
    /* ignore */
  }
}

module.exports = async function handler(req, res) {
  patchUrlForInternalRewrite(req);
  var h;
  try {
    if (!handlerPromise) {
      handlerPromise = (async function () {
        try {
          var cfg = require("../server/connection-config");
          if (typeof cfg.logDatabaseEnvDiagnostics === "function") {
            cfg.logDatabaseEnvDiagnostics("[api/server] ");
          }
        } catch (logErr) {
          console.error("[api/server] connection-config load for diagnostics", logErr);
        }
        var tInit = Date.now();
        var mod = require("../server/app");
        console.log("[api/server] server/app loaded in " + (Date.now() - tInit) + "ms");
        tInit = Date.now();
        if (process.env.VERCEL) {
          console.log(
            "[api/server] Skipping prepare() on Vercel — DB DDL/seeds run on first use per route (faster cold start, avoids 504)."
          );
        } else {
          await mod.prepare();
          console.log("[api/server] prepare() finished in " + (Date.now() - tInit) + "ms");
        }
        return serverless(mod.app);
      })();
    }
    h = await handlerPromise;
  } catch (e) {
    console.error("[api/server] init failed", e);
    handlerPromise = null;
    clearServerModuleCache();
    if (!res.headersSent) {
      res.status(500).json({ error: String(e.message || e) });
    }
    return;
  }
  try {
    return await h(req, res);
  } catch (e) {
    console.error("[api/server] request error", e);
    if (!res.headersSent) {
      res.status(500).json({ error: String(e.message || e) });
    }
  }
};
