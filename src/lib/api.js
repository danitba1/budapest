/** @type {string} */
const TOKEN_KEY = "pack_api_token";

export function getApiBase() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) {
    return String(import.meta.env.VITE_API_BASE).replace(/\/$/, "");
  }
  return "";
}

export function apiUrl(path) {
  const base = getApiBase();
  if (base.endsWith("/") && path.charAt(0) === "/") {
    return base.slice(0, -1) + path;
  }
  return base + path;
}

export function getAuthHeaders() {
  const h = { Accept: "application/json" };
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) h.Authorization = "Bearer " + t;
  return h;
}

export function getJsonHeaders() {
  const h = getAuthHeaders();
  h["Content-Type"] = "application/json";
  return h;
}

export const packApiTokenKey = TOKEN_KEY;

export async function apiFetch(path, options) {
  const res = await fetch(apiUrl(path), options || {});
  const bodyText = await res.text();
  if (res.status === 401) {
    const e401 = new Error("UNAUTHORIZED");
    e401.status = 401;
    throw e401;
  }
  if (!res.ok) {
    let msg = bodyText;
    try {
      const ej = JSON.parse(bodyText);
      if (ej && ej.error != null) {
        const er = ej.error;
        msg =
          typeof er === "string"
            ? er
            : er && typeof er.message === "string"
              ? er.message
              : JSON.stringify(er);
      }
    } catch {
      /* keep msg */
    }
    if (res.status === 404 && (/Cannot GET|404/.test(bodyText) || /<!DOCTYPE/i.test(bodyText)) && path.includes("/trip-days/")) {
      msg =
        "השרת לא מכיר את הנתיב /api/trip-days/…/meals — כנראה תהליך Node ישן ללא הקוד העדכני. " +
        "עצרו את השרת והריצו שוב: npm start מתוך תיקיית server (או פריסה מחדש).";
    }
    throw new Error((res.status + " " + msg).trim());
  }
  if (!bodyText) return {};
  return JSON.parse(bodyText);
}
