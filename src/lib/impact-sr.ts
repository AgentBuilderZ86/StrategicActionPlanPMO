/**
 * Impact sécurité routière — relie les actions du plan aux leviers nationaux
 * du Baromètre de la Sécurité Routière 2024 (NARSA/CNER, données consolidées,
 * RGPH 2024), afin de rendre visible l'enjeu humain derrière chaque action.
 *
 * MÉTHODOLOGIE ET LIMITES : les fourchettes de vies par an sont des ordres de
 * grandeur INDICATIFS de niveau national, dérivés des chiffres et des leviers
 * cités par le baromètre (références OMS, ONISR et Cerema citées par le
 * document). Elles décrivent le potentiel du LEVIER auquel une action se
 * rattache si celui-ci était déployé à plein effet à l'échelle nationale.
 * Elles ne constituent en aucun cas une prévision d'impact de l'action
 * elle-même. Fonctions pures, testables.
 */

export const BAROMETRE_2024 = {
  annee: 2024,
  accidentsCorporels: 71_629,
  tues: 2_006,
  blessesGraves: 7_345,
  blessesLegers: 95_947,
  evolutionTues: '+4,0 % vs 2023',
  evolutionBG: '+27,7 % vs 2023',
  partUsagersVulnerables: 73, // % des tués (2-3RM + piétons + cyclistes)
  source:
    'Baromètre de la Sécurité Routière 2024 — NARSA/CNER (données consolidées, RGPH 2024)',
} as const;

export type LevierSR = {
  code: string;
  libelle: string;
  /** Mots-clés (sans accents, minuscules) reconnus dans le titre/description/axe. */
  motsCles: string[];
  viesMin: number;
  viesMax: number;
  /** Constat chiffré du baromètre qui fonde la fourchette. */
  fondement: string;
  reference: string;
};

/** Fourchettes dérivées du Baromètre SR 2024 (voir en-tête pour les limites). */
export const LEVIERS_SR: LevierSR[] = [
  {
    code: 'CASQUE_2RM',
    libelle: 'Casque et sécurité des 2-3 roues motorisés',
    motsCles: ['casque', '2rm', '2-3rm', 'deux-roues', 'deux roues', 'moto', 'cyclomoteur'],
    viesMin: 200,
    viesMax: 300,
    fondement:
      '816 tués en 2-3RM en 2024 (41 % du total, +7,6 %) ; port du casque estimé à ~60 %. Passage à 99 % : potentiel ~300 vies/an.',
    reference: 'OMS, cité par le Baromètre SR 2024',
  },
  {
    code: 'CONTROLE_AUTO',
    libelle: 'Contrôle automatisé et sanction (radars)',
    motsCles: ['radar', 'controle automatise', 'controle-sanction', 'sanction', 'verbalisation', 'controle routier'],
    viesMin: 150,
    viesMax: 420,
    fondement:
      "~550 radars au Maroc vs ~4 700 en France. Le déploiement massif français (2003) a réduit la mortalité de 21 %, soit l'équivalent de ~420 vies/an rapporté aux 2 006 tués de 2024.",
    reference: 'ONISR, cité par le Baromètre SR 2024',
  },
  {
    code: 'VITESSE',
    libelle: 'Maîtrise des vitesses (routes bidirectionnelles)',
    motsCles: ['vitesse', '80 km/h', 'limitation', 'bidirectionnelle', 'exces de vitesse'],
    viesMin: 100,
    viesMax: 250,
    fondement:
      '54 % des tués hors agglomération, risque concentré sur les bidirectionnelles sans séparation. La mesure française 80 km/h : -349 vies/an.',
    reference: 'Cerema, cité par le Baromètre SR 2024',
  },
  {
    code: 'PIETONS',
    libelle: 'Protection des piétons',
    motsCles: ['pieton', 'traversee', 'passage pieton', 'trottoir', 'zone 30'],
    viesMin: 50,
    viesMax: 160,
    fondement: '542 piétons tués en 2024 (27 % du total) ; usagers vulnérables : 73 % des décès.',
    reference: 'Baromètre SR 2024 (NARSA/CNER)',
  },
  {
    code: 'JEUNES_CONDUCTEURS',
    libelle: 'Jeunes conducteurs et conduites à risque',
    motsCles: ['alcool', 'stupefiant', 'jeune conducteur', 'permis probatoire', '18-34', 'conduite a risque'],
    viesMin: 60,
    viesMax: 150,
    fondement: 'Les 18-34 ans représentent 38 % des tués ; les 25-34 ans sont la tranche la plus touchée (438 tués).',
    reference: 'Baromètre SR 2024 (NARSA/CNER)',
  },
  {
    code: 'SECOURS',
    libelle: 'Secours et prise en charge post-accident',
    motsCles: ['samu', 'secours', 'urgence', 'evacuation', 'prise en charge', 'trauma'],
    viesMin: 40,
    viesMax: 120,
    fondement:
      'Les 3 régions du Sud affichent des taux de mortalité 5 à 7 fois supérieurs à la moyenne, avec une faible couverture SAMU en facteur cité.',
    reference: 'Baromètre SR 2024 (NARSA/CNER)',
  },
  {
    code: 'EDUCATION',
    libelle: 'Éducation, sensibilisation, formation',
    motsCles: ['sensibilisation', 'formation', 'education routiere', 'campagne', 'permis', 'auto-ecole'],
    viesMin: 30,
    viesMax: 100,
    fondement:
      'Facteurs comportementaux dominants (vitesse, casque ~60 %, conduites à risque des 18-34 ans, 85 % des tués sont des hommes).',
    reference: 'Baromètre SR 2024 (NARSA/CNER)',
  },
  {
    code: 'INFRASTRUCTURE',
    libelle: 'Infrastructure et aménagements de sécurité',
    motsCles: ['infrastructure', 'amenagement', 'glissiere', 'point noir', 'signalisation', 'eclairage', 'route'],
    viesMin: 60,
    viesMax: 180,
    fondement:
      'Hors agglomération : 54 % des décès malgré un trafic moindre ; les bidirectionnelles sans séparation concentrent le risque.',
    reference: 'Baromètre SR 2024 (NARSA/CNER)',
  },
];

export const DISCLAIMER_IMPACT =
  "Fourchettes indicatives de niveau national dérivées du Baromètre SR 2024 (NARSA/CNER ; réf. OMS, ONISR, Cerema citées par le baromètre). Elles décrivent le potentiel du levier auquel l'action se rattache, pas une prévision d'impact de l'action elle-même.";

const normaliser = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Leviers reconnus dans un texte libre (titre, description, axe). */
export function leviersPourTexte(texte: string): LevierSR[] {
  const t = normaliser(texte);
  return LEVIERS_SR.filter((l) => l.motsCles.some((m) => t.includes(m)));
}

export type EnjeuAction = { levier: LevierSR };

/** Enjeu d'une action : premier levier reconnu (le plus fort en cas d'ambiguïté). */
export function enjeuAction(a: {
  titre: string;
  description?: string | null;
  axe?: string | null;
}): EnjeuAction | null {
  const texte = [a.titre, a.description ?? '', a.axe ?? ''].join(' ');
  const leviers = leviersPourTexte(texte);
  if (leviers.length === 0) return null;
  const meilleur = [...leviers].sort((x, y) => y.viesMax - x.viesMax)[0]!;
  return { levier: meilleur };
}

export type EnjeuCumule = {
  viesMin: number;
  viesMax: number;
  leviers: LevierSR[];
  actionsCouvertes: number;
};

/**
 * Enjeu cumulé d'un portefeuille d'actions : chaque levier n'est compté
 * qu'UNE fois même si plusieurs actions s'y rattachent (pas d'addition
 * artificielle), car la fourchette décrit le levier national, pas l'action.
 */
export function enjeuCumule(
  actions: { titre: string; description?: string | null; axe?: string | null; statut: string }[],
): EnjeuCumule {
  const actives = actions.filter((a) => a.statut !== 'TERMINE');
  const parCode = new Map<string, LevierSR>();
  let couvertes = 0;
  for (const a of actives) {
    const enjeu = enjeuAction(a);
    if (enjeu) {
      couvertes++;
      parCode.set(enjeu.levier.code, enjeu.levier);
    }
  }
  const leviers = [...parCode.values()];
  return {
    viesMin: leviers.reduce((s, l) => s + l.viesMin, 0),
    viesMax: leviers.reduce((s, l) => s + l.viesMax, 0),
    leviers,
    actionsCouvertes: couvertes,
  };
}
