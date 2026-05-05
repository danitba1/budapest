/**
 * יוצר טבלאות ב-Neon. דורש קובץ .env עם DATABASE_URL
 * הרצה: npm run migrate
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { getPoolOptions } = require("./connection-config");

async function main() {
  var opts = getPoolOptions();
  if (!opts) {
    console.error("חסר DATABASE_URL ב-.env");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const client = new Client(opts);
  await client.connect();
  var parts = sql
    .split(";")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  for (var i = 0; i < parts.length; i++) {
    await client.query(parts[i]);
  }
  console.log("schema.sql הורץ בהצלחה (" + parts.length + " פקודות).");
  await client.end();
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
