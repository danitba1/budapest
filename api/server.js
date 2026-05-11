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

module.exports = async function handler(req, res) {
  try {
    patchUrlForInternalRewrite(req);
    if (!handlerPromise) {
      handlerPromise = (async function () {
        var mod = require("../server/app");
        await mod.prepare();
        return serverless(mod.app);
      })();
    }
    var h = await handlerPromise;
    return h(req, res);
  } catch (e) {
    console.error("[api/server]", e);
    if (!res.headersSent) {
      res.status(500).json({ error: String(e.message || e) });
    }
  }
};
