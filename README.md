# StrategicActionPlanPMO

Application **PMO Control Tower** — un poste de pilotage exécutif pour le suivi
d'un plan d'action stratégique multi-pays et multi-entités (empreinte Afrique de
l'Ouest). Construite en React, avec persistance locale (`window.localStorage`) et
visualisations Recharts.

## Fonctionnalités

- **Tableau de bord exécutif**
  - Cartes KPI (actions, avancement moyen, terminées, bloquées, budget)
  - Matrice heatmap *Pays × Axes* de l'avancement moyen
  - Graphiques : avancement par axe, répartition par statut, budget par axe,
    activité par pays
- **Plan d'action**
  - Table filtrable (recherche, axe, pays, entité, statut, priorité)
  - Édition *inline* du statut et de l'avancement
  - Modale d'ajout / modification d'action
  - Détection automatique des actions en retard (échéance dépassée)
- **Analyses**
  - Tableaux croisés dynamiques par pays, entité, axe ou responsable
    (volume, avancement, budget, blocages)
  - Liste des points d'attention (bloqués / en retard) triés par priorité
- **Paramètres**
  - Gestion des référentiels (axes, pays, entités, responsables)
  - Renommage du plan, réinitialisation
  - Export JSON et CSV

## Modèle de données

Chaque action : `id, title, axis, country, entity, owner, status, progress,
priority, startDate, endDate, budget, notes`.

Données persistées sous la clé `pmo-app-data-v1`. Unité monétaire : `k€`.

## Design

Interface professionnelle « control tower » : palette neutre claire, surfaces
blanches, encre bleu profond (`#0B2545`) et accent cobalt (`#1D4ED8`), police
**Archivo**. La structure est en Tailwind ; les couleurs de marque sont appliquées
en styles inline.

## Démarrage

```bash
npm install
npm run dev      # serveur de développement Vite
npm run build    # build de production
npm run preview  # prévisualisation du build
```

Stack : React 18 · Vite 5 · Tailwind CSS 3 · Recharts 2.
