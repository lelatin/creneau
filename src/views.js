import { html } from './html.js';
import { taki, takiSays } from './taki.js';
import { fmtDate, fmtTime, fmtDuration, fmtPrice } from './util.js';

// Identité V2 : éditoriale et calme. Grands titres en serif, petites étiquettes
// façon machine à écrire entre crochets, listes à filets, papiers colorés posés
// de travers et Taki dessiné au trait.

// ---------- Mise en page ----------

const tag = (s) => html`<span class="tag">[${s}]</span>`;

export function layout({ title, teacher, body, flash, publicPage = false }) {
  const nav = teacher && !publicPage
    ? html`<nav>
        <a href="/tableau">[séances]</a>
        <a href="/profil">[profil]</a>
        <form method="post" action="/deconnexion"><button class="link">[déconnexion]</button></form>
      </nav>`
    : !publicPage ? html`<nav>
        <a href="/connexion">[connexion]</a>
        <a href="/inscription" class="nav-cta">[créer mon espace]</a>
      </nav>` : '';

  return html`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title ? `${title} · ` : ''}Créneau</title>
<link rel="icon" href="/taki.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.bunny.net">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=instrument-serif:400,400i|instrument-sans:400,500,600|dm-mono:400,500&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body${publicPage ? html` class="public"` : ''}>
${publicPage ? '' : html`<header class="top">
  <a href="${teacher ? '/tableau' : '/'}" class="logo">${taki('hello', { size: 30, label: '' })}<span>Créneau</span></a>
  ${nav}
</header>`}
<main>
${flash ? html`<p class="flash" role="status">${flash}</p>` : ''}
${body}
</main>
${publicPage
  ? html`<footer class="powered">${taki('busy', { size: 26, label: '' })}<span>[réservations gérées par Taki] · <a href="/">Créneau</a></span></footer>`
  : html`<footer class="foot"><span>Créneau</span><span>[fait avec soin pour les indépendant·e·s]</span></footer>`}
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
      <p class="tag center">[réservation de cours pour profs de yoga, de pilates et coachs indépendants]</p>
      <h1 class="display">Vous donnez cours.<br><em>Taki</em> s'occupe du reste.</h1>
      <div class="hero-paper">
        ${taki('zen', { size: 230 })}
        <article class="idcard">
          <div class="idcard-pic">${taki('hello', { size: 120, label: '' })}</div>
          <dl>
            <dt>[nom]</dt><dd class="serif">Taki</dd>
            <dt>[métier]</dt><dd>Assistant de réservation</dd>
            <dt>[s'occupe de]</dt><dd>Inscriptions, confirmations, places, annulations</dd>
            <dt>[devise]</dt><dd>Vous enseignez, je gère la logistique.</dd>
          </dl>
        </article>
      </div>
      <div class="hero-cta">
        <a class="btn big" href="/inscription">Créer mon espace</a>
        <span class="tag">[gratuit · prêt en 2 minutes · sans carte bancaire]</span>
      </div>
    </section>

    <section class="notes-section">
      <div class="section-head">
        <h2 class="serif-xl">Ce que Taki fait<br>pour vous</h2>
        <p>Un·e indépendant·e ne devrait pas jongler avec les messages « il reste une place ? »,
          les listes sur papier et les rappels. Taki s'en charge, vous respirez.</p>
      </div>
      <ul class="notes">
        <li class="note sage">Une page de réservation, prête en 2 minutes</li>
        <li class="note blue">Vos élèves réservent sans compte : un nom, un email</li>
        <li class="note sand">Les places sont tenues à jour, le cours complet se ferme seul</li>
        <li class="note lime">Confirmations et annulations envoyées par email</li>
        <li class="note blue">Au parc, en salle, à domicile ou en visio</li>
      </ul>
    </section>

    <section class="steps">
      <h2 class="serif-xl">Comment ça marche</h2>
      <ol class="ruled">
        <li><span class="tag">[1]</span><span>Vous créez vos séances</span><span class="serif-num">2 min</span></li>
        <li><span class="tag">[2]</span><span>Vous partagez un seul lien (Instagram, WhatsApp, votre site)</span><span class="serif-num">1 clic</span></li>
        <li><span class="tag">[3]</span><span>Vos élèves réservent, Taki gère le reste</span><span class="serif-num">0 souci</span></li>
      </ol>
    </section>

    <section class="poses">
      <figure class="pose sage">${taki('zen', { size: 150 })}<figcaption>[respirer]<br>Vous préparez votre cours.</figcaption></figure>
      <figure class="pose blue">${taki('busy', { size: 150 })}<figcaption>[noter]<br>Taki tient la liste des inscrits.</figcaption></figure>
      <figure class="pose sand">${taki('party', { size: 150 })}<figcaption>[se réjouir]<br>Le cours est complet !</figcaption></figure>
    </section>

    <section class="closing">
      <h2 class="display small">Moins de logistique,<br><em>plus de cours.</em></h2>
      <a class="btn big" href="/inscription">Essayer avec Taki</a>
    </section>`,
  });
}

const authPage = ({ title, pose, say, body }) => html`
  <section class="auth">
    <aside class="auth-paper">${taki(pose, { size: 170 })}<p>${say}</p></aside>
    <div class="auth-form">
      <h1 class="serif-xl">${title}</h1>
      ${body}
    </div>
  </section>`;

export function signup({ values = {}, error } = {}) {
  return layout({
    title: 'Créer mon espace',
    body: authPage({
      title: 'Créer mon espace', pose: 'hello',
      say: html`Trois champs et je prépare votre page. Promis, c'est rapide.`,
      body: html`
      ${errorBox(error)}
      <form method="post" action="/inscription" class="stack">
        ${field({ label: '[votre nom, affiché à vos élèves]', name: 'name', value: values.name, required: true, autocomplete: 'name', placeholder: 'Camille Martin — Yoga' })}
        ${field({ label: '[email]', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email' })}
        ${field({ label: '[mot de passe]', name: 'password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password', hint: '8 caractères minimum' })}
        <button class="btn">Créer mon espace</button>
      </form>
      <p class="muted">Déjà inscrit·e ? <a href="/connexion">Se connecter</a></p>`,
    }),
  });
}

export function login({ values = {}, error } = {}) {
  return layout({
    title: 'Connexion',
    body: authPage({
      title: 'Connexion', pose: 'zen',
      say: html`Re-bonjour ! Tout est en ordre, je vous attendais.`,
      body: html`
      ${errorBox(error)}
      <form method="post" action="/connexion" class="stack">
        ${field({ label: '[email]', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email' })}
        ${field({ label: '[mot de passe]', name: 'password', type: 'password', required: true, autocomplete: 'current-password' })}
        <button class="btn">Se connecter</button>
      </form>
      <p class="muted">Pas encore de compte ? <a href="/inscription">Créer mon espace</a></p>`,
    }),
  });
}

export function profile({ teacher, values, error, flash, base }) {
  const v = values || teacher;
  return layout({
    title: 'Profil', teacher, flash,
    body: html`
    <section class="narrow">
      ${tag('profil')}
      <h1 class="serif-xl">Mon profil</h1>
      ${errorBox(error)}
      <form method="post" action="/profil" class="stack">
        ${field({ label: '[nom affiché]', name: 'name', value: v.name, required: true })}
        ${field({ label: '[adresse de votre page]', name: 'slug', value: v.slug, required: true, pattern: '[a-z0-9-]{3,40}',
          hint: `${base}/… — lettres minuscules, chiffres et tirets` })}
        <label class="field">
          <span>[présentation, facultatif]</span>
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
    <a href="/seances/${c.id}" class="row-item${c.cancelled_at ? ' cancelled' : ''}">
      <span class="when">${fmtDate(c.starts_at)}<br>${fmtTime(c.starts_at)}</span>
      <strong class="serif-title">${c.title}</strong>
      <span class="count${!c.cancelled_at && c.booked >= c.capacity ? ' full' : ''}">
        ${c.cancelled_at ? '[annulée]' : `${c.booked}/${c.capacity}`}
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
    <section class="share">
      ${tag('votre lien de réservation')}
      <p>À partager à vos élèves : Instagram, WhatsApp, votre site.</p>
      <div class="copy">
        <input readonly value="${publicUrl}" id="public-url" aria-label="Lien de réservation">
        <button type="button" class="btn small" data-copy="public-url">Copier</button>
      </div>
      <a href="${publicUrl}" target="_blank" rel="noopener">[voir ma page →]</a>
    </section>

    <div class="row">
      <h1 class="serif-xl">Mes séances</h1>
      <a class="btn" href="/seances/nouvelle">+ Nouvelle séance</a>
    </div>

    ${upcoming.length
      ? html`<ul class="ruled-list">${upcoming.map(classItem)}</ul>`
      : html`<div class="empty">
          ${taki('sleepy', { size: 120 })}
          <p class="serif-title">Aucune séance à venir.</p>
          <p class="muted">Créez votre premier cours : il apparaîtra tout de suite sur votre page.</p>
          <a class="btn" href="/seances/nouvelle">Créer ma première séance</a>
        </div>`}

    ${past.length ? html`
      <details class="past">
        <summary>[séances passées]</summary>
        <ul class="ruled-list">${past.map(classItem)}</ul>
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
      <a href="/tableau" class="back">[← mes séances]</a>
      <h1 class="serif-xl">Nouvelle séance</h1>
      ${errorBox(error)}
      <form method="post" action="/seances/nouvelle" class="stack">
        ${field({ label: '[nom du cours]', name: 'title', value: v.title, required: true, maxlength: 80, placeholder: 'Yoga doux', list: 'titles' })}
        <div class="grid2">
          ${field({ label: '[date]', name: 'date', type: 'date', value: v.date, required: true })}
          ${field({ label: '[heure]', name: 'time', type: 'time', value: v.time, required: true })}
        </div>
        <div class="grid2">
          ${field({ label: '[durée, minutes]', name: 'duration_min', type: 'number', value: v.duration_min, required: true, min: 10, max: 600, step: 5 })}
          ${field({ label: '[places]', name: 'capacity', type: 'number', value: v.capacity, required: true, min: 1, max: 500 })}
        </div>
        ${field({ label: '[lieu]', name: 'location', value: v.location, maxlength: 200, placeholder: 'Parc de la Tête d\'Or, entrée Enfants du Rhône — ou lien visio' })}
        ${field({ label: '[prix, €]', name: 'price', value: v.price, inputmode: 'decimal', placeholder: '15', hint: 'Laissez vide pour ne pas afficher de prix, 0 pour « Gratuit ». Réglé directement avec vous.' })}
        <label class="field">
          <span>[infos pour les élèves, facultatif]</span>
          <textarea name="description" rows="3" maxlength="1000" placeholder="Apportez votre tapis et une gourde.">${v.description}</textarea>
        </label>
        <label class="field">
          <span>[répéter]</span>
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
      <a href="/tableau" class="back">[← mes séances]</a>
      <h1 class="serif-xl">${c.title}${c.cancelled_at ? html` <span class="tag">[annulée]</span>` : ''}</h1>
      <p class="meta"><span>${fmtDate(c.starts_at)}</span>${classMeta(c)}</p>
      ${c.description ? html`<p class="desc">${c.description}</p>` : ''}

      <div class="row">
        <h2 class="serif-l">Inscrits <span class="tag">[${c.booked}/${c.capacity}]</span></h2>
        ${bookings.length ? html`<button type="button" class="btn small ghost" data-copy-text="${emails}">Copier les emails</button>` : ''}
      </div>
      ${bookings.length
        ? html`<ul class="ruled-list people">${bookings.map((b) => html`
            <li class="row-item">
              <div><strong>${b.name}</strong><span class="muted">${b.email}</span></div>
              ${!isPast && !c.cancelled_at ? html`
              <form method="post" action="/seances/${c.id}/retirer/${b.id}" data-confirm="Retirer ${b.name} de la séance ? Un email lui sera envoyé.">
                <button class="link danger">[retirer]</button>
              </form>` : ''}
            </li>`)}</ul>`
        : html`<div class="empty">${taki('sleepy', { size: 100 })}<p>Personne pour l'instant. Partagez votre lien, Taki veille !</p></div>`}

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
      <h1 class="display small">${teacher.name}</h1>
      <article class="idcard">
        <div class="idcard-pic avatar" aria-hidden="true">${teacher.name.trim().charAt(0).toUpperCase()}</div>
        <dl>
          ${teacher.bio ? html`<dt>[approche]</dt><dd class="bio">${teacher.bio}</dd>` : ''}
          <dt>[cours]</dt><dd>${classes.length === 1 ? '1 cours à venir' : `${classes.length} cours à venir`}</dd>
          <dt>[réserver]</dt><dd>Choisissez un cours, deux champs et c'est fait.</dd>
        </dl>
      </article>
    </header>
    <h2 class="serif-xl classes-title">Prochains cours</h2>
    ${days.length ? days.map((d) => html`
      <section class="day">
        <h3 class="tag">[${d.label.toLowerCase()}]</h3>
        <ul class="ruled-list">${d.items.map((c) => {
          const full = c.booked >= c.capacity;
          return html`<li>
            <a class="row-item slot${full ? ' full' : ''}" href="${full ? '#' : `/${teacher.slug}/${c.id}`}"${full ? html` aria-disabled="true"` : ''}>
              <span class="when">${fmtTime(c.starts_at)}<br>${fmtDuration(c.duration_min)}</span>
              <div>
                <strong class="serif-title">${c.title}</strong>
                ${c.location ? html`<span class="muted small">${c.location}</span>` : ''}
              </div>
              <span class="price">
                ${c.price_cents != null ? html`<span class="serif-num">${fmtPrice(c.price_cents)}</span>` : ''}
                <span class="tag">[${placesLabel(c).toLowerCase()}]</span>
              </span>
            </a>
          </li>`;
        })}</ul>
      </section>`)
      : html`<div class="empty">${taki('sleepy', { size: 110 })}<p>Aucun cours programmé pour le moment. Revenez bientôt !</p></div>`}`,
  });
}

export function bookForm({ teacher, c, values = {}, error }) {
  const full = c.booked >= c.capacity;
  return layout({
    title: c.title, publicPage: true,
    body: html`
    <a href="/${teacher.slug}" class="back">[← tous les cours de ${teacher.name}]</a>
    <section class="book">
      <article class="class-card">
        ${tag('cours')}
        <h1 class="serif-xl">${c.title}</h1>
        <dl class="facts">
          <dt>[quand]</dt><dd>${fmtDate(c.starts_at)} · ${fmtTime(c.starts_at)} · ${fmtDuration(c.duration_min)}</dd>
          ${c.location ? html`<dt>[où]</dt><dd>${c.location}</dd>` : ''}
          ${c.price_cents != null ? html`<dt>[prix]</dt><dd>${fmtPrice(c.price_cents)}</dd>` : ''}
          <dt>[places]</dt><dd>${placesLabel(c)}${full ? '' : ' restante' + (c.capacity - c.booked > 1 ? 's' : '')}</dd>
        </dl>
        ${c.description ? html`<p class="desc">${c.description}</p>` : ''}
      </article>
      ${full ? html`<div class="empty">${taki('oops', { size: 100 })}<p>Ce cours est complet.</p></div>` : html`
      <div class="book-form">
        ${takiSays('hello', html`Deux champs et c'est réservé. Je vous envoie la confirmation par email.`, { size: 76 })}
        ${errorBox(error)}
        <form method="post" action="/${teacher.slug}/${c.id}" class="stack">
          ${field({ label: '[prénom et nom]', name: 'name', value: values.name, required: true, maxlength: 80, autocomplete: 'name' })}
          ${field({ label: '[email]', name: 'email', type: 'email', value: values.email, required: true, autocomplete: 'email', hint: 'Pour recevoir la confirmation et pouvoir annuler.' })}
          <button class="btn big">Réserver ma place</button>
          ${c.price_cents ? html`<p class="muted small">Le règlement (${fmtPrice(c.price_cents)}) se fait directement avec ${teacher.name}.</p>` : ''}
        </form>
      </div>`}
    </section>`,
  });
}

export function bookingPage({ teacher, c, booking, justBooked, flash }) {
  const cancelled = booking.cancelled_at || c.cancelled_at;
  const past = booking._past;
  return layout({
    title: 'Ma réservation', publicPage: true, flash,
    body: html`
    ${justBooked ? html`<div class="success">${taki('party', { size: 170 })}<h1 class="display small">C'est réservé !</h1>
      <p>Un email de confirmation a été envoyé à <strong>${booking.email}</strong>.</p></div>`
      : html`<h1 class="serif-xl">Ma réservation</h1>`}
    <article class="class-card ticket">
      ${tag('votre place')}
      <h2 class="serif-l">${c.title}</h2>
      <dl class="facts">
        <dt>[quand]</dt><dd>${fmtDate(c.starts_at)} · ${fmtTime(c.starts_at)} · ${fmtDuration(c.duration_min)}</dd>
        ${c.location ? html`<dt>[où]</dt><dd>${c.location}</dd>` : ''}
        <dt>[avec]</dt><dd><a href="/${teacher.slug}">${teacher.name}</a></dd>
        <dt>[au nom de]</dt><dd>${booking.name}</dd>
      </dl>
      ${c.cancelled_at ? html`<p class="error">Cette séance a été annulée par ${teacher.name}.</p>`
        : booking.cancelled_at ? html`<p class="error">Réservation annulée.</p>` : ''}
    </article>
    ${!cancelled && !past ? html`
      <div class="actions">
        <a class="btn" href="/r/${booking.token}/agenda.ics">Ajouter à mon agenda</a>
        <form method="post" action="/r/${booking.token}/annuler" data-confirm="Annuler votre réservation ?">
          <button class="btn ghost danger">Annuler ma réservation</button>
        </form>
      </div>
      <p class="muted small">Gardez ce lien : il vous permet de retrouver et d'annuler votre réservation.</p>` : ''}
    ${!justBooked ? '' : html`<p><a href="/${teacher.slug}">[voir les autres cours →]</a></p>`}
    ${copyScript}`,
  });
}

export function notFound(teacher) {
  return layout({
    title: 'Page introuvable', teacher,
    body: html`<section class="notfound">${taki('oops', { size: 170 })}
      <h1 class="display small">Oups.</h1>
      <p>Taki a cherché partout : ce lien n'existe pas ou plus.</p>
      <p><a href="/">[retour à l'accueil]</a></p></section>`,
  });
}
