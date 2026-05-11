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
        var mod = require("../server/app");
        await mod.prepare();
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
