import { useEffect, useState } from "react";

function fmt(tz) {
  const parts = new Intl.DateTimeFormat("he-IL", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = parts.find((x) => x.type === "hour");
  const mm = parts.find((x) => x.type === "minute");
  const ss = parts.find((x) => x.type === "second");
  return (hh ? hh.value : "00") + ":" + (mm ? mm.value : "00") + ":" + (ss ? ss.value : "00");
}

export function TzClocks() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="tz-clocks" aria-label="שעונים (זמני מדינות)">
      <div className="tz-clocks__item">
        <div className="tz-clocks__label">ישראל</div>
        <div className="tz-clocks__time" data-tz="Asia/Jerusalem">
          {fmt("Asia/Jerusalem")}
        </div>
      </div>
      <div className="tz-clocks__item">
        <div className="tz-clocks__label">בודפשט</div>
        <div className="tz-clocks__time" data-tz="Europe/Budapest">
          {fmt("Europe/Budapest")}
        </div>
      </div>
    </section>
  );
}
