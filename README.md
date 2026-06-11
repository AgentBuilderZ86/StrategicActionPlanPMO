# PMO — Pilotage de plan d'action stratégique

Application web de **pilotage PMO** d'un plan d'action stratégique (digital ou
thématique) déployé sur **plusieurs pays et entités** d'un groupe. Suivi des
actions, pilotage de l'avancement, analyses multi-axes et vues exécutives
(dashboard, COPIL).

> Interface 100 % en français. Montants en **k€**.

## Stack

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS** (design tokens, sans lib UI lourde)
- **Recharts** pour la data-viz
- **Prisma** + **PostgreSQL** (Neon/Supabase ; compatible Netlify)
- **NextAuth** (credentials) avec rôles `ADMIN` / `PMO` / `CONTRIBUTEUR` / `LECTEUR`
- **Zod** pour la validation (API + formulaires), **react-hook-form**
- **SheetJS** (export Excel) · ESLint + Prettier · **Vitest**

## Démarrage rapide

```bash
pnpm install
cp .env.example .env          # DATABASE_URL (Postgres), NEXTAUTH_SECRET, NEXTAUTH_URL
pnpm db:push                  # crée le schéma sur la base Postgres
pnpm db:seed                  # jeu de démonstration
pnpm dev                      # http://localhost:3000
```

> Besoin d'une base gratuite ? Créez un projet sur **neon.tech** et copiez la
> *connection string* dans `DATABASE_URL`.

### Comptes de démonstration (mot de passe `demo1234`)

| Rôle | Email | Droits |
| --- | --- | --- |
| Administrateur | `admin@pmo.demo` | Tout, y compris gestion des utilisateurs |
| PMO | `pmo@pmo.demo` | Tout sauf gestion des utilisateurs |
| Contributeur | `contrib@pmo.demo` | Édite les actions de son périmètre |
| Lecteur | `lecteur@pmo.demo` | Lecture seule |

## Scripts

| Commande | Description |
| --- | --- |
| `pnpm dev` | Serveur de développement |
| `pnpm build` | `prisma generate` + build de production |
| `pnpm typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `pnpm lint` | ESLint (next lint) |
| `pnpm test` | Tests Vitest (agrégations + schémas Zod) |
| `pnpm db:push` / `db:seed` / `db:reset` | Schéma / seed / reset+seed |

## Fonctionnalités

- **Tableau de bord exécutif** (`/`) — KPIs, **heatmap Pays × Axes**, avancement
  par axe et par pays, répartition des statuts, budget alloué/consommé, courbe de
  tendance, points d'attention, filtre de période et sélecteur de plan.
- **Plan d'actions** (`/actions`) — table filtrable et triable, pagination,
  CRUD via drawer (Zod + react-hook-form), flag « en retard » automatique,
  snapshots d'avancement, **export CSV (FR ; BOM UTF-8) / Excel**, **import CSV**
  avec mapping de colonnes et rapport d'erreurs ligne par ligne.
- **Analyses multi-axes** (`/analyses`) — pivot dynamique par dimension, tableau
  de synthèse, graphiques comparés, **matrice croisée** dim1 × dim2, drill-down.
- **Vue COPIL** (`/copil`) — synthèse imprimable / PDF (KPIs, heatmap, top 5
  points d'attention, faits marquants), **snapshot du mois**.
- **Paramètres** (`/parametres`) — référentiels (axes ordonnables, pays, entités),
  renommage du plan, gestion utilisateurs/rôles (ADMIN), reset démo (dev).

## Modèle de données

`Plan` → `Axe`, `Pays`, `Entite`, `Action` (avec `Jalon`, `Avancement` pour la
tendance), `SnapshotCopil`, plus les modèles NextAuth (`User` porte le `role`).
Règle dérivée : `enRetard = dateFin < today && statut != TERMINE` (jamais stockée).

> Statut/priorité/rôle sont des `String` validés par Zod (`src/lib/constants.ts`),
> choix portable conservé depuis la phase SQLite.

## API (route handlers)

- `GET/POST /api/actions`, `GET/PATCH/DELETE /api/actions/[id]`
- `GET /api/dashboard?planId=` (toutes les agrégations en une requête)
- `GET /api/analyses?dim=&dim2=&planId=`
- Référentiels : `/api/axes`, `/api/pays`, `/api/entites`, `/api/plans` (+ `[id]`)
- `GET /api/export?format=csv|xlsx`, `POST /api/import`
- `GET/POST /api/snapshots`, `/api/users` (+ `[id]`, ADMIN), `/api/dev/reset` (dev)

Réponses typées ; erreurs normalisées `{ error: { code, message, details? } }`.

## Déploiement Netlify

`netlify.toml` inclut `@netlify/plugin-nextjs`. Définir dans l'UI Netlify :
`DATABASE_URL` (Postgres Neon/Supabase), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

Initialisation de la base (une fois, depuis votre machine, pointée sur Neon) :

```bash
DATABASE_URL="postgresql://...neon..." pnpm prisma db push
DATABASE_URL="postgresql://...neon..." pnpm db:seed
```

> Le client Prisma est généré avec le *binary target* `rhel-openssl-3.0.x`
> requis par le runtime serverless de Netlify.

## Roadmap V2 (hors périmètre V1)

Notifications email · workflow de validation · Gantt interactif · multi-langue ·
SSO entreprise.
