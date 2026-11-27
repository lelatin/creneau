// Fabrique l'affiche du questionnaire (PNG 1080×1920, format story) et le QR code seul (SVG).
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

const qr = qrSvg(URL_QUESTIONNAIRE, { module: 12, light: '#fdf8ea' }).replace('<svg ', '<svg class="qr" ');
const shortUrl = URL_QUESTIONNAIRE.replace(/^https:\/\//, '');
const BG = pathToFileURL(path.join(img, 'collines.jpg')).href; // photo de fond

const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=anton:400|instrument-sans:500,600,700|dm-mono:400,500&display=block">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; }
  body {
    font-family: "Instrument Sans", sans-serif; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center;
    /* fond : une photo de nature du site (les collines), assombrie pour faire ressortir la carte */
    background:
      linear-gradient(180deg, rgba(8, 26, 14, .55), rgba(8, 26, 14, .25) 45%, rgba(8, 26, 14, .7)),
      url("${BG}") center 70% / cover no-repeat, #10301e;
  }
  .brand { display: flex; align-items: center; gap: 14px; font-family: Anton, Impact, sans-serif; font-size: 66px; text-transform: uppercase; letter-spacing: .01em; }
  .brand b { color: #f0ff2a; font-weight: 400; }
  .baseline { font-weight: 600; font-size: 25px; opacity: .85; margin: 6px 0 46px; }
  .card { position: relative; width: 600px; background: #fdf8ea; color: #111110; border: 5px solid #111110; border-radius: 40px;
          padding: 56px 50px 44px; text-align: center; transform: rotate(-1.5deg); box-shadow: 14px 14px 0 #071a10; }
  .qr { display: block; width: 390px; height: 390px; margin: 0 auto; }
  .sticker { position: absolute; right: -26px; top: -30px; background: #ff5b23; color: #111110; border: 5px solid #111110; border-radius: 999px;
             padding: 10px 24px; font-weight: 700; font-size: 30px; transform: rotate(5deg); box-shadow: 6px 6px 0 #111110; }
  h1 { font-family: Anton, Impact, sans-serif; font-weight: 400; font-size: 62px; line-height: 1; text-transform: uppercase; margin: 26px 0 14px; }
  .meta { font-weight: 600; font-size: 28px; }
  .meta2 { font-weight: 500; font-size: 24px; color: #5f6157; margin-top: 8px; font-family: "DM Mono", monospace; }
  .tagline { margin-top: 64px; background: #f0ff2a; color: #111110; font-weight: 700; font-size: 44px; padding: 10px 22px 12px; border-radius: 10px; transform: rotate(-1deg); }
  .url { margin-top: 26px; font-weight: 600; font-size: 26px; opacity: .85; }
</style></head><body>
  <div class="brand">${String(taki('hello', { size: 74, label: '' }))}<span>Cré<b>neau</b></span></div>
  <p class="baseline">Réservation de cours · pour les lieux et les profs</p>
  <div class="card">
    <span class="sticker">Scannez-moi ✦</span>
    ${qr}
    <h1>Parlez-nous<br>de votre lieu</h1>
    <p class="meta">Questionnaire · 10 minutes</p>
    <p class="meta2">[yoga · pilates · méditation…]</p>
  </div>
  <p class="tagline">Taki s'occupe du reste.</p>
  <p class="url">${shortUrl}</p>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'creneau-affiche-'));
const htmlFile = path.join(tmp, 'affiche.html');
fs.writeFileSync(htmlFile, page);
const out = path.join(img, 'affiche-questionnaire.png');
fs.rmSync(out, { force: true });
// Profil temporaire séparé : sinon Edge se rattache à une fenêtre déjà ouverte et ne capture rien.
execFileSync(EDGE, ['--headless=new', `--user-data-dir=${path.join(tmp, 'profil')}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--window-size=1080,1920', '--virtual-time-budget=8000', `--screenshot=${out}`, pathToFileURL(htmlFile).href], { stdio: 'ignore', timeout: 60000 });
// Edge peut rendre la main avant d'avoir fini d'écrire la capture : on l'attend un peu.
for (let i = 0; i < 40 && !fs.existsSync(out); i++) await new Promise((r) => setTimeout(r, 250));
if (!fs.existsSync(out)) throw new Error("Edge n'a pas produit l'affiche");
console.log(`QR code vérifié (${URL_QUESTIONNAIRE}) → public/img/qr-questionnaire.svg`);
console.log('Affiche → public/img/affiche-questionnaire.png');
