import { html } from './html.js';
import { taki, takiSays } from './taki.js';
import { fmtDate, fmtTime, fmtDuration, fmtPrice } from './util.js';

// ---------- Mise en page ----------

export function layout({ title, teacher, body, flash, publicPage = false }) {
  const nav = teacher && !publicPage
    ? html`<nav>
        <a href="/tableau">Mes séances</a>
        <a href="/profil">Profil</a>
        <form method="post" action="/deconnexion"><button class="link">Déconnexion</button></form>
      </nav>`
    : !publicPage ? html`<nav><a href="/connexion">Connexion</a></nav>` : '';

  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title ? `${title} · ` : ''}Créneau</title>
<link rel="icon" href="/taki.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.bunny.net">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=bricolage-grotesque:400,500,700,800&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body${publicPage ? html` class="public"` : ''}>
${publicPage ? '' : html`<header class="top">
  <a href="${teacher ? '/tableau' : '/'}" class="logo">${taki('hello', { size: 34, label: '' })}<span>Créneau</span></a>
  ${nav}
</header>`}
<main>
${flash ? html`<p class="flash" role="status">${flash}</p>` : ''}
${body}
</main>
${publicPage
  ? html`<footer class="powered">${taki('busy', { size: 28, label: '' })}<span>Réservations gérées par Taki · <a href="/">Créneau</a></span></footer>`
  : html`<footer class="foot">Créneau · fait avec soin pour les indépendant·e·s</footer>`}
</body>
</html>`;
}

const field = ({ label, name, type = 'text', value = '', hint, ...attrs }) => html`
  <label class="field">
    <span>${label}</span>
    <input type="${type}" name="${name}" value="${value ?? ''}"
      ${Object.entries(attrs).map(([k, v]) => v === true ? html` ${k}` : v === false || v == null ? '' : html` ${k}="${v}"`)}>
    ${hint ? html`<small>${hint}</small>` : ''}
  </label>`;

const errorBox = (error) => error ? html`<p class="error" role="alert">${error}</p>` : '';

const placesLabel = (c) => {
  const left = c.capacity - c.booked;
  if (left <= 0) return 'Complet';
  return left === 1 ? '1 place' : `${left} places`;
};

const classMeta = (c) => html`
  <span>${fmtTime(c.starts_at)} · ${fmtDuration(c.duration_min)}</span>
  ${c.location ? html`<span>${c.location}</span>` : ''}
  ${c.price_cents != null ? html`<span>${fmtPrice(c.price_cents)}</span>` : ''}`;

// ---------- Accueil & comptes ----------

export function home() {
  return layout({
    body: html`
    <section class="hero">
      <div class="hero-text">
        <p class="kicker">Pour les profs de yoga, de pilates et les coachs indépendants</p>
        <h1>Vous donnez cours.<br><mark>Taki s'occupe du reste.</mark></h1>
        <p class="lead">Créneau, c'est votre assistant de réservation. Vous créez vos séances, vous partagez un lien,
          et Taki gère les inscriptions, les confirmations et les annulations.</p>
        <a class="btn big" href="/inscription">Créer mon espace — c'est gratuit</a>
        <p class="muted small">Prêt en 2 minutes. Sans carte bancaire.</p>
      </div>
      <div class="hero-taki">
        <div class="bubble">Salut ! Moi c'est Taki. La logistique, c'est mon truc.</div>
        ${taki('hello', { size: 220 })}
      </div>
    </section>

    <section class="features">
      <h2>Ce que Taki fait pour vous</h2>
      <ul class="points">
        <li><span class="num">1</span><div><strong>Une page de réservation, tout de suite.</strong>
          Un seul lien à mettre sur Instagram, WhatsApp ou votre site.</div></li>
        <li><span class="num">2</span><div><strong>Vos élèves réservent sans compte.</strong>
          Un nom, un email, c'est réservé. Taki envoie la confirmation.</div></li>
        <li><span class="num">3</span><div><strong>Les places sont tenues à jour.</strong>
          Cours complet ? Taki ferme les inscriptions tout seul.</div></li>
        <li><span class="num">4</span><div><strong>Où que vous donniez cours.</strong>
          Parc, salle louée, à domicile ou en visio.</div></li>
      </ul>
    </section>

    <section class="calm">
      ${taki('zen', { size: 120 })}
      <div>
        <h2>Un·e indépendant·e ne devrait pas jongler avec tout ça.</h2>
        <p>Les messages « il reste une place ? », les listes sur papier, les rappels…
          Taki s'en charge. Vous, respirez.</p>
        <a class="btn" href="/inscription">Essayer avec Taki</a>
      </div>
    </section>`,
  });
}

export function signup({ values = {}, error } = {}) {
  return layout({
    title: 'Créer mon espace',
    body: html`
    <section class="narrow">
      ${takiSays('hello', html`Trois champs et je prépare votre page. Promis, c'est rapide.`)}
      <h1>Créer mon espace</h1>
      ${errorBox(error)}
      <form method="post" action="/inscription" class="stack">
        ${field({ label: 'Votre nom (affiché à vos élèves)', name: 'name', value: values.name, required: true, autocomplete: 'name', placeholder: 'Camille Martin — Yoga' })}
        ${field({ label: 'Email', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email' })}
        ${field({ label: 'Mot de passe', name: 'password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password', hint: '8 caractères minimum' })}
        <button class="btn">Créer mon espace</button>
      </form>
      <p class="muted">Déjà inscrit·e ? <a href="/connexion">Se connecter</a></p>
    </section>`,
  });
}

export function login({ values = {}, error } = {}) {
  return layout({
    title: 'Connexion',
    body: html`
    <section class="narrow">
      ${takiSays('zen', html`Re-bonjour ! Tout est en ordre, je vous attendais.`)}
      <h1>Connexion</h1>
      ${errorBox(error)}
      <form method="post" action="/connexion" class="stack">
        ${field({ label: 'Email', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email' })}
        ${field({ label: 'Mot de passe', name: 'password', type: 'password', required: true, autocomplete: 'current-password' })}
        <button class="btn">Se connecter</button>
      </form>
      <p class="muted">Pas encore de compte ? <a href="/inscription">Créer mon espace</a></p>
    </section>`,
  });
}

export function profile({ teacher, values, error, flash, base }) {
  const v = values || teacher;
  return layout({
    title: 'Profil', teacher, flash,
    body: html`
    <section class="narrow">
      <h1>Mon profil</h1>
      ${errorBox(error)}
      <form method="post" action="/profil" class="stack">
        ${field({ label: 'Nom affiché', name: 'name', value: v.name, required: true })}
        ${field({ label: 'Adresse de votre page', name: 'slug', value: v.slug, required: true, pattern: '[a-z0-9-]{3,40}',
          hint: `${base}/… — lettres minuscules, chiffres et tirets` })}
        <label class="field">
          <span>Présentation (facultatif)</span>
          <textarea name="bio" rows="4" maxlength="600" placeholder="Hatha et vinyasa, tous niveaux. Cours au parc de la Tête d'Or et en visio.">${v.bio}</textarea>
        </label>
        <button class="btn">Enregistrer</button>
      </form>
    </section>`,
  });
}

// ---------- Tableau de bord du prof ----------

const classItem = (c) => html`
  <li>
    <a href="/seances/${c.id}" class="item${c.cancelled_at ? ' cancelled' : ''}">
      <div>
        <strong>${c.title}</strong>
        <span class="muted">${fmtDate(c.starts_at)} · ${fmtTime(c.starts_at)}</span>
      </div>
      <span class="pill${!c.cancelled_at && c.booked >= c.capacity ? ' full' : ''}">
        ${c.cancelled_at ? 'Annulée' : `${c.booked}/${c.capacity}`}
      </span>
    </a>
  </li>`;

function takiBrief(teacher, upcoming) {
  const first = teacher.name.trim().split(/\s+/)[0];
  const active = upcoming.filter((c) => !c.cancelled_at);
  if (!active.length) return html`Salut ${first} ! Rien de prévu pour l'instant. Créez une séance, je m'occupe des inscriptions.`;
  const next = active[0];
  const people = active.reduce((n, c) => n + c.booked, 0);
  return html`Salut ${first} ! ${active.length === 1 ? '1 séance à venir' : `${active.length} séances à venir`},
    ${people === 1 ? '1 élève inscrit·e' : `${people} élèves inscrit·e·s`}.
    Prochaine séance <strong>${fmtDate(next.starts_at).toLowerCase()} à ${fmtTime(next.starts_at)}</strong>.
    Je gère les confirmations.`;
}

export function dashboard({ teacher, upcoming, past, publicUrl, flash }) {
  return layout({
    title: 'Mes séances', teacher, flash,
    body: html`
    ${takiSays('busy', takiBrief(teacher, upcoming))}
    <section class="card share">
      <p><strong>Votre lien de réservation</strong> — à partager à vos élèves</p>
      <div class="copy">
        <input readonly value="${publicUrl}" id="public-url" aria-label="Lien de réservation">
        <button type="button" class="btn small" data-copy="public-url">Copier</button>
      </div>
      <a href="${publicUrl}" target="_blank" rel="noopener">Voir ma page →</a>
    </section>

    <div class="row">
      <h1>Mes séances</h1>
      <a class="btn" href="/seances/nouvelle">+ Nouvelle séance</a>
    </div>

    ${upcoming.length
      ? html`<ul class="list">${upcoming.map(classItem)}</ul>`
      : html`<div class="empty">
          ${taki('sleepy', { size: 110 })}
          <p><strong>Aucune séance à venir.</strong></p>
          <p class="muted">Créez votre premier cours : il apparaîtra tout de suite sur votre page.</p>
          <a class="btn" href="/seances/nouvelle">Créer ma première séance</a>
        </div>`}

    ${past.length ? html`
      <details class="past">
        <summary>Séances passées</summary>
        <ul class="list">${past.map(classItem)}</ul>
      </details>` : ''}
    ${copyScript}`,
  });
}

export function classForm({ teacher, values, error }) {
  const v = values;
  return layout({
    title: 'Nouvelle séance', teacher,
    body: html`
    <section class="narrow">
      <a href="/tableau" class="back">← Mes séances</a>
      <h1>Nouvelle séance</h1>
      ${errorBox(error)}
      <form method="post" action="/seances/nouvelle" class="stack">
        ${field({ label: 'Nom du cours', name: 'title', value: v.title, required: true, maxlength: 80, placeholder: 'Yoga doux', list: 'titles' })}
        <div class="grid2">
          ${field({ label: 'Date', name: 'date', type: 'date', value: v.date, required: true })}
          ${field({ label: 'Heure', name: 'time', type: 'time', value: v.time, required: true })}
        </div>
        <div class="grid2">
          ${field({ label: 'Durée (minutes)', name: 'duration_min', type: 'number', value: v.duration_min, required: true, min: 10, max: 600, step: 5 })}
          ${field({ label: 'Places', name: 'capacity', type: 'number', value: v.capacity, required: true, min: 1, max: 500 })}
        </div>
        ${field({ label: 'Lieu', name: 'location', value: v.location, maxlength: 200, placeholder: 'Parc de la Tête d\'Or, entrée Enfants du Rhône — ou lien visio' })}
        ${field({ label: 'Prix (€)', name: 'price', value: v.price, inputmode: 'decimal', placeholder: '15', hint: 'Laissez vide pour ne pas afficher de prix, 0 pour « Gratuit ». Réglé directement avec vous.' })}
        <label class="field">
          <span>Infos pour les élèves (facultatif)</span>
          <textarea name="description" rows="3" maxlength="1000" placeholder="Apportez votre tapis et une gourde.">${v.description}</textarea>
        </label>
        <label class="field">
          <span>Répéter</span>
          <select name="repeat">
            ${[1, 2, 4, 8, 12].map((n) => html`<option value="${n}"${String(v.repeat) === String(n) ? html` selected` : ''}>
              ${n === 1 ? 'Une seule fois' : `Chaque semaine, ${n} fois`}</option>`)}
          </select>
        </label>
        <button class="btn">Créer la séance</button>
      </form>
      ${v.titles?.length ? html`<datalist id="titles">${v.titles.map((t) => html`<option value="${t}">`)}</datalist>` : ''}
    </section>`,
  });
}

export function classDetail({ teacher, c, bookings, isPast, flash }) {
  const emails = bookings.map((b) => b.email).join(', ');
  return layout({
    title: c.title, teacher, flash,
    body: html`
    <section>
      <a href="/tableau" class="back">← Mes séances</a>
      <h1>${c.title}${c.cancelled_at ? html` <span class="pill">Annulée</span>` : ''}</h1>
      <p class="meta">
        <span>${fmtDate(c.starts_at)}</span>
        ${classMeta(c)}
      </p>
      ${c.description ? html`<p class="desc">${c.description}</p>` : ''}

      <div class="row">
        <h2>Inscrits · ${c.booked}/${c.capacity}</h2>
        ${bookings.length ? html`<button type="button" class="btn small ghost" data-copy-text="${emails}">Copier les emails</button>` : ''}
      </div>
      ${bookings.length
        ? html`<ul class="list people">${bookings.map((b) => html`
            <li class="item">
              <div><strong>${b.name}</strong><span class="muted">${b.email}</span></div>
              ${!isPast && !c.cancelled_at ? html`
              <form method="post" action="/seances/${c.id}/retirer/${b.id}" data-confirm="Retirer ${b.name} de la séance ? Un email lui sera envoyé.">
                <button class="link danger">Retirer</button>
              </form>` : ''}
            </li>`)}</ul>`
        : html`<div class="empty">${taki('sleepy', { size: 90 })}<p>Personne pour l'instant. Partagez votre lien, Taki veille !</p></div>`}

      <div class="actions">
        <a class="btn ghost" href="/seances/nouvelle?depuis=${c.id}">Dupliquer</a>
        ${!isPast && !c.cancelled_at ? html`
        <form method="post" action="/seances/${c.id}/annuler"
          data-confirm="Annuler cette séance ? ${c.booked ? `Les ${c.booked} inscrit·e·s seront prévenu·e·s par email.` : ''}">
          <button class="btn ghost danger">Annuler la séance</button>
        </form>` : ''}
      </div>
    </section>
    ${copyScript}`,
  });
}

// Petit script partagé : boutons "copier" et confirmations.
const copyScript = html`<script>
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy],[data-copy-text]');
  if (!b) return;
  const text = b.dataset.copyText ?? document.getElementById(b.dataset.copy).value;
  navigator.clipboard.writeText(text).then(() => { const t = b.textContent; b.textContent = 'Copié !'; setTimeout(() => b.textContent = t, 1500); });
});
document.addEventListener('submit', (e) => {
  const m = e.target.dataset.confirm;
  if (m && !confirm(m)) e.preventDefault();
});
</script>`;

// ---------- Pages publiques (élèves) ----------

export function publicPage({ teacher, classes }) {
  const days = [];
  for (const c of classes) {
    const day = c.starts_at.slice(0, 10);
    if (days.at(-1)?.day !== day) days.push({ day, label: fmtDate(c.starts_at), items: [] });
    days.at(-1).items.push(c);
  }
  return layout({
    title: teacher.name, publicPage: true,
    body: html`
    <header class="pub-head">
      <div class="avatar" aria-hidden="true">${teacher.name.trim().charAt(0).toUpperCase()}</div>
      <h1>${teacher.name}</h1>
      ${teacher.bio ? html`<p class="bio">${teacher.bio}</p>` : ''}
    </header>
    ${days.length ? days.map((d) => html`
      <section class="day">
        <h2>${d.label}</h2>
        <ul class="list">${d.items.map((c) => {
          const full = c.booked >= c.capacity;
          return html`<li>
            <a class="item slot${full ? ' full' : ''}" href="${full ? '#' : `/${teacher.slug}/${c.id}`}"${full ? html` aria-disabled="true"` : ''}>
              <div>
                <strong>${c.title}</strong>
                <span class="meta">${classMeta(c)}</span>
              </div>
              <span class="pill${full ? ' full' : ''}">${placesLabel(c)}</span>
            </a>
          </li>`;
        })}</ul>
      </section>`)
      : html`<div class="empty">${taki('sleepy', { size: 100 })}<p>Aucun cours programmé pour le moment. Revenez bientôt !</p></div>`}`,
  });
}

export function bookForm({ teacher, c, values = {}, error }) {
  const full = c.booked >= c.capacity;
  return layout({
    title: c.title, publicPage: true,
    body: html`
    <a href="/${teacher.slug}" class="back">← Tous les cours de ${teacher.name}</a>
    <section class="card">
      <h1>${c.title}</h1>
      <p class="meta"><span>${fmtDate(c.starts_at)}</span>${classMeta(c)}</p>
      ${c.description ? html`<p class="desc">${c.description}</p>` : ''}
      <p class="muted">${placesLabel(c)}${full ? '' : ' restante' + (c.capacity - c.booked > 1 ? 's' : '')}</p>
    </section>
    ${full ? html`<div class="empty">${taki('oops', { size: 90 })}<p>Ce cours est complet.</p></div>` : html`
    <section class="narrow">
      ${takiSays('hello', html`Deux champs et c'est réservé. Je vous envoie la confirmation par email.`, { size: 72 })}
      ${errorBox(error)}
      <form method="post" action="/${teacher.slug}/${c.id}" class="stack">
        ${field({ label: 'Prénom et nom', name: 'name', value: values.name, required: true, maxlength: 80, autocomplete: 'name' })}
        ${field({ label: 'Email', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email', hint: 'Pour recevoir la confirmation et pouvoir annuler.' })}
        <button class="btn big">Réserver ma place</button>
        ${c.price_cents ? html`<p class="muted small">Le règlement (${fmtPrice(c.price_cents)}) se fait directement avec ${teacher.name}.</p>` : ''}
      </form>
    </section>`}`,
  });
}

export function bookingPage({ teacher, c, booking, justBooked, flash }) {
  const cancelled = booking.cancelled_at || c.cancelled_at;
  const past = booking._past;
  return layout({
    title: 'Ma réservation', publicPage: true, flash,
    body: html`
    ${justBooked ? html`<div class="success">${taki('party', { size: 150 })}<h1>C'est réservé !</h1>
      <p>Un email de confirmation a été envoyé à <strong>${booking.email}</strong>.</p></div>`
      : html`<h1>Ma réservation</h1>`}
    <section class="card">
      <h2>${c.title}</h2>
      <p class="meta"><span>${fmtDate(c.starts_at)}</span>${classMeta(c)}</p>
      <p>Avec <a href="/${teacher.slug}">${teacher.name}</a> · au nom de ${booking.name}</p>
      ${c.cancelled_at ? html`<p class="error">Cette séance a été annulée par ${teacher.name}.</p>`
        : booking.cancelled_at ? html`<p class="error">Réservation annulée.</p>` : ''}
    </section>
    ${!cancelled && !past ? html`
      <div class="actions">
        <a class="btn" href="/r/${booking.token}/agenda.ics">Ajouter à mon agenda</a>
        <form method="post" action="/r/${booking.token}/annuler" data-confirm="Annuler votre réservation ?">
          <button class="btn ghost danger">Annuler ma réservation</button>
        </form>
      </div>
      <p class="muted small">Gardez ce lien : il vous permet de retrouver et d'annuler votre réservation.</p>` : ''}
    ${!justBooked ? '' : html`<p><a href="/${teacher.slug}">Voir les autres cours →</a></p>`}
    ${copyScript}`,
  });
}

export function notFound(teacher) {
  return layout({
    title: 'Page introuvable', teacher,
    body: html`<section class="narrow notfound">${taki('oops', { size: 140 })}<h1>Page introuvable</h1><p>Taki a cherché partout : ce lien n'existe pas ou plus.</p><p><a href="/">Retour à l'accueil</a></p></section>`,
  });
}
