import { q } from './db.js';

// Pour l'instant les emails sont écrits dans la console et gardés en base.
// Brancher ici un fournisseur (Brevo, Postmark, SMTP…) le moment venu.
export function sendEmail({ to, subject, text }) {
  q.insertEmail.run(to, subject, text);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`\n✉️  À : ${to}\n   Objet : ${subject}\n   ${text.replace(/\n/g, '\n   ')}\n`);
  }
}
