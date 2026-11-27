import { html, raw } from './html.js';
import { layout } from './views.js';
import { taki } from './taki.js';
import { photo, loop, arrow, note } from './scribble.js';

// Questionnaire autonome pour les gérant·e·s de lieux (disciplines physiques et mentales).
// Rempli sur téléphone (lien ou QR code), envoyé par email depuis l'app mail du lieu.
// Rien n'est stocké par Créneau : un brouillon reste dans le navigateur jusqu'à l'envoi.

// Adresse qui reçoit les réponses, en deux morceaux : elle n'apparaît pas en clair
// dans la page, ce qui gêne les robots qui ramassent les adresses pour le spam.
const MAIL_USER = 'unemployed-staff';
const MAIL_DOMAIN = 'ikmail.com';

const DISCIPLINES = ['Yoga', 'Pilates', 'Méditation', 'Sophrologie', 'Qi gong / Tai chi', 'Danse', 'Renforcement / stretching', 'Respiration', 'Massage / soins'];

// type : text | email | number | textarea | radio | checks
export const SECTIONS = [
  {
    key: 'contact', tag: 'vous', title: 'Vous et votre lieu', color: 'lime',
    intro: 'Pour savoir qui nous écrit et pouvoir vous recontacter.',
    questions: [
      { id: 'lieu', label: 'Nom du lieu', type: 'text', required: true, placeholder: 'Studio Respire' },
      { id: 'ville', label: 'Ville', type: 'text', placeholder: 'Lyon' },
      { id: 'nom', label: 'Votre prénom et nom', type: 'text', required: true },
      { id: 'contact', label: 'Email ou téléphone pour vous recontacter', type: 'text', required: true },
    ],
  },
  {
    key: 'lieu', tag: '1/5', title: 'Votre lieu aujourd\'hui', color: 'sky',
    intro: 'La taille du lieu et le volume à gérer chaque semaine.',
    questions: [
      { id: 'disciplines', label: 'Quelles disciplines proposez-vous ?', type: 'checks', options: DISCIPLINES },
      { id: 'disciplines_autres', label: 'Autres disciplines', type: 'text' },
      { id: 'cours_semaine', label: 'Combien de cours ou de séances par semaine, en moyenne ?', type: 'number' },
      { id: 'salles', label: 'Combien de salles ou d\'espaces ?', type: 'number' },
      { id: 'eleves', label: 'Combien d\'élèves différents viennent dans un mois ?', type: 'radio', options: ['Moins de 50', '50 à 150', '150 à 300', 'Plus de 300'] },
      { id: 'qui_gere', label: 'Qui s\'occupe des plannings et des réservations ?', type: 'radio', options: ['Moi', 'Une personne à l\'accueil', 'Chaque intervenant·e', 'Un peu tout le monde'] },
      { id: 'temps', label: 'Combien de temps par semaine passez-vous sur cette logistique ?', type: 'radio', options: ['Moins d\'1 h', '1 à 3 h', '3 à 6 h', 'Plus de 6 h'] },
    ],
  },
  {
    key: 'intervenants', tag: '2/5', title: 'Intervenant·e·s et créneaux', color: 'orange',
    intro: 'Qui donne cours chez vous, et comment vous travaillez ensemble.',
    questions: [
      { id: 'nb_intervenants', label: 'Combien d\'intervenant·e·s travaillent dans votre lieu ?', type: 'number' },
      { id: 'statut', label: 'Ils ou elles sont…', type: 'checks', options: ['Salarié·e·s', 'Indépendant·e·s'] },
      { id: 'types', label: 'Vous proposez…', type: 'radio', options: ['Des cours collectifs', 'Des séances individuelles', 'Les deux'] },
      { id: 'regularite', label: 'Vos cours reviennent-ils chaque semaine au même horaire ?', type: 'radio', options: ['Presque tous', 'Environ la moitié', 'Peu'] },
      { id: 'qui_cree', label: 'Qui crée et modifie les créneaux ?', type: 'radio', options: ['Moi', 'Les intervenant·e·s', 'Les deux'] },
      { id: 'finances', label: 'Comment ça se passe financièrement avec eux ?', type: 'checks', options: ['Location de salle', 'Pourcentage des recettes', 'Salaire', 'Fixe par cours', 'Autre'] },
      { id: 'coince_intervenants', label: 'Qu\'est-ce qui coince le plus avec eux aujourd\'hui ?', type: 'textarea', placeholder: 'Plannings, remplacements, comptes en fin de mois…' },
    ],
  },
  {
    key: 'resas', tag: '3/5', title: 'Réservations et paiement', color: 'forest',
    intro: 'Comment vos élèves réservent, annulent et paient.',
    questions: [
      { id: 'canaux', label: 'Comment vos élèves réservent-ils aujourd\'hui ?', type: 'checks', options: ['Téléphone / SMS', 'WhatsApp / Instagram', 'Email', 'Un logiciel ou un site', 'Sur place'] },
      { id: 'annulation', label: 'Avez-vous une règle d\'annulation (par exemple 24 h avant) ?', type: 'radio', options: ['Oui, et elle est respectée', 'Oui, mais peu respectée', 'Non'] },
      { id: 'absents', label: 'Combien d\'élèves ne viennent pas sans prévenir, sur une semaine ?', type: 'radio', options: ['Aucun', '1 à 3', '4 à 10', 'Plus de 10'] },
      { id: 'attente', label: 'Quand un cours est complet, tenez-vous une liste d\'attente ?', type: 'radio', options: ['Oui', 'Non', 'Non, mais j\'aimerais'] },
      { id: 'formules', label: 'Comment vos élèves paient-ils ?', type: 'checks', options: ['À la séance', 'Carnet de séances', 'Abonnement', 'Sur place', 'Virement', 'En ligne'] },
      { id: 'paiement_en_ligne', label: 'Le paiement en ligne serait-il indispensable pour utiliser un nouvel outil ?', type: 'radio', options: ['Oui, dès le départ', 'Plus tard', 'Non'] },
    ],
  },
  {
    key: 'outils', tag: '4/5', title: 'Vos outils et ce qui fait mal', color: 'lime',
    intro: 'Ce que vous utilisez aujourd\'hui, et ce que vous aimeriez ne plus jamais faire.',
    questions: [
      { id: 'outil', label: 'Quels outils utilisez-vous (logiciel, Excel, WhatsApp, cahier…) ?', type: 'text' },
      { id: 'outil_cout', label: 'Combien vous coûtent-ils par mois ?', type: 'text', placeholder: 'Par exemple 45 €' },
      { id: 'agace', label: 'Qu\'est-ce qui vous agace le plus dans votre organisation actuelle ?', type: 'textarea' },
      { id: 'baguette', label: 'Si une tâche pouvait disparaître demain, laquelle ?', type: 'textarea' },
    ],
  },
  {
    key: 'prix', tag: '5/5', title: 'Prix et test', color: 'sky',
    intro: 'Créneau s\'occupe des réservations, des confirmations et des places pour tout votre lieu.',
    questions: [
      { id: 'prix', label: 'Combien paieriez-vous par mois pour que ça remplace ce que vous faites aujourd\'hui ?', type: 'radio', options: ['Moins de 20 €', '20 à 40 €', '40 à 80 €', 'Plus de 80 €', 'Je ne sais pas'] },
      { id: 'trop_cher', label: 'À partir de quel prix par mois ce serait trop cher ?', type: 'text', placeholder: 'Par exemple 60 €' },
      { id: 'modele', label: 'Vous préférez…', type: 'radio', options: ['Un prix fixe par mois', 'Un prix par intervenant·e', 'Une petite part par réservation'] },
      { id: 'testeur', label: 'Seriez-vous partant pour être lieu testeur : 3 mois offerts, en échange d\'un retour toutes les deux semaines ?', type: 'radio', options: ['Oui, partant !', 'Peut-être, j\'aimerais en savoir plus', 'Non, pas pour l\'instant'] },
      { id: 'mot_libre', label: 'Un mot pour nous ?', type: 'textarea' },
    ],
  },
];

const fieldHtml = (q) => {
  const label = html`<span class="q-label">${q.label}${q.required ? html` <em>*</em>` : ''}</span>`;
  if (q.type === 'radio' || q.type === 'checks') {
    const t = q.type === 'radio' ? 'radio' : 'checkbox';
    return html`<fieldset class="q-field" data-q="${q.id}">
      <legend class="q-label">${q.label}</legend>
      <div class="chips">${q.options.map((o) => html`<label class="chip"><input type="${t}" name="${q.id}" value="${o}"><span>${o}</span></label>`)}</div>
    </fieldset>`;
  }
  if (q.type === 'textarea') {
    return html`<label class="q-field" data-q="${q.id}">${label}
      <textarea name="${q.id}" rows="3" placeholder="${q.placeholder || ''}"></textarea></label>`;
  }
  return html`<label class="q-field" data-q="${q.id}">${label}
    <input type="${q.type === 'number' ? 'number' : 'text'}" name="${q.id}"${q.type === 'number' ? html` inputmode="numeric" min="0"` : ''}
      placeholder="${q.placeholder || ''}"${q.required ? html` required` : ''}></label>`;
};

export function questionnaire() {
  // Libellés envoyés au script pour rédiger l'email (id → question).
  const labels = Object.fromEntries(SECTIONS.flatMap((s) => s.questions.map((q) => [q.id, q.label])));
  const order = SECTIONS.map((s) => ({ title: s.title, ids: s.questions.map((q) => q.id) }));
  return layout({
    title: 'Questionnaire pour les lieux', publicPage: true,
    body: html`
    <header class="q-top"><a href="/" class="logo">${taki('hello', { size: 30, label: '' })}<span>Créneau</span></a><span class="tag">[questionnaire lieux]</span></header>

    ${photo('sommet', {
      className: 'q-hero bleed', eager: true,
      marks: loop(1332, 872, 48, 74) + arrow(1560, 690, 1420, 700, 1372, 800) +
        note(1490, 610, ['vous, sans la', 'logistique'], { size: 60, rotate: -4 }),
      children: html`<div class="q-hero-copy">
        <p class="tag light">[10 minutes · une trentaine de questions · aucun compte]</p>
        <h1 class="display light">Parlez-nous<br>de votre lieu.</h1>
      </div>`,
    })}

    <section class="q-intro">
      <div class="intro-taki">${taki('busy', { size: 150 })}</div>
      <div>
        <p class="tag">[salut, moi c'est Taki]</p>
        <h2 class="display-m">Aidez-nous à construire l'outil de votre lieu.</h2>
        <p class="lead">Créneau gère les réservations des cours de yoga, pilates, méditation et autres disciplines.
          Vos réponses nous disent ce qui compte vraiment pour un lieu comme le vôtre.
          Répondez à ce que vous voulez : seules les 3 questions marquées d'une étoile sont obligatoires.</p>
      </div>
    </section>

    <div class="q-progress" aria-hidden="true"><span></span><em>0 %</em></div>

    <form id="q-form" class="q-form" novalidate data-u="${MAIL_USER}" data-d="${MAIL_DOMAIN}">
      ${SECTIONS.map((s) => html`
        <section class="q-section">
          <div class="q-head">
            <span class="q-num ${s.color}">${s.tag}</span>
            <div><h2 class="display-m">${s.title}</h2><p class="muted">${s.intro}</p></div>
          </div>
          <div class="q-fields">${s.questions.map(fieldHtml)}</div>
        </section>`)}

      <section class="q-send">
        ${taki('party', { size: 130 })}
        <h2 class="display-m">C'est tout bon ?</h2>
        <p>Le bouton ouvre votre messagerie avec vos réponses déjà rédigées : il ne reste qu'à appuyer sur « Envoyer ».</p>
        <p class="error" id="q-error" role="alert" hidden></p>
        <button class="btn big lime" type="submit">Envoyer mes réponses</button>
        <div class="q-alt">
          <button class="btn small ghost" type="button" id="q-copy">Copier mes réponses</button>
          <button class="btn small ghost" type="button" id="q-download">Télécharger (.txt)</button>
        </div>
        <p class="muted small">Votre messagerie ne s'ouvre pas ? Copiez vos réponses et envoyez-les à l'adresse affichée ici :
          <strong id="q-mail">[cliquez sur « Envoyer » pour l'afficher]</strong>.
          Vos réponses restent sur votre téléphone jusqu'à l'envoi.</p>
      </section>
    </form>

    <div class="q-thanks" id="q-thanks" hidden>
      ${taki('party', { size: 170 })}
      <h2 class="display">Merci !</h2>
      <p class="lead">Si votre messagerie s'est ouverte, appuyez sur « Envoyer ». On revient vers vous très vite.</p>
      <button class="btn ghost" type="button" id="q-back">Revenir à mes réponses</button>
    </div>

    <script>
    ${raw(`(() => {
      const LABELS = ${JSON.stringify(labels).replace(/</g, '\\u003c')};
      const ORDER = ${JSON.stringify(order).replace(/</g, '\\u003c')};
      const form = document.getElementById('q-form');
      const KEY = 'creneau-questionnaire-v1';
      const mail = () => form.dataset.u + '@' + form.dataset.d;

      const values = () => {
        const out = {};
        for (const el of form.elements) {
          if (!el.name) continue;
          if (el.type === 'radio' || el.type === 'checkbox') {
            if (!el.checked) continue;
            (out[el.name] ||= []).push(el.value);
          } else if (el.value.trim()) out[el.name] = el.value.trim();
        }
        return out;
      };

      // Brouillon conservé dans le navigateur
      const save = () => { try { localStorage.setItem(KEY, JSON.stringify(values())); } catch {} progress(); };
      const restore = () => {
        let v = {}; try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
        for (const el of form.elements) {
          if (!el.name || !(el.name in v)) continue;
          if (el.type === 'radio' || el.type === 'checkbox') el.checked = [].concat(v[el.name]).includes(el.value);
          else el.value = v[el.name];
        }
      };
      const total = Object.keys(LABELS).length;
      const bar = document.querySelector('.q-progress');
      const progress = () => {
        const n = Object.keys(values()).length, pct = Math.round(100 * n / total);
        bar.querySelector('span').style.width = pct + '%';
        bar.querySelector('em').textContent = pct + ' %';
      };

      const asText = () => {
        const v = values();
        const lines = ['Questionnaire Créneau — ' + (v.lieu || 'lieu'), ''];
        // Seules les questions répondues : un lien mailto trop long est coupé par certaines messageries.
        for (const s of ORDER) {
          const done = s.ids.filter((id) => v[id]);
          if (!done.length) continue;
          lines.push('== ' + s.title.toUpperCase() + ' ==');
          for (const id of done) lines.push('- ' + LABELS[id] + '\\n  ' + [].concat(v[id]).join(', '));
          lines.push('');
        }
        return lines.join('\\n');
      };

      const missing = () => ['lieu', 'nom', 'contact'].filter((id) => !values()[id]);
      const showError = (msg) => { const e = document.getElementById('q-error'); e.textContent = msg; e.hidden = !msg; };

      form.addEventListener('input', save);
      form.addEventListener('change', save);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const m = missing();
        if (m.length) {
          showError('Il manque : ' + m.map((id) => LABELS[id].toLowerCase()).join(', ') + '.');
          form.querySelector('[name="' + m[0] + '"]').focus();
          return;
        }
        showError('');
        document.getElementById('q-mail').textContent = mail();
        const subject = 'Questionnaire Créneau — ' + values().lieu;
        location.href = 'mailto:' + mail() + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(asText());
        form.hidden = true; bar.hidden = true;
        document.getElementById('q-thanks').hidden = false;
        window.scrollTo({ top: document.getElementById('q-thanks').offsetTop - 20, behavior: 'smooth' });
      });
      document.getElementById('q-back').addEventListener('click', () => {
        form.hidden = false; bar.hidden = false; document.getElementById('q-thanks').hidden = true;
      });
      document.getElementById('q-copy').addEventListener('click', async (e) => {
        document.getElementById('q-mail').textContent = mail();
        try { await navigator.clipboard.writeText(asText()); e.target.textContent = 'Copié !'; }
        catch { e.target.textContent = 'Copie impossible'; }
        setTimeout(() => e.target.textContent = 'Copier mes réponses', 1800);
      });
      document.getElementById('q-download').addEventListener('click', () => {
        document.getElementById('q-mail').textContent = mail();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([asText()], { type: 'text/plain;charset=utf-8' }));
        a.download = 'questionnaire-creneau-' + (values().lieu || 'lieu').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt';
        a.click();
      });
      restore(); progress();
    })();`)}
    </script>`,
  });
}
