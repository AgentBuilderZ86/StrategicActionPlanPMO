# Manuel administrateur — PMO NARSA

Destiné aux profils **ADMIN** (et, pour certaines sections, **PMO**).

## 1. Première mise en service

1. Définir les variables d'environnement (voir `docs/ARCHITECTURE.md` §2).
2. Initialiser le schéma et les données : `pnpm prisma migrate deploy` puis `pnpm db:seed`.
3. Se connecter avec le compte d'amorçage (`admin@narsa.ma`), **puis changer immédiatement le mot de passe** (voir §3).
4. Vérifier que `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` n'est **pas** défini en production.

## 2. Gestion des plans et référentiels (Paramètres)

- **Plan** : renommer, définir le type (Écosystème / Interne / SI).
- **Axes** : ajouter, réordonner, supprimer.
- **Régions** et **Pôles / Partenaires** : gérer les référentiels.
- **Attributs métier** : créer des champs personnalisés par niveau (texte, nombre, date, oui/non, liste).

## 3. Gestion des utilisateurs et habilitations

Section « Utilisateurs, rôles & habilitations » (ADMIN) :
- **Rôle** de base : ADMIN, PMO, Contributeur, Observateur.
- **Type** : Interne NARSA / Partenaire externe.
- **Droits fins** (cases à cocher) : lecture, saisie, validation, reporting.
- **Réinitialisation de mot de passe** et **déverrouillage** via l'API (`PATCH /api/users/[id]`), soumis à la politique de mot de passe.

## 4. Validation hiérarchique

File d'attente « Validations en attente » : approuver / rejeter les demandes.
Le rôle validateur dépend du niveau (Pilier/Axe → ADMIN, sinon PMO).

## 5. Journal d'audit

Onglet « Journal d'audit » (ADMIN) : consultation filtrable (action, entité,
période) de toutes les écritures et connexions.

## 6. Interopérabilité (API)

Section « Interopérabilité — Jetons d'API » :
- Générer un jeton (lecture seule ou lecture/écriture). **Le secret n'est affiché qu'une seule fois.**
- Révoquer un jeton compromis.
- Documentation : `GET /api/v1/openapi.json`. Authentification : en-tête `Authorization: Bearer <jeton>`.

## 7. Exploitation

- **Rappels d'échéance** : générés au fil de l'eau ; endpoint cron `POST /api/notifications/rappels`.
- **Rapports planifiés** : `GET /api/reports?format=xlsx` (droit reporting), déclenchable par cron.
- **Sauvegarde** : gérée au niveau de la base PostgreSQL (Neon/Supabase).
