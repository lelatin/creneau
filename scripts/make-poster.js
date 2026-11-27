// Fabrique l'affiche du questionnaire (PNG 1080×1350) et le QR code seul (SVG).
// Usage : node scripts/make-poster.js   (outil local : il faut Microsoft Edge installé)
//
// L'affiche est composée en HTML (polices, Taki, QR code), puis Edge en mode sans
// fenêtre en fait une capture. Les fichiers vont dans public/img/ et sont publiés avec le site.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { qrSvg, qrEncode, qrDecodeCheck } from './qr.js';
import { taki } from '../src/taki.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_QUESTIONNAIRE = process.env.QUESTIONNAIRE_URL || 'https://lelatin.github.io/creneau/questionnaire.html';
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Vérifie que le QR code relu redonne exactement l'adresse
const check = qrDecodeCheck(qrEncode(URL_QUESTIONNAIRE, 'M'));
if (check.text !== URL_QUESTIONNAIRE) throw new Error('QR code incohérent');

const img = path.join(root, 'public', 'img');
fs.writeFileSync(path.join(img, 'qr-questionnaire.svg'), qrSvg(URL_QUESTIONNAIRE, { module: 20 }));

const qr = qrSvg(URL_QUESTIONNAIRE, { module: 12 }).replace('<svg ', '<svg class="qr" ');
const shortUrl = URL_QUESTIONNAIRE.replace(/^https:\/\//, '');

const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=anton:400|instrument-sans:400,600|dm-mono:400,500|caveat:700&display=block">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1080px; height: 1350px; overflow: hidden; }
  body { background: #f0ff2a; color: #111110; font-family: "Instrument Sans", sans-serif; position: relative; padding: 70px 80px; }
  .tag { font-family: "DM Mono", monospace; font-size: 26px; }
  h1 { font-family: Anton, Impact, sans-serif; font-weight: 400; text-transform: uppercase; font-size: 148px; line-height: .9; margin: 26px 0 22px; letter-spacing: .005em; }
  .sub { font-size: 34px; line-height: 1.25; max-width: 760px; }
  .card { position: absolute; left: 110px; top: 640px; background: #fff; border: 5px solid #111110; border-radius: 34px;
          padding: 18px; transform: rotate(-3deg); box-shadow: 16px 16px 0 #ff5b23; }
  .qr { display: block; width: 470px; height: 470px; }
  .note { position: absolute; left: 640px; top: 690px; font-family: Caveat, cursive; font-weight: 700; font-size: 70px; line-height: .95; transform: rotate(-6deg); }
  .arrow { position: absolute; left: 600px; top: 840px; width: 170px; height: 150px; }
  .taki { position: absolute; right: 60px; bottom: 120px; }
  .sun { position: absolute; right: 70px; top: 470px; width: 190px; height: 190px; display: grid; place-items: center; text-align: center;
         background: #ff5b23; color: #fff; font-family: Caveat, cursive; font-weight: 700; font-size: 44px; line-height: .95; transform: rotate(12deg);
         clip-path: polygon(50% 0, 61% 12%, 75% 4%, 79% 19%, 95% 21%, 90% 36%, 100% 50%, 90% 64%, 95% 79%, 79% 81%, 75% 96%, 61% 88%, 50% 100%, 39% 88%, 25% 96%, 21% 81%, 5% 79%, 10% 64%, 0 50%, 10% 36%, 5% 21%, 21% 19%, 25% 4%, 39% 12%); }
  .foot { position: absolute; left: 80px; right: 80px; bottom: 56px; display: flex; justify-content: space-between; align-items: baseline;
          border-top: 4px solid #111110; padding-top: 18px; }
  .brand { font-family: Anton, Impact, sans-serif; font-size: 44px; text-transform: uppercase; }
  .url { font-family: "DM Mono", monospace; font-size: 24px; }
</style></head><body>
  <p class="tag">[créneau · pour les lieux de yoga, pilates, méditation…]</p>
  <h1>Parlez-nous<br>de votre lieu.</h1>
  <p class="sub">10 minutes pour nous aider à construire l'outil qui gère les réservations de votre lieu. Aucun compte à créer.</p>
  <div class="sun"><span>10<br>minutes</span></div>
  <div class="card">${qr}</div>
  <p class="note">scannez-<br>moi !</p>
  <svg class="arrow" viewBox="0 0 170 150" fill="none" stroke="#111110" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M150 10 C140 80 90 120 20 128"/><path d="M48 104 L20 128 L52 146"/></svg>
  ${String(taki('busy', { size: 300, label: '' }))}
  <div class="foot"><span class="brand">Créneau</span><span class="url">${shortUrl}</span></div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'creneau-affiche-'));
const htmlFile = path.join(tmp, 'affiche.html');
fs.writeFileSync(htmlFile, page);
const out = path.join(img, 'affiche-questionnaire.png');
fs.rmSync(out, { force: true });
// Profil temporaire séparé : sinon Edge se rattache à une fenêtre déjà ouverte et ne capture rien.
execFileSync(EDGE, ['--headless=new', `--user-data-dir=${path.join(tmp, 'profil')}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=1080,1350', '--virtual-time-budget=8000', `--screenshot=${out}`, pathToFileURL(htmlFile).href], { stdio: 'ignore', timeout: 60000 });
// Edge peut rendre la main avant d'avoir fini d'écrire la capture : on l'attend un peu.
for (let i = 0; i < 40 && !fs.existsSync(out); i++) await new Promise((r) => setTimeout(r, 250));
if (!fs.existsSync(out)) throw new Error("Edge n'a pas produit l'affiche");
console.log(`QR code vérifié (${URL_QUESTIONNAIRE}) → public/img/qr-questionnaire.svg`);
console.log('Affiche → public/img/affiche-questionnaire.png');
