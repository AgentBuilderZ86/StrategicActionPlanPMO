# Matrice de conformité — PMO NARSA (CPS n°15/NARSA/2026, Art. 29)

Suivi d'avancement des 38 exigences fonctionnelles + exigences techniques/sécurité.
Statuts : ✅ conforme · 🟡 en cours · ⬜ à faire.

## WAVE 0 — Fondations bloquantes

| Exig. | Intitulé | Statut | Tâche | Preuve |
|------:|----------|:------:|-------|--------|
| 2 | Arborescence hiérarchique du plan (parent-enfant) | ✅ | T0.1 | `Action.parentId` + relation « Arbre », `src/lib/tree.ts`, vue `/actions` arborescente |
| 3 | Imbrication / déplacement / suppression en cascade des nœuds | ✅ | T0.1 | `onDelete: Cascade` (parent), déplacement `PATCH /api/actions/[id]`, `tree.test.ts` |
| 4 | Codification automatique des nœuds | ✅ | T0.2 | `Action.code` unique par plan, `genererCode`/`calculerCodesArbre`, reindex sur toute modif structurelle, `utils.test.ts` |
| 33 | Traçabilité des connexions | ✅ | T0.4 | `AuditLog` LOGIN_SUCCESS/LOGIN_FAILURE dans `authorize()` |
| 35 | Piste d'audit des modifications (avant/après) | ✅ | T0.4 | `logAction()` branché sur toutes les mutations (actions, axes, pays, entités, plans, users, snapshots, import), journal `/parametres` ADMIN, `GET /api/audit` |
| 37 | Durcissement authentification (politique MDP, verrouillage) | 🟡 | T0.3 | `passwordSchema`, verrouillage 5 échecs/15 min, `POST /api/users`, reset/unlock admin, `zod.test.ts`, `SECURITE.md` (reste OWASP/crypto → T3.1) |

## WAVE 1 — Cœur fonctionnel

| Exig. | Intitulé | Statut | Tâche |
|------:|----------|:------:|-------|
| 7 | Pièces jointes / documents | ⬜ | T1.3 |
| 8 | Notifications, alertes, rappels | ⬜ | T1.4 |
| 9 | Attributs personnalisables par type de plan | ⬜ | T1.1 |
| 10 | Attributs par niveau | ⬜ | T1.1 |
| 11 | KPI personnalisés | ✅ | T1.2 · modèle `Indicateur` multi-lignes/nœud (unité, cible, réalisé, sens), CRUD `/api/actions/[id]/indicateurs` + `/api/indicateurs/[id]` |
| 13 | Remontée automatique multi-niveaux | ✅ | T1.2 · `consoliderIndicateurs()` (remontée ascendante sur le sous-arbre) exposée dans `GET /api/actions/[id]`, `indicateurs.test.ts` |
| 14 | Indicateurs d'impact sécurité routière | 🟡 | T1.2 · structure en place (sens BAISSE pour mortalité) ; indicateurs d'impact à saisir/seed |
| 18 | Rappels d'échéance | ⬜ | T1.4 |
| 24 | Workflows de validation configurables | ⬜ | T1.5 |
| 25 | Validation hiérarchique | ⬜ | T1.5 |
| 30 | Habilitations fines (lecture/saisie/validation/reporting) | ⬜ | T1.6 |
| 31 | Profils partenaires externes | ⬜ | T1.6 |
| 32 | Fil de commentaires / collaboration | ⬜ | T1.3 |

## WAVE 2 — Visualisation, SI/Agile, interopérabilité

| Exig. | Intitulé | Statut | Tâche |
|------:|----------|:------:|-------|
| 16 | Planification visuelle (Gantt) | ⬜ | T2.1 |
| 17 | Vue calendrier | ⬜ | T2.1 |
| 19 | Volet PMO SI / Agile (Backlog, Kanban) | ⬜ | T2.3 |
| 20 | Tableaux de bord agiles (burndown, velocity, CFD) | ⬜ | T2.3 |
| 21 | Suivi des tests / déploiements techniques | ⬜ | T2.3 |
| 23 | Tableaux de bord personnalisables par profil | ⬜ | T2.2 |
| 34 | SSO / LDAP | ⬜ | T2.5 |
| 36 | Interfaçage SI externe (API, webhooks) | ⬜ | T2.4 |

## WAVE 3 — Sécurité avancée & livrables

| Exig. | Intitulé | Statut | Tâche |
|------:|----------|:------:|-------|
| 22 | Reporting budgétaire avancé | ⬜ | T3.2 |
| 28 | Exports planifiables PDF/Excel | ⬜ | T3.2 |
| 37 | Chiffrement, RGS, OWASP Top 10 | 🟡 | T3.1 |
| 38 | Signature électronique | ⬜ | T3.1 |
| — | Non-fonctionnel (perf, licences, docs CPS) | ⬜ | T3.3 |
