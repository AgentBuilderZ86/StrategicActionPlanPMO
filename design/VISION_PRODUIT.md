# Vision produit — PMO nouvelle génération

**Du reporting au cockpit d'action.** L'application actuelle décrit l'état du plan. La cible : une application qui dit à chaque utilisateur, à chaque connexion, **ce qui mérite son attention et quoi faire maintenant**, en anticipant les dérives avant qu'elles ne se matérialisent et en adaptant les actions d'accompagnement aux populations concernées.

---

## 1. Diagnostic de l'existant

Base solide (Next.js 14, modèle de données riche, rôles, CRUD complet, exports, COPIL imprimable) mais quatre limites structurantes :

| # | Constat | Impact utilisateur |
|---|---------|--------------------|
| 1 | **Descriptif, pas prescriptif** : les dashboards montrent l'état (avancement, statuts, budget), jamais la décision à prendre | L'utilisateur doit interpréter seul ; le PMO passe son temps à "lire" au lieu d'agir |
| 2 | **Alertes réactives** : le flag "en retard" est calculé après coup (`dateFin < today`), les rappels d'échéance sont déclenchés manuellement | On constate le retard, on ne le devance jamais |
| 3 | **UI fonctionnelle mais datée** : icônes emoji, tables denses, hiérarchie visuelle faible, pas de vue personnalisée par rôle, aucune micro-interaction | Peu de plaisir d'usage, adoption molle des contributeurs, mise à jour vécue comme une corvée |
| 4 | **Angle mort humain** : aucune donnée sur les populations impactées par les actions | Impossible d'adapter la conduite du changement ; les actions "techniquement terminées" échouent à l'adoption |

---

## 2. Concept design — "Cockpit"

### 2.1 Principe directeur

Chaque écran répond à une seule question : **"Que dois-je faire maintenant ?"** Tout élément affiché doit soit déclencher une action, soit justifier une décision. Le reporting devient un sous-produit, plus jamais l'objet principal.

### 2.2 Refonte du système de design

- **Identité visuelle** : palette resserrée (fond neutre chaud, un accent fort, sémantique vert/ambre/rouge réservée au risque), typographie à fort contraste (display pour les chiffres clés, tabular-nums partout), icônes vectorielles Lucide en remplacement des emojis, mode sombre.
- **Motion design utile** : skeleton loaders, transitions de 150-200 ms, compteurs animés sur les KPIs, feedback immédiat sur chaque sauvegarde (optimistic UI). Respect de `prefers-reduced-motion`.
- **Densité progressive** : vue par défaut aérée orientée décision, densité "expert" activable pour le PMO.
- **Navigation** : sidebar fixe avec badges de compteurs (alertes, validations en attente), **command palette (Ctrl+K)** pour tout atteindre en 2 frappes, fil d'Ariane contextuel.

### 2.3 Nouveaux écrans clés

**"Ma journée" (nouvelle home par rôle).** Le contributeur voit ses 3-5 actions à mettre à jour, ses échéances à 14 jours, ses validations. Le PMO voit les alertes triées par criticité, les actions dormantes, les arbitrages en attente. Le sponsor voit la synthèse exécutive et les décisions à prendre. Mise à jour d'une action en 2 clics sans quitter l'écran (inline editing).

**Check-in hebdomadaire en 2 minutes.** Rituel guidé : l'app présente au contributeur ses actions une par une (avancement, confiance, blocage, commentaire), façon "stories". C'est le levier n°1 de fraîcheur des données, donc de fiabilité des insights.

**Centre d'alertes.** Voir §3.

**Fiche action augmentée.** Score de risque, trajectoire projetée, recommandations, populations impactées. Voir §3 et §4.

---

## 3. Moteur d'insights et alertes proactives

### 3.1 Score de risque par action (0-100)

Calculé quotidiennement, combinant des signaux déjà disponibles dans le modèle (`Avancement`, `Jalon`, `budget/budgetConso`, `Commentaire`, `DemandeValidation`) :

| Signal | Détection |
|--------|-----------|
| **Dérive de vélocité** | Avancement observé vs avancement théorique (temps écoulé / durée totale). Une action à 30 % aux deux tiers du délai est signalée **avant** d'être en retard |
| **Burn budgétaire décorrélé** | `budgetConso / budget` très supérieur à l'avancement |
| **Action dormante** | Aucun snapshot d'avancement ni commentaire depuis N semaines |
| **Jalon à risque** | Jalon < 14 jours avec avancement insuffisant des prérequis |
| **Surcharge responsable** | Un responsable cumule trop d'actions actives ou à risque |
| **Signal humain** | Indice de confiance déclaré en check-in, mots-clés de blocage dans les commentaires |
| **Risque d'adoption** | Population cible à faible réceptivité au changement (voir §4) |

Chaque score est **explicable** : l'utilisateur voit les 2-3 facteurs qui le composent, jamais une boîte noire.

### 3.2 Centre d'alertes

- File unique triée par criticité × impact (priorité de l'action, budget, nombre de populations touchées).
- Chaque alerte porte **le diagnostic, la tendance, et 2-3 pistes de résolution actionnables en 1 clic** : replanifier, escalader au COPIL, réaffecter, demander un point au responsable, déclencher une action d'accompagnement.
- Cycle de vie : nouvelle → prise en charge → résolue / acceptée (risque assumé, tracé pour le COPIL).
- **Digest hebdomadaire** automatique (in-app + email) : top risques, nouvelles dérives, dérives résorbées.
- Seuils configurables par plan dans Paramètres ; cron Netlify scheduled function pour le calcul quotidien (le endpoint `POST /api/notifications/rappels` existe déjà, il devient le point d'entrée du moteur).

### 3.3 Insights de niveau plan

Encarts générés automatiquement sur le dashboard : "L'axe Digital ralentit depuis 3 mois", "80 % des retards se concentrent sur 2 entités", "Le rythme actuel donne une fin de plan en T3 2027, soit +5 mois". Chaque insight est cliquable et mène à la vue filtrée correspondante.

---

## 4. Module "Populations & adoption" (socio-démographique)

Aucune donnée n'existant aujourd'hui, le module est conçu de bout en bout : référentiel, collecte, restitution, adaptation des actions.

### 4.1 Modèle de données (extension Prisma)

- **`Population`** : groupe de collaborateurs impacté (ex. "Agents guichet région Nord"). Attributs agrégés : effectif, tranche d'âge dominante, ancienneté moyenne, répartition métiers/sites, maturité digitale (1-5), exposition au changement (faible/moyenne/forte), langue de travail.
- **`ActionPopulation`** : lien N-N action ↔ population avec niveau d'impact (informé / formé / transformé).
- **`PulseEnquete` / `PulseReponse`** : mini-questionnaires (3-5 questions, < 1 min) envoyés aux populations à jalons clés : compréhension du changement, adhésion, sentiment de préparation.

**RGPD by design** : données stockées et restituées **au niveau du groupe uniquement**, jamais individuelles ; seuil de k-anonymat (pas de restitution sous 8 répondants) ; finalité limitée à l'accompagnement du plan ; à valider avec le DPO du client avant mise en production.

### 4.2 Restitutions

- **Carte des populations** : heatmap populations × axes montrant qui est touché, à quelle intensité, et l'état d'adhésion mesuré par les pulses.
- **Radar de réceptivité** par population (maturité digitale, adhésion, préparation, charge de changement cumulée).
- **Alerte saturation** : une même population touchée par trop de changements simultanés est signalée (facteur majeur d'échec des plans multi-pays).

### 4.3 Adaptation automatique de la conduite du changement

Cœur de la demande : des **playbooks de remédiation contextualisés**. Le moteur croise le profil de la population avec l'état de l'action et propose des actions complémentaires prêtes à ajouter au plan :

| Situation détectée | Recommandation générée |
|--------------------|------------------------|
| Action en dérive + population à faible maturité digitale | Renforcer la formation terrain, désigner des relais de proximité, prévoir supports pas-à-pas |
| Adhésion pulse < 50 % + population expérimentée (forte ancienneté) | Impliquer les experts métier en co-construction, communication sur le "pourquoi" plutôt que le "comment" |
| Population multi-sites + avancement hétérogène par pays | Dupliquer le dispositif du pays le plus avancé, organiser un partage de pratiques |
| Saturation de changement | Recommander au COPIL un rephasage, prioriser les actions à plus fort enjeu |
| Jeune population, forte maturité digitale, adhésion moyenne | Format court digital (micro-learning), gamification, ambassadeurs pairs |

Chaque recommandation s'ajoute au plan en un clic comme action d'accompagnement rattachée, avec responsable et échéance pré-remplis. La bibliothèque de playbooks est éditable par le PMO (Paramètres), le moteur reste transparent : règles visibles, jamais de boîte noire.

---

## 5. Roadmap priorisée

### Horizon 1 — Expérience & quick wins (4-6 semaines)

Refonte du design system (tokens, Lucide, dark mode, motion), vue "Ma journée" par rôle, inline editing des actions, command palette, check-in hebdomadaire guidé, insights simples sur le dashboard (dérive de vélocité, actions dormantes). **Impact fort, risque faible : c'est ce qui change la perception de l'outil.**

### Horizon 2 — Moteur d'insights & alertes (6-10 semaines)

Score de risque explicable, centre d'alertes avec cycle de vie et pistes de résolution, cron quotidien, digest hebdomadaire email, seuils configurables, insights de niveau plan. Prérequis : le check-in de l'horizon 1 garantit la fraîcheur des données.

### Horizon 3 — Populations & adoption (8-12 semaines)

Modèle `Population` + rattachement aux actions, pulses intégrés, carte des populations et radar de réceptivité, moteur de recommandations d'accompagnement, bibliothèque de playbooks éditable. Cadrage RGPD/DPO en amont (2 semaines, parallélisable).

### Mesure du succès

Taux de mise à jour hebdomadaire des actions (> 80 %), délai moyen de détection d'une dérive (avant vs après), taux d'alertes suivies d'une action, taux d'adhésion pulse par population, NPS interne de l'outil.

---

## 6. Ce que montrent les maquettes

Le fichier `maquette-interactive.html` (à ouvrir dans un navigateur) prototype quatre écrans : le cockpit "Ma journée" PMO, le centre d'alertes avec pistes de résolution, la fiche action augmentée (score de risque explicable, trajectoire, populations), et le module Populations & adoption avec recommandations d'accompagnement.
