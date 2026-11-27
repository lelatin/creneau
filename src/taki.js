import { html, raw } from './html.js';

// Taki, la mascotte de Créneau : une petite graine sereine, une pousse à deux
// feuilles sur la tête, dessinée d'un trait d'encre. Bras et jambes sont des
// "tubes" (un trait d'encre épais, puis un trait de couleur plus fin par-dessus),
// ce qui donne des membres pleins, dessinés au contour.
// Le léger tremblé vient d'un filtre SVG, pour garder un côté fait main.

const INK = '#1b1b18';
const LIME = '#F0FF2A';

const wobble = `<defs><filter id="taki-wobble" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
</filter></defs>`;

// Un membre : contour d'encre + intérieur citron.
const tube = (d) => `<path d="${d}" stroke="${INK}" stroke-width="12.5"/><path d="${d}" stroke="${LIME}" stroke-width="7"/>`;

const body = `
  <path d="M60 16 C79 16 87 33 87 52 C87 74 83 90 60 90 C37 90 33 74 33 52 C33 33 41 16 60 16 Z" fill="${LIME}"/>
  <path d="M60 16 C60 11 60 8 61 4"/>
  <path d="M61 7 C55 0 47 1 45 4 C50 9 56 10 61 7 Z" fill="${LIME}"/>
  <path d="M61 6 C66 -1 75 0 77 3 C72 8 66 9 61 6 Z" fill="${LIME}"/>`;

const eyes = {
  open: `<g stroke="none" fill="${INK}"><ellipse cx="52" cy="42" rx="2.4" ry="3.2"/><ellipse cx="68" cy="42" rx="2.4" ry="3.2"/></g>`,
  closed: `<path d="M48 42 Q52 46 56 42"/><path d="M64 42 Q68 46 72 42"/>`,
  happy: `<path d="M48 44 Q52 39 56 44"/><path d="M64 44 Q68 39 72 44"/>`,
  wide: `<circle cx="52" cy="41" r="4.2" fill="#fff"/><circle cx="68" cy="41" r="4.2" fill="#fff"/>
    <g stroke="none" fill="${INK}"><circle cx="52.6" cy="41.6" r="1.7"/><circle cx="68.6" cy="41.6" r="1.7"/></g>`,
};

const mouths = {
  smile: `<path d="M55 51 Q60 55 65 51"/>`,
  grin: `<path d="M53 50 Q60 51.5 67 50 Q65 58 60 58 Q55 58 53 50 Z" fill="${INK}"/>`,
  calm: `<path d="M56 52 Q60 54 64 52"/>`,
  o: `<ellipse cx="60" cy="53" rx="2.6" ry="3.4" fill="${INK}" stroke="none"/>`,
};

const standing = tube('M51 86 L49 108 L42 109') + tube('M69 86 L71 108 L78 109');

const poses = {
  // Salut ! (accueil)
  hello: {
    eyes: 'open', mouth: 'smile',
    back: standing + tube('M37 58 C29 66 27 76 29 84') + tube('M83 56 C95 48 99 36 97 24'),
    front: `<path d="M104 18 Q109 22 109 28 M100 10 Q107 11 111 16" stroke-width="2.4"/>`,
  },
  // Taki gère : bloc-notes en main (tableau de bord)
  busy: {
    eyes: 'open', mouth: 'smile',
    back: standing + tube('M37 58 C29 66 27 76 29 84'),
    front: tube('M83 58 C91 63 94 68 93 72') + `
      <g transform="rotate(8 100 72)"><rect x="88" y="58" width="24" height="30" rx="3" fill="#fff"/>
      <rect x="95" y="55" width="10" height="6" rx="2" fill="${INK}"/>
      <path d="M93 68 L107 68 M93 74 L107 74 M93 80 L102 80" stroke-width="2.2"/></g>`,
  },
  // Méditation, en tailleur (connexion, bloc "respirez")
  zen: {
    eyes: 'closed', mouth: 'calm',
    back: tube('M38 84 C24 90 28 102 46 101 L74 101 C92 102 96 90 82 84'),
    front: tube('M37 58 C27 70 27 82 35 90') + tube('M83 58 C93 70 93 82 85 90') +
      `<path d="M26 24 Q22 18 24 12 M94 24 Q98 18 96 12" stroke-width="2.2"/>`,
  },
  // Youpi ! (réservation confirmée) — bras en V
  party: {
    eyes: 'happy', mouth: 'grin',
    back: tube('M51 86 L43 108 L35 109') + tube('M69 86 L77 108 L85 109') +
      tube('M39 52 C29 40 25 28 23 16') + tube('M81 52 C91 40 95 28 97 16'),
    front: `<path d="M10 20 L15 24 M16 8 L17 14 M8 34 L14 34 M110 20 L105 24 M104 8 L103 14 M112 34 L106 34" stroke-width="2.4"/>`,
  },
  // Rien à faire... (états vides)
  sleepy: {
    eyes: 'closed', mouth: 'o',
    back: standing + tube('M37 58 C29 68 28 78 31 86') + tube('M83 58 C91 68 92 78 89 86'),
    front: `<path d="M92 22 L101 22 L92 31 L101 31" stroke-width="2.4"/><path d="M105 8 L111 8 L105 14 L111 14" stroke-width="2"/>`,
  },
  // Oups (404, cours complet)
  oops: {
    eyes: 'wide', mouth: 'o',
    back: standing + tube('M37 58 C25 54 21 44 25 34') + tube('M83 58 C95 54 99 44 95 34'),
    front: `<text x="100" y="22" font-family="inherit" font-weight="800" font-size="20" fill="${INK}" stroke="none">?</text>`,
  },
};

export function taki(pose = 'hello', { size = 120, label = 'Taki, la mascotte de Créneau', className = '' } = {}) {
  const p = poses[pose] || poses.hello;
  return html`<svg class="taki ${className}" width="${size}" height="${size}" viewBox="-4 -6 128 128" role="img" aria-label="${label}">${raw(`
  ${wobble}
  <g filter="url(#taki-wobble)" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ${p.back}
    ${body}
    ${eyes[p.eyes]}
    ${mouths[p.mouth]}
    ${p.front}
  </g>`)}</svg>`;
}

// Taki qui parle : mascotte + bulle.
export function takiSays(pose, content, { size = 84 } = {}) {
  return html`<div class="taki-says">
    ${taki(pose, { size })}
    <div class="bubble">${content}</div>
  </div>`;
}

// Favicon (tête de Taki), servi en /taki.svg
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="28 -2 64 64">
<g fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
<path d="M60 16 C79 16 87 33 87 52 C87 60 86 62 60 62 C34 62 33 60 33 52 C33 33 41 16 60 16 Z" fill="${LIME}"/>
<path d="M60 16 C60 11 60 8 61 4"/>
<path d="M61 7 C55 0 47 1 45 4 C50 9 56 10 61 7 Z" fill="${LIME}"/>
<path d="M61 6 C66 -1 75 0 77 3 C72 8 66 9 61 6 Z" fill="${LIME}"/>
<path d="M48 42 Q52 46 56 42"/><path d="M64 42 Q68 46 72 42"/></g></svg>`;
