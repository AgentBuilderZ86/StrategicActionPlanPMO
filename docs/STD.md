# Spécifications Techniques Détaillées (STD)

**Projet** : Plateforme collaborative de pilotage PMO — NARSA
**Marché** : CPS n°15/NARSA/2026 (Article 29 — Exigences techniques et de sécurité)

| | |
|---|---|
| Version | 1.0 |
| Statut | Livrable |
| Référence fonctionnelle | `docs/SFD.md` |

---

## 1. Introduction

Ce document décrit l'architecture technique, le modèle de données, les
interfaces, la sécurité et les modalités de déploiement de la plateforme PMO
NARSA. Il complète le SFD et sert de référence pour la construction, la recette
et l'exploitation.

---

## 2. Architecture technique

### 2.1 Pile technologique (imposée par le CPS)
| Domaine | Technologie | Version |
|---------|-------------|---------|
| Framework | Next.js (App Router) | 14 |
| Langage | TypeScript (strict) | 5.x |
| UI | React + Tailwind CSS | 18 / 3.x |
| Graphiques | Recharts | 2.x |
| Tableurs | SheetJS (xlsx) | — |
| ORM | Prisma | 5.22 |
| Base de données | PostgreSQL | 16 (Neon/Supabase) |
| Authentification | NextAuth | 4.x (stratégie JWT) |
| Validation | Zod | 3.x |
| Tests | Vitest | 2.x |
| Hachage | bcryptjs | — |
| Exécution | Node.js | 20 |
| Hébergement | Netlify (serverless) | `@netlify/plugin-nextjs` |

### 2.2 Découpage en couches
```
┌───────────────────────────────────────────────────────────┐
│  Présentation (React Server/Client Components, Tailwind)   │
├───────────────────────────────────────────────────────────┤
│  API (Route Handlers Next.js — src/app/api/**)             │
│    · guards de permission · validation Zod · audit         │
├───────────────────────────────────────────────────────────┤
│  Domaine (fonctions pures — src/lib/*.ts, testées)         │
│    tree, codes, aggregations, indicateurs, agile, planning,│
│    reports                                                 │
├───────────────────────────────────────────────────────────┤
│  Accès données (Prisma) → PostgreSQL                       │
└───────────────────────────────────────────────────────────┘
```

### 2.3 Principes
- **Logique métier pure et testable** isolée dans `src/lib` (aucune dépendance Prisma/HTTP), couverte par Vitest.
- **Validation systématique** des entrées via Zod à la frontière API.
- **Rendu dynamique** (`force-dynamic`) pour les pages et routes dépendant des données/session.
- **Middleware** d'authentification protégeant les pages applicatives.

---

## 3. Modèle de données

### 3.1 Entités principales
| Entité | Rôle | Points clés |
|--------|------|-------------|
| `Plan` | Plan (par type de PMO) | `typePmo`, `objectif`, dates |
| `Axe` | Axe stratégique | ordonné, rattaché au plan |
| `Pays` | Région | code, rattaché au plan |
| `Entite` | Pôle / Partenaire | rattaché à une région |
| `Action` | Nœud de l'arbre | `parentId` (auto-relation), `niveau`, `code`, `ordre`, `statut`, `avancement`, budget, dates ; dimensions (`axeId`/`paysId`/`entiteId`) **optionnelles** |
| `Jalon` | Jalon d'une action | date, atteint |
| `Avancement` | Historique d'avancement | courbe de tendance |
| `Indicateur` | Indicateur multi-lignes | cible, réalisé, sens, agrégeable |
| `Commentaire` | Fil collaboratif | auteur, horodatage |
| `AttributDef` / `AttributValeur` | Attributs personnalisés | portée plan/type/niveau |
| `DemandeValidation` | Workflow de validation | statut, rôle validateur, historique |
| `Sprint` / `ItemBacklog` | Volet Agile | Kanban, points, sprint |
| `SnapshotCopil` | Instantané COPIL | indicateurs figés (JSON) |
| `Notification` | Notifications in-app | type, lu |
| `DashboardPref` | Préférences dashboard | config widgets (JSON) |
| `ApiToken` | Jeton d'interopérabilité | empreinte SHA-256, scopes |
| `AuditLog` | Piste d'audit | avant/après (JSON), IP, user-agent |
| `User` / `Account` / `Session` | Auth (NextAuth) | rôle, périmètre, droits, verrouillage |

### 3.2 Contraintes structurantes
- **Arbre** : `Action.parentId → Action.id`, `ON DELETE CASCADE` ; index `@@index([parentId])`.
- **Codification** : `@@unique([planId, code])`.
- **Dimensions optionnelles** : `axeId`/`paysId`/`entiteId` nullables, `ON DELETE SET NULL`.
- **Cascade** : indicateurs, commentaires, jalons, avancements, attributs, demandes de validation supprimés avec l'action.
- **Unicité** : `User.email`, `ApiToken.tokenHash`, `AttributValeur(actionId, attributDefId)`.

### 3.3 Migrations
Migrations Prisma versionnées et numérotées (`prisma/migrations/0_init` → `14_api_tokens`),
appliquées en production par `prisma migrate deploy` (idempotentes,
`IF NOT EXISTS` / blocs `DO $$`). Schéma source : `prisma/schema.prisma`.

---

## 4. Interfaces (API)

### 4.1 API interne (REST, Route Handlers)
- Convention de réponse : `ok(data)` / `fail(code, message, status)`.
- Erreurs normalisées (Zod → 422, générique → 500, messages internes masqués en production).
- Domaines : `actions` (+ `[id]`, `indicateurs`, `commentaires`, `attributs`, `validation`),
  `axes`, `pays`, `entites`, `plans`, `users`, `snapshots`, `import`, `export`,
  `dashboard` (+ `config`), `analyses`, `reports`, `notifications`, `validations`,
  `sprints`, `items`, `audit`, `admin/tokens`.
- Chaque mutation : **guard de permission** + **validation Zod** + **journalisation d'audit**.

### 4.2 API d'interopérabilité v1 (exig. 36)
- Base : `/api/v1`. Authentification : en-tête `Authorization: Bearer <jeton>`.
- `GET /api/v1/actions?planId=` — lecture. `POST /api/v1/actions` — création (scope `read_write`).
- Documentation : `GET /api/v1/openapi.json` (OpenAPI 3.0).
- Jetons gérés par l'ADMIN (émission — secret affiché une seule fois — et révocation) ;
  stockage de l'**empreinte SHA-256** uniquement.

---

## 5. Logique métier (bibliothèques pures)
| Module | Responsabilité |
|--------|----------------|
| `tree.ts` | Construction/aplatissement d'arbre, règle de niveau, codes |
| `utils.ts` | Codification (`genererCode`), formats, règle « en retard » |
| `codes.ts` | Réindexation transactionnelle des codes d'un plan |
| `aggregations.ts` | KPI, heatmap, agrégations par dimension, tendance |
| `indicateurs.ts` | Consolidation ascendante, taux d'atteinte |
| `agile.ts` | Velocity, CFD, burndown |
| `planning.ts` | Mise en page Gantt (positions en %) |
| `reports.ts` | Feuilles de reporting |
| `notifications.ts` | Notifications & rappels d'échéance |

Toutes couvertes par des tests unitaires Vitest.

---

## 6. Sécurité (exig. 37)

### 6.1 Authentification
- NextAuth, stratégie **JWT**, `maxAge` 8 heures.
- Vérification par **bcrypt** (coût 12 pour les comptes créés via l'API).
- **Politique de mot de passe** (Zod) : ≥ 8 caractères, majuscule, minuscule, chiffre, caractère spécial, rejet des mots de passe usuels.
- **Verrouillage de compte** : 5 échecs → verrouillage 15 min (`failedAttempts`, `lockedUntil`) ; déverrouillage administrateur.

### 6.2 Autorisation
- Guards serveur : `requireRole(roles)`, `requireEdit(scope)`, `requireDroit(droit)`.
- **Habilitations fines** (lecture/saisie/validation/reporting) en surcouche du rôle ; périmètre géographique appliqué à l'écriture.

### 6.3 Traçabilité (exig. 33, 35)
- `AuditLog` : `userId`, `action`, `entite`, `avant`/`apres` (JSON), IP, user-agent, horodatage.
- Journalisation de **toutes les mutations** et des **connexions** (succès/échec).

### 6.4 Transport & en-têtes (RGS/OWASP)
Déclarés en natif Netlify (`netlify.toml`) :
`Strict-Transport-Security` (preload, 2 ans), `Content-Security-Policy`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`.

### 6.5 Durcissements en roadmap
CSP par nonces, campagne OWASP Top 10 (ZAP/Burp), *rate limiting* `/api/auth`
(Redis/Upstash), signature électronique (exig. 38), SSO/OIDC/LDAP (exig. 34).

---

## 7. Déploiement & exploitation

### 7.1 Chaîne de build (`netlify.toml`)
```
command = "pnpm prisma migrate deploy && pnpm build"   # migrations puis build
publish = ".next"
plugin  = "@netlify/plugin-nextjs"
```
Les en-têtes de sécurité sont déclarés dans `[[headers]]` (natif Netlify).

### 7.2 Variables d'environnement
| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL (Neon/Supabase) |
| `NEXTAUTH_SECRET` | Secret de signature JWT |
| `NEXTAUTH_URL` | URL publique |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | Affichage des comptes démo (jamais en production) |

### 7.3 Initialisation & données
- Schéma : `prisma migrate deploy`. Jeu de démonstration : `pnpm db:seed` (ou `db:reset`).
- L'endpoint d'amorçage `/api/setup` est **désactivé en production**.

### 7.4 Interfaçage externe
Stockage objet (pièces jointes), SMTP (e-mails/rappels planifiés) et fournisseur
d'identité (SSO/LDAP) sont des points d'intégration à provisionner (voir §6.5).

---

## 8. Exigences non-fonctionnelles

| Exigence | Cible | Moyen |
|----------|-------|-------|
| Temps de réponse | < 5 s (10 s traitements lourds) | Rendu serveur, requêtes indexées, agrégations optimisées |
| Compatibilité | Edge, Firefox, Chrome | Standards web, responsive Tailwind |
| Disponibilité | Hébergement managé | Serverless Netlify + base managée Neon |
| Langue / devise | Français / k MAD | UI 100 % FR, format `fr-FR` |
| Sécurité des flux | HTTPS/HSTS | En-têtes + TLS Netlify |
| Traçabilité | Intégrale | Piste d'audit |

---

## 9. Qualité & tests
- **Tests unitaires** Vitest sur la logique pure (`pnpm test`).
- **Contrôles statiques** : `pnpm typecheck` (tsc strict) + `pnpm lint` (ESLint), bloquants à la construction.
- **Cahier de recette** : `docs/CAHIER_RECETTE.md` (scénarios tracés vers les exigences).
- **CI/CD** : construction et déploiement Netlify sur chaque révision ; `migrate deploy` applique les migrations avant la mise en ligne.

---

## 10. Organisation du code (repère)
```
prisma/               schéma + migrations + seed
src/app/              pages (App Router) + API (route handlers)
src/components/       composants UI (dashboard, actions, agile, planning, …)
src/lib/              logique métier pure + accès données + auth/permissions
docs/                 livrables (ARCHITECTURE, SFD, STD, manuels, recette)
netlify.toml          build, plugin Next, en-têtes de sécurité
```

> Documents liés : `docs/SFD.md`, `docs/ARCHITECTURE.md`, `docs/CAHIER_RECETTE.md`,
> `docs/MANUEL_ADMINISTRATEUR.md`, `docs/MANUEL_UTILISATEUR.md`, `CONFORMITE.md`.
