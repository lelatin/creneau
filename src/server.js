import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { q, db } from './db.js';
import { currentTeacher, startSession, endSession, hashPassword, verifyPassword, newToken } from './auth.js';
import { sendEmail } from './mail.js';
import * as V from './views.js';
import { faviconSvg } from './taki.js';
import {
  nowParis, todayParis, addDays, fmtDate, fmtTime, fmtPrice, parsePrice,
  slugify, isValidSlug, isEmail, RESERVED_SLUGS, ics,
} from './util.js';

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = () => (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(path.join(here, '..', 'public', 'style.css'));

const FLASH = {
  cree: 'Séance créée. Elle est visible sur votre page.',
  creees: 'Séances créées. Elles sont visibles sur votre page.',
  annulee: 'Séance annulée. Les inscrits ont été prévenus par email.',
  retire: 'Participant retiré et prévenu par email.',
  profil: 'Profil enregistré.',
  bienvenue: 'Bienvenue ! Créez votre première séance, puis partagez votre lien.',
  annulation: 'Votre réservation est annulée. À bientôt !',
};

// ---------- Petit routeur ----------

const routes = [];
const route = (method, pattern, handler) =>
  routes.push({ method, re: new RegExp(`^${pattern}$`), handler });

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' });
  res.end(String(body));
}
const redirect = (res, to) => { res.writeHead(303, { Location: to }); res.end(); };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 100_000) { reject(new Error('too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Protection CSRF simple : un formulaire doit venir de notre propre site.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return req.headers['sec-fetch-site'] !== 'cross-site';
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

const requireTeacher = (handler) => (ctx) =>
  ctx.teacher ? handler(ctx) : redirect(ctx.res, '/connexion');

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);

// ---------- Accueil, inscription, connexion ----------

route('GET', '/', ({ res, teacher }) => teacher ? redirect(res, '/tableau') : send(res, 200, V.home()));

route('GET', '/inscription', ({ res }) => send(res, 200, V.signup()));
route('POST', '/inscription', ({ res, body }) => {
  const values = { name: str(body.name, 80), email: str(body.email).toLowerCase() };
  const password = String(body.password || '');
  let error;
  if (!values.name) error = 'Indiquez votre nom.';
  else if (!isEmail(values.email)) error = 'Cet email ne semble pas valide.';
  else if (password.length < 8) error = 'Le mot de passe doit faire au moins 8 caractères.';
  else if (q.teacherByEmail.get(values.email)) error = 'Un compte existe déjà avec cet email.';
  if (error) return send(res, 400, V.signup({ values, error }));

  const base = slugify(values.name).padEnd(3, '0') || 'prof';
  let slug = base, n = 2;
  while (RESERVED_SLUGS.has(slug) || q.teacherBySlug.get(slug)) slug = `${base}-${n++}`;

  const { lastInsertRowid } = q.insertTeacher.run(values.email, hashPassword(password), values.name, slug);
  startSession(res, Number(lastInsertRowid));
  redirect(res, '/tableau?ok=bienvenue');
});

route('GET', '/connexion', ({ res, teacher }) => teacher ? redirect(res, '/tableau') : send(res, 200, V.login()));
route('POST', '/connexion', ({ res, body }) => {
  const values = { email: str(body.email).toLowerCase() };
  const t = q.teacherByEmail.get(values.email);
  if (!t || !verifyPassword(String(body.password || ''), t.password_hash)) {
    return send(res, 401, V.login({ values, error: 'Email ou mot de passe incorrect.' }));
  }
  startSession(res, t.id);
  redirect(res, '/tableau');
});

route('POST', '/deconnexion', ({ req, res }) => { endSession(req, res); redirect(res, '/'); });

// ---------- Espace prof ----------

route('GET', '/tableau', requireTeacher(({ res, teacher, url }) => {
  const now = nowParis();
  send(res, 200, V.dashboard({
    teacher,
    upcoming: q.upcomingClasses.all(teacher.id, now),
    past: q.pastClasses.all(teacher.id, now),
    publicUrl: `${BASE_URL()}/${teacher.slug}`,
    flash: FLASH[url.searchParams.get('ok')],
  }));
}));

route('GET', '/profil', requireTeacher(({ res, teacher, url }) =>
  send(res, 200, V.profile({ teacher, base: BASE_URL(), flash: FLASH[url.searchParams.get('ok')] }))));
route('POST', '/profil', requireTeacher(({ res, teacher, body }) => {
  const values = { name: str(body.name, 80), slug: str(body.slug, 40).toLowerCase(), bio: str(body.bio, 600) };
  let error;
  const other = q.teacherBySlug.get(values.slug);
  if (!values.name) error = 'Indiquez votre nom.';
  else if (!isValidSlug(values.slug)) error = 'Adresse invalide : 3 à 40 caractères, lettres minuscules, chiffres et tirets.';
  else if (other && other.id !== teacher.id) error = 'Cette adresse est déjà prise.';
  if (error) return send(res, 400, V.profile({ teacher, values, error, base: BASE_URL() }));
  q.updateTeacher.run(values.name, values.slug, values.bio, teacher.id);
  redirect(res, '/profil?ok=profil');
}));

function recentTitles(teacherId) {
  return db.prepare('SELECT DISTINCT title FROM classes WHERE teacher_id = ? ORDER BY id DESC LIMIT 15')
    .all(teacherId).map((r) => r.title);
}

route('GET', '/seances/nouvelle', requireTeacher(({ res, teacher, url }) => {
  const from = q.classById.get(Number(url.searchParams.get('depuis')));
  const src = from && from.teacher_id === teacher.id ? from : null;
  const values = src
    ? {
      title: src.title, date: addDays(src.starts_at, 7).slice(0, 10), time: src.starts_at.slice(11, 16),
      duration_min: src.duration_min, capacity: src.capacity, location: src.location,
      price: src.price_cents == null ? '' : String(src.price_cents / 100).replace('.', ','),
      description: src.description, repeat: 1,
    }
    : { date: todayParis(), time: '18:30', duration_min: 60, capacity: 12, repeat: 1 };
  values.titles = recentTitles(teacher.id);
  send(res, 200, V.classForm({ teacher, values }));
}));

route('POST', '/seances/nouvelle', requireTeacher(({ res, teacher, body }) => {
  const v = {
    title: str(body.title, 80), date: str(body.date, 10), time: str(body.time, 5),
    duration_min: Number(body.duration_min), capacity: Number(body.capacity),
    location: str(body.location), price: str(body.price, 12), description: str(body.description, 1000),
    repeat: Number(body.repeat) || 1,
  };
  const price = parsePrice(v.price);
  const startsAt = `${v.date}T${v.time}`;
  let error;
  if (!v.title) error = 'Donnez un nom à votre cours.';
  else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) error = 'Date ou heure invalide.';
  else if (startsAt < nowParis()) error = 'Cette date est déjà passée.';
  else if (!Number.isInteger(v.duration_min) || v.duration_min < 10 || v.duration_min > 600) error = 'Durée invalide (entre 10 et 600 minutes).';
  else if (!Number.isInteger(v.capacity) || v.capacity < 1 || v.capacity > 500) error = 'Nombre de places invalide.';
  else if (Number.isNaN(price)) error = 'Prix invalide.';
  else if (![1, 2, 4, 8, 12].includes(v.repeat)) error = 'Répétition invalide.';
  if (error) {
    v.titles = recentTitles(teacher.id);
    return send(res, 400, V.classForm({ teacher, values: v, error }));
  }
  db.exec('BEGIN');
  try {
    for (let i = 0; i < v.repeat; i++) {
      q.insertClass.run(teacher.id, v.title, addDays(startsAt, 7 * i), v.duration_min, v.location, v.capacity, price, v.description);
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  redirect(res, `/tableau?ok=${v.repeat > 1 ? 'creees' : 'cree'}`);
}));

function ownClass(teacher, id) {
  const c = q.classById.get(Number(id));
  return c && c.teacher_id === teacher.id ? c : null;
}

const describe = (c) => `${c.title} — ${fmtDate(c.starts_at)} à ${fmtTime(c.starts_at)}`;

route('GET', '/seances/(?<id>\\d+)', requireTeacher(({ res, teacher, params, url }) => {
  const c = ownClass(teacher, params.id);
  if (!c) return send(res, 404, V.notFound(teacher));
  send(res, 200, V.classDetail({
    teacher, c, bookings: q.bookingsForClass.all(c.id),
    isPast: c.starts_at < nowParis(), flash: FLASH[url.searchParams.get('ok')],
  }));
}));

route('POST', '/seances/(?<id>\\d+)/annuler', requireTeacher(({ res, teacher, params }) => {
  const c = ownClass(teacher, params.id);
  if (!c) return send(res, 404, V.notFound(teacher));
  if (!c.cancelled_at) {
    q.cancelClass.run(c.id);
    for (const b of q.bookingsForClass.all(c.id)) {
      sendEmail({
        to: b.email,
        subject: `Séance annulée : ${c.title}`,
        text: `Bonjour ${b.name},\n\n${teacher.name} a dû annuler la séance suivante :\n${describe(c)}\n\nDésolé pour le contretemps. Les prochains cours : ${BASE_URL()}/${teacher.slug}`,
      });
    }
  }
  redirect(res, `/seances/${c.id}?ok=annulee`);
}));

route('POST', '/seances/(?<id>\\d+)/retirer/(?<bid>\\d+)', requireTeacher(({ res, teacher, params }) => {
  const c = ownClass(teacher, params.id);
  const b = q.bookingById.get(Number(params.bid));
  if (!c || !b || b.class_id !== c.id) return send(res, 404, V.notFound(teacher));
  if (!b.cancelled_at) {
    q.cancelBooking.run('prof', b.id);
    sendEmail({
      to: b.email,
      subject: `Réservation annulée : ${c.title}`,
      text: `Bonjour ${b.name},\n\nVotre réservation pour ${describe(c)} a été annulée par ${teacher.name}.\n\nLes prochains cours : ${BASE_URL()}/${teacher.slug}`,
    });
  }
  redirect(res, `/seances/${c.id}?ok=retire`);
}));

// ---------- Réservation par l'élève (sans compte) ----------

function bookingContext(token) {
  const booking = q.bookingByToken.get(token);
  if (!booking) return null;
  const c = q.classById.get(booking.class_id);
  const teacher = q.teacherById.get(c.teacher_id);
  booking._past = c.starts_at < nowParis();
  return { booking, c, teacher };
}

route('GET', '/r/(?<token>[\\w-]+)', ({ res, params, url }) => {
  const ctx = bookingContext(params.token);
  if (!ctx) return send(res, 404, V.notFound());
  send(res, 200, V.bookingPage({ ...ctx, justBooked: url.searchParams.has('ok'), flash: FLASH[url.searchParams.get('msg')] }));
});

route('GET', '/r/(?<token>[\\w-]+)/agenda\\.ics', ({ res, params }) => {
  const ctx = bookingContext(params.token);
  if (!ctx) return send(res, 404, V.notFound());
  const { c, teacher, booking } = ctx;
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(c.title) || 'seance'}.ics"`);
  send(res, 200, ics({
    uid: `booking-${booking.id}@creneau`, title: `${c.title} · ${teacher.name}`, start: c.starts_at,
    durationMin: c.duration_min, location: c.location,
    description: `${c.description}\n\nGérer ma réservation : ${BASE_URL()}/r/${booking.token}`,
  }), 'text/calendar; charset=utf-8');
});

route('POST', '/r/(?<token>[\\w-]+)/annuler', ({ res, params }) => {
  const ctx = bookingContext(params.token);
  if (!ctx) return send(res, 404, V.notFound());
  const { booking, c, teacher } = ctx;
  if (!booking.cancelled_at && !booking._past) {
    q.cancelBooking.run('eleve', booking.id);
    sendEmail({
      to: q.teacherById.get(teacher.id).email,
      subject: `Désinscription : ${booking.name}`,
      text: `${booking.name} s'est désinscrit·e de ${describe(c)}.\nIl reste ${c.capacity - c.booked + 1} place(s).`,
    });
  }
  redirect(res, `/r/${booking.token}?msg=annulation`);
});

// Pages publiques : /{slug} et /{slug}/{id}. Déclarées en dernier.

function publicClass(slug, id) {
  const teacher = q.teacherBySlug.get(slug);
  if (!teacher) return null;
  const c = q.classById.get(Number(id));
  if (!c || c.teacher_id !== teacher.id || c.cancelled_at || c.starts_at < nowParis()) return { teacher };
  return { teacher, c };
}

route('GET', '/(?<slug>[a-z0-9-]+)', ({ res, params }) => {
  const teacher = q.teacherBySlug.get(params.slug);
  if (!teacher) return send(res, 404, V.notFound());
  send(res, 200, V.publicPage({ teacher, classes: q.publicClasses.all(teacher.id, nowParis()) }));
});

route('GET', '/(?<slug>[a-z0-9-]+)/(?<id>\\d+)', ({ res, params }) => {
  const found = publicClass(params.slug, params.id);
  if (!found) return send(res, 404, V.notFound());
  if (!found.c) return redirect(res, `/${found.teacher.slug}`);
  send(res, 200, V.bookForm(found));
});

route('POST', '/(?<slug>[a-z0-9-]+)/(?<id>\\d+)', ({ res, params, body }) => {
  const found = publicClass(params.slug, params.id);
  if (!found) return send(res, 404, V.notFound());
  if (!found.c) return redirect(res, `/${found.teacher.slug}`);
  const { teacher, c } = found;
  const values = { name: str(body.name, 80), email: str(body.email).toLowerCase() };
  let error;
  if (!values.name) error = 'Indiquez votre nom.';
  else if (!isEmail(values.email)) error = 'Cet email ne semble pas valide.';
  else if (c.booked >= c.capacity) error = 'Désolé, ce cours vient d\'être complet.';
  if (error) return send(res, 400, V.bookForm({ teacher, c, values, error }));

  const existing = q.activeBookingByEmail.get(c.id, values.email);
  if (existing) return redirect(res, `/r/${existing.token}`);

  const token = newToken();
  q.insertBooking.run(c.id, values.name, values.email, token);
  const link = `${BASE_URL()}/r/${token}`;
  sendEmail({
    to: values.email,
    subject: `Réservé : ${c.title} — ${fmtDate(c.starts_at)} à ${fmtTime(c.starts_at)}`,
    text: `Bonjour ${values.name},\n\nVotre place est réservée :\n${describe(c)}\n${c.location ? `Lieu : ${c.location}\n` : ''}${c.price_cents ? `Tarif : ${fmtPrice(c.price_cents)}, à régler à ${teacher.name}\n` : ''}\nPour ajouter au calendrier ou annuler : ${link}\n\nÀ bientôt !\n${teacher.name}`,
  });
  sendEmail({
    to: teacher.email,
    subject: `Nouvelle inscription : ${values.name}`,
    text: `${values.name} (${values.email}) a réservé ${describe(c)}.\n${c.booked + 1}/${c.capacity} inscrit·e·s.`,
  });
  redirect(res, `/r/${token}?ok`);
});

// ---------- Serveur ----------

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
        return res.end(CSS);
      }
      if (req.method === 'GET' && url.pathname === '/taki.svg') {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
        return res.end(faviconSvg);
      }
      const teacher = currentTeacher(req);
      let body = {};
      if (req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Requête refusée.', 'text/plain; charset=utf-8');
        body = Object.fromEntries(new URLSearchParams(await readBody(req)));
      }
      const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : url.pathname;
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = pathname.match(r.re);
        if (m) return await r.handler({ req, res, url, params: m.groups || {}, body, teacher });
      }
      send(res, 404, V.notFound(teacher));
    } catch (err) {
      console.error(err);
      if (!res.headersSent) send(res, 500, 'Oups, une erreur est survenue.', 'text/plain; charset=utf-8');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, () => console.log(`Créneau tourne sur ${BASE_URL()}`));
}
