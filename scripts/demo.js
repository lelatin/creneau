// Crée un compte de démonstration avec quelques séances et inscrits.
// Usage : npm run demo  (puis npm start)
import { q, db } from '../src/db.js';
import { hashPassword, newToken } from '../src/auth.js';
import { todayParis, addDays } from '../src/util.js';

const EMAIL = 'demo@creneau.test';
const PASSWORD = 'demo1234';

const existing = q.teacherByEmail.get(EMAIL);
if (existing) db.prepare('DELETE FROM teachers WHERE id = ?').run(existing.id);

const { lastInsertRowid } = q.insertTeacher.run(EMAIL, hashPassword(PASSWORD), 'Camille — Yoga & Pilates', 'camille-yoga');
const id = Number(lastInsertRowid);
q.updateTeacher.run('Camille — Yoga & Pilates', 'camille-yoga',
  'Hatha, vinyasa et pilates, tous niveaux.\nCours au parc, dans un café-studio et en visio.', id);

const day = (n, time) => `${addDays(`${todayParis()}T00:00`, n).slice(0, 10)}T${time}`;
const classes = [
  ['Yoga doux', day(1, '09:00'), 60, 'Parc de la Tête d\'Or, entrée Enfants du Rhône', 12, 1200, 'Apportez votre tapis.'],
  ['Pilates', day(1, '18:30'), 50, 'Café Lotus, 12 rue des Lilas', 8, 1500, ''],
  ['Vinyasa flow', day(3, '19:00'), 75, 'En visio (le lien arrive par email)', 30, 1000, ''],
  ['Yoga doux', day(8, '09:00'), 60, 'Parc de la Tête d\'Or, entrée Enfants du Rhône', 12, 1200, 'Apportez votre tapis.'],
  ['Méditation', day(5, '08:00'), 30, 'En visio', 50, 0, ''],
];
const names = ['Léa Dubois', 'Hugo Martin', 'Chloé Bernard', 'Nina Petit', 'Sami Haddad', 'Inès Moreau', 'Paul Garnier', 'Emma Roux'];

classes.forEach(([title, start, dur, loc, cap, price, desc], i) => {
  const c = q.insertClass.run(id, title, start, dur, loc, cap, price, desc);
  const n = i === 1 ? cap : Math.min(cap, 2 + i);
  for (let k = 0; k < n; k++) {
    const name = names[(i + k) % names.length];
    q.insertBooking.run(Number(c.lastInsertRowid), name, `${name.split(' ')[0].toLowerCase()}${k}@exemple.test`, newToken());
  }
});

console.log(`Compte démo prêt : ${EMAIL} / ${PASSWORD}  →  page publique /camille-yoga`);
