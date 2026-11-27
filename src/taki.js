import { html, raw } from './html.js';

// Taki, la mascotte de Créneau : une petite boule citron vert dessinée au feutre.
// Le trait "tremblé" vient d'un filtre SVG (turbulence + déplacement) pour garder
// un côté fait main, un peu brut.

const INK = '#141414';
const LIME = '#F0FF2A';

// Filtre partagé. Plusieurs SVG peuvent le redéclarer : le navigateur garde le premier.
const wobble = `<defs><filter id="taki-wobble" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
</filter></defs>`;

const body = `
  <path d="M60 22 C85 19 101 37 100 62 C101 87 84 103 59 102 C34 103 19 86 20 61 C19 36 36 23 60 22 Z" fill="${LIME}"/>
  <path d="M60 22 C59 15 60 11 63 7"/>
  <path d="M63 8 C69 1 79 2 82 6 C76 11 68 12 63 8 Z" fill="${LIME}"/>`;

const cheeks = `<g stroke="none" fill="#FFB49A" opacity=".7"><ellipse cx="38" cy="68" rx="6" ry="3.5"/><ellipse cx="82" cy="68" rx="6" ry="3.5"/></g>`;

const eyes = {
  open: `<g stroke="none" fill="${INK}"><ellipse cx="47" cy="55" rx="3.6" ry="5.2"/><ellipse cx="73" cy="55" rx="3.6" ry="5.2"/></g>`,
  closed: `<path d="M42 56 Q47 60 52 56"/><path d="M68 56 Q73 60 78 56"/>`,
  happy: `<path d="M42 57 Q47 50 52 57"/><path d="M68 57 Q73 50 78 57"/>`,
  wide: `<circle cx="47" cy="54" r="5.5" fill="#fff"/><circle cx="73" cy="54" r="5.5" fill="#fff"/>
    <g stroke="none" fill="${INK}"><circle cx="48" cy="55" r="2.2"/><circle cx="74" cy="55" r="2.2"/></g>`,
};

const mouths = {
  smile: `<path d="M50 70 Q60 79 70 70"/>`,
  grin: `<path d="M48 68 Q60 70 72 68 Q68 82 60 82 Q52 82 48 68 Z" fill="${INK}"/>`,
  calm: `<path d="M54 72 Q60 75 66 72"/>`,
  o: `<ellipse cx="60" cy="74" rx="4" ry="5" fill="${INK}" stroke="none"/>`,
};

const legs = {
  stand: `<path d="M49 101 L47 113 L41 114"/><path d="M71 101 L73 113 L79 114"/>`,
  crossed: `<path d="M34 96 Q48 112 62 104 Q74 112 86 96"/>`,
};

const poses = {
  // Salut ! (accueil)
  hello: {
    eyes: 'open', mouth: 'grin', legs: 'stand',
    extra: `<path d="M22 66 Q12 72 10 84"/>
      <path d="M98 58 Q110 48 108 32"/><path d="M104 31 L106 25 M109 30 L112 25 M112 34 L117 31"/>
      <path d="M114 44 Q119 48 118 54" stroke-width="2.5"/><path d="M110 18 Q116 20 119 26" stroke-width="2.5"/>`,
  },
  // Taki gère : bloc-notes sous le bras (tableau de bord)
  busy: {
    eyes: 'open', mouth: 'smile', legs: 'stand',
    extra: `<path d="M22 66 Q12 74 16 86"/>
      <g transform="rotate(10 104 76)"><rect x="92" y="60" width="24" height="30" rx="3" fill="#fff"/>
      <rect x="99" y="57" width="10" height="6" rx="2" fill="${INK}"/>
      <path d="M97 70 L111 70 M97 76 L111 76 M97 82 L106 82" stroke-width="2.5"/></g>
      <path d="M99 64 Q94 72 96 80"/>`,
  },
  // Zen, en tailleur (connexion, attente)
  zen: {
    eyes: 'closed', mouth: 'calm', legs: 'crossed',
    extra: `<path d="M22 70 Q14 80 24 88"/><path d="M98 70 Q106 80 96 88"/>
      <path d="M36 28 Q30 22 32 14 M86 28 Q92 22 90 14" stroke-width="2.5"/>`,
  },
  // Youpi ! (réservation confirmée)
  party: {
    eyes: 'happy', mouth: 'grin', legs: 'stand',
    extra: `<path d="M24 58 Q12 46 14 30"/><path d="M96 58 Q108 46 106 30"/>
      <path d="M8 22 L12 26 M18 14 L18 20 M6 36 L12 36 M112 22 L108 26 M102 14 L102 20 M114 36 L108 36" stroke-width="2.5"/>`,
  },
  // Rien à faire... (états vides)
  sleepy: {
    eyes: 'closed', mouth: 'o', legs: 'stand',
    extra: `<path d="M22 68 Q14 78 20 88"/><path d="M98 68 Q106 78 100 88"/>
      <path d="M92 24 L102 24 L92 34 L102 34" stroke-width="2.5"/><path d="M106 8 L113 8 L106 15 L113 15" stroke-width="2"/>`,
  },
  // Oups (404)
  oops: {
    eyes: 'wide', mouth: 'o', legs: 'stand',
    extra: `<path d="M22 62 Q8 58 10 44"/><path d="M98 62 Q112 58 110 44"/>
      <text x="96" y="22" font-family="inherit" font-weight="800" font-size="22" fill="${INK}" stroke="none">?</text>`,
  },
};

export function taki(pose = 'hello', { size = 120, label = 'Taki, la mascotte de Créneau', className = '' } = {}) {
  const p = poses[pose] || poses.hello;
  return html`<svg class="taki ${className}" width="${size}" height="${size}" viewBox="-4 -6 128 128" role="img" aria-label="${label}">${raw(`
  ${wobble}
  <g filter="url(#taki-wobble)" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    ${legs[p.legs]}
    ${body}
    ${cheeks}
    ${eyes[p.eyes]}
    ${mouths[p.mouth]}
    ${p.extra}
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
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 0 92 92">
<g fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
<path d="M60 22 C85 19 101 37 100 62 C101 87 84 90 59 89 C34 90 19 86 20 61 C19 36 36 23 60 22 Z" fill="${LIME}"/>
<path d="M60 22 C59 15 60 11 63 7"/><path d="M63 8 C69 1 79 2 82 6 C76 11 68 12 63 8 Z" fill="${LIME}"/>
<g stroke="none" fill="${INK}"><ellipse cx="47" cy="55" rx="4" ry="6"/><ellipse cx="73" cy="55" rx="4" ry="6"/></g>
<path d="M50 70 Q60 79 70 70"/></g></svg>`;
