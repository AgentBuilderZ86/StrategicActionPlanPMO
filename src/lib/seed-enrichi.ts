import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Enrichissement du jeu de données NARSA : peuple les modules récents —
 * signaux du moteur de risque, populations & pulses (démo, plan SNSR),
 * utilisateurs de rôles, et le portefeuille PPM DSI du plan « Feuille de
 * Route Digitale » avec les 116 projets réels de la « Liste des projets
 * digitaux priorisés NARSA V3 » (remplace tout portefeuille de démonstration
 * précédemment chargé pour ce plan). Déterministe : mêmes données à chaque
 * exécution.
 */

const JOUR = 86_400_000;
const ilYA = (jours: number) => new Date(Date.now() - jours * JOUR);

// Portefeuille réel de la feuille de route digitale NARSA (remplace le
// portefeuille de démonstration) — mapping des libellés source vers le
// référentiel Domaine/Sous-domaine et le cycle de vie waterfall PPM DSI.
const DOMAINES_ROADMAP_DIGITALE: { nom: string; type: string; sousDomaines: string[] }[] = [
  { nom: 'Amélioration des conditions de la sécurité routière', type: 'COEUR_METIER', sousDomaines: ['Communication, sensibilisation, formation'] },
  { nom: 'Services digitaux aux usagers', type: 'COEUR_METIER', sousDomaines: ['E-services', "Echange avec l'écosystème"] },
  { nom: 'Optimisation des opérations internes', type: 'SUPPORT', sousDomaines: ['SI métiers', 'SI transverse', 'SI pilotage et support', 'N/A'] },
];

const POLE_LABELS: Record<string, string> = {
  PSESR: 'Pôle Surveillance et Expertise en Sécurité Routière',
  PSCV: 'Pôle Sécurité de la Conduite et des Véhicules',
  PSI: "Pôle Système d'Information et NTSR",
  PAAJF: 'Pôle Affaires Administratives, Juridiques et Financières',
  PCEPR: 'Pôle Communication, Éducation et Prévention Routière',
  PQACG: 'Pôle Qualité, Audit et Contrôle de Gestion',
  Transverse: 'Transverse (multi-pôles)',
};

const STATUT_SOURCE_VERS_CYCLE: Record<string, string> = {
  'NOUVEAU': 'NON_QUALIFIE',
  'EN COURS': 'REALISATION_EN_COURS',
};

// Portefeuille réel de la feuille de route digitale NARSA — source :
// « Liste des projets digitaux priorisés V3 » (onglet « Liste brut projets »),
// 116 projets priorisés MoSCoW. Remplace le portefeuille de démonstration.
type ProjetDigitalSeed = {
  titre: string;
  categorie: string; // Catégorie source (→ Domaine)
  sousCategorie: string; // Sous-catégorie source (→ Sous-domaine)
  pole: string; // Pôle NARSA porteur (abréviation source)
  statutSource: 'NOUVEAU' | 'EN COURS';
  siConcerne: string | null;
  siSocle: string | null;
  valeur: number; // 1..5 (échelle source 1..4, ramenée à l'échelle valeurMetier)
  complexite: number | null; // 1..4
  dureeMois: number | null; // 1,3,6,9,12
  priorite: 'MUST HAVE' | 'GOOD TO HAVE' | 'NICE TO HAVE';
};

const PROJETS_DIGITAUX_NARSA: ProjetDigitalSeed[] = [
  { titre: "Mise en place d'une application mobile citoyenne de contribution à de la Sécurité Routière dans le cadre d'une initiative de recherche", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PSESR", statutSource: "EN COURS", siConcerne: "Application mobile Sécurité Routière", siSocle: "Application mobile Sécurité Routière", valeur: 4, complexite: 2, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place d'une application mobile citoyenne de contribution à de la Sécurité Routière, avec des modules d'expression citoyenne et d'interconexion avec la protection civile", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Application mobile Sécurité Routière", siSocle: "Application mobile Sécurité Routière", valeur: 4, complexite: 4, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Gamification des parcours de formation d'éducation et de sensibilisation, intégrée à la plateforme e-learning", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Plateforme e-learning externe", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 3, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Développement d'applications mobile d'éducation routière", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PCEPR", statutSource: "EN COURS", siConcerne: "Système Éducation Routière", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 2, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place et intégration à la plateforme 360° d'accès aux services digitaux de la Narsa, d'un système éducation routière (avec différentes fonctionnalités)", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Système Éducation Routière", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Développement d'un module MOOC et intégration au système Education Routière de la plateforme 360° d'accès aux services digitaux de la Narsa", categorie: "Amélioration des conditions de la sécurité routière", sousCategorie: "Communication, sensibilisation, formation", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Système Éducation Routière", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Mise en place d'API d'échange de données avec les SI métiers de certains professionnels de la Sécurité Routière", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "API d'échange de données", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation d'une cartographie interactive des données d’accident", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Réferentiel de données de la sécurité routière", siSocle: "Plateforme Data", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Implémentation d'une cartographie interactive des données d’infraction", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Cartographies de données (accidents, infractions, …)", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'une cellule de veille technologique et réglementaire", categorie: "Optimisation des opérations internes", sousCategorie: "N/A", pole: "PSI", statutSource: "NOUVEAU", siConcerne: "Cellule Veille", siSocle: "Cellule Veille", valeur: 3, complexite: 2, dureeMois: 3, priorite: "GOOD TO HAVE" },
  { titre: "Construction d'un référentiel des prestataires et des types de prestations, soutenu par un système d'évaluation de ces derniers", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "CRM (partenaires, prestataires, user experience)", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 1, dureeMois: 3, priorite: "GOOD TO HAVE" },
  { titre: "Construction d'un référentiel des partenaires bénéficiant de l'accompagnement de la Narsa, soutenu par un système d'évaluation de ces derniers", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "CRM (partenaires, prestataires, user experience)", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 1, dureeMois: 3, priorite: "GOOD TO HAVE" },
  { titre: "Marketing des services digitaux : Implémentation de système de suivi de la satisfaction des usagers", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "CRM (partenaires, prestataires, user experience)", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Préparer et étudier un cadre d'échange de données avec des fournisseurs de solutions de monitoring du traffic (Waze, …)", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Réferentiel de données de la sécurité routière", siSocle: "Plateforme Data", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Interfaçage entre le système de collecte des recettes de la Narsa et le système GID (Gestion Intégrée des Dépenses)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "GID", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 3, priorite: "GOOD TO HAVE" },
  { titre: "Mise en place de système(s) de tracking des réalisations terrain des actions des partenaires financés par la Narsa", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Module services aux partenaires (ONG, associations, Ecoles, …)", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation d'outil BI connecté aux SI de la Narsa, facilitant l'analytic et le reporting", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outil BI", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Implémentation d'outil (tableau de bord) de suivi des demandes média", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Outil BI", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Implémentations d'outils analytics IA d'exploitation et de valorisation plus approfondie des données", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outil BI", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise à jour de l'outil BPM (Business Process Management) MEGA", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PQACG", statutSource: "NOUVEAU", siConcerne: "Outil BPM MEGA", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Plateforme centralisée interne - Construction et intégration d'un outil/espace de Knowledge Management et de gestion documentaire", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outil de KM et de gestion documentaire", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Plateforme centralisée interne: Intégration d'un outil de ticketing pour la gestion des sollicitations internes (SI et Data)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outil de ticketing", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Automatisation de la production documentaire (rapports d’activité, document administratif, …)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outils de productivité (rapports automatiques, OCR, …)", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'une solution d'océrisation (Reconnaissance Optique de Caractères) permettant de scanner les données papiers", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Outils de productivité (rapports automatiques, OCR, …)", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Implémentation d'une plateforme data centralisée", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Plateforme Data", siSocle: "Plateforme Data", valeur: 4, complexite: 4, dureeMois: 12, priorite: "MUST HAVE" },
  { titre: "Mise en place d'une plateforme e-learning pour tous les collaborateurs de la Narsa", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Plateforme e-learning interne", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Construction d'un référentiel de données des permis de conduire", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Référentiel Permis de conduire", siSocle: "Plateforme Data", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Construction d'un référentiel de données des véhicules", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Référentiel Véhicules", siSocle: "Plateforme Data", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Mise en place d'un SI Achat", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Achat", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un système électronique de dépôt et de suivi de la facturation", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Achat", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 3, priorite: "MUST HAVE" },
  { titre: "Implémentation d'un nouveau système de gestion des cartes grises, pour la partie cyclomoteurs", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "EN COURS", siConcerne: "SI Cartes grises", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 4, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Implémentation d'un nouveau système de gestion des cartes grises: Extension des types de véhicules", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Cartes grises", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 4, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Etude d'opportunité sur la poursuite de l'utilisation du système Involys ou la mise en place d'un nouveau SI finance en remplacement", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Finance", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place de système d'aide à la comptabilité analytique", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Finance", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'un flux digital de collecte des données des recettes de la Narsa auprès des partenaires", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "EN COURS", siConcerne: "SI Finance", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise à jour de Involys dans le cadre du contrat de maintenance", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Finance", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 3, priorite: "GOOD TO HAVE" },
  { titre: "Digitalisation de la saisie des données des infractions par les agents des corps de contrôle, avec un canal de transmission en temps réel à la Narsa", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Infraction", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Intégration d'un système de notifications et de rappel sur les interfaces d'interaction avec les usagers en matière d'infraction", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Infraction", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Réalisation d'une revue fonctionnelle du Système de Gestion des Infractions", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Infraction", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Extention de la couverture fonctionnelle de l'application web interne infraction de saisie des déclarations et des réclamations papier", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Infraction", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Digitalisation et optimisation du traitement du contentieux  (dispatch, suivi du traitement, …)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "EN COURS", siConcerne: "SI Juridique", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation et intégration au SI conteniteux, d'un système digitale de la qualification des contentieux", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Juridique", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 3, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'une solution digitale de consolidation et centralisation des textes juridiques", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Juridique", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Déploiement d'outils d'IA d'aide à la recherche et à l'analyse de textes juridiques", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Juridique", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'un système de monitoring des infrastructures et des applicatifs déployés, soutenu par un reporting régulier et des alertes automatiques", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "PSI", statutSource: "NOUVEAU", siConcerne: "SI monitoring des infra et applicatifs", siSocle: "Plateforme technique SI", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Implémentation d'un nouveau système de gestion des permis de conduire", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Permis de conduire", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 4, dureeMois: 12, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un outil de gestion des réclamations, intégrant un système de pré-qualification des réclamations", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "EN COURS", siConcerne: "SI Réclamations", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Revue de la catégorisation des motifs de réclamation dans Chikaya", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Réclamations", siSocle: "Plateforme centralisée interne", valeur: 1, complexite: 1, dureeMois: 1, priorite: "NICE TO HAVE" },
  { titre: "Standardisation du formulaire de réception des réclamations papiers", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SI Réclamations", siSocle: "Plateforme centralisée interne", valeur: 1, complexite: 1, dureeMois: 1, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'un outil de gestion des risques", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PQACG", statutSource: "NOUVEAU", siConcerne: "SI Risque", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Mise en place d'un système de suivi et de gestion des déploiements des solutions SI", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "PSI", statutSource: "NOUVEAU", siConcerne: "SI suivi des déploiements de solutions", siSocle: "Plateforme technique SI", valeur: 3, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation d'un système d’information géographique (SIG) pour les opérations internes (surveillance et expertise en sécurité routière, déploiement et monitoring des équipements de contrôle, …)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "SIG", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'un SIRH (propre à la Narsa, ou utilisation d'un SIRH d'un partenaire institutionnel)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SIRH", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 4, dureeMois: 12, priorite: "MUST HAVE" },
  { titre: "Digitalisation du processus de recrutement avec utilisation de système ATS", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "SIRH", siSocle: "Plateforme centralisée interne", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Développement du socle d'une plateforme digitale interne permettant de centraliser les opérations internes et d'améliorer la collaboration interne", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Socle de la plateforme", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un système expert en accidentologie", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Système accidentologie", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation d'outil(s) d’analyse prédictive des accidents", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Système accidentologie", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Implémentation d'un système intelligent d'aide à la déclaration des anomalies des sollutions SI, de qualification et de dispatch des demandes", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "PSI", statutSource: "NOUVEAU", siConcerne: "Système d'aide à la déclarations d'anomalies SI", siSocle: "Plateforme technique SI", valeur: 2, complexite: 3, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'Api de recupération des données de suivi des formations dans le cadre du projet ASSR", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Système Education Routière", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'un système Observatoire de production des données clés de la Sécurité routière", categorie: "Optimisation des opérations internes", sousCategorie: "SI transverse", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Réferentiel de données de la sécurité routière", siSocle: "Plateforme Data", valeur: 3, complexite: 3, dureeMois: 12, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un PMO SI (module intégré à une plateforme PMO global)", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "PSI", statutSource: "NOUVEAU", siConcerne: "Système PMO", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un PMO NARSA (module intégré à une plateforme PMO global)", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Système PMO", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un PMO Sécurité routière (module intégré à une plateforme PMO global)", categorie: "Optimisation des opérations internes", sousCategorie: "SI pilotage et support", pole: "PSESR", statutSource: "NOUVEAU", siConcerne: "Système PMO", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Mise en place d'un système de gestion des entrepôts (WMS)", categorie: "Optimisation des opérations internes", sousCategorie: "SI métiers", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "WMS", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Intégration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d'un agent conversationnel intelligent et multilingue, avec option vocale", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Agent conversationnel intelligent", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Développement d'une version mobile de la plateforme digitale 360° d'accès aux services digitaux de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Application mobile Services aux citoyens", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 4, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Digitalisation de la saisie des données des accidents par les agents des corps de contrôle, avec un canal de transmission en temps réel à la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "Echange avec l'écosystème", pole: "PSESR", statutSource: "EN COURS", siConcerne: "Réferentiel de données de la sécurité routière", siSocle: "Plateforme Data", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Intégration de la Brigade Nationale de la Police Judiciaire et de la CNSS dans le parcours digital d'échange dans le cadre de la gestion des oppositions de véhicule", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Canaux d'échange avec l'écosysème", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Revue fonctionnelle et de l'architecture des canaux actuels d'échange avec l'écosystème de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "Echange avec l'écosystème", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Canaux d'échange avec l'écosysème", siSocle: "Plateforme centralisée interne", valeur: 3, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Digitalisation et centralisation des workflow de gestion des sollicitations de l'écosystème de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "Echange avec l'écosystème", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Canaux d'échange avec l'écosysème", siSocle: "Plateforme centralisée interne", valeur: 4, complexite: 3, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Digitalisation et intégration à la plateforme E-Rokhsati, du parcours d'échange du permis de conduire étranger", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "E-Rokhsati", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Construction et integration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d'un module Data as a Service (DaaS)", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Module DaaS", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Construction et integration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d'un module Open Data", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Module Open Data", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 4, dureeMois: 12, priorite: "MUST HAVE" },
  { titre: "Intégration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d’un module dédié aux services aux partenaires (ONG, écoles, associations, …) accompagnés par la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Module services aux partenaires (ONG, associations, Ecoles, …)", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Digitalisation et intégration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d'un workflow digitale gestion des demandes de labélisation des associations et ONG", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Module services aux partenaires (ONG, associations, Ecoles, …)", siSocle: "Plateforme digitale 360° externe", valeur: 1, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme digitale web 360° d'accès aux services digitaux de la Narsa, d’un module dédié aux services aux professionnels", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 5, complexite: null, dureeMois: null, priorite: "MUST HAVE" },
  { titre: "Interfaçage entre la plateforme 360° d'accès aux services de la Narsa, le SI homologation et la plateforme Téléservices (pour le cas des RTI)", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Interfaçage entre la plateforme 360° d'accès aux services de la Narsa, le SI homologation, le SI Immatriculation et la plateforme Téléservices (pour le cas des RTI)", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Interfaçage entre la plateforme digitale 360° d'accès aux services digitaux de la Narsa er la plateforme E-Rokhsati de gestion annexe du permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Interfaçage entre la plateforme digitale 360° d'accès aux services digitaux de la Narsa et la plateforme auto-école (teléservices)", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Interfaçage entre la plateforme digitale 360° d'accès aux services digitaux de la Narsa et la plateforme téléservices de gestion des professionnels", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux professionnels", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Digitalisation et intégration à la plateforme digitale 360° d'accès aux services de la Narsa, du parcours de gestion annexe des certificats d’immatriculation", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Intégration à la plateforme digitale web 360° d'accès aux services digitaux de la Narsa, d’un module dédié aux services aux usagers", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Intégration à la plateforme digitale 360° d'accès aux services de la Narsa, du parcours digitalisé d'authentification du permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Interfaçage entre la plateforme 360° d'accès aux services de la Narsa et le SI mutation", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 2, dureeMois: 1, priorite: "GOOD TO HAVE" },
  { titre: "Construction et intégration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa, d'une bibliothèque juridique numérique de la Narsa, soutenue par un agent conversationnel", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PAAJF", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 1, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Digitalisation des opérations relatives aux vignettes et intégration à la plateforme digitale 360° d'accès aux services digitaux de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 3, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Digitalisation et intégration à la plateforme digitale 360° d'accès aux services de la Narsa, du parcours de conversion du brevet militaire en permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 1, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme digitale 360° d'accès aux services de la Narsa, du parcours d'obtention de la prime à la casse ou de la prime au renouvellement", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Module services aux usagers", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 1, priorite: "NICE TO HAVE" },
  { titre: "Implémentation et intégration à la plateforme digital 360° d'accès aux services digitaux de la Narsa, d'outils dynamiques et innovants de sensibilisation (simulateurs, cartographies interractives, serious game, …)", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PCEPR", statutSource: "NOUVEAU", siConcerne: "Outils dynamiques de sensibilisation", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 4, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Extention de l'utilisation de la plateforme e-learning Perminou, aux candidats libres non inscrits à aucune auto-école", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Perminou", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Mise en place d'une plateforme e-learning pour les citoyens", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Plateforme e-learning externe", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Développement de plateforme Téléservices pour la gestion des Etablissements d'Enseignement à la Conduite", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Développement de plateformes Téléservices pour la gestion des Etablissements de Formation Continue des Moniteurs", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Développement de plateformes Téléservices pour la gestion des Etablissements d'Education à la Sécurité Routière", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Développement de plateforme Téléservices pour la gestion des animateurs des stages d’éducation à la sécurité routière", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Développement de plateforme Téléservices pour la gestion des revendeurs et des concessionnaires et garagistes", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "GOOD TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des agents du centre de contrôle technique", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des casseurs et ferrailleurs", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des experts VGA", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des fabricants des plaques d’immatriculation", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des laboratoires d’essai des véhicules", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des mandataires et des constructeurs", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des organismes de classification de véhicules de collection", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des organismes de formation des experts VGA", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des organismes délivrant le permis international", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 2, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des réseaux et des centres de contrôle technique", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "NICE TO HAVE" },
  { titre: "Intégration à la plateforme Téléservices d'un parcours de gestion des sessions d'éducation à la Sécurité Routière", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "Plateforme Teleservices", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Implémentation d'un nouveau système de gestion des examens à l'obtention du permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Examens au permis de conduire", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 4, complexite: 3, dureeMois: 6, priorite: "MUST HAVE" },
  { titre: "Configuration de Tasrih pour la gestion des réclamations des professionnels en matière d'infractions", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Infraction", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Implémentation d'un système de légalisation électronique des documents", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Mutation", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "NICE TO HAVE" },
  { titre: "Extention fonctionnelle du portail mutation pour intégrer d'autres cas", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "NOUVEAU", siConcerne: "SI Mutation", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 3, complexite: 2, dureeMois: 1, priorite: "GOOD TO HAVE" },
  { titre: "Digitalisation du parcours d'authentification du permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "PSCV", statutSource: "EN COURS", siConcerne: "SI Permis de conduire", siSocle: "Systèmes de gestion (PC, CG, Infractions)", valeur: 2, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
  { titre: "Implémentation et intégration d'un système d'information géographique à la plateforme digitale 360° d'accès aux services digitaux de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "SIG", siSocle: "Plateforme digitale 360° externe", valeur: 2, complexite: 2, dureeMois: 3, priorite: "NICE TO HAVE" },
  { titre: "Développement du socle d'une plateforme digitale 360° d'accès aux services digitaux de la Narsa", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Socle plateforme", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 3, dureeMois: 9, priorite: "MUST HAVE" },
  { titre: "Intégration à la plateforme digitale  360° d'accès aux services de la Narsa, de deux systèmes d'authentification et de connexion, via la CIN ou le permis de conduire", categorie: "Services digitaux aux usagers", sousCategorie: "E-services", pole: "Transverse", statutSource: "NOUVEAU", siConcerne: "Socle plateforme", siSocle: "Plateforme digitale 360° externe", valeur: 3, complexite: 2, dureeMois: 6, priorite: "GOOD TO HAVE" },
];

export async function seedEnrichi(
  prisma: PrismaClient,
  planSnsrId: string,
  planSiId: string,
): Promise<{ populations: number; pulses: number; initiatives: number; transitions: number }> {
  // ── Utilisateurs incarnant les rôles PPM (notifications par nom) ─────────
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const rolesUsers = [
    { email: 'cp.dsi@narsa.ma', name: 'Mehdi El Fassi', role: 'PMO' },
    { email: 'po.metier@narsa.ma', name: 'Salma Benjelloun', role: 'CONTRIBUTEUR' },
    { email: 'proxy.po@narsa.ma', name: 'Hicham Cherkaoui', role: 'CONTRIBUTEUR' },
    { email: 'keyuser1@narsa.ma', name: 'Karim Alaoui', role: 'CONTRIBUTEUR' },
    { email: 'keyuser2@narsa.ma', name: 'Rim Tazi', role: 'CONTRIBUTEUR' },
  ];
  for (const u of rolesUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash },
      create: { ...u, passwordHash },
    });
  }

  // ── Signaux du moteur de risque sur le plan SNSR ──────────────────────────
  const actionsSnsr = await prisma.action.findMany({
    where: { planId: planSnsrId, statut: 'EN_COURS', niveau: { gte: 3 } },
    orderBy: { titre: 'asc' },
    take: 8,
    select: { id: true, budget: true },
  });
  // Confiance faible déclarée au check-in (facteur CONFIANCE)
  for (const a of actionsSnsr.slice(0, 3)) {
    await prisma.action.update({ where: { id: a.id }, data: { confiance: 2 } });
  }
  // Burn budgétaire décorrélé (facteur BUDGET)
  for (const a of actionsSnsr.slice(3, 5)) {
    if (a.budget) {
      await prisma.action.update({
        where: { id: a.id },
        data: { budgetConso: Math.round(a.budget * 0.85), avancement: 30 },
      });
    }
  }

  // ── Populations & pulses (plan SNSR) ──────────────────────────────────────
  await prisma.pulse.deleteMany({ where: { population: { planId: planSnsrId } } });
  await prisma.population.deleteMany({ where: { planId: planSnsrId } });
  const populationsData = [
    {
      nom: 'Agents guichet région Nord', effectif: 240, trancheAge: 'PLUS_50',
      ancienneteMoyenne: 16, maturiteDigitale: 2, expositionChangement: 'FORTE',
      pulses: [
        { jours: 45, adhesion: 58, comprehension: 62, preparation: 50, repondants: 64 },
        { jours: 10, adhesion: 41, comprehension: 55, preparation: 35, repondants: 71 },
      ],
    },
    {
      nom: 'Conseillers clientèle', effectif: 115, trancheAge: 'ENTRE_35_50',
      ancienneteMoyenne: 8, maturiteDigitale: 3, expositionChangement: 'MOYENNE',
      pulses: [{ jours: 10, adhesion: 63, comprehension: 70, preparation: 58, repondants: 42 }],
    },
    {
      nom: 'Contrôleurs routiers', effectif: 310, trancheAge: 'MIXTE',
      ancienneteMoyenne: 12, maturiteDigitale: 3, expositionChangement: 'FORTE',
      pulses: [{ jours: 18, adhesion: 57, comprehension: 61, preparation: 49, repondants: 96 }],
    },
    {
      nom: 'Équipes DSI', effectif: 85, trancheAge: 'MOINS_35',
      ancienneteMoyenne: 4, maturiteDigitale: 4, expositionChangement: 'MOYENNE',
      pulses: [{ jours: 10, adhesion: 79, comprehension: 84, preparation: 72, repondants: 38 }],
    },
  ];
  let nbPulses = 0;
  const actionsALier = await prisma.action.findMany({
    where: { planId: planSnsrId, niveau: { gte: 3 } },
    orderBy: { titre: 'asc' },
    take: 10,
    select: { id: true },
  });
  let cursorLien = 0;
  for (const p of populationsData) {
    const { pulses, ...profil } = p;
    const pop = await prisma.population.create({ data: { ...profil, planId: planSnsrId } });
    for (const pl of pulses) {
      const { jours, ...valeurs } = pl;
      await prisma.pulse.create({ data: { ...valeurs, populationId: pop.id, date: ilYA(jours) } });
      nbPulses++;
    }
    // 2-3 actions liées par population, impacts variés
    const impacts = ['TRANSFORME', 'FORME', 'INFORME'];
    for (let k = 0; k < 3 && cursorLien < actionsALier.length; k++, cursorLien++) {
      await prisma.actionPopulation.create({
        data: {
          populationId: pop.id,
          actionId: actionsALier[cursorLien]!.id,
          niveauImpact: impacts[k % 3]!,
        },
      });
    }
  }

  // ── PPM DSI : domaines & portefeuille réel de la feuille de route digitale
  // NARSA (« Liste des projets digitaux priorisés V3 »). Remplace toute donnée
  // de démonstration précédemment chargée pour ce plan.
  await prisma.transitionCycle.deleteMany({ where: { initiative: { planId: planSiId } } });
  await prisma.initiative.deleteMany({ where: { planId: planSiId } });
  await prisma.sousDomaine.deleteMany({ where: { domaine: { planId: planSiId } } });
  await prisma.domaine.deleteMany({ where: { planId: planSiId } });

  const sousDomaineIds = new Map<string, { domaineId: string; sousDomaineId: string }>();
  for (const [i, d] of DOMAINES_ROADMAP_DIGITALE.entries()) {
    const dom = await prisma.domaine.create({
      data: { planId: planSiId, nom: d.nom, type: d.type, ordre: i },
    });
    for (const [j, nomSd] of d.sousDomaines.entries()) {
      const sd = await prisma.sousDomaine.create({
        data: { domaineId: dom.id, nom: nomSd, ordre: j },
      });
      sousDomaineIds.set(`${d.nom}/${nomSd}`, { domaineId: dom.id, sousDomaineId: sd.id });
    }
  }

  let nbTransitions = 0;
  for (const projet of PROJETS_DIGITAUX_NARSA) {
    const refs = sousDomaineIds.get(`${projet.categorie}/${projet.sousCategorie}`);
    const poleLabel = POLE_LABELS[projet.pole] ?? projet.pole;
    const statutCycle = STATUT_SOURCE_VERS_CYCLE[projet.statutSource] ?? 'NON_QUALIFIE';
    const description = [
      `Pôle porteur : ${poleLabel}`,
      `Catégorie : ${projet.categorie} / ${projet.sousCategorie}`,
      `SI concerné : ${projet.siConcerne ?? '—'}`,
      `SI socle : ${projet.siSocle ?? '—'}`,
      `Complexité (1-4) : ${projet.complexite ?? '—'}`,
      `Durée estimée : ${projet.dureeMois ? `${projet.dureeMois} mois` : '—'}`,
      `Priorité (MoSCoW) : ${projet.priorite}`,
      `Statut source : ${projet.statutSource}`,
      '',
      'Source : Liste des projets digitaux priorisés NARSA V3 (onglet « Liste brut projets »).',
    ].join('\n');

    const initiative = await prisma.initiative.create({
      data: {
        planId: planSiId,
        titre: projet.titre,
        description,
        type: 'PROJET',
        mode: 'WATERFALL',
        statutCycle,
        domaineId: refs?.domaineId ?? null,
        sousDomaineId: refs?.sousDomaineId ?? null,
        valeurMetier: Math.min(5, Math.max(1, projet.valeur)),
      },
    });

    // Historique minimal : trace la qualification initiale et, le cas
    // échéant, l'avancement déjà constaté sur le terrain (statut « EN COURS »).
    if (statutCycle !== 'NON_QUALIFIE') {
      await prisma.transitionCycle.create({
        data: {
          initiativeId: initiative.id,
          de: 'NON_QUALIFIE',
          vers: statutCycle,
          par: 'Import Excel',
          commentaire: 'Import initial — Liste des projets digitaux priorisés NARSA V3.',
        },
      });
      nbTransitions++;
    }
  }

  return {
    populations: populationsData.length,
    pulses: nbPulses,
    initiatives: PROJETS_DIGITAUX_NARSA.length,
    transitions: nbTransitions,
  };
}
