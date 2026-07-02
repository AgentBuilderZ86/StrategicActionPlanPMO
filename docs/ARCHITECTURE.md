# Dossier d'architecture — PMO NARSA

Plateforme collaborative de pilotage de la Stratégie Nationale de la Sécurité
Routière (SNSR 2026-2030) et des plans NARSA. CPS n°15/NARSA/2026.

## 1. Architecture applicative

Application web **Next.js 14 (App Router)**, rendu serveur + composants clients.

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Présentation | React 18 + Tailwind CSS + Recharts | Pages, tableaux de bord, graphiques |
| API | Route Handlers Next.js (`src/app/api/**`) | REST interne + API v1 d'interopérabilité |
| Domaine | Fonctions pures (`src/lib/*.ts`) | Arbre, codification, agrégations, indicateurs, agile, reporting |
| Validation | Zod (`src/lib/zod.ts`) | Schémas d'entrée de toutes les mutations |
| Accès données | Prisma ORM | Requêtes typées PostgreSQL |
| Authentification | NextAuth (JWT) | Sessions, rôles, habilitations fines |

### Modules fonctionnels
- **Plan d'actions arborescent** : `Action` auto-relation (Pilier › Axe › Projet › Action › Sous-action), codification automatique.
- **Indicateurs** multi-niveaux avec remontée ascendante.
- **Collaboration** : commentaires, pièces jointes (à venir), notifications in-app.
- **Workflow** de validation hiérarchique.
- **Agile / SI** : sprints, backlog, Kanban, velocity/CFD/burndown.
- **Reporting** : tableaux de bord personnalisables, exports XLSX/PDF.
- **Interopérabilité** : API v1 versionnée + jetons + OpenAPI.

## 2. Architecture technique

- **Runtime** : Node.js 20, déploiement serverless **Netlify** (`@netlify/plugin-nextjs`).
- **Base de données** : PostgreSQL (Neon/Supabase), migrations Prisma (`prisma/migrations`).
- **Build** : `prisma migrate deploy && prisma generate && next build` (voir `netlify.toml`).
- **Variables d'environnement** : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` (démo).

## 3. Architecture de sécurité

- **Authentification** : identifiants + bcrypt (coût 12), politique de mot de passe forte, verrouillage de compte (5 échecs / 15 min), session JWT 8 h.
- **Autorisation** : rôles (ADMIN/PMO/CONTRIBUTEUR/LECTEUR) + **habilitations fines** (lecture/saisie/validation/reporting) + périmètre géographique ; profils internes / partenaires externes.
- **Traçabilité** : piste d'audit (`AuditLog`) sur toutes les mutations et connexions.
- **Transport** : HTTPS/HSTS (preload), en-têtes de sécurité (CSP, X-Frame-Options DENY, Permissions-Policy…).
- **API externe** : jetons Bearer (empreinte SHA-256), scopes lecture/écriture, révocables.
- **Reste à durcir (roadmap)** : CSP par nonces, rate limiting `/api/auth` (Redis/Upstash), signature électronique, campagne OWASP ZAP/Burp.

## 4. Modèle de données (extrait)

`Plan → Axe / Pays / Entite / Action*`. `Action` porte l'arborescence (`parentId`),
la codification (`code`), les indicateurs, jalons, commentaires, attributs
personnalisés et demandes de validation. Volet SI : `Sprint`, `ItemBacklog`.
Transverses : `User`, `AuditLog`, `Notification`, `ApiToken`, `DashboardPref`.

Schéma complet : `prisma/schema.prisma`.
