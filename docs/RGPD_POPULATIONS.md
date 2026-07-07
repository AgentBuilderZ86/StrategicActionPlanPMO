# Cadrage RGPD — Module Populations & adoption

> **Statut : analyse préparatoire.** Ce document structure les points à valider
> avec le DPO et, le cas échéant, le conseil juridique de l'organisation avant
> toute mise en production du module. Il ne constitue pas un avis juridique.

## 1. Objet du module

Le module référence des **groupes** de collaborateurs impactés par le plan
d'action (« populations ») avec un profil **agrégé** : effectif, tranche d'âge
dominante, ancienneté moyenne, maturité digitale estimée, exposition au
changement. Des « pulses » mesurent périodiquement l'adhésion, la
compréhension et le sentiment de préparation du groupe, sous forme de scores
agrégés. Ces signaux alimentent le moteur de risque (facteur « risque
d'adoption ») et des recommandations d'accompagnement.

## 2. Principes appliqués dès la conception (privacy by design)

| Principe | Traduction dans le module |
|---|---|
| Minimisation | Aucune donnée individuelle stockée : ni nom, ni identifiant, ni réponse individuelle aux pulses. Seuls des agrégats de groupe existent en base (`Population`, `Pulse`). |
| K-anonymat | Un pulse ne peut être enregistré qu'avec **au moins 8 répondants** (validation applicative, `K_ANONYMAT`). Aucune restitution sous ce seuil. |
| Finalité limitée | Accompagnement du changement dans le cadre du plan d'action piloté. Toute réutilisation (évaluation RH, individualisation) serait un détournement de finalité. |
| Transparence | Bandeau d'information sur la page du module ; le présent document est versionné avec le code. |
| Traçabilité | Créations et modifications journalisées dans l'audit log existant. |
| Limitation d'accès | Écriture réservée aux rôles ADMIN/PMO ; lecture selon les droits fins existants. |

## 3. Points à instruire avec le DPO avant mise en production

1. **Qualification** : des agrégats de groupe (≥ 8 personnes) sur des équipes
   parfois petites peuvent rester indirectement identifiants selon le
   contexte (ex. site de 9 personnes). Valider le seuil k=8 ou le relever,
   et définir une taille minimale de population référencée.
2. **Base légale** de la collecte des pulses (intérêt légitime ou autre) et
   information préalable des collaborateurs sondés.
3. **Registre des traitements** : inscrire le traitement, son responsable,
   sa durée de conservation (proposition : durée du plan + 12 mois, puis
   suppression ou anonymisation renforcée).
4. **Instances représentatives du personnel** : selon le pays, la mesure
   d'« adhésion » de groupes de salariés peut requérir une information ou
   consultation préalable. À vérifier pays par pays pour un plan multi-pays.
5. **Sous-traitance et hébergement** : la base est hébergée chez le
   fournisseur cloud retenu (Neon/PostgreSQL) ; vérifier la localisation des
   données et les clauses applicables.

## 4. Ce que le module ne fait volontairement pas

Pas de lien entre un collaborateur identifié et une population ; pas d'import
de données RH nominatives ; pas de restitution par individu ; pas d'export
des pulses en deçà du seuil de k-anonymat ; pas d'utilisation des signaux à
d'autres fins que la conduite du changement du plan.
