/*
=============================================================================
MODULE: public/mmUtils.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: SSOT constants, timezones, validators, PII masking,
and retry logic (PUBLIC SAFE).
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { SDK_CONFIG as INTERNAL_SDK_CONFIG } from "backend/internalConfig";

export const VERSION = Object.freeze({
    CORE: "v19.8.0-excellence-consolidated",
    API_V2: true,
    COMPLIANCE_ES: "2026",
});

export const SDK_CONFIG = Object.freeze({
    TZ: "Europe/Madrid",
});

export const MONEY = Object.freeze({
    DISPLAY_CURRENCY: "EUR",
    DECIMAL_PLACES: 2,
});

export const BOOKINGSADDONCONFIG = Object.freeze({
    MAXPERBOOKING: 21,
});

export const MESSAGE_TYPES = Object.freeze({
    READY: "MM_READY",
    CONTEXT: "MM_CONTEXT",
    AVAIL: "MM_AVAIL",
    SELECT: "MM_SELECT",
    BOOK: "MM_BOOK",
    NAV: "MM_NAV",
});

export const URLS = Object.freeze({
    SERVICIOS: "/reserva-online",
    CALENDARIO_2: "/booking-calendar/calendario-2",
    DETALLE_SERVICIO: "/servicio-2",
    PRIVACY_POLICY: "/politica-de-privacidad",
    TPV_PANEL: "/onlystaff",
});

export const UI = Object.freeze({
    HANDSHAKEMAXATTEMPTS: 7,
    HANDSHAKEBASEBACKOFF_MS: 750,
    HANDSHAKETIMEOUTMS: 120000,
    CONTEXTTIMEOUTMS: 120000,
    FRONTENDAPITIMEOUT_MS: 30000,
    FRONTENDRETRYATTEMPTS: 5,
    FRONTENDRETRYBASEBACKOFFMS: 500,
    TPVPOLLINGMS: 60 * 1000,
    MAXVISIBLESLOTS: 100,
    SLOTBUTTONCLASS: "slot-btn",
    DEFAULTSERVICEIMAGEURL: "https://static.wixstatic.com/media/ab7708374e5f7adb2f47f3944f3355da129b80~mv2.jpg",
    SALONLOCATIONLABEL: "C/ Maurice Ravel 35, Zaragoza",
});

export const STAFFDEFAULTNAME = "PROFESIONAL SEGUN HORARIO";

export function makeTraceId(prefix = "mm") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}${timestamp}${random}`;
}

export function _safeTrim(v) {
    return v === null || v === undefined ? "" : String(v).trim();
}

export function _cloneDeep(value) {
    if (value == null || typeof value !== "object") return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) return value.map((entry) => _cloneDeep(entry));
    const output = {};
    Object.keys(value).forEach((key) => {
        output[key] = _cloneDeep(value[key]);
    });
    return output;
}

export function _safeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

export function _safePhone(phone) {
    const raw = String(phone || "").trim();
    if (!raw) return "";
    const hasPlus = raw.startsWith("+");
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export function normalizeIdPart(v, maxLen = 80) {
    const s = String(v || "").trim();
    const safe = s.replace(/[^A-Za-z0-9_-]/g, "");
    return safe.length > maxLen ? safe.slice(0, maxLen) : safe;
}

export function _looksLikeGuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(v || "").trim()
    );
}

export function _safeSlugOrId(raw) {
    let s = String(raw || "").trim();
    if (!s) return "";
    s = s.split("?")[0].split("#")[0].trim();
    if (s.startsWith("/")) s = s.substring(1);
    if (s.endsWith("/")) s = s.slice(0, -1);
    const parts = s.split("/").filter(Boolean);
    s = parts.length ? parts[parts.length - 1] : s;
    if (_looksLikeGuid(s)) return s.trim();
    s = s.trim().toLowerCase();
    s = s.replace(/\s+/g, "-");
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s = s.replace(/[^a-z0-9-]/g, "");
    s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return s;
}

export function _normalizeLocalIsoStr(rawStr) {
    if (!rawStr || rawStr instanceof Date) return "";
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(String(rawStr).trim());
    if (!match) return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = match[4] === undefined ? 0 : Number(match[4]);
    const minute = match[5] === undefined ? 0 : Number(match[5]);
    const second = match[6] === undefined ? 0 : Number(match[6]);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day ||
        hour > 23 ||
        minute > 59 ||
        second > 59
    ) return "";
    return `${match[1]}-${match[2]}-${match[3]}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

export function getUtcDateFromMadridLocal(localStr) {
    if (localStr instanceof Date) return isNaN(localStr.getTime()) ? null : localStr;
    if (!localStr) return null;
    const norm = _normalizeLocalIsoStr(localStr);
    const partsIso = norm.split("T");
    const datePart = partsIso[0] || "";
    const timePart = partsIso[1] || "00:00:00";
    const dateParts = datePart.split("-").map(Number);
    const timeParts = timePart.split(":").map(Number);
    const y = Number(dateParts[0]);
    const m = Number(dateParts[1]);
    const d = Number(dateParts[2]);
    const hh = Number(timeParts[0] || 0);
    const mm = Number(timeParts[1] || 0);
    const ss = Number(timeParts[2] || 0);
    if (!y || !m || !d) return null;
    const guessUtcMs = Date.UTC(y, m - 1, d, hh, mm, ss);
    const guessDate = new Date(guessUtcMs);
    const dtf = new Intl.DateTimeFormat("sv-SE", {
        timeZone: SDK_CONFIG.TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    const parts = dtf.formatToParts(guessDate);
    const get = (type) => {
        const found = parts.find((p) => p.type === type);
        return found ? found.value : null;
    };
    const asIfUtc = Date.UTC(
        Number(get("year")),
        Number(get("month")) - 1,
        Number(get("day")),
        Number(get("hour")),
        Number(get("minute")),
        Number(get("second"))
    );
    const offsetMs = asIfUtc - guessDate.getTime();
    const utcMs = guessUtcMs - offsetMs;
    const out = new Date(utcMs);
    if (isNaN(out.getTime())) return null;
    const roundTripParts = dtf.formatToParts(out);
    const roundTrip = (type) => {
        const found = roundTripParts.find((p) => p.type === type);
        return found ? Number(found.value) : NaN;
    };
    if (
        roundTrip("year") !== y ||
        roundTrip("month") !== m ||
        roundTrip("day") !== d ||
        roundTrip("hour") !== hh ||
        roundTrip("minute") !== mm ||
        roundTrip("second") !== ss
    ) {
        return null;
    }
    return out;
}

export function getMadridLocalStringNoZ(utcDate) {
    if (!utcDate || !(utcDate instanceof Date) || isNaN(utcDate.getTime())) return "";
    return utcDate.toLocaleString("sv-SE", { timeZone: SDK_CONFIG.TZ }).replace(" ", "T");
}

export function _toDateSafe(val) {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "object" && val !== null && val.$date) return _toDateSafe(val.$date);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

export function withTimeout(promise, timeoutMs, label = "operation") {
    const ms = Number.isFinite(timeoutMs) ? timeoutMs : (INTERNAL_SDK_CONFIG?.TIMEOUTS?.API_MS || 15000);
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
    });
}

export function _maskEmail(email) {
    const raw = String(email || "").trim();
    if (!raw || !raw.includes("@")) return "*@";
    const split = raw.split("@");
    const localRaw = split[0] || "";
    const domainRaw = split[1] || "";
    const local = String(localRaw);
    const domain = String(domainRaw);
    if (!domain) return "*@";
    const keep = Math.min(2, local.length);
    const prefix = keep > 0 ? local.slice(0, keep) : "";
    return `${prefix}*@${domain}`;
}

export function _maskIp(ip) {
    if (!ip || typeof ip !== "string") return "*";
    const trimmed = ip.trim();
    if (!trimmed) return "*";
    const parts = trimmed.split(".");
    if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) return `${parts[0]}.${parts[1]}..`;
    if (trimmed.length > 6) return trimmed.slice(0, 6) + ":*";
    return "*";
}

export function _maskPhone(phone) {
    const raw = String(phone || "").trim();
    if (!raw) return "*";
    const clean = _safePhone(raw);
    if (clean.length <= 4) return "***";
    return `${clean.slice(0, 3)}****${clean.slice(-2)}`;
}

export function _maskName(name) {
    const raw = String(name || "").trim();
    if (!raw) return "";
    if (raw.length <= 2) return `${raw[0]}*`;
    return `${raw.slice(0, 2)}${"*".repeat(Math.max(1, raw.length - 2))}`;
}

export function _hashKey(input) {
    const str = String(input || "");
    let hash1 = 5381;
    let hash2 = 52711;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash1 = ((hash1 << 5) + hash1) ^ char;
        hash2 = ((hash2 << 5) + hash2) ^ char;
    }
    return (Math.abs(hash1) + Math.abs(hash2)).toString(36);
}

export function _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function _normType(type) {
    if (!type) return "";
    return String(type).trim().toUpperCase();
}
