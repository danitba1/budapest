/**
 * כניסת הרצה מקומית: טעינת .env מאותה תיקייה, האזנה ליציאת API + סטטיים.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mod = require("./app");

async function main() {
  console.log("[budapest-api] Starting (packing + trip_day_meals + trip_tasks_state, ensureSeed + seeds) …");
  await mod.prepare();
  console.log("[budapest-api] public.trip_day_meals ready (10 rows seeded if new).");
  console.log("[budapest-api] Trip meals API: GET|PUT /api/trip-days/1..10/meals");
  console.log("[budapest-api] Tasks API: GET|PUT /api/tasks");

  mod.app.listen(mod.PORT, function () {
    var staticDir = path.join(__dirname, "..");
    console.log("שרת רץ: http://localhost:" + mod.PORT);
    console.log("קבצים סטטיים מ:", staticDir);
    if (process.env.PACK_API_TOKEN) console.log("אימות API מופעל (PACK_API_TOKEN)");
  });
}

main().catch(function (e) {
  if (e && String(e.code) === "42501") {
    var m = String(e.message || "");
    if (/packing_categories|packing_items|trip_day_meals|trip_tasks_state|schema public/i.test(m)) {
      mod.logPackingPermissionHelp("Startup failed (PostgreSQL 42501)");
    }
  }
  console.error(e);
  process.exit(1);
});
