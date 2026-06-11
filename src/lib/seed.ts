import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** (Ré)initialise le jeu de données de démonstration. Idempotent. */
export async function seedDemo(prisma: PrismaClient) {
  await prisma.avancement.deleteMany();
  await prisma.jalon.deleteMany();
  await prisma.action.deleteMany();
  await prisma.entite.deleteMany();
  await prisma.pays.deleteMany();
  await prisma.axe.deleteMany();
  await prisma.snapshotCopil.deleteMany();
  await prisma.plan.deleteMany();

  const plan = await prisma.plan.create({
    data: {
      nom: 'Plan Digital Stratégique 2026–2028',
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2028-12-31'),
    },
  });

  const axesData = [
    'Gouvernance Data',
    'Infrastructure & Cloud',
    'Digitalisation Métiers',
    'Expérience Client',
    'Cybersécurité',
    'Talents & Culture',
  ];
  const axes = await Promise.all(
    axesData.map((nom, i) => prisma.axe.create({ data: { nom, ordre: i, planId: plan.id } })),
  );

  const paysData = [
    { nom: 'Maroc', code: 'MA' },
    { nom: 'Sénégal', code: 'SN' },
    { nom: "Côte d'Ivoire", code: 'CI' },
    { nom: 'Cameroun', code: 'CM' },
    { nom: 'Tunisie', code: 'TN' },
  ];
  const pays = await Promise.all(
    paysData.map((pp) => prisma.pays.create({ data: { ...pp, planId: plan.id } })),
  );

  const entitesData = [
    { nom: 'Banque de Détail', paysIdx: 0 },
    { nom: 'Assurance', paysIdx: 1 },
    { nom: 'Télécom', paysIdx: 2 },
    { nom: 'Holding & Services', paysIdx: 3 },
  ];
  const entites = await Promise.all(
    entitesData.map((e) =>
      prisma.entite.create({ data: { nom: e.nom, paysId: pays[e.paysIdx]!.id, planId: plan.id } }),
    ),
  );

  const a = (i: number) => axes[i]!.id;
  const p = (i: number) => pays[i]!.id;
  const e = (i: number) => entites[i]!.id;

  type S = [string, number, number, number, string, string, number, string, number, number, number, string?];
  const rows: S[] = [
    ['Mise en place du Data Office Groupe', 0, 0, 3, 'A. Benali', 'EN_COURS', 60, 'HAUTE', 90, 450, 240],
    ['Catalogue de données et qualité', 0, 1, 1, 'M. Diop', 'EN_COURS', 35, 'MOYENNE', 150, 180, 60],
    ['Migration vers cloud souverain', 1, 0, 0, 'Y. Tazi', 'BLOQUE', 25, 'HAUTE', -10, 900, 300, 'En attente de validation réglementaire locale.'],
    ['Refonte du réseau inter-filiales', 1, 2, 2, 'K. Koffi', 'EN_COURS', 55, 'MOYENNE', 120, 620, 350],
    ['Dématérialisation des process crédit', 2, 0, 0, 'S. Idrissi', 'EN_COURS', 70, 'HAUTE', 60, 300, 210],
    ['Plateforme e-souscription assurance', 2, 1, 1, 'F. Sarr', 'EN_COURS', 45, 'MOYENNE', 200, 260, 110],
    ['Automatisation back-office', 2, 4, 3, 'N. Gharbi', 'A_LANCER', 0, 'BASSE', 300, 140, 0],
    ['Application mobile client unifiée', 3, 2, 2, 'K. Koffi', 'EN_COURS', 50, 'HAUTE', 110, 400, 220],
    ['Programme NPS et voix du client', 3, 3, 3, 'P. Ngo', 'EN_COURS', 40, 'MOYENNE', 160, 90, 30],
    ['Refonte des parcours agence', 3, 1, 1, 'F. Sarr', 'BLOQUE', 20, 'MOYENNE', 40, 150, 60, 'Dépendance au chantier SI core en retard.'],
    ['SOC régional et supervision', 4, 0, 3, 'Y. Tazi', 'EN_COURS', 48, 'HAUTE', 130, 520, 250],
    ['Mise en conformité ISO 27001', 4, 4, 3, 'N. Gharbi', 'EN_COURS', 38, 'HAUTE', -5, 200, 90, 'Audit de certification glissé.'],
    ['Sensibilisation cybersécurité', 4, 2, 2, 'K. Koffi', 'TERMINE', 100, 'BASSE', -30, 50, 48],
    ['Académie digitale interne', 5, 0, 3, 'A. Benali', 'EN_COURS', 65, 'MOYENNE', 180, 160, 95],
    ['Recrutement Data Scientists', 5, 1, 1, 'M. Diop', 'A_LANCER', 0, 'MOYENNE', 240, 120, 0],
    ['Plan de conduite du changement', 5, 3, 3, 'P. Ngo', 'TERMINE', 100, 'BASSE', -60, 80, 75],
  ];

  for (const [titre, axe, py, ent, responsable, statut, avancement, priorite, fin, budget, conso, commentaire] of rows) {
    const action = await prisma.action.create({
      data: {
        titre, planId: plan.id, axeId: a(axe), paysId: p(py), entiteId: e(ent), responsable,
        statut, avancement, priorite, dateDebut: daysFromNow(fin - 180), dateFin: daysFromNow(fin),
        budget, budgetConso: conso, commentaire: commentaire ?? null,
      },
    });
    for (let s = 1; s <= 4; s++) {
      const valeur = Math.round((avancement * s) / 4);
      await prisma.avancement.create({
        data: {
          actionId: action.id, date: daysFromNow(-30 * (4 - s)), valeur,
          statut: valeur >= 100 ? 'TERMINE' : valeur > 0 ? 'EN_COURS' : 'A_LANCER',
        },
      });
    }
  }

  const usersData = [
    { email: 'admin@pmo.demo', name: 'Admin Démo', role: 'ADMIN' },
    { email: 'pmo@pmo.demo', name: 'PMO Central', role: 'PMO' },
    { email: 'contrib@pmo.demo', name: 'Relais Pays', role: 'CONTRIBUTEUR' },
    { email: 'lecteur@pmo.demo', name: 'Sponsor COPIL', role: 'LECTEUR' },
  ];
  const passwordHash = await bcrypt.hash('demo1234', 10);
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, passwordHash },
      create: { ...u, passwordHash },
    });
  }

  return { plan, axes: axes.length, pays: pays.length, entites: entites.length, actions: rows.length };
}
