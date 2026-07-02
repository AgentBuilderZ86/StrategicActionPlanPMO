# Cahier de recette — PMO NARSA (CPS n°15/NARSA/2026)

Scénarios de recette, tracés vers la matrice de conformité (`CONFORMITE.md`).
Statut attendu : ✅ conforme.

## Tests automatisés (Vitest)

`pnpm test` — couvre les fonctions pures :
`tree` (arbre, règle de niveau), `utils` (codification), `indicateurs`
(consolidation), `agile` (velocity/CFD/burndown), `planning` (Gantt), `reports`
(feuilles), `aggregations`, `zod` (validation, politique mot de passe).

## Tests fonctionnels manuels

| # | Exig. | Scénario | Résultat attendu |
|---|------:|----------|------------------|
| R01 | 2, 3 | Créer Pilier › Axe › Projet › Action › Sous-action ; déplacer un nœud ; supprimer un parent | Arbre cohérent ; niveaux recalculés ; suppression en cascade |
| R02 | 4 | Créer plusieurs nœuds | Code unique par plan (ex. `PS1.CS2.PRJ1`), recalculé au déplacement |
| R03 | 9, 10 | Définir un attribut « liste » au niveau 4, le renseigner sur une action | Champ affiché au bon niveau, valeur persistée |
| R04 | 11, 13 | Saisir des indicateurs sur des feuilles, ouvrir un parent | Consolidation ascendante (somme cible/réalisé) affichée |
| R05 | 32 | Poster un commentaire | Ajout horodaté au fil, auteur renseigné |
| R06 | 8, 18 | Passer une action à BLOQUE ; approcher une échéance | Notification ADMIN/PMO ; rappel d'échéance |
| R07 | 24, 25 | Soumettre une action pour validation ; approuver | Demande EN_ATTENTE → APPROUVE ; notifications demandeur/validateur |
| R08 | 30, 31 | Retirer le droit « validation » à un PMO | Décision de validation refusée (403) |
| R09 | 16, 17 | Ouvrir /planning | Gantt (ligne aujourd'hui) et calendrier (échéances + jalons) |
| R10 | 23 | Masquer un widget, réordonner | Configuration persistée par profil |
| R11 | 19, 20 | Créer un sprint, des items, déplacer dans le Kanban | Colonnes à jour ; velocity/CFD/burndown cohérents |
| R12 | 36 | Générer un jeton lecture ; `GET /api/v1/actions` avec Bearer | 200 + données ; sans jeton → 401 ; écriture avec jeton read → 403 |
| R13 | 22, 28 | Ouvrir /rapports ; export XLSX ; imprimer | Rapport multi-feuilles ; fichier XLSX ; PDF via impression |
| R14 | 37 | Créer un utilisateur avec mot de passe faible | Rejet (politique) ; 5 échecs → compte verrouillé |
| R15 | 33, 35 | Modifier une action puis ouvrir le Journal (ADMIN) | Entrée d'audit avant/après horodatée ; connexions tracées |

## Tests de sécurité (transport)

| # | Contrôle | Attendu |
|---|----------|---------|
| S01 | `curl -I` sur le site | En-têtes HSTS, CSP, X-Frame-Options DENY, Permissions-Policy présents |
| S02 | Accès `/api/export` sans session | 401 |
| S03 | `/api/setup` en production | 403 |
| S04 | Page `/connexion` en production | Bloc démo masqué |

## Non-fonctionnel (à mesurer en recette)

- Temps de réponse transactions < 5 s (10 s pour traitements lourds).
- Compatibilité Edge / Firefox / Chrome ; responsive.
