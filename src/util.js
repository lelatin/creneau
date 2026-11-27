// Les dates sont stockées en heure locale française, sans fuseau : "2026-12-03T18:30".

const parisNow = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Paris',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

export function nowParis() {
  return parisNow.format(new Date()).replace(' ', 'T');
}

export function todayParis() {
  return nowParis().slice(0, 10);
}

function toUTC(s) {
  const [d, t = '00:00'] = s.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [H, M] = t.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, day, H, M));
}

const iso = (date) => date.toISOString().slice(0, 16);

export function addMinutes(s, min) {
  return iso(new Date(toUTC(s).getTime() + min * 60000));
}

export function addDays(s, days) {
  return addMinutes(s, days * 24 * 60);
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });

export function fmtDate(s) {
  const out = dayFmt.format(toUTC(s));
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function fmtTime(s) {
  return `${s.slice(11, 13)}h${s.slice(14, 16)}`;
}

export function fmtDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function fmtPrice(cents) {
  if (cents == null) return '';
  if (cents === 0) return 'Gratuit';
  const euros = cents / 100;
  return `${Number.isInteger(euros) ? euros : euros.toFixed(2).replace('.', ',')} €`;
}

export function parsePrice(input) {
  const s = String(input ?? '').trim().replace(',', '.').replace('€', '').trim();
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 10000) return NaN;
  return Math.round(n * 100);
}

export function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export const RESERVED_SLUGS = new Set([
  'tableau', 'connexion', 'inscription', 'deconnexion', 'seances', 'profil',
  'r', 'admin', 'api', 'static', 'style.css', 'favicon.ico', 'aide', 'tarifs', 'questionnaire', 'img',
]);

export function isValidSlug(s) {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(s) && !RESERVED_SLUGS.has(s);
}

export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}

// Agenda (.ics) en heure "flottante" : interprétée dans le fuseau du téléphone de l'élève.
export function ics({ uid, title, start, durationMin, location, description }) {
  const f = (s) => s.replace(/[-:]/g, '') + '00';
  const e = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Creneau//FR', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(addMinutes(start, durationMin))}`,
    `SUMMARY:${e(title)}`,
    `LOCATION:${e(location)}`,
    `DESCRIPTION:${e(description)}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
