import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
const { createServer } = await import('../src/server.js');
const { q } = await import('../src/db.js');
const { todayParis, addDays } = await import('../src/util.js');

let server, base;
before(() => new Promise((ok) => { server = createServer().listen(0, () => { base = `http://localhost:${server.address().port}`; ok(); }); }));
after(() => server.close());

let cookie = '';
async function call(path, { method = 'GET', form } = {}) {
  const res = await fetch(base + path, {
    method, redirect: 'manual',
    headers: { cookie, ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return { status: res.status, location: res.headers.get('location'), text: await res.text() };
}

const tomorrow = addDays(`${todayParis()}T00:00`, 1).slice(0, 10);

test('parcours complet : inscription prof → séance → réservation élève → annulation', async () => {
  let r = await call('/inscription', { method: 'POST', form: { name: 'Camille Écho', email: 'c@ex.test', password: 'motdepasse' } });
  assert.equal(r.status, 303);
  assert.match(r.location, /^\/tableau/);

  r = await call('/tableau');
  assert.match(r.text, /Aucune séance à venir/);
  assert.match(r.text, /\/camille-echo/);

  r = await call('/seances/nouvelle', { method: 'POST', form: {
    title: 'Yoga <doux>', date: tomorrow, time: '09:00', duration_min: '60', capacity: '2',
    location: 'Parc', price: '12,50', description: '', repeat: '4',
  } });
  assert.equal(r.status, 303);

  r = await call('/tableau');
  assert.equal((r.text.match(/Yoga &lt;doux&gt;/g) || []).length, 4, 'séance répétée 4 fois et échappée');
  assert.ok(!r.text.includes('Yoga <doux>'));

  // Élève : pas de cookie
  cookie = '';
  r = await call('/camille-echo');
  assert.match(r.text, /12,50 €/);
  const id = r.text.match(/href="\/camille-echo\/(\d+)"/)[1];

  r = await call(`/camille-echo/${id}`, { method: 'POST', form: { name: 'Léa', email: 'lea@ex.test' } });
  assert.equal(r.status, 303);
  const token = r.location.match(/\/r\/([\w-]+)/)[1];

  r = await call(`/r/${token}?ok`);
  assert.match(r.text, /C'est réservé/);

  // Même email → pas de doublon
  r = await call(`/camille-echo/${id}`, { method: 'POST', form: { name: 'Léa', email: 'LEA@ex.test' } });
  assert.equal(r.location, `/r/${token}`);

  r = await call(`/camille-echo/${id}`, { method: 'POST', form: { name: 'Hugo', email: 'hugo@ex.test' } });
  assert.equal(r.status, 303);
  r = await call(`/camille-echo/${id}`, { method: 'POST', form: { name: 'Zoé', email: 'zoe@ex.test' } });
  assert.equal(r.status, 400, 'complet → refus');
  assert.match(r.text, /complet/);
  assert.equal(q.bookingsForClass.all(Number(id)).length, 2);

  r = await call(`/r/${token}/agenda.ics`);
  assert.match(r.text, /BEGIN:VEVENT/);

  r = await call(`/r/${token}/annuler`, { method: 'POST', form: {} });
  assert.equal(r.status, 303);
  assert.equal(q.bookingsForClass.all(Number(id)).length, 1);

  const emails = q.lastEmails.all(10).map((e) => e.subject);
  assert.ok(emails.some((s) => s.startsWith('Réservé')));
  assert.ok(emails.some((s) => s.startsWith('Désinscription')));
});

test('un formulaire venant d\'un autre site est refusé', async () => {
  const res = await fetch(`${base}/connexion`, {
    method: 'POST', headers: { origin: 'https://pirate.example', 'content-type': 'application/x-www-form-urlencoded' },
    body: 'email=a&password=b',
  });
  assert.equal(res.status, 403);
});

test('les pages prof sont protégées', async () => {
  cookie = '';
  const r = await call('/tableau');
  assert.equal(r.location, '/connexion');
});
