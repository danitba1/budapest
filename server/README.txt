=== רשימת אריזה + Neon ===

1) ב-Neon: פרויקט holy-sky-49450734 — ב-Dashboard → Connection details → העתיקו את ה-URI (SSL).

2) בתיקיית server:
   - העתיקו .env.example ל-.env
   - הדביקו את DATABASE_URL=... ב-.env
   - אופציונלי: PACK_API_TOKEN=מחרוזת_סודית_ארוכה
     אם מוגדר – בדפדפן יופיע מסך להזנת אותו ערך (נשמר ב-localStorage).

3) רשימת אריזה: בכל GET ל-/api/pack (כולל פתיחת דף האריזה) — אם אין פריטים במסד, השרת ממלא רשימת בסיס לפי סדר הקטגוריות. אחרי איפוס — הפריטים נטענים מיד. אופציונלי: POST /api/pack/fill-defaults (רק כשאין פריטים).

4) התקנה והרצת מיגרציה (ללא נקודה בסוף — migrate ולא migrate.):
   מתוך תיקיית server:  npm install   ואז   npm run migrate
   או משורש הפרויקט budapest (אחרי npm install בתיקיית server):  npm run migrate

5) הרצת שרת (גם מגיש את קבצי האתר מהתיקייה האב):
   npm start
   פתיחה: http://localhost:3000/packing.html  או  http://localhost:3000/trip-day.html?day=1
   טבלת trip_day_meals נוצרת אוטומטית בהפעלת השרת (יומי 1–10 עם ארוחות ריקות). API: GET/PUT /api/trip-days/1/meals … /10/meals — JSON כולל meal1, meal2, generalNotes (אותו PACK_API_TOKEN כמו ל-/api/pack).

6) פריסה לפרודקשן (Railway, Render, Fly.io וכו'):
   - הגדירו DATABASE_URL ו-PORT
   - פקודת start: node index.js (מתוך server)
   - שרתו את ה-build סטטי או העתיקו את כל תיקיית budapest

הערה: אין לשתף את DATABASE_URL או את .env בגיט.

=== בעיות נפוצות ===
- בדפדפן מופיע "Invalid response" / שגיאת JSON: ודאו ש-http://localhost:3000/packing.html (אותו מחשב שבו npm start) ולא file://
- "relation does not exist": הריצו npm run migrate
- שגיאת SASL / channel_binding: בקוד מוסר channel_binding מה-URL אוטומטית; עדכנו גם את החבילות: npm install
- ENOTFOUND / רשת: בדקו חיבור אינטרנט ו-Firewall; ב-Neon ודאו שה-endpoint נכון
- יצירת טבלאות נכשלת עם pooler: ב-Neon בחרו Connection string ל-migrated branch ללא "pooler" ב-host (Direct) והדביקו ב-.env
