import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const file = process.env.DB_PATH || path.join(process.cwd(), 'data', 'creneau.db');
if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });

export const db = new DatabaseSync(file);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- Une "classe" = une séance planifiée (cours de yoga du mardi 18h30, etc.)
-- starts_at est une heure locale (Europe/Paris) au format YYYY-MM-DDTHH:MM
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL,
  price_cents INTEGER,
  description TEXT NOT NULL DEFAULT '',
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS classes_teacher_start ON classes(teacher_id, starts_at);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT,
  cancelled_by TEXT
);
CREATE INDEX IF NOT EXISTS bookings_class ON bookings(class_id);

-- Boîte d'envoi : en attendant un vrai fournisseur d'email, on garde une trace.
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const BOOKED = `(SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.cancelled_at IS NULL) AS booked`;

export const q = {
  teacherById: db.prepare('SELECT * FROM teachers WHERE id = ?'),
  teacherByEmail: db.prepare('SELECT * FROM teachers WHERE email = ?'),
  teacherBySlug: db.prepare('SELECT * FROM teachers WHERE slug = ?'),
  insertTeacher: db.prepare('INSERT INTO teachers (email, password_hash, name, slug) VALUES (?, ?, ?, ?)'),
  updateTeacher: db.prepare('UPDATE teachers SET name = ?, slug = ?, bio = ? WHERE id = ?'),

  insertAuth: db.prepare('INSERT INTO auth_sessions (token, teacher_id, expires_at) VALUES (?, ?, ?)'),
  authByToken: db.prepare('SELECT * FROM auth_sessions WHERE token = ? AND expires_at > ?'),
  deleteAuth: db.prepare('DELETE FROM auth_sessions WHERE token = ?'),

  insertClass: db.prepare(`INSERT INTO classes
    (teacher_id, title, starts_at, duration_min, location, capacity, price_cents, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
  classById: db.prepare(`SELECT c.*, ${BOOKED} FROM classes c WHERE c.id = ?`),
  upcomingClasses: db.prepare(`SELECT c.*, ${BOOKED} FROM classes c
    WHERE c.teacher_id = ? AND c.starts_at >= ? ORDER BY c.starts_at LIMIT 200`),
  pastClasses: db.prepare(`SELECT c.*, ${BOOKED} FROM classes c
    WHERE c.teacher_id = ? AND c.starts_at < ? ORDER BY c.starts_at DESC LIMIT 20`),
  publicClasses: db.prepare(`SELECT c.*, ${BOOKED} FROM classes c
    WHERE c.teacher_id = ? AND c.starts_at >= ? AND c.cancelled_at IS NULL
    ORDER BY c.starts_at LIMIT 60`),
  cancelClass: db.prepare(`UPDATE classes SET cancelled_at = CURRENT_TIMESTAMP WHERE id = ?`),

  insertBooking: db.prepare('INSERT INTO bookings (class_id, name, email, token) VALUES (?, ?, ?, ?)'),
  bookingsForClass: db.prepare(`SELECT * FROM bookings WHERE class_id = ? AND cancelled_at IS NULL ORDER BY created_at`),
  bookingByToken: db.prepare('SELECT * FROM bookings WHERE token = ?'),
  bookingById: db.prepare('SELECT * FROM bookings WHERE id = ?'),
  activeBookingByEmail: db.prepare(`SELECT * FROM bookings WHERE class_id = ? AND lower(email) = lower(?) AND cancelled_at IS NULL`),
  cancelBooking: db.prepare(`UPDATE bookings SET cancelled_at = CURRENT_TIMESTAMP, cancelled_by = ? WHERE id = ?`),

  insertEmail: db.prepare('INSERT INTO emails (to_addr, subject, body) VALUES (?, ?, ?)'),
  lastEmails: db.prepare('SELECT * FROM emails ORDER BY id DESC LIMIT ?'),
};
