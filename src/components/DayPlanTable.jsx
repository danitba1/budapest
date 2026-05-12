import { Link } from "react-router-dom";
import { buildTripRowWazeHref } from "../../trip-days-data.js";

const TICKET_HTML = {
  must: { cls: "ticket-must", label: "חובה" },
  rec: { cls: "ticket-rec", label: "מומלץ" },
  no: { cls: "ticket-no", label: "לא" },
  na: { cls: "ticket-na", label: "—" },
};

/**
 * @param {{ plan: object }} props
 */
export function DayPlanTable({ plan }) {
  return (
    <div className="day-table-wrap">
      <table className="day-table">
        <thead>
          <tr>
            <th scope="col">חלק ביום</th>
            <th scope="col">מה עושים</th>
            <th scope="col">כרטיס מראש</th>
            <th scope="col" className="col-links">
              קישורים
            </th>
            <th scope="col" className="col-waze">
              ניווט (Waze)
            </th>
          </tr>
        </thead>
        <tbody>
          {plan.rows.map((row, i) => {
            const tinfo = TICKET_HTML[row.ticket] || TICKET_HTML.na;
            const wHref = buildTripRowWazeHref(row);
            return (
              <tr key={i}>
                <th scope="row">{row.part}</th>
                <td dangerouslySetInnerHTML={{ __html: row.activity }} />
                <td className="ticket-cell">
                  <span className={"ticket " + tinfo.cls}>{tinfo.label}</span>
                  {row.ticketNote ? <span className="muted">{" " + row.ticketNote}</span> : null}
                </td>
                <td className="col-links" dangerouslySetInnerHTML={{ __html: row.links }} />
                <td className="col-waze">
                  {wHref ? (
                    <a href={wHref} target="_blank" rel="noopener noreferrer">
                      פתח ב-Waze
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {{ plan: object, extras?: { navigation?: string } }} props
 */
export function DayPlanCard({ plan, extras }) {
  const navId = `index-nav-time-${plan.day}`;
  return (
    <article className="day-card" id={`day${plan.day}`}>
      <div className="day-head-row">
        <div className="day-head">{plan.title}</div>
        <Link className="day-head-link" to={`/trip-day/${plan.day}`}>
          עמוד היום ←
        </Link>
      </div>
      <DayPlanTable plan={plan} />
      {extras?.navigation ? (
        <section className="trip-extra-section day-card-nav-time" aria-labelledby={navId}>
          <h3 className="section-heading section-heading--on-card" id={navId}>
            ניווט וזמן
          </h3>
          <div className="day-card-nav-time__body" dangerouslySetInnerHTML={{ __html: extras.navigation }} />
        </section>
      ) : null}
    </article>
  );
}
