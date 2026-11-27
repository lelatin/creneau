import { html, raw, esc } from './html.js';

// Photos annotées "à main levée" : boucles, flèches et mots manuscrits tracés
// au feutre blanc par-dessus l'image, comme une prise de note.
// Les coordonnées sont celles de la photo (en pixels) : le calque SVG utilise
// le même viewBox et le même recadrage (cover / slice) que l'image, donc les
// annotations restent collées au bon endroit quelle que soit la taille d'écran.

export const PHOTOS = {
  vallee: { w: 2000, h: 1335, alt: 'Vallée au lever du soleil, montagnes dans la brume et rivière' },
  route: { w: 1500, h: 1124, alt: 'Route sinueuse à travers des collines boisées, vue du ciel' },
  collines: { w: 2000, h: 1191, alt: 'Collines vertes ondulées avec un troupeau de moutons' },
  sommet: { w: 2000, h: 1329, alt: 'Randonneuse debout sur un rocher face à des vallées dorées' },
  peinture: { w: 2000, h: 1425, alt: 'Peinture de montagnes et de forêt au bord d\'un lac' },
  brume: { w: 2000, h: 1333, alt: 'Rivière dans une vallée de sapins couverte de brume' },
};

// Boucle ouverte qui se chevauche, comme un cercle fait à la main.
export const loop = (cx, cy, rx, ry) =>
  `<path d="M${cx - rx * 1.02} ${cy + ry * 0.15} C${cx - rx * 1.05} ${cy - ry * 1.1} ${cx + rx * 1.1} ${cy - ry * 1.08} ${cx + rx} ${cy + ry * 0.05}
  C${cx + rx * 0.92} ${cy + ry * 1.12} ${cx - rx * 0.95} ${cy + ry * 1.1} ${cx - rx * 1.08} ${cy - ry * 0.3}"/>`;

// Flèche courbe de (x1, y1) à (x2, y2), en passant près de (cx, cy).
export function arrow(x1, y1, cx, cy, x2, y2, head = 26) {
  const a = Math.atan2(y2 - cy, x2 - cx);
  const p = (d) => `${(x2 - head * Math.cos(a + d)).toFixed(1)} ${(y2 - head * Math.sin(a + d)).toFixed(1)}`;
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}"/><path d="M${p(0.45)} L${x2} ${y2} L${p(-0.45)}"/>`;
}

// Trait souligné ondulé.
export const squiggle = (x, y, w) =>
  `<path d="M${x} ${y} q${w / 8} -14 ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0"/>`;

// Mot(s) manuscrit(s). lines : tableau de lignes.
export const note = (x, y, lines, { size = 54, rotate = -4, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" transform="rotate(${rotate} ${x} ${y})">${[].concat(lines)
    .map((l, i) => `<tspan x="${x}" dy="${i ? size * 1.02 : 0}">${esc(l)}</tspan>`).join('')}</text>`;

const scribbleFilter = `<defs><filter id="scribble" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="11" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter></defs>`;

// Photo + calque d'annotations. ink : couleur du feutre.
export function photo(name, { marks = '', ink = '#fff', className = '', children = '', position = 'center' } = {}) {
  const p = PHOTOS[name];
  return html`<figure class="photo ${className}">
    <img src="/img/${name}.jpg" alt="${p.alt}" width="${p.w}" height="${p.h}" loading="lazy" style="object-position:${position}">
    ${marks ? raw(`<svg class="scribbles" viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="${position === 'center' ? 'xMidYMid' : 'xMidYMax'} slice" aria-hidden="true">
      ${scribbleFilter}
      <g filter="url(#scribble)" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        ${marks.replace(/<text /g, `<text fill="${ink}" stroke="none" `)}
      </g></svg>`) : ''}
    ${children}
  </figure>`;
}
