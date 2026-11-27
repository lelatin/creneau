// Générateur de QR code minimal, sans dépendance (norme ISO/IEC 18004).
// Mode octets, versions 1 à 10, masque fixe. Adapté de l'algorithme de référence
// de Project Nayuki (licence MIT). Usage : qrMatrix(texte, 'M') → tableau de lignes de booléens.

const ECC = { L: 1, M: 0, Q: 3, H: 2 }; // bits de format
const ECC_PER_BLOCK = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};
const NUM_BLOCKS = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
};

const rawModules = (v) => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (v >= 7) r -= 36;
  }
  return r;
};
const dataCodewords = (v, ecl) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[ecl][v] * NUM_BLOCKS[ecl][v];

// Corps de Galois GF(2^8), polynôme 0x11D
const gfMul = (x, y) => {
  let z = 0;
  for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
  return z & 0xff;
};
export const rsDivisor = (degree) => {
  const r = new Array(degree - 1).fill(0).concat([1]);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
    root = gfMul(root, 0x02);
  }
  return r;
};
export const rsRemainder = (data, divisor) => {
  const r = divisor.map(() => 0);
  for (const b of data) {
    const f = b ^ r.shift();
    r.push(0);
    divisor.forEach((c, i) => { r[i] ^= gfMul(c, f); });
  }
  return r;
};

const alignPositions = (v) => {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, size = v * 4 + 17;
  const step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const res = [6];
  for (let pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
  return res;
};

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
];

export const formatBits = (ecl, mask) => {
  const data = (ECC[ecl] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
};

// Positions des 15 bits de format (première copie), dans l'ordre des bits 0..14 : [x, y]
export const formatPositions = () => {
  const p = [];
  for (let i = 0; i <= 5; i++) p.push([8, i]);
  p.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) p.push([14 - i, 8]);
  return p;
};

export function qrEncode(text, ecl = 'M', mask = 2) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  while (v <= 10 && 4 + 8 + bytes.length * 8 > dataCodewords(v, ecl) * 8) v++;
  if (v > 10) throw new Error('Texte trop long pour ce générateur');
  const size = v * 4 + 17, cap = dataCodewords(v, ecl);

  // Flux de bits : mode octets (0100), longueur sur 8 bits, données, terminateur, bourrage
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < cap * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  // Correction d'erreurs Reed-Solomon par blocs, puis entrelacement
  const nb = NUM_BLOCKS[ecl][v], eccLen = ECC_PER_BLOCK[ecl][v], raw = Math.floor(rawModules(v) / 8);
  const nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen);
  const blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < nShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const codewords = [];
  for (let i = 0; i < blocks[0].length; i++)
    blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) codewords.push(b[i]); });

  // Matrice et motifs fixes
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]])
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  const al = alignPositions(v), last = al.length - 1;
  al.forEach((ax, i) => al.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  // Bits de format (deux copies) + module sombre
  const fb = formatBits(ecl, mask), bit = (i) => ((fb >>> i) & 1) === 1;
  formatPositions().forEach(([x, y], i) => set(x, y, bit(i)));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
  if (v >= 7) throw new Error('Versions 7+ non prises en charge (bloc de version)');

  // Placement en zigzag des données, puis masque
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x] && i < codewords.length * 8) { m[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[mask](x, y)) m[y][x] = !m[y][x];
  return { matrix: m, version: v, size, ecl, mask, functionModules: fn, codewords, blocks: { nb, eccLen, nShort, shortLen } };
}

// Relecture indépendante : format, démasquage, désentrelacement, vérification Reed-Solomon, décodage.
export function qrDecodeCheck(q) {
  const { matrix: m, size, functionModules: fn, blocks: { nb, eccLen, nShort, shortLen } } = q;
  let fbRead = 0;
  formatPositions().forEach(([x, y], i) => { if (m[y][x]) fbRead |= 1 << i; });
  const fmt = (fbRead ^ 0x5412) >>> 10, mask = fmt & 7, eclBits = fmt >>> 3;
  if (formatBits(q.ecl, q.mask) !== fbRead) throw new Error('Bits de format illisibles');
  const um = m.map((row, y) => row.map((d, x) => (!fn[y][x] && MASKS[mask](x, y) ? !d : d)));
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fn[y][x]) bits.push(um[y][x] ? 1 : 0);
    }
  }
  const cw = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  // Désentrelacement
  const bl = Array.from({ length: nb }, (_, j) => []);
  let k = 0;
  for (let i = 0; i < shortLen + 1; i++) for (let j = 0; j < nb; j++) {
    if (i === shortLen - eccLen && j < nShort) continue; // octet de bourrage des blocs courts, non transmis
    bl[j].push(cw[k++]);
  }
  const div = rsDivisor(eccLen), data = [];
  bl.forEach((b) => {
    const d = b.slice(0, b.length - eccLen), e = b.slice(b.length - eccLen);
    const re = rsRemainder(d, div);
    if (re.some((x, i) => x !== e[i])) throw new Error('Contrôle Reed-Solomon en échec');
    data.push(...d);
  });
  const dbits = data.flatMap((b) => [7, 6, 5, 4, 3, 2, 1, 0].map((s) => (b >>> s) & 1));
  const read = (from, len) => parseInt(dbits.slice(from, from + len).join(''), 2);
  if (read(0, 4) !== 0b0100) throw new Error('Mode inattendu');
  const len = read(4, 8), out = [];
  for (let i = 0; i < len; i++) out.push(read(12 + 8 * i, 8));
  return { text: new TextDecoder().decode(new Uint8Array(out)), mask, eclBits };
}

// SVG noir sur blanc, avec la zone de silence réglementaire de 4 modules.
export function qrSvg(text, { ecl = 'M', module = 10, dark = '#111110', light = '#ffffff' } = {}) {
  const { matrix, size } = qrEncode(text, ecl);
  const q = 4, total = (size + 2 * q) * module;
  let d = '';
  matrix.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${(x + q) * module} ${(y + q) * module}h${module}v${module}h-${module}z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
