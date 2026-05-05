/**
 * תכנית ימים (טבלה) + תוספות (המלצות, כבישים) — מסונכנים עם index.html.
 * trip-day.js קורא window.TRIP_DAY_PLAN ו-window.TRIP_DAY_EXTRAS (כולל navigation, recommendations, roads).
 * לכל שורה אפשר wazeQuery (חיפוש) או wazeLl ("lat,lon") — window.buildTripRowWazeHref(row).
 */
(function () {
  var P = [];

  P.push({
    day: 1,
    title: "יום 1 · יום ראשון – בודפשט → בלד (סלובניה)",
    rows: [
      {
        part: "בוקר",
        activity:
          "הצטיידות בבודפשט: פירות, ירקות ומוצרים כשרים. איסוף הרכב מחברת שילר בבודפשט. העמסת הציוד והצ׳ימיגג.",
        ticket: "rec",
        ticketNote: "(שילר)",
        links:
          '<a href="https://schillerrent.hu/en/" target="_blank" rel="noopener">Schiller Rent</a>',
        wazeQuery: "Schiller Rent Budapest Hungary",
      },
      {
        part: "הדרך",
        activity: "נסיעה ישירה לאגם בלד (כ־5 שעות).",
        ticket: "na",
        ticketNote: "",
        links: '<a href="https://www.bled.si/en/" target="_blank" rel="noopener">תיירות בלד</a>',
        wazeQuery: "Lake Bled Slovenia",
      },
      {
        part: "אחה״צ",
        activity:
          "הגעה לבלד ועלייה למגלשות ההרים <strong>Straža Bled</strong> – נוף לאגם ופתיחה מושלמת לילדים.",
        ticket: "rec",
        ticketNote: "(Straža)",
        links: '<a href="https://www.straza-bled.si/en/summer" target="_blank" rel="noopener">Straža Bled</a>',
        wazeLl: "46.3629,14.1042",
      },
      {
        part: "לינה",
        activity: "אזור בלד / לובליאנה.",
        ticket: "rec",
        ticketNote: "(לינה)",
        links: '<a href="https://www.visitljubljana.com/en/" target="_blank" rel="noopener">לובליאנה</a>',
        wazeQuery: "Bled Slovenia",
      },
    ],
  });

  P.push({
    day: 2,
    title: "יום 2 · יום שני – אדרנלין בנהר הסוצ׳ה",
    rows: [
      {
        part: "בוקר",
        activity:
          "מבלד לעיירה בובץ׳ (Bovec) דרך איטליה – מעבר <strong>Passo del Predil</strong> (נוח יותר עם מטען על הגג).",
        ticket: "na",
        ticketNote: "",
        links: '<a href="https://www.bovec.si/en" target="_blank" rel="noopener">Bovec</a>',
        wazeQuery: "Bovec Slovenia",
      },
      {
        part: "פעילות",
        activity: "<strong>ראפטינג בנהר הסוצ׳ה</strong> – כ־3 שעות במים טורקיזיים.",
        ticket: "must",
        ticketNote: "(Soča Splash וכו׳)",
        links:
          '<a href="https://www.socasplash.com/" target="_blank" rel="noopener">Soča Splash</a> <span class="muted">(או חברה דומה)</span>',
        wazeQuery: "Soča Splash Bovec",
      },
      {
        part: "אחה״צ",
        activity: "ביקור במפל <strong>Virje</strong> הסמוך – פינה לפיקניק.",
        ticket: "no",
        ticketNote: "",
        links: '<a href="https://www.bovec.si/en/explore/virje-waterfall" target="_blank" rel="noopener">מפל Virje</a>',
        wazeQuery: "Virje waterfall Plužna Slovenia",
      },
      {
        part: "ערב",
        activity: "חזרה לבלד.",
        ticket: "na",
        ticketNote: "",
        links: "—",
        wazeQuery: "Bled Slovenia",
      },
    ],
  });

  P.push({
    day: 3,
    title: "יום 3 · יום שלישי – טבע אלפיני ואגם בוהיני",
    rows: [
      {
        part: "בוקר",
        activity: "טיול בקניון <strong>Vintgar</strong> – הליכה קלה על גשרי עץ.",
        ticket: "must",
        ticketNote: "(Vintgar)",
        links: '<a href="https://vintgar.si/en/" target="_blank" rel="noopener">Vintgar Gorge</a>',
        wazeLl: "46.3907,14.0828",
      },
      {
        part: "צהריים",
        activity:
          "נסיעה לאגם <strong>Bohinj</strong>, רכבל ל<strong>Vogel</strong> – תצפית על האלפים היוליאניים.",
        ticket: "rec",
        ticketNote: "(רכבל Vogel)",
        links:
          '<a href="https://www.bohinj.si/en/" target="_blank" rel="noopener">Bohinj</a> · <a href="https://www.vogel.si/en" target="_blank" rel="noopener">Vogel</a>',
        wazeQuery: "Vogel cable car Ukanc Bohinj",
      },
      {
        part: "לינה",
        activity: "אזור בלד.",
        ticket: "na",
        ticketNote: "",
        links: "—",
        wazeQuery: "Bled Slovenia",
      },
    ],
  });

  P.push({
    day: 4,
    title: "יום 4 · יום רביעי – פארק מים ומעבר לקרואטיה",
    rows: [
      {
        part: "בוקר",
        activity: "נסיעה לכיוון מזרח סלובניה.",
        ticket: "na",
        ticketNote: "",
        links: "—",
      },
      {
        part: "פעילות",
        activity: "יום ב<strong>Aqualuna</strong> או <strong>Terme 3000</strong> – מגלשות לגדולים ובריכות לקטנים.",
        ticket: "rec",
        ticketNote: "(פארק מים)",
        links:
          '<a href="https://www.terme-olimia.com/en/aqualuna" target="_blank" rel="noopener">Aqualuna</a> · <a href="https://www.terme3000.si/en" target="_blank" rel="noopener">Terme 3000</a>',
        wazeQuery: "Aqualuna Terme Olimia Podčetrtek Slovenia",
      },
      {
        part: "ערב",
        activity: "חציית הגבול לקרואטיה.",
        ticket: "na",
        ticketNote: "",
        links: "—",
        wazeQuery: "Gruškovje border crossing Slovenia Croatia",
      },
      {
        part: "לינה",
        activity: "אזור סלוני (Slunj) או רסטוקה (Rastoke).",
        ticket: "rec",
        ticketNote: "(לינה)",
        links: '<a href="https://www.rastoke.hr/en/" target="_blank" rel="noopener">Rastoke</a>',
        wazeQuery: "Rastoke Slunj Croatia",
      },
    ],
  });

  P.push({
    day: 5,
    title: "יום 5 · יום חמישי – פליטביצה וחזרה להונגריה",
    rows: [
      {
        part: "בוקר",
        activity: "כניסה מוקדמת ל<strong>פליטביצה</strong> – מסלול משולב עם סירה ורכבת פנימית מומלץ.",
        ticket: "must",
        ticketNote: "(פליטביצה)",
        links: '<a href="https://np-plitvicka-jezera.hr/en/" target="_blank" rel="noopener">שמורת פליטביצה</a>',
        wazeQuery: "Plitvice Lakes National Park Entrance 1 Croatia",
      },
      {
        part: "צהריים",
        activity: "ביקור קצר בכפר המפלים רסטוקה.",
        ticket: "no",
        ticketNote: "(כניסה לכפר)",
        links: '<a href="https://www.rastoke.hr/en/" target="_blank" rel="noopener">Rastoke</a>',
        wazeQuery: "Rastoke Slunj Croatia",
      },
      {
        part: "אחה״צ",
        activity: "נסיעה לכיוון בודפשט (כ־5 שעות).",
        ticket: "na",
        ticketNote: "",
        links: "—",
        wazeQuery: "Budapest Hungary",
      },
      {
        part: "לינה",
        activity: "הגעה מאוחרת לבודפשט – דירה ברובע 7 (הרובע היהודי).",
        ticket: "rec",
        ticketNote: "(דירה)",
        links: '<a href="https://www.budapestinfo.hu/en" target="_blank" rel="noopener">Budapest Info</a>',
        wazeQuery: "Kazinczy Street Budapest District 7",
      },
    ],
  });

  P.push({
    day: 6,
    title: "יום 6 · יום שישי – וישיגראד והתארגנות לשבת",
    rows: [
      {
        part: "בוקר",
        activity: "נסיעה ל<strong>וישיגראד</strong> (~50 דק׳). מגלשות הרים (תעלה ומסילה).",
        ticket: "rec",
        ticketNote: "(Bobpálya)",
        links: '<a href="https://visegrad.bobozas.hu/en" target="_blank" rel="noopener">Bobpálya Visegrád</a>',
        wazeQuery: "Bobpálya Visegrád Hungary",
      },
      {
        part: "צהריים",
        activity: "חזרה לבודפשט: כשר מרקט, חלות בפרישמן, אוכל לשבת מכרמל או חב״ד.",
        ticket: "must",
        ticketNote: "(אוכל שבת)",
        links:
          '<a href="https://chabadhungary.com/en/food/138/" target="_blank" rel="noopener">Kosher Market</a> · ' +
          '<a href="https://jguideeurope.org/en/site/frohlich-bakery/" target="_blank" rel="noopener">Fröhlich</a> · ' +
          '<a href="https://www.carmel.hu/en" target="_blank" rel="noopener">Carmel</a> · ' +
          '<a href="https://chabadhungary.com/en/shabbat/" target="_blank" rel="noopener">חב״ד הונגריה – שבת</a>',
        wazeQuery: "Síp utca 12 Budapest kosher",
      },
      {
        part: "ערב",
        activity: "כניסת שבת – תפילה בבית הכנסת הגדול או ברובע 7.",
        ticket: "no",
        ticketNote: "(תפילה)",
        links: '<a href="https://www.milev.hu/?lang=en" target="_blank" rel="noopener">מורשת יהודית בודפשט</a>',
        wazeQuery: "Dohány Street Synagogue Budapest",
      },
    ],
  });

  P.push({
    day: 7,
    title: "יום 7 · שבת – מנוחה בבודפשט",
    rows: [
      {
        part: "בוקר",
        activity: "תפילה וסעודת שבת.",
        ticket: "na",
        ticketNote: "",
        links: "—",
        wazeQuery: "Kazinczy Street Synagogue Budapest",
      },
      {
        part: "צהריים",
        activity: "טיול רגלי: גשר השלשלאות לבודה, הליכה לאורך הדנובה, נעליים על הדנובה.",
        ticket: "no",
        ticketNote: "",
        links:
          '<a href="https://www.budapestinfo.hu/en/sights-in-budapest/shoes-on-the-danube-bank" target="_blank" rel="noopener">נעליים על הדנובה</a>',
        wazeLl: "47.5039,19.0445",
      },
      {
        part: "ערב",
        activity: "מוצאי שבת – גלידריה או הליכה בוואצ׳י אוצ׳ה.",
        ticket: "no",
        ticketNote: "",
        links: '<a href="https://www.budapestinfo.hu/en/sights-in-budapest/vaci-street" target="_blank" rel="noopener">Váci utca</a>',
        wazeQuery: "Váci utca Budapest",
      },
    ],
  });

  P.push({
    day: 8,
    title: "יום 8 · יום ראשון – פארק מים בבודפשט",
    rows: [
      {
        part: "יום",
        activity: "יום שלם ב<strong>Aquaworld Budapest</strong> – פארק מקורה; הסעות ממרכז העיר.",
        ticket: "rec",
        ticketNote: "(Aquaworld)",
        links: '<a href="https://www.aquaworldresort.hu/en/aquaworld" target="_blank" rel="noopener">Aquaworld</a>',
        wazeQuery: "Aquaworld Resort Budapest",
      },
      {
        part: "ערב",
        activity: "סיור אורות בבודפשט.",
        ticket: "no",
        ticketNote: "",
        links: '<a href="https://www.budapestinfo.hu/en" target="_blank" rel="noopener">מידע לתיירים</a>',
        wazeQuery: "Széchenyi Chain Bridge Budapest",
      },
    ],
  });

  P.push({
    day: 9,
    title: "יום 9 · יום שני – נוף, אי מרגיט וקניות",
    rows: [
      {
        part: "בוקר",
        activity: "גבעת יאנוש – רכבל הכיסאות <strong>Libegő</strong>.",
        ticket: "no",
        ticketNote: "(רגיל במקום)",
        links: '<a href="https://bkk.hu/en/travel-information/special-and-heritage-transport-services/chairlift/" target="_blank" rel="noopener">Libegő (Zugliget chairlift)</a>',
        wazeQuery: "Libegő Budapest Zugliget",
      },
      {
        part: "צהריים",
        activity: "האי מרגיט – רכב פדלים משפחתי ופארק.",
        ticket: "no",
        ticketNote: "",
        links:
          '<a href="https://www.budapestinfo.hu/en/sights-in-budapest/margaret-island" target="_blank" rel="noopener">Margitsziget</a>',
        wazeQuery: "Margaret Island Budapest",
      },
      {
        part: "אחה״צ",
        activity: "קניון West End או ארנה.",
        ticket: "no",
        ticketNote: "",
        links:
          '<a href="https://westend.hu/en" target="_blank" rel="noopener">WestEnd</a> · <a href="https://www.arenamall.hu/en/" target="_blank" rel="noopener">Aréna Mall</a>',
        wazeQuery: "Westend City Center Budapest",
      },
    ],
  });

  P.push({
    day: 10,
    title: "יום 10 · יום שלישי – החזרת רכב וטיסה",
    rows: [
      {
        part: "המשך",
        activity: "נסיעה לשילר, החזרת הרכב (אוקטביה וצ׳ימיגג), הסעה לטרמינל וטיסה הביתה.",
        ticket: "rec",
        ticketNote: "(תיאום שעת החזרה)",
        links: '<a href="https://schillerrent.hu/en/" target="_blank" rel="noopener">Schiller Rent</a>',
        wazeQuery: "Schiller Rent Budapest Hungary",
      },
    ],
  });

  var E = {
    "1": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים (ברכב, ללא עצירות ארוכות):</strong> מבודפשט לאזור גבול הונגריה–סלובניה בערך <strong>2–2½ שעות</strong> (תלוי נקודת יציאה ועומס); מן הגבול לכיוון בלד עוד כ־<strong>2½–3 שעות</strong>. <strong>סה״כ</strong> לכיוון בלד כ־<strong>5 שעות</strong> נהיגה רציפה. עצירה בלובליאנה — הוסיפו לפחות <strong>45 דק׳–שעה</strong> לביקור + חניה.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> יציאה מבודפשט בשעות <strong>07:00–09:00</strong> לרוב עמוסה. אחר הצהריים בכניסה לאזור בלד (סופ״ש) — תנועה וחניה ליד האגם עמוסים יותר; כדאי לבדוק מראש חניה במלון/חיצונית.</p>",
      recommendations: [
        "עצירה בלובליאנה (כ־45 דק׳ מהמסלול) — טיילת ליד הנהר, גשר הדרקונים, שוק אם פתוח.",
        "לפני יציאה מבודפשט: מיכלון דלק מלא + קפה — מקטינים עצירה ראשונה בדרך.",
        "בכניסה לבלד: חניה סביב האגם בתשלום/זמן — לבדוק באפליקציית מפות או במלון.",
      ],
      roads:
        "מבודפשט: כבישים ראשיים לכיוון גבול סלובניה (למשל דרך M7 / כבישים מהירים לפי Waze). נדרשת <strong>וינייטה הונגרית</strong> (משילר) ו<strong>וינייטה סלובנית</strong> — לרכוש לפני או מיד אחרי הגבול בתחנת דלק. נסיעה ארוכה (~5 שעות) — תורנות נהגים, הפסקות כל שעתיים. בכניסה לאזור האלפים הכבישים צפויים ונוחים יחסית.",
      misc: "יום ארוך — כדאי חטיפים ומים ברכב; כשרות בדרך: צידנית / מה שארזתם מבודפשט.",
    },
    "2": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> בלד → מעבר Predil ואז בובץ׳ (Bovec) בערך <strong>1:00–1:30 שעות</strong> (כביש הררי, פיתולים). בובץ׳ ↔ מפל Virje כ־<strong>10–15 דק׳</strong>. חזרה לבלד — עוד כ־<strong>1:00–1:30</strong>.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> בקטעי הרים אפשר להיתקע מאחורי משאיות איטיות; לפני ראפטינג — הגיעו <strong>15–20 דק׳</strong> לפני שעת האיסוף. אין כאן «שעות שיא» מטרופוליניות, אבל בקיץ כבישי תיירות עמוסים יותר באמצע היום.</p>",
      recommendations: [
        "מוזיאון מלחמה בקובאריד (Kobarid) — קרוב ל-Bovec, מעניין למבוגרים ולילדים גדולים.",
        "אחרי ראפטינג: להחליף בגדים יבשים מראש בתיק.",
      ],
      roads:
        "מבלד לטרז׳יצה (Tarvisio) ואיטליה: כביש הררי דרך <strong>Passo del Predil</strong> — פיתולים, לפעמים איטי מאחורים; עם צ׳ימיגג על הגג — נסיעה זהירה. קטע קצר באיטליה — בדקו האם נדרש כרטיס/וינייטה איטלקית לקטע הספציפי (משתנה לפי מסלול מדויק). ממעבר פרדיל ל-Bovec כביש יורד — בלמים קרים אחרי ירידה.",
      misc: "הזמנת ראפטינג מראש — שעת איסוף קשוחה; הגיעו עם רבע שעה מרווח.",
    },
    "3": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> בלד → Vintgar כ־<strong>10–15 דק׳</strong>. Vintgar → אזור אגם בוהיני / תחתית רכבל Vogel כ־<strong>25–40 דק׳</strong>. חזרה לבלד כ־<strong>25–35 דק׳</strong> (תלוי מקור היציאה בבוהיני).</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> חניה וכניסה ל־Vintgar <strong>צפופים בדרך כלל 10:00–14:00</strong> בעונה — מומלץ להגיע מוקדם או בסוף אחר הצהריים לפי שעות האתר.</p>",
      recommendations: [
        "אגם בוהיני: רציף ליד כנסיית יוחנן המטביל — רגע צילום קלאסי.",
        "אם Vogel מעונן — טיילת סביב חוף האגם או כפר סטארה פוצ׳יבה (Stara Fužina).",
      ],
      roads:
        "נסיעות קצרות בין בלד–Vintgar–Bohinj — כבישים צרים יחסית בעונה; חניה ב-Vintgar לפי הוראות האתר. לרכבל Vogel חניה בתחתית הרכבל — מלא מוקדם בקיץ.",
      misc: "Vintgar — כרטיס חובה מראש; הגיעו בשעות פחות עומס אם אפשר.",
    },
    "4": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> תלויים בבחירה בין Aqualuna (Podčetrtek) ל־Terme 3000 ובמיקום הלינה בקרואטיה — בדרך כלל בין <strong>שעה לשלוש שעות</strong> בין נקודות היום. מסלול לגבול סלובניה–קרואטיה — לעיתים <strong>תור קצר</strong> בשיא עונה.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> כבישים אזוריים צרים; אחרי פארק מים — ייבוש והפסקה קצרה לפני נסיעה ארוכה לעבר הגבול.</p>",
      recommendations: [
        "בין Aqualuna ל-Terme 3000 — לבחור לפי מרחק מהלינה בקרואטיה; לבדוק שעות פתיחה באתר.",
        "אחרי מים — ייבוש מלא לפני נסיעה ארוכה לגבול.",
      ],
      roads:
        "מזרח סלובניה לכיוון גבול קרואטיה — כבישים אזוריים ואז כבישי חיבור לגבול. <strong>וינייטה קרואטית</strong> נדרשת לכבישים המהירים בקרואטיה — רכישה לפני או אחרי הגבול. לינה באזור סלוני/רסטוקה — כבישים מקומיים, פיתולים בכניסה לכפר.",
      misc: "לוודא שעות הגבול אם חוזרים מאוחר; בדרך כלל ללא בעיה לתיירים.",
    },
    "5": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> מאזור רסטוקה/סלוני לכניסה לפליטביצה (כניסה 1) בדרך כלל <strong>20–35 דק׳</strong> בבוקר. מפליטביצה חזרה לבודפשט — בערך <strong>4:30–6 שעות</strong> (מסלול, עצירות וגבולות).</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> כניסה מוקדמת לפארק חוסכת תורים בכניסה; <strong>אחר הצהריים</strong> בכבישים ארוכים — עייפות נהגים; כדאי להחליף נהגים. כניסה לבודפשט בערב — תנועה עירונית איטית יותר.</p>",
      recommendations: [
        "בפליטביצה: מסלול H מומלץ למבקרים ביום אחד — שילוב הליכה, סירה ורכבת (לפי עונה).",
        "מים ובגד חלופי — גם אם לא מתכננים לשחות.",
      ],
      roads:
        "מוקדם בבוקר מרסטוקה/סלוני לכניסת הפארק — זמן קצר. אחרי הצהריים: מסלול ארוך חזרה לבודפשט (~5 שעות) — דרך קרואטיה והונגריה; <strong>וינייטות</strong> בתוקף. נהיגת ערב עייפה — החלפת נהגים.",
      misc: "כרטיס פליטביצה עם חלון כניסה — לא לאחר מהחלון ששילמתם.",
    },
    "6": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> מרובע 7 בבודפשט לוישיגראד (Bobpálya) בערך <strong>45–60 דק׳</strong>; חזרה דומה. קניות בשישי — קחו בחשבון זמן <strong>חניה + תורים</strong> במרכולים.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> <strong>שישי אחר הצהריים</strong> — כניסה לעיר עמוסה לפני שבת; סיימו נסיעות מוקדם מספיק לפני כניסת השבת.</p>",
      recommendations: [
        "בוישיגראד: טירה (Fellegvár) אם יש זמן ורגליים — נוף לדנובה (לא בשבת אם מקפידים על כרטיסים).",
        "רשימת קניות לשבת — לפי עמוד <a href=\"kosher-budapest.html\">כשרות בבודפשט</a> ו-<a href=\"synagogues-budapest.html\">בתי כנסת</a>.",
      ],
      roads:
        "בודפשט → וישיגראד כ־50 דק׳ — כביש לאורך הדנובה (M11 וכו׳ לפי ניווט). חניה ליד Bobpálya לפי האתר. חזרה לעיר — עומס אפשרי בשעות אחר הצהריים.",
      misc: "יום שישי — סגירת חנויות מוקדמת; סיים קניות לפני כניסת שבת.",
    },
    "7": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>נסיעה:</strong> לפי התכנון — <strong>ללא נסיעה בשבת</strong>. כל ההתניידות ברגל או בתחבורה שמותרת לכם לפי ההלכה.</p>" +
        "<p class=\"trip-extra-prose\"><strong>זמן הליכה משוער:</strong> מרובע 7 לגשר השלשלאות ~<strong>25–40 דק׳</strong> הליכה רגילה (תלוי במיקום הדירה המדויק); לנעליים על הדנובה — עוד כ־<strong>15–25 דק׳</strong> לאורך הטיילת.</p>",
      recommendations: [
        "שבת — אין נסיעות; טיול בגשר השלשלאות וברובע היהודי ברגל מהדירה.",
        "מנוחה במלון אחרי שבוע עמוס.",
      ],
      roads:
        "ללא נסיעות בשבת (לפי תכנון המשפחה). הליכה בלבד ברובע 7 ובמרכז — שבילים שטוחים ליד הדנובה; גשר השלשלאות עמוס בתיירים.",
      misc: "לוודא עירוב וזמני שבת מקומיים לפי הצורך; תפילה — ראו עמוד בתי הכנסת.",
    },
    "8": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> מרובע 7 ל־Aquaworld (צפון־מזרח העיר) בערך <strong>25–45 דק׳</strong> ברכב (תלוי במסלול ובשעה). חזרה — דומה; בדקו אם יש הסעה מהמתחם ושעותיה.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> <strong>פתיחת פארק המים</strong> — תורים אפשריים לקופה; בשעות אחר הצהריים — עומס בכבישים לכיוון מרכז העיר.</p>",
      recommendations: [
        "Aquaworld — מגבות לפעמים בתשלום; כדאי להביא מהמלון.",
        "אם משתמשים בהסעה של המתחם — לבדוק שעת איסוף חזרה.",
      ],
      roads:
        "Aquaworld בצפון־מזרח העיר — נסיעה ברכב או הסעה; חניה במתחם (לפי אתר). לא בטוח בתחבורה ציבורית ישירה מרובע 7 — בדקו מראש.",
      misc: "יום ארוך במים — קרם הגנה ומים לשתייה.",
    },
    "9": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> רובע 7 → בסיס Libegő (Zugliget) בערך <strong>20–35 דק׳</strong> ברכב. Libegő ↔ אי מרגיט — בערך <strong>15–30 דק׳</strong> ברכב בתוך העיר (תלוי חניה ליד הגשרים). לקניונים — בדרך כלל <strong>10–25 דק׳</strong> מתוך המרכז.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> מרכז ו־Váci בשעות אחר הצהריים <strong>עמוסים</strong>; חניה במרגיט — מצומצמת בשיא, שקלו תחבורה ציבורית או מונית לקטעים מסוימים.</p>",
      recommendations: [
        "Libegő + גבעת יאנוש — אפשר לשלב עם גן חיות (בתשלום נפרד) אם הילדים רוצים.",
        "באי מרגיט — מזרקה מוזיקלית בשעות מסוימות בעונה.",
      ],
      roads:
        "תחבורה ציבורית בבודפשט או חניה ליד בסיס Libegő (מוגבל). לאי מרגיט — גשרים מהמרכז; חניה בצד הצפוני/דרומי לפי מפה.",
      misc: "יום לפני טיסה — לא לעייף יתר על המידה; שמירת זמן לקניות.",
    },
    "10": {
      navigation:
        "<p class=\"trip-extra-prose\"><strong>זמני נסיעה משוערים:</strong> מרובע 7 לשילר (החזרת רכב) בערך <strong>25–40 דק׳</strong>. משילר לשדה התעופה — תלוי במסוף הטיסה; לרוב <strong>30–50 דק׳</strong> + זמן היסעה פנימית בטרמינל.</p>" +
        "<p class=\"trip-extra-prose\"><strong>עומס ותזמון:</strong> <strong>יום טיסה</strong> — השאירו מרווח של לפחות <strong>שעה–שעתיים</strong> אחרי זמן החזרה הרשום מול שעת הטיסה (בדיקת רכב, הסעה, ביטחון). בוקר בשדה — תורים בביטחון ובצ׳ק־אין.</p>",
      recommendations: [
        "לפני שילר: דלק מלא, ריקון שתייה מהרכב אם נדרש להשכרה.",
        "צילום מצב הרכב בעת החזרה (שריטות) למניעת מחלוקות.",
      ],
      roads:
        "ממרכז העיר לשילר — לפי כתובת החברה ב-Waze; עומס בוקר בכבישים לשדה תעופה — תאמו שעת החזרה מול שילר והשארת זמן להסעה לטרמינל.",
      misc: "דרכונים, טיסות, צ׳ימיגג — רשימת אימות > ראו גם <a href=\"packing.html\">רשימת אריזה</a>.",
    },
  };

  /**
   * קישור Waze לניווט: מעדיף wazeLl ("lat,lon") ואם אין — wazeQuery (טקסט חיפוש).
   * https://developers.google.com/waze/deeplinks
   */
  function buildTripRowWazeHref(row) {
    if (!row) return null;
    if (row.wazeLl) {
      var parts = String(row.wazeLl)
        .split(/[\s,]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      if (parts.length >= 2) {
        var lat = parseFloat(parts[0]);
        var lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          return "https://waze.com/ul?q=" + encodeURIComponent(lat + "," + lon) + "&navigate=yes";
        }
      }
    }
    if (row.wazeQuery) {
      var q = String(row.wazeQuery).trim();
      if (q) return "https://waze.com/ul?q=" + encodeURIComponent(q) + "&navigate=yes";
    }
    return null;
  }

  function augmentIndexDayTablesWithWaze() {
    if (typeof document === "undefined" || !document.querySelector) return;
    if (!document.getElementById("day1")) return;
    var cards = document.querySelectorAll("article.day-card[id^='day']");
    if (!cards.length) return;
    cards.forEach(function (card) {
      var idm = card.id.match(/^day(\d+)$/);
      if (!idm) return;
      var dayNum = parseInt(idm[1], 10);
      var plan = P[dayNum - 1];
      if (!plan || !plan.rows) return;
      var table = card.querySelector("table.day-table");
      if (!table) return;
      var theadTr = table.querySelector("thead tr");
      var tbody = table.querySelector("tbody");
      if (!theadTr || !tbody || theadTr.querySelector("th[data-waze-col]")) return;
      var thW = document.createElement("th");
      thW.scope = "col";
      thW.className = "col-waze";
      thW.setAttribute("data-waze-col", "1");
      thW.textContent = "ניווט (Waze)";
      theadTr.appendChild(thW);
      var trs = tbody.querySelectorAll("tr");
      for (var i = 0; i < plan.rows.length; i++) {
        if (i >= trs.length) break;
        var href = buildTripRowWazeHref(plan.rows[i]);
        var td = document.createElement("td");
        td.className = "col-waze";
        if (href) {
          var a = document.createElement("a");
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "פתח ב-Waze";
          td.appendChild(a);
        } else {
          var sp = document.createElement("span");
          sp.className = "muted";
          sp.textContent = "—";
          td.appendChild(sp);
        }
        trs[i].appendChild(td);
      }
    });
  }

  window.buildTripRowWazeHref = buildTripRowWazeHref;
  window.TRIP_DAY_PLAN = P;
  window.TRIP_DAY_EXTRAS = E;

  function augmentIndexDayCardsWithNavigation() {
    if (typeof document === "undefined" || !document.querySelector) return;
    if (!document.getElementById("day1")) return;
    for (var dn = 1; dn <= 10; dn++) {
      var card = document.getElementById("day" + dn);
      if (!card || card.querySelector("[data-index-nav-time]")) continue;
      var extra = E[String(dn)];
      if (!extra || !extra.navigation) continue;
      var tableWrap = card.querySelector(".day-table-wrap");
      if (!tableWrap) continue;
      var sec = document.createElement("section");
      sec.className = "trip-extra-section day-card-nav-time";
      sec.setAttribute("data-index-nav-time", "1");
      sec.setAttribute("aria-labelledby", "index-nav-time-" + dn);
      var h = document.createElement("h3");
      h.className = "section-heading section-heading--on-card";
      h.id = "index-nav-time-" + dn;
      h.textContent = "ניווט וזמן";
      var body = document.createElement("div");
      body.className = "day-card-nav-time__body";
      body.innerHTML = extra.navigation;
      sec.appendChild(h);
      sec.appendChild(body);
      tableWrap.insertAdjacentElement("afterend", sec);
    }
  }

  augmentIndexDayTablesWithWaze();
  augmentIndexDayCardsWithNavigation();
})();
