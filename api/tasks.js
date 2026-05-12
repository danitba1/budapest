/**
 * Lean Vercel function for GET|PUT /api/tasks only — avoids loading full Express (smaller cold bundle, fewer 504s).
 */
"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "server", ".env") });

const { Pool } = require("pg");
const { getPoolOptions, logDatabaseEnvDiagnostics } = require("../server/connection-config");
const tripTasks = require("../server/trip-tasks-store");

var cachedPool = null;
function getPool() {
  if (!cachedPool) {
    var opts = getPoolOptions();
    if (!opts) throw new Error("Missing DATABASE_URL");
    cachedPool = new Pool(opts);
  }
  return cachedPool;
}

function readJsonBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (c) {
      chunks.push(c);
    });
    req.on("end", function () {
      var s = Buffer.concat(chunks).toString("utf8");
      if (!s) return resolve({});
      try {
        resolve(JSON.parse(s));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function tasksHandler(req, res) {
  var reqLog = (req.method || "?") + " " + (req.url || "");
  var t0 = Date.now();
  console.log("[api/tasks] req start " + reqLog);
  try {
    try {
      if (typeof logDatabaseEnvDiagnostics === "function") {
        logDatabaseEnvDiagnostics("[api/tasks] ");
      }
    } catch (eLog) {
      /* ignore */
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    var method = (req.method || "GET").toUpperCase();
    if (method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
      res.statusCode = 204;
      res.end();
      return;
    }

    var pool;
    try {
      pool = getPool();
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e.message || e) }));
      return;
    }

    try {
      if (method === "GET") {
        var data = await tripTasks.getTripTasksJson(pool);
        res.statusCode = 200;
        res.end(JSON.stringify(data));
        return;
      }
      if (method === "PUT") {
        var body = await readJsonBody(req);
        var putResult = await tripTasks.putTripTasksJson(pool, body);
        if (putResult && putResult.badRequest) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: putResult.error }));
          return;
        }
        res.statusCode = 200;
        res.end(JSON.stringify(putResult));
        return;
      }
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
    } catch (e) {
      console.error("[api/tasks] error", e);
      var msg = String(e.message || e);
      if (/relation .* does not exist/i.test(msg)) {
        msg += " — הריצו npm start או schema.sql ב־Neon.";
      }
      res.statusCode = 500;
      res.end(JSON.stringify({ error: msg }));
    }
  } finally {
    console.log("[api/tasks] req end " + reqLog + " " + (Date.now() - t0) + "ms");
  }
};
