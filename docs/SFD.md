# Spécifications Fonctionnelles Détaillées (SFD)

**Projet** : Plateforme collaborative de pilotage PMO — NARSA
**Marché** : CPS n°15/NARSA/2026 (Article 29 — Matrice de conformité fonctionnelle)
**Objet** : Pilotage de la Stratégie Nationale de la Sécurité Routière (SNSR 2026-2030),
du plan de développement stratégique de la NARSA et de sa feuille de route digitale.

| | |
|---|---|
| Version | 1.0 |
| Statut | Livrable |
| Périmètre | Application web PMO (multi-plans, multi-niveaux, collaborative) |

---

## 1. Introduction

### 1.1 Objet du document
Le présent document décrit les fonctionnalités attendues et implémentées de la
plateforme PMO NARSA, leur comportement, les règles de gestion associées et la
traçabilité vis-à-vis des exigences de l'Article 29 du CPS.

### 1.2 Définitions et acronymes
| Terme | Définition |
|-------|------------|
| PMO | *Project Management Office* — bureau de pilotage de projets/plans |
| SNSR | Stratégie Nationale de la Sécurité Routière |
| Plan | Ensemble structuré d'actions relevant d'un type de PMO |
| Nœud / Action | Élément de l'arbre du plan (Pilier, Axe, Projet, Action, Sous-action) |
| Région | Découpage territorial (Direction Régionale NARSA) — champ technique « Pays » |
| Pôle / Partenaire | Entité porteuse (pôle interne NARSA ou partenaire institutionnel) — champ « Entité » |
| Indicateur | Mesure de performance (cible / réalisé) rattachée à un nœud |
| KPI | Indicateur clé de performance agrégé |

### 1.3 Types de PMO couverts
| Type (`typePmo`) | Libellé | Usage |
|------------------|---------|-------|
| `ECOSYSTEME` | PMO Écosystème (SNSR) | Suivi des engagements de la stratégie nationale avec les partenaires |
| `INTERNE` | PMO Interne (NARSA) | Plan de développement et chantiers internes de l'Agence |
| `SI` | PMO SI (Projets IT) | Feuille de route digitale, pilotage Agile |

---

## 2. Acteurs, rôles et habilitations

### 2.1 Rôles de base
| Rôle | Description | Droits par défaut |
|------|-------------|-------------------|
| ADMIN | Administrateur | lecture, saisie, validation, reporting + administration |
| PMO | Chargé PMO | lecture, saisie, validation, reporting |
| CONTRIBUTEUR | Contributeur | lecture, saisie (dans son périmètre) |
| LECTEUR | Observateur | lecture seule |

### 2.2 Habilitations fines (exig. 30)
Chaque utilisateur peut recevoir des **droits fins** qui priment sur son rôle :
`lecture`, `saisie`, `validation`, `reporting`. Par défaut, ces droits sont
dérivés du rôle (rétrocompatibilité).

### 2.3 Profils partenaires externes (exig. 31)
Type d'utilisateur `INTERNE` ou `PARTENAIRE_EXTERNE`. Un partenaire externe est
restreint à son **périmètre** (régions autorisées) pour la saisie.

### 2.4 Périmètre
Un contributeur régional ou un partenaire est limité à un périmètre de régions
(`perimetrePays`) contrôlé sur les opérations d'écriture.

---

## 3. Architecture fonctionnelle (modules)

1. **Structuration du plan** — arborescence, codification.
2. **Suivi des actions** — statuts, avancement, budget, dates.
3. **Indicateurs de performance** — multi-lignes, consolidation multi-niveaux.
4. **Attributs personnalisables** — champs métier configurables.
5. **Collaboration** — commentaires, pièces jointes (roadmap), notifications.
6. **Workflow de validation** — soumission / décision hiérarchique.
7. **Planification visuelle** — Gantt, calendrier, jalons.
8. **Analyses & tableaux de bord** — KPI, heatmap, dashboards personnalisables.
9. **Volet SI / Agile** — sprints, backlog, Kanban, métriques agiles.
10. **Reporting** — rapports multiformats (Excel/PDF).
11. **Administration** — référentiels, utilisateurs, habilitations, audit, jetons API.
12. **Interopérabilité** — API versionnée + jetons.

---

## 4. Exigences fonctionnelles détaillées

### 4.1 Structuration arborescente du plan (exig. 2, 3)
- Le plan est un **arbre** : Pilier › Axe › Projet › Action › Sous-action, profondeur configurable (> 5 niveaux possibles).
- **Règle de gestion RG-1** : `niveau(enfant) = niveau(parent) + 1`.
- **RG-2** : la suppression d'un nœud supprime en cascade ses descendants.
- **RG-3** : le déplacement d'un nœud interdit tout cycle et recalcule les niveaux de la descendance.
- **Écrans** : page « Plan d'actions » — vue **Table** (filtrable/triable/paginée) et vue **Arborescence** repliable ; ajout d'un enfant depuis un nœud.

### 4.2 Codification automatique (exig. 4)
- Chaque nœud reçoit un **code** unique par plan, cohérent avec l'arbre (ex. `PS1.CS2.PRJ1`).
- **RG-4** : le code est recalculé à toute modification structurelle (création, déplacement, réordonnancement).

### 4.3 Attributs personnalisables (exig. 9, 10)
- L'administrateur définit des **attributs métier** (texte, nombre, date, booléen, liste) applicables par **type de plan** et/ou **niveau**.
- Les champs s'affichent dynamiquement sur la fiche action au niveau concerné.

### 4.4 Indicateurs & remontée multi-niveaux (exig. 11, 13, 14)
- Indicateurs **multi-lignes** par nœud : libellé, unité, cible, réalisé, sens d'amélioration.
- **RG-5** : consolidation **ascendante** — un nœud parent agrège les indicateurs (par libellé + unité) de tout son sous-arbre ; taux d'atteinte calculé selon le sens (hausse/baisse).
- Indicateurs d'impact SR (ex. taux de réduction de mortalité) supportés (sens « baisse »).

### 4.5 Pièces jointes & commentaires (exig. 7, 32)
- **Commentaires** : fil horodaté par nœud, auteur tracé (implémenté).
- **Pièces jointes** : prévues (nécessite un stockage objet — voir STD §7).

### 4.6 Notifications, alertes & rappels (exig. 8, 18)
- **Notifications in-app** (cloche) : blocage d'action, échéance, validation.
- **RG-6** : le passage d'une action à « Bloqué » alerte ADMIN/PMO.
- **Rappels d'échéance** : actions en retard ou à échéance ≤ 7 jours (dédupliqués, déclenchables par tâche planifiée). E-mail SMTP prévu (voir STD §7).

### 4.7 Workflow de validation hiérarchique (exig. 24, 25)
- **Soumettre pour validation** depuis la fiche action ; file d'attente pour le validateur.
- **RG-7** : le rôle validateur dépend du niveau (Pilier/Axe → ADMIN, sinon PMO) et exige le droit `validation`.
- Historique des décisions tracé et audité ; notifications au demandeur et au validateur.

### 4.8 Planification visuelle (exig. 16, 17)
- **Gantt** : barres temporelles, avancement dans la barre, repères mensuels, ligne « aujourd'hui », jalons.
- **Calendrier** : grille mensuelle des échéances et jalons, navigation par mois.

### 4.9 Analyses & tableaux de bord (exig. 22, 23)
- **Tableau de bord** : KPI (actions, avancement, terminées, en cours, bloquées, en retard, budget), heatmap Région × Axe, graphiques (par axe, par statut, par région, budget, tendance), points d'attention.
- **RG-8** : chaque profil **personnalise** son tableau de bord (visibilité et ordre des widgets, persistés).
- **Analyses croisées** multi-dimensions (région, pôle, axe, responsable, priorité).

### 4.10 Volet SI / Agile (exig. 19, 20, 21)
- **Sprints** (planifié / en cours / clos), **backlog**, tableau **Kanban** (5 colonnes) avec points et affectation.
- **Graphiques agiles** : velocity, cumulative flow (CFD), burndown.
- Suivi des tests/déploiements via items typés (module dédié en roadmap).

### 4.11 Reporting (exig. 22, 28)
- **Rapport de pilotage** : feuilles Synthèse / Par axe / Par région / Exécution budgétaire.
- Export **Excel (XLSX)** multi-feuilles et **PDF** (impression) ; génération déclenchable par tâche planifiée.

### 4.12 Interopérabilité SI (exig. 36)
- **API v1** versionnée (`/api/v1/actions`) authentifiée par **jeton Bearer** (scopes lecture / lecture-écriture), documentée en **OpenAPI**.

### 4.13 Sécurité & traçabilité (exig. 33, 35, 37)
- **Journal d'audit** : chaque écriture (avant/après) et chaque connexion (succès/échec) tracée, consultable par l'ADMIN.
- Politique de mot de passe, verrouillage de compte, en-têtes de sécurité (voir STD §6).

---

## 5. Parcours utilisateurs (principaux)

1. **Contributeur régional** : connexion → Plan d'actions (arborescence de son périmètre) → met à jour l'avancement, saisit un indicateur, commente un blocage → soumet pour validation.
2. **Chargé PMO** : tableau de bord national → identifie les points d'attention → traite la file de validation → génère un rapport de pilotage.
3. **Administrateur** : gère les référentiels et utilisateurs, définit des attributs, consulte le journal d'audit, émet un jeton d'API pour un système tiers.
4. **Chef de projet SI** : volet Agile → planifie un sprint, alimente le backlog, suit velocity/burndown.

---

## 6. Matrice de traçabilité (extrait)

| Exig. | Fonctionnalité | Statut |
|------:|----------------|:------:|
| 2, 3 | Arborescence, déplacement, cascade | ✅ |
| 4 | Codification automatique | ✅ |
| 7 | Pièces jointes | ⬜ (stockage objet) |
| 8, 18 | Notifications & rappels | ✅ (e-mail SMTP en option) |
| 9, 10 | Attributs personnalisables | ✅ |
| 11, 13, 14 | Indicateurs & remontée | ✅ |
| 16, 17 | Gantt & calendrier | ✅ |
| 19, 20 | Agile (backlog, Kanban, graphiques) | ✅ |
| 21 | Suivi tests/déploiements | 🟡 |
| 22, 23, 28 | Reporting & dashboards | ✅ |
| 24, 25 | Workflow de validation | ✅ |
| 30, 31 | Habilitations fines & partenaires | ✅ / 🟡 |
| 32 | Commentaires | ✅ |
| 33, 35 | Audit connexions & écritures | ✅ |
| 34 | SSO / LDAP | ⬜ (décision infra) |
| 36 | Interopérabilité API | ✅ |
| 37, 38 | Sécurité avancée / signature | 🟡 / ⬜ |

> La matrice complète et à jour est maintenue dans `CONFORMITE.md`.
