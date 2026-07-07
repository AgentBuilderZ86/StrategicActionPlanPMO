import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculerCodesArbre } from './tree';
import { seedEnrichi } from './seed-enrichi';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function date(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

// Historique d'avancement (4 points de mesure) pour une action feuille.
async function seedHistorique(prisma: PrismaClient, actionId: string, avancement: number) {
  for (let s = 1; s <= 4; s++) {
    const valeur = Math.round((avancement * s) / 4);
    await prisma.avancement.create({
      data: {
        actionId,
        date: daysFromNow(-30 * (4 - s)),
        valeur,
        statut: valeur >= 100 ? 'TERMINE' : valeur > 0 ? 'EN_COURS' : 'A_LANCER',
      },
    });
  }
}

type ActionRow = [
  string,   // titre
  number,   // axeIdx
  number,   // regionIdx
  number,   // entiteIdx
  string,   // responsable
  string,   // statut
  number,   // avancement
  string,   // priorite
  number,   // finDays (relatif à aujourd'hui)
  number,   // budget k MAD
  number,   // budgetConso k MAD
  number,   // niveau (ignoré : la profondeur est désormais dérivée de l'arbre)
  (string | null)?,  // commentaire
  (string | null)?,  // indicateur
  (number | null)?,  // cibleIndicateur
  (number | null)?,  // valeurIndicateur
];

/**
 * Crée l'arborescence d'un plan : un Pilier (niveau 1) par axe, les actions
 * rattachées (niveau 2), et quelques sous-actions (niveau 3) pour illustrer la
 * profondeur. Les codes sont ensuite recalculés de façon cohérente avec l'arbre.
 */
async function seedActionsHierarchiques(
  prisma: PrismaClient,
  planId: string,
  axes: { id: string; nom: string }[],
  regionId: (i: number) => string,
  entiteId: (i: number) => string,
  rows: ActionRow[],
) {
  // Niveau 1 : un Pilier par axe (avancement = moyenne de ses actions).
  const piliers = new Map<number, string>();
  for (let i = 0; i < axes.length; i++) {
    const rowsAxe = rows.filter((r) => r[1] === i);
    const av = rowsAxe.length
      ? Math.round(rowsAxe.reduce((s, r) => s + r[6], 0) / rowsAxe.length)
      : 0;
    const pilier = await prisma.action.create({
      data: {
        titre: axes[i]!.nom,
        planId,
        axeId: axes[i]!.id,
        responsable: 'Direction NARSA',
        statut: av >= 100 ? 'TERMINE' : av > 0 ? 'EN_COURS' : 'A_LANCER',
        avancement: av,
        priorite: 'HAUTE',
        niveau: 1,
        ordre: i,
      },
    });
    piliers.set(i, pilier.id);
  }

  // Niveau 2 : les actions, rattachées à leur pilier ; niveau 3 : sous-actions
  // sur la première action de chaque plan.
  const ordreParAxe = new Map<number, number>();
  let premier = true;
  for (const row of rows) {
    const [titre, axe, reg, ent, responsable, statut, avancement, priorite, finDays, budget, conso, , commentaire, indicateur, cible, valeur] = row;
    const ordre = ordreParAxe.get(axe) ?? 0;
    ordreParAxe.set(axe, ordre + 1);

    const action = await prisma.action.create({
      data: {
        titre,
        planId,
        axeId: axes[axe]!.id,
        paysId: regionId(reg),
        entiteId: entiteId(ent),
        parentId: piliers.get(axe)!,
        responsable,
        statut,
        avancement,
        priorite,
        dateDebut: daysFromNow(finDays - 360),
        dateFin: daysFromNow(finDays),
        budget,
        budgetConso: conso,
        niveau: 2,
        ordre,
        commentaire: commentaire ?? null,
        indicateur: indicateur ?? null,
        cibleIndicateur: cible ?? null,
        valeurIndicateur: valeur ?? null,
      },
    });
    await seedHistorique(prisma, action.id, avancement);

    // Indicateur multi-lignes (T1.2) migré depuis le triplet historique.
    if (indicateur) {
      await prisma.indicateur.create({
        data: {
          actionId: action.id,
          libelle: indicateur,
          unite: indicateur.includes('%') ? '%' : null,
          cible: cible ?? null,
          realise: valeur ?? null,
          sens: 'HAUSSE',
          agregeable: true,
        },
      });
    }

    // Jalons (T2.1) : lancement + revue à mi-parcours + livraison.
    await prisma.jalon.createMany({
      data: [
        { actionId: action.id, titre: 'Lancement', date: daysFromNow(finDays - 360), atteint: avancement > 0 },
        { actionId: action.id, titre: 'Revue à mi-parcours', date: daysFromNow(finDays - 180), atteint: avancement >= 50 },
        { actionId: action.id, titre: 'Livraison', date: daysFromNow(finDays), atteint: statut === 'TERMINE' },
      ],
    });

    // Commentaires de contexte (démo collaboration) : blocages et actions
    // prioritaires en retard de démarrage.
    if (statut === 'BLOQUE') {
      await prisma.commentaire.create({
        data: { actionId: action.id, auteurNom: 'pmo@narsa.ma', contenu: 'Action bloquée : arbitrage budgétaire en attente au comité de pilotage.' },
      });
    } else if (priorite === 'HAUTE' && avancement < 40 && statut !== 'TERMINE') {
      await prisma.commentaire.create({
        data: { actionId: action.id, auteurNom: 'pmo@narsa.ma', contenu: 'Action prioritaire en retard de démarrage — point de suivi hebdomadaire mis en place avec le responsable.' },
      });
    }

    if (premier) {
      premier = false;
      const sousActions: [string, number][] = [
        ['Étude de cadrage et diagnostic', Math.min(100, avancement + 20)],
        ['Déploiement opérationnel et suivi', Math.max(0, avancement - 15)],
      ];
      for (let k = 0; k < sousActions.length; k++) {
        const sa = await prisma.action.create({
          data: {
            titre: sousActions[k]![0],
            planId,
            axeId: axes[axe]!.id,
            paysId: regionId(reg),
            entiteId: entiteId(ent),
            parentId: action.id,
            responsable,
            statut: 'EN_COURS',
            avancement: sousActions[k]![1],
            priorite: 'MOYENNE',
            dateFin: daysFromNow(finDays - 60),
            niveau: 3,
            ordre: k,
          },
        });
        await seedHistorique(prisma, sa.id, sousActions[k]![1]);
      }
    }
  }

  // Codification automatique cohérente avec l'arbre (T0.2).
  const actions = await prisma.action.findMany({
    where: { planId },
    select: { id: true, parentId: true, niveau: true, ordre: true },
  });
  for (const [id, code] of calculerCodesArbre(actions)) {
    await prisma.action.update({ where: { id }, data: { code } });
  }
}

/** Amorce le volet Agile (sprints + backlog Kanban) d'un plan SI (T2.3). */
async function seedAgile(prisma: PrismaClient, planId: string) {
  const [s1, s2, s3] = await Promise.all([
    prisma.sprint.create({ data: { planId, nom: 'Sprint 1 — Socle', statut: 'CLOS', ordre: 0, dateDebut: daysFromNow(-42), dateFin: daysFromNow(-28), objectif: 'Mettre en place le socle technique et CI/CD.' } }),
    prisma.sprint.create({ data: { planId, nom: 'Sprint 2 — Portail', statut: 'EN_COURS', ordre: 1, dateDebut: daysFromNow(-7), dateFin: daysFromNow(7), objectif: 'Livrer le portail permis de conduire en ligne.' } }),
    prisma.sprint.create({ data: { planId, nom: 'Sprint 3 — Mobile', statut: 'PLANIFIE', ordre: 2, dateDebut: daysFromNow(8), dateFin: daysFromNow(22), objectif: 'Application NARSA Mobile — MVP.' } }),
  ]);
  const sid = [s1.id, s2.id, s3.id];

  // [titre, points, colonne Kanban, index sprint (-1 = backlog), assigné]
  const items: [string, number, string, number, string][] = [
    ['Provisionner l’environnement cloud souverain', 8, 'TERMINE', 0, 'Équipe Infra'],
    ['Mettre en place le pipeline CI/CD', 5, 'TERMINE', 0, 'Équipe Infra'],
    ['Configurer l’authentification SSO', 5, 'TERMINE', 0, 'Équipe Sécurité'],
    ['Modèle de données permis de conduire', 3, 'TERMINE', 1, 'Équipe Back'],
    ['API de dépôt de dossier en ligne', 8, 'EN_REVUE', 1, 'Équipe Back'],
    ['Écran de suivi de dossier (front)', 5, 'EN_COURS', 1, 'Équipe Front'],
    ['Paiement en ligne des redevances', 8, 'EN_COURS', 1, 'Équipe Back'],
    ['Notifications e-mail/SMS usager', 3, 'A_FAIRE', 1, 'Équipe Back'],
    ['Tableau de bord agent régional', 5, 'A_FAIRE', 1, 'Équipe Front'],
    ['Tests de charge portail', 3, 'A_FAIRE', 1, 'Équipe QA'],
    ['Maquettes application mobile', 3, 'A_FAIRE', 2, 'UX/UI'],
    ['Auth mobile + biométrie', 5, 'BACKLOG', 2, 'Équipe Mobile'],
    ['Consultation des points de permis', 3, 'BACKLOG', 2, 'Équipe Mobile'],
    ['Prise de rendez-vous visite technique', 5, 'BACKLOG', 2, 'Équipe Mobile'],
    ['Open data — API publique statistiques SR', 8, 'BACKLOG', -1, 'Équipe Data'],
    ['Interconnexion base accidents ↔ santé', 13, 'BACKLOG', -1, 'Équipe Data'],
  ];

  await prisma.itemBacklog.createMany({
    data: items.map(([titre, points, statut, sIdx, assigne], i) => ({
      planId, titre, points, statut, assigne, ordre: i,
      sprintId: sIdx >= 0 ? sid[sIdx]! : null,
    })),
  });
}

/** (Ré)initialise le jeu de données de démonstration NARSA. Idempotent. */
export async function seedDemo(prisma: PrismaClient) {
  // Tables sans cascade depuis Plan/Action : à purger explicitement.
  await prisma.itemBacklog.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.attributDef.deleteMany();
  await prisma.notification.deleteMany();
  // Le reste (indicateurs, commentaires, demandes, attributs valeurs, jalons,
  // avancements) est supprimé en cascade avec les actions.
  await prisma.avancement.deleteMany();
  await prisma.jalon.deleteMany();
  await prisma.action.deleteMany();
  await prisma.entite.deleteMany();
  await prisma.pays.deleteMany();
  await prisma.axe.deleteMany();
  await prisma.snapshotCopil.deleteMany();
  await prisma.plan.deleteMany();

  // ─── Plan 1 : PMO Écosystème — SNSR 2026-2030 ──────────────────────────────
  const planSnsr = await prisma.plan.create({
    data: {
      nom: "Plan d'Action National de la Sécurité Routière 2026-2030",
      dateDebut: date(2026, 1, 1),
      dateFin: date(2030, 12, 31),
      typePmo: 'ECOSYSTEME',
      objectif: "Réduire de 50% le nombre de tués et de blessés graves d'ici 2030",
    },
  });

  // 5 Piliers Stratégiques SNSR (selon le CPS NARSA)
  const axesSnsr = await Promise.all([
    prisma.axe.create({ data: { nom: 'Gestion de la vitesse', ordre: 0, planId: planSnsr.id } }),
    prisma.axe.create({ data: { nom: 'Protection des usagers vulnérables', ordre: 1, planId: planSnsr.id } }),
    prisma.axe.create({ data: { nom: 'Traitement des points accidentogènes', ordre: 2, planId: planSnsr.id } }),
    prisma.axe.create({ data: { nom: 'Rendre les véhicules plus sûrs', ordre: 3, planId: planSnsr.id } }),
    prisma.axe.create({ data: { nom: "Renforcer l'efficacité des réponses post-accidents", ordre: 4, planId: planSnsr.id } }),
  ]);

  // 12 Régions du Maroc (Directions Régionales NARSA)
  const regionsData = [
    { nom: 'Rabat-Salé-Kénitra', code: 'RSK' },
    { nom: 'Casablanca-Settat', code: 'CS' },
    { nom: 'Marrakech-Safi', code: 'MS' },
    { nom: 'Fès-Meknès', code: 'FM' },
    { nom: 'Tanger-Tétouan-Al Hoceïma', code: 'TTH' },
    { nom: 'Oriental', code: 'OR' },
    { nom: 'Béni Mellal-Khénifra', code: 'BMK' },
    { nom: 'Drâa-Tafilalet', code: 'DT' },
    { nom: 'Souss-Massa', code: 'SM' },
    { nom: 'Guelmim-Oued Noun', code: 'GON' },
    { nom: 'Laâyoune-Sakia El Hamra', code: 'LSH' },
    { nom: 'Dakhla-Oued Ed-Dahab', code: 'DOD' },
  ];
  const regions = await Promise.all(
    regionsData.map((r) => prisma.pays.create({ data: { ...r, planId: planSnsr.id } })),
  );

  // Partenaires institutionnels (pour PMO Écosystème)
  const partenairesData = [
    { nom: 'Ministère du Transport et de la Logistique', paysIdx: 0 },
    { nom: "Ministère de l'Intérieur (Gendarmerie/Police)", paysIdx: 1 },
    { nom: 'Ministère de la Santé', paysIdx: 2 },
    { nom: "Ministère de l'Éducation Nationale", paysIdx: 3 },
    { nom: "Ministère de l'Équipement et de l'Eau", paysIdx: 0 },
    { nom: 'Comité National de Prévention des Accidents (CNPAC)', paysIdx: 1 },
  ];
  const partenaires = await Promise.all(
    partenairesData.map((e) =>
      prisma.entite.create({
        data: { nom: e.nom, paysId: regions[e.paysIdx]!.id, planId: planSnsr.id },
      }),
    ),
  );

  const rs = (i: number) => regions[i]!.id;
  const pa = (i: number) => partenaires[i]!.id;

  // Actions SNSR — Plan d'action national
  const actionsSnsr: ActionRow[] = [
    // Pilier 1 : Gestion de la vitesse
    ['Programme national de contrôle automatisé de la vitesse', 0, 0, 0, 'Dir. Contrôle NARSA', 'EN_COURS', 65, 'HAUTE', 365, 12000, 7800, 4, 'Déploiement de 200 radars fixes sur le réseau national.', 'Nb radars déployés', 200, 130],
    ['Révision des limites de vitesse sur réseau secondaire', 0, 2, 4, 'Dir. Technique NARSA', 'EN_COURS', 45, 'HAUTE', 180, 800, 360, 4, null, 'Km de voirie révisée', 2500, 1125],
    ['Campagnes nationales de sensibilisation vitesse', 0, 1, 5, 'Pôle Communication', 'EN_COURS', 70, 'MOYENNE', 120, 2500, 1750, 4, null, 'Personnes sensibilisées', 500000, 350000],
    ["Formation des forces de l'ordre au contrôle vitesse", 0, 0, 1, 'Pôle Sécurité Conduite', 'TERMINE', 100, 'MOYENNE', -30, 600, 590, 4, null],
    ["Étude d'impact des zones 30 km/h en milieu urbain", 0, 3, 4, 'Pôle Surveillance SR', 'A_LANCER', 0, 'BASSE', 300, 400, 0, 3],

    // Pilier 2 : Protection des usagers vulnérables
    ['Programme national de port du casque moto', 1, 0, 1, 'Dir. Prévention NARSA', 'EN_COURS', 55, 'HAUTE', 270, 1800, 990, 4, 'Campagne + contrôle + subvention casque.', 'Taux port casque %', 75, 41],
    ['Sécurisation des abords des établissements scolaires', 1, 1, 3, 'Dir. Régionale CS', 'EN_COURS', 40, 'HAUTE', 365, 5000, 2000, 4, 'Programme interministériel Éducation-Transport.', 'Établissements sécurisés', 1500, 600],
    ['Infrastructure piétonne sur axes dangereux', 1, 4, 4, 'Ministère Équipement', 'EN_COURS', 30, 'HAUTE', 540, 8000, 2400, 3, null, 'Km de trottoirs aménagés', 300, 90],
    ['Campagne piétons et cyclistes — milieu rural', 1, 6, 5, 'Pôle Communication', 'A_LANCER', 0, 'MOYENNE', 180, 900, 0, 4],
    ['Gilets rétroréfléchissants pour usagers vulnérables', 1, 2, 5, 'Pôle Communication', 'TERMINE', 100, 'BASSE', -60, 350, 342, 4, null, 'Gilets distribués', 50000, 50000],

    // Pilier 3 : Traitement des points accidentogènes
    ['Cartographie nationale des points noirs accidentogènes', 2, 0, 4, 'Pôle Surveillance SR', 'TERMINE', 100, 'HAUTE', -90, 1200, 1190, 3, 'Base de données géoréférencée complète.', 'Points noirs identifiés', 850, 850],
    ['Traitement de 100 points noirs prioritaires', 2, 2, 4, 'Dir. Technique NARSA', 'EN_COURS', 48, 'HAUTE', 420, 15000, 7200, 4, null, 'Points noirs traités', 100, 48],
    ['Audit de sécurité des routes nationales', 2, 3, 4, 'Pôle Surveillance SR', 'EN_COURS', 60, 'HAUTE', 240, 3000, 1800, 3, null, 'Km audités', 6000, 3600],
    ['Installation de glissières de sécurité sur axes à risque', 2, 5, 4, 'Ministère Équipement', 'EN_COURS', 35, 'MOYENNE', 365, 6000, 2100, 4, null, 'Km équipés', 500, 175],
    ['Signalisation horizontale et verticale — réseau national', 2, 0, 4, 'Ministère Équipement', 'EN_COURS', 50, 'MOYENNE', 300, 4500, 2250, 4, null],

    // Pilier 4 : Rendre les véhicules plus sûrs
    ['Réforme du contrôle technique obligatoire', 3, 1, 0, 'Pôle Sécurité Conduite', 'EN_COURS', 55, 'HAUTE', 365, 2000, 1100, 3, 'Digitalisation et renforcement des centres agréés.', 'Centres certifiés', 800, 440],
    ['Lutte contre les véhicules non conformes', 3, 3, 1, 'Gendarmerie/Police', 'EN_COURS', 42, 'HAUTE', 270, 1500, 630, 4, "Opérations conjointes NARSA/Forces de l'ordre.", 'Véhicules retirés circulation', 5000, 2100],
    ['Homologation des équipements de sécurité véhicules', 3, 0, 0, 'CNEH-NARSA', 'EN_COURS', 70, 'MOYENNE', 180, 800, 560, 4, null],
    ['Campagne anti-surcharge des poids lourds', 3, 2, 1, 'Gendarmerie/Police', 'TERMINE', 100, 'MOYENNE', -45, 500, 498, 4, null, 'PL contrôlés', 20000, 20000],

    // Pilier 5 : Réponses post-accidents
    ['Réseau national de premiers secours routiers', 4, 0, 2, 'Ministère Santé', 'EN_COURS', 38, 'HAUTE', 540, 9000, 3420, 3, 'Équipement des équipes SAMU et formation.', 'Équipes SAMU formées', 120, 46],
    ['Centres de traumatologie — réseau hospitalier', 4, 1, 2, 'Ministère Santé', 'EN_COURS', 25, 'HAUTE', 720, 20000, 5000, 3, null, 'Centres opérationnels', 20, 5],
    ['Base de données accidents — interconnexion SI', 4, 0, 0, 'Pôle SI NARSA', 'EN_COURS', 60, 'HAUTE', 240, 3000, 1800, 4, null, 'Sources interconnectées', 8, 5],
    ['Indemnisation rapide victimes accidents corporels', 4, 1, 0, 'Dir. Juridique NARSA', 'A_LANCER', 0, 'MOYENNE', 365, 500, 0, 4, 'Réforme législative en cours.'],
  ];

  await seedActionsHierarchiques(
    prisma,
    planSnsr.id,
    axesSnsr.map((a) => ({ id: a.id, nom: a.nom })),
    rs,
    pa,
    actionsSnsr,
  );

  // ─── Plan 2 : PMO Interne — Plan de développement NARSA 2026-2030 ──────────
  const planNarsa = await prisma.plan.create({
    data: {
      nom: 'Plan de Développement Stratégique NARSA 2026-2030',
      dateDebut: date(2026, 1, 1),
      dateFin: date(2030, 12, 31),
      typePmo: 'INTERNE',
      objectif: 'Renforcer les capacités institutionnelles de la NARSA pour piloter efficacement la SNSR',
    },
  });

  // 5 Axes stratégiques NARSA (internes)
  const axesNarsa = await Promise.all([
    prisma.axe.create({ data: { nom: 'Pilotage de la SNSR et des PRSR', ordre: 0, planId: planNarsa.id } }),
    prisma.axe.create({ data: { nom: 'Mobilisation des acteurs institutionnels', ordre: 1, planId: planNarsa.id } }),
    prisma.axe.create({ data: { nom: 'Éducation, Formation, Sensibilisation & Prévention', ordre: 2, planId: planNarsa.id } }),
    prisma.axe.create({ data: { nom: 'Contrôle des véhicules et des infractions', ordre: 3, planId: planNarsa.id } }),
    prisma.axe.create({ data: { nom: 'Systèmes de gestion interne & Performance', ordre: 4, planId: planNarsa.id } }),
  ]);

  // Régions NARSA (mêmes 12 régions)
  const regionsNarsa = await Promise.all(
    regionsData.map((r) => prisma.pays.create({ data: { ...r, planId: planNarsa.id } })),
  );

  // 6 Pôles NARSA
  const polesData = [
    { nom: 'Pôle Surveillance et Expertise en Sécurité Routière', paysIdx: 0 },
    { nom: 'Pôle Sécurité de la Conduite et des Véhicules', paysIdx: 0 },
    { nom: "Pôle Système d'Information et NTSR", paysIdx: 0 },
    { nom: 'Pôle Affaires Administratives, Juridiques et Financières', paysIdx: 0 },
    { nom: 'Pôle Communication, Éducation et Prévention Routière', paysIdx: 0 },
    { nom: 'Pôle Qualité, Audit et Contrôle de Gestion', paysIdx: 0 },
  ];
  const poles = await Promise.all(
    polesData.map((e) =>
      prisma.entite.create({
        data: { nom: e.nom, paysId: regionsNarsa[e.paysIdx]!.id, planId: planNarsa.id },
      }),
    ),
  );

  const rn = (i: number) => regionsNarsa[i]!.id;
  const po = (i: number) => poles[i]!.id;

  const actionsNarsa: ActionRow[] = [
    // Axe 1 : Pilotage SNSR
    ['Mise en place de la plateforme PMO collaborative', 0, 0, 2, 'Pôle SI NARSA', 'EN_COURS', 55, 'HAUTE', 180, 3500, 1925, 4, "Cahier des charges élaboré, appel d'offres lancé.", 'Modules déployés', 3, 1],
    ['Tableau de bord national de suivi de la SNSR', 0, 0, 0, 'Pôle Surveillance SR', 'EN_COURS', 70, 'HAUTE', 120, 800, 560, 4, null, 'Indicateurs renseignés', 45, 32],
    ['Comités régionaux de la sécurité routière — animation', 0, 0, 5, 'Pôle Qualité & Audit', 'EN_COURS', 60, 'MOYENNE', 300, 600, 360, 4, null, 'CPSR réunis', 10, 6],
    ["Rapports trimestriels d'évaluation SNSR", 0, 0, 0, 'Pôle Surveillance SR', 'EN_COURS', 50, 'MOYENNE', 270, 400, 200, 4, null, 'Rapports publiés', 4, 2],

    // Axe 2 : Mobilisation acteurs
    ["Partenariats institutionnels — protocoles d'accord", 1, 1, 1, 'Dir. Juridique NARSA', 'EN_COURS', 45, 'HAUTE', 240, 300, 135, 4, null, 'Protocoles signés', 12, 5],
    ['Forum national de la sécurité routière 2026', 1, 0, 4, 'Pôle Communication', 'TERMINE', 100, 'HAUTE', -30, 1200, 1185, 4, 'Événement tenu avec 500 participants.', 'Participants', 500, 512],
    ["Réseau d'experts nationaux SR — mise en place", 1, 3, 0, 'Pôle Surveillance SR', 'EN_COURS', 35, 'MOYENNE', 365, 500, 175, 4],
    ['Coopération internationale — transfert de bonnes pratiques', 1, 0, 0, 'Dir. Générale NARSA', 'EN_COURS', 50, 'BASSE', 420, 800, 400, 4, null],

    // Axe 3 : Éducation, Formation, Sensibilisation
    ['Programme national de sensibilisation scolaire', 2, 0, 4, 'Pôle Communication', 'EN_COURS', 65, 'HAUTE', 300, 3000, 1950, 4, null, 'Élèves sensibilisés', 1000000, 650000],
    ['Réforme du programme de formation à la conduite', 2, 0, 1, 'Pôle Sécurité Conduite', 'EN_COURS', 40, 'HAUTE', 365, 1500, 600, 3, null, 'Centres agréés réformés', 450, 180],
    ['Campagne nationale Conduire, cest partager', 2, 1, 4, 'Pôle Communication', 'EN_COURS', 80, 'HAUTE', 90, 5000, 4000, 4, null, 'Reach médias (millions)', 10, 8],
    ['Application mobile SR — sensibilisation grand public', 2, 0, 2, 'Pôle SI NARSA', 'EN_COURS', 30, 'MOYENNE', 540, 2000, 600, 4, 'En cours de développement.', 'Téléchargements', 500000, 150000],
    ['Formation des journalistes aux reportages SR', 2, 0, 4, 'Pôle Communication', 'TERMINE', 100, 'BASSE', -20, 200, 196, 4],

    // Axe 4 : Contrôle véhicules/infractions
    ['Modernisation du système de permis de conduire', 3, 0, 1, 'Pôle Sécurité Conduite', 'EN_COURS', 60, 'HAUTE', 360, 8000, 4800, 3, null, 'Dossiers dématérialisés %', 100, 60],
    ['Déploiement contrôle technique numérique', 3, 2, 1, 'Pôle Sécurité Conduite', 'EN_COURS', 48, 'HAUTE', 420, 4000, 1920, 4, null, 'Centres connectés', 800, 384],
    ['Système national des infractions (SNAI) — extension', 3, 0, 2, 'Pôle SI NARSA', 'EN_COURS', 55, 'HAUTE', 270, 5000, 2750, 4, null, 'Types infractions couverts', 50, 28],
    ['Formation des agents NARSA au contrôle terrain', 3, 0, 5, 'Pôle Qualité & Audit', 'EN_COURS', 70, 'MOYENNE', 150, 600, 420, 4, null, 'Agents formés', 500, 350],

    // Axe 5 : Systèmes gestion interne
    ["Refonte du système d'information NARSA (ERP)", 4, 0, 2, 'Pôle SI NARSA', 'EN_COURS', 35, 'HAUTE', 540, 12000, 4200, 3, 'Mise en place Odoo/SAP adapté SP marocain.', 'Modules déployés', 10, 4],
    ['Mise en place du contrôle de gestion NARSA', 4, 0, 3, 'Pôle AAJF', 'EN_COURS', 50, 'HAUTE', 300, 800, 400, 4, null],
    ['Programme de développement RH 2026-2028', 4, 0, 3, 'Pôle AAJF', 'EN_COURS', 45, 'MOYENNE', 540, 1500, 675, 3, null, "Taux d'encadrement %", 45, 40],
    ['Certification ISO 9001 des processus NARSA', 4, 0, 5, 'Pôle Qualité & Audit', 'A_LANCER', 0, 'MOYENNE', 720, 700, 0, 4, null],
    ['Digitalisation de la gestion documentaire (GED)', 4, 0, 2, 'Pôle SI NARSA', 'EN_COURS', 40, 'BASSE', 420, 1200, 480, 4, null, 'Documents numérisés', 50000, 20000],
  ];

  await seedActionsHierarchiques(
    prisma,
    planNarsa.id,
    axesNarsa.map((a) => ({ id: a.id, nom: a.nom })),
    rn,
    po,
    actionsNarsa,
  );

  // ─── Plan 3 : PMO SI — Feuille de route digitale NARSA ──────────────────────
  const planSi = await prisma.plan.create({
    data: {
      nom: 'Feuille de Route Digitale NARSA 2026-2028',
      dateDebut: date(2026, 1, 1),
      dateFin: date(2028, 12, 31),
      typePmo: 'SI',
      objectif: 'Digitalisation complète des services NARSA et interopérabilité des systèmes',
    },
  });

  const axesSi = await Promise.all([
    prisma.axe.create({ data: { nom: 'Infrastructure & Cloud', ordre: 0, planId: planSi.id } }),
    prisma.axe.create({ data: { nom: 'Applications métier NARSA', ordre: 1, planId: planSi.id } }),
    prisma.axe.create({ data: { nom: 'Interopérabilité & Données', ordre: 2, planId: planSi.id } }),
    prisma.axe.create({ data: { nom: 'Cybersécurité', ordre: 3, planId: planSi.id } }),
    prisma.axe.create({ data: { nom: 'Services numériques aux usagers', ordre: 4, planId: planSi.id } }),
  ]);

  const regionsSi = await Promise.all(
    regionsData.map((r) => prisma.pays.create({ data: { ...r, planId: planSi.id } })),
  );

  const polesSi = await Promise.all(
    polesData.map((e) =>
      prisma.entite.create({
        data: { nom: e.nom, paysId: regionsSi[0]!.id, planId: planSi.id },
      }),
    ),
  );

  const rsi = (i: number) => regionsSi[i]!.id;
  const psi = (i: number) => polesSi[i]!.id;

  const actionsSi: ActionRow[] = [
    ['Migration infrastructure vers cloud souverain', 0, 0, 2, 'DSI NARSA', 'EN_COURS', 40, 'HAUTE', 420, 8000, 3200, 3, 'Cloud privé hébergé au Maroc.', 'Services migrés %', 100, 40],
    ['Modernisation réseau NARSA — 10 directions régionales', 0, 0, 2, 'DSI NARSA', 'EN_COURS', 55, 'HAUTE', 300, 5000, 2750, 4, null, 'Sites connectés fibre', 10, 6],
    ['Plateforme PMO collaborative (Mission 1 CPS)', 1, 0, 2, 'DSI NARSA', 'EN_COURS', 55, 'HAUTE', 200, 3500, 1925, 4, "Appel d'offres N°15/NARSA/2026 en cours."],
    ['Refonte portail permis de conduire en ligne', 1, 0, 1, 'Pôle SC&V', 'EN_COURS', 70, 'HAUTE', 180, 4000, 2800, 4, null, 'Transactions en ligne/mois', 50000, 35000],
    ['Application de suivi des infractions (mobile/web)', 1, 1, 2, 'DSI NARSA', 'EN_COURS', 45, 'HAUTE', 360, 3000, 1350, 4, null],
    ['Hub data SR — interconnexion bases accidents/infractions/santé', 2, 0, 0, 'Pôle SR & Expertise', 'EN_COURS', 30, 'HAUTE', 540, 6000, 1800, 3, null, 'Sources connectées', 8, 2],
    ['API ouvertes data SR — open data', 2, 0, 2, 'DSI NARSA', 'A_LANCER', 0, 'MOYENNE', 600, 1000, 0, 4, null],
    ['SOC sécurité — centre opérationnel cybersécurité', 3, 0, 2, 'DSI NARSA', 'EN_COURS', 35, 'HAUTE', 480, 7000, 2450, 3, null],
    ['Mise en conformité DGSSI — sécurité SI', 3, 0, 5, 'Pôle Qualité & Audit', 'EN_COURS', 60, 'HAUTE', 240, 1500, 900, 4, null],
    ['Application NARSA Mobile — services usagers', 4, 2, 2, 'DSI NARSA', 'EN_COURS', 50, 'HAUTE', 300, 5000, 2500, 4, null, 'Téléchargements cumulés', 1000000, 500000],
    ['Espace numérique usager — Mon espace NARSA', 4, 0, 1, 'Pôle SC&V', 'A_LANCER', 0, 'HAUTE', 420, 3000, 0, 4, null],
  ];

  await seedActionsHierarchiques(
    prisma,
    planSi.id,
    axesSi.map((a) => ({ id: a.id, nom: a.nom })),
    rsi,
    psi,
    actionsSi,
  );

  // Volet Agile (sprints + backlog Kanban) pour le plan SI.
  await seedAgile(prisma, planSi.id);

  // ─── Utilisateurs NARSA ──────────────────────────────────────────────────────
  const usersData = [
    { email: 'admin@narsa.ma', name: 'Administrateur NARSA', role: 'ADMIN' },
    { email: 'pmo@narsa.ma', name: 'Chef PMO NARSA', role: 'PMO' },
    { email: 'contrib@narsa.ma', name: 'Chargé de suivi Régional', role: 'CONTRIBUTEUR' },
    { email: 'copil@narsa.ma', name: 'Membre Comité de Pilotage', role: 'LECTEUR' },
  ];
  const passwordHash = await bcrypt.hash('demo1234', 10);
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash },
      create: { ...u, passwordHash },
    });
  }

  // Enrichissement : populations, pulses, signaux de risque, portefeuille PPM
  // DSI avec historique de transitions daté (dette #7).
  const enrichi = await seedEnrichi(prisma, planSnsr.id, planSi.id);

  return {
    plan: planSnsr,
    enrichi,
    axes: axesSnsr.length + axesNarsa.length + axesSi.length,
    pays: regions.length + regionsNarsa.length + regionsSi.length,
    entites: partenaires.length + poles.length + polesSi.length,
    // Inclut les Piliers (niveau 1) et sous-actions (niveau 3) créés en plus.
    actions: await prisma.action.count(),
  };
}
