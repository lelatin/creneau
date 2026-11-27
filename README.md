# Créneau

**La réservation de cours la plus simple possible, pour les profs de yoga, de pilates et les coachs indépendants.**

Le prof crée ses séances et partage **un seul lien**. Les élèves réservent avec leur nom et leur email, **sans créer de compte**.

> Statut : MVP (prototype fonctionnel) pour tester l'idée avec de vrais profs.

## Ce que fait la v0.1

**Côté prof**
- Création de compte en 3 champs, page publique créée automatiquement (`/votre-nom`)
- Créer une séance : nom, date, heure, durée, lieu (parc, salle, visio…), nombre de places, prix affiché
- Répéter une séance chaque semaine (2, 4, 8 ou 12 fois), dupliquer une séance
- Voir les inscrits, copier leurs emails, retirer quelqu'un
- Annuler une séance : tous les inscrits sont prévenus par email
- Lien de réservation à copier en un clic (Instagram, WhatsApp, site…)

**Côté élève**
- Page claire avec les cours à venir et les places restantes
- Réservation en 2 champs, sans compte ni mot de passe
- Page « Ma réservation » avec ajout à l'agenda (.ics) et annulation en un clic
- Pas de double réservation, cours complet bloqué

**Pas encore là (volontairement)** : paiement en ligne, carnets de séances, liste d'attente, rappels automatiques, envoi réel des emails (ils s'affichent pour l'instant dans la console).

## Identité visuelle

Éditoriale, calme et un brin malicieuse : fond papier, grands titres en serif fin (Instrument Serif),
petites étiquettes façon machine à écrire [entre crochets] (DM Mono), texte en Instrument Sans,
listes séparées par des filets, papiers colorés posés de travers (sauge, bleu poudré, sable) et une touche
de citron vert. Les polices sont servies par Bunny Fonts (hébergé en Europe, sans traçage).

**Taki** est la mascotte : une petite graine sereine, une pousse à deux feuilles sur la tête, dessinée d'un trait
d'encre avec des membres épais au contour, en postures de yoga. C'est lui qui « s'occupe de tout » (inscriptions,
confirmations, places).
Il apparaît sur l'accueil, le tableau de bord, les états vides, la confirmation de réservation et la 404.

## Lancer le projet

Il faut seulement [Node.js](https://nodejs.org) 22.13 ou plus récent. Aucune dépendance à installer.

```bash
npm run demo     # démo avec données fictives : http://localhost:3000/camille-yoga
npm start        # version "vide" : http://localhost:3000
npm test         # tests automatiques
npm run build:static   # génère l'aperçu statique dans docs/ (pour le regarder en local)
```

Compte de démo : `demo@creneau.test` / `demo1234`

### Version publique (aperçu statique)

Un aperçu cliquable de l'appli est en ligne : **https://lelatin.github.io/creneau/**

À chaque push sur `main`, GitHub Actions (`.github/workflows/pages.yml`) lance les tests, génère l'aperçu
en pages HTML fixes (`npm run build:static` → `docs/`, non versionné) et le publie sur GitHub Pages.
Les pull requests lancent seulement les tests et la génération, sans publier.

Les données sont fictives et les formulaires mènent à la page suivante sans rien enregistrer.

### Variables d'environnement

| Variable   | Rôle                                           | Défaut                  |
|------------|------------------------------------------------|-------------------------|
| `PORT`     | Port du serveur                                | `3000`                  |
| `BASE_URL` | Adresse publique (liens dans les emails)       | `http://localhost:PORT` |
| `DB_PATH`  | Fichier de la base SQLite                      | `data/creneau.db`       |

## Technique

Volontairement minimal pour aller vite et rester facile à héberger :
- Node.js sans aucune dépendance (serveur `node:http`, base `node:sqlite`)
- Pages générées côté serveur, quasiment pas de JavaScript côté navigateur
- Mots de passe hachés (scrypt), cookies `HttpOnly`/`SameSite`, protection contre les formulaires venant d'autres sites, tout le contenu échappé

```
src/server.js   routes et logique
src/views.js    pages HTML
src/taki.js     Taki, la mascotte (SVG dessiné à la main, 6 poses)
scripts/build-static.js   génère l'aperçu statique docs/
src/db.js       schéma et requêtes SQLite
src/auth.js     comptes et sessions
src/mail.js     envoi d'emails (à brancher sur un vrai fournisseur)
src/util.js     dates, prix, slugs, agenda
```

## Prochaines étapes envisagées

1. Envoi réel des emails (Brevo, fournisseur français) + rappel la veille du cours
2. Mise en ligne (hébergement en Europe)
3. Paiement en ligne (Stripe) et carnets de 10 séances
4. Liste d'attente automatique
