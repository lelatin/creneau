// Génère une version statique de démonstration dans docs/, publiable sur GitHub Pages.
// Usage : npm run build:static
//
// L'appli est lancée avec une base de démo temporaire, chaque page est enregistrée
// en HTML, et les liens sont réécrits vers les fichiers. Les formulaires mènent
// à la page suivante sans rien enregistrer (c'est un aperçu).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'docs');
const PUBLIC_BASE = process.env.PUBLIC_BASE || 'https://lelatin.github.io/creneau';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'creneau-static-'));
process.env.DB_PATH = path.join(tmp, 'demo.db');
process.env.BASE_URL = PUBLIC_BASE;
process.chdir(root);
const log = console.log;
console.log = () => {}; // les emails de démo s'affichent sinon dans la console
await import('./demo.js');
const { createServer } = await import('../src/server.js');
const { taki } = await import('../src/taki.js');

const server = createServer().listen(0);
await new Promise((r) => server.once('listening', r));
const origin = `http://127.0.0.1:${server.address().port}`;

async function get(p, cookie) {
  const res = await fetch(origin + p, { headers: cookie ? { cookie } : {}, redirect: 'manual' });
  return { status: res.status, text: await res.text(), location: res.headers.get('location'), setCookie: res.headers.get('set-cookie') };
}
const post = (p, form) => fetch(origin + p, {
  method: 'POST', redirect: 'manual',
  headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(form),
});

// Session du prof de démo
const login = await post('/connexion', { email: 'demo@creneau.test', password: 'demo1234' });
const cookie = login.headers.get('set-cookie').split(';')[0];

const idsIn = (text, re) => [...new Set([...text.matchAll(re)].map((m) => m[1]))];
const publicIds = idsIn((await get('/camille-yoga')).text, /href="\/camille-yoga\/(\d+)"/g);

// Une réservation fictive pour montrer la page de confirmation
// (faite avant les captures, pour que les compteurs de places concordent partout)
const booked = await post(`/camille-yoga/${publicIds[0]}`, { name: 'Alex Exemple', email: 'alex@exemple.test' });
const confirmation = await get(booked.headers.get('location'));

const home = await get('/');
const pub = await get('/camille-yoga');
const dash = await get('/tableau', cookie);
const classIds = idsIn(dash.text, /href="\/seances\/(\d+)"/g);

// Chemin de l'appli → fichier statique
const SLUG = 'camille-yoga';
function mapPath(p, { form = false } = {}) {
  p = p.replace(PUBLIC_BASE, '').replace(/[?#].*$/, '') || '/';
  if (p === '/') return 'index.html';
  if (p === '/style.css' || p === '/taki.svg') return p.slice(1);
  if (p === '/connexion' || p === '/inscription') return form ? 'tableau.html' : `${p.slice(1)}.html`;
  if (p === '/deconnexion') return 'index.html';
  if (p === '/tableau' || p === '/profil') return form ? 'tableau.html' : `${p.slice(1)}.html`;
  if (p === `/${SLUG}`) return `${SLUG}.html`;
  let m;
  if ((m = p.match(new RegExp(`^/${SLUG}/(\\d+)$`)))) return form ? 'confirmation.html' : `reservation-${m[1]}.html`;
  if (p === '/seances/nouvelle') return form ? 'tableau.html' : 'nouvelle-seance.html';
  if ((m = p.match(/^\/seances\/(\d+)$/))) return `seance-${m[1]}.html`;
  if (/^\/r\/[\w-]+$/.test(p)) return 'confirmation.html';
  return '#';
}

const banner = `<div class="demo-banner">Aperçu de démonstration : données fictives, rien n'est enregistré.
  <a href="index.html">Accueil</a> · <a href="camille-yoga.html">Page élève</a> · <a href="tableau.html">Espace prof</a> · <a href="taki.html">Taki</a></div>`;

const previewScript = `<script>
document.addEventListener('submit', (e) => {
  if (e.defaultPrevented) return;
  e.preventDefault();
  const to = e.target.getAttribute('action');
  if (to && to !== '#') location.href = to;
  else alert("Aperçu : cette action n'est pas disponible dans la démonstration.");
});
</script>`;

function staticize(htmlText) {
  return htmlText
    .replace(/(href|action)="((?:https?:\/\/[^"]*)?\/[^"]*)"/g, (all, attr, url) => {
      if (/^https?:/.test(url) && !url.startsWith(PUBLIC_BASE)) return all; // liens externes (polices…)
      return `${attr}="${mapPath(url, { form: attr === 'action' })}"`;
    })
    .replace(/<body([^>]*)>/, `<body$1>\n${banner}`)
    .replace('</body>', `${previewScript}\n</body>`);
}

const pages = {
  'index.html': home.text,
  'connexion.html': (await get('/connexion')).text,
  'inscription.html': (await get('/inscription')).text,
  [`${SLUG}.html`]: pub.text,
  'confirmation.html': confirmation.text,
  'tableau.html': dash.text,
  'profil.html': (await get('/profil', cookie)).text,
  'nouvelle-seance.html': (await get('/seances/nouvelle', cookie)).text,
  '404.html': (await get('/page-introuvable')).text,
};
for (const id of publicIds) pages[`reservation-${id}.html`] = (await get(`/${SLUG}/${id}`)).text;
for (const id of classIds) pages[`seance-${id}.html`] = (await get(`/seances/${id}`, cookie)).text;

// Planche de Taki
const poses = [['hello', 'Salut !'], ['busy', 'Je gère'], ['zen', 'Respirez'], ['party', "C'est réservé !"], ['sleepy', 'Rien de prévu'], ['oops', 'Oups']];
pages['taki.html'] = home.text
  .replace(/<title>[^<]*<\/title>/, '<title>Taki · Créneau</title>')
  .replace(/<main>[\s\S]*<\/main>/, `<main>
<h1>Voici Taki</h1>
<p class="lead">La mascotte de Créneau. Taki s'occupe de la logistique, vous de vos cours.</p>
<ul class="taki-board">${poses.map(([p, label]) => `<li>${taki(p, { size: 170 })}<span>${label}</span></li>`).join('')}</ul>
</main>`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
// La page 404 peut être servie à n'importe quelle adresse : ses liens partent de la racine du site.
const sitePath = new URL(PUBLIC_BASE).pathname.replace(/\/?$/, '/');
for (const [file, content] of Object.entries(pages)) {
  let out = staticize(content);
  if (file === '404.html') out = out.replace('<head>', `<head>\n<base href="${sitePath}">`);
  fs.writeFileSync(path.join(OUT, file), out);
}
fs.copyFileSync(path.join(root, 'public', 'style.css'), path.join(OUT, 'style.css'));
fs.writeFileSync(path.join(OUT, 'taki.svg'), (await get('/taki.svg')).text);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// Page d'entrée à la racine du dépôt : si GitHub Pages sert la racine de main
// (au lieu de docs/), elle affiche Taki et ouvre aussitôt l'aperçu.
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Créneau · Taki s'occupe du reste</title>
<meta http-equiv="refresh" content="0; url=docs/index.html">
<link rel="icon" href="docs/taki.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.bunny.net">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=bricolage-grotesque:400,700,800&display=swap">
<link rel="stylesheet" href="docs/style.css">
<style>
  .entry { min-height: 100vh; display: grid; place-content: center; justify-items: center; text-align: center; gap: 6px; padding: 24px; }
  .entry h1 { font-size: 2.6rem; margin: .2em 0 .1em; }
  .entry .lead { max-width: 420px; }
  .entry nav { flex-wrap: wrap; justify-content: center; margin-top: 18px; }
</style>
</head>
<body>
<main class="entry">
  ${taki('hello', { size: 180 })}
  <h1>Créneau</h1>
  <p class="lead">Vous donnez cours. <mark>Taki s'occupe du reste.</mark></p>
  <a class="btn big" href="docs/index.html">Ouvrir l'aperçu</a>
  <nav>
    <a href="docs/camille-yoga.html">Page élève</a>
    <a href="docs/tableau.html">Espace prof</a>
    <a href="docs/taki.html">Taki</a>
  </nav>
</main>
<script>location.replace('docs/index.html');</script>
</body>
</html>
`);

server.close();
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* base encore ouverte sous Windows : sans gravité */ }
console.log = log;
console.log(`Version statique générée dans docs/ (${Object.keys(pages).length} pages).`);
