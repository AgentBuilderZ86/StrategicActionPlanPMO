import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  // Réinitialisation idempotente du jeu de démo
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
    axesData.map((nom, i) =>
      prisma.axe.create({ data: { nom, ordre: i, planId: plan.id } }),
    ),
  );

  const paysData = [
    { nom: 'Maroc', code: 'MA' },
    { nom: 'Sénégal', code: 'SN' },
    { nom: "Côte d'Ivoire", code: 'CI' },
    { nom: 'Cameroun', code: 'CM' },
    { nom: 'Tunisie', code: 'TN' },
  ];
  const pays = await Promise.all(
    paysData.map((p) => prisma.pays.create({ data: { ...p, planId: plan.id } })),
  );

  const entitesData = [
    { nom: 'Banque de Détail', paysIdx: 0 },
    { nom: 'Assurance', paysIdx: 1 },
    { nom: 'Télécom', paysIdx: 2 },
    { nom: 'Holding & Services', paysIdx: 3 },
  ];
  const entites = await Promise.all(
    entitesData.map((e) =>
      prisma.entite.create({
        data: { nom: e.nom, paysId: pays[e.paysIdx]!.id, planId: plan.id },
      }),
    ),
  );

  const a = (i: number) => axes[i]!.id;
  const p = (i: number) => pays[i]!.id;
  const e = (i: number) => entites[i]!.id;

  type Seed = {
    titre: string;
    axe: number;
    pays: number;
    entite: number;
    responsable: string;
    statut: string;
    avancement: number;
    priorite: string;
    fin: number; // jours depuis aujourd'hui
    budget: number;
    conso: number;
    commentaire?: string;
  };

  const actionsData: Seed[] = [
    { titre: 'Mise en place du Data Office Groupe', axe: 0, pays: 0, entite: 3, responsable: 'A. Benali', statut: 'EN_COURS', avancement: 60, priorite: 'HAUTE', fin: 90, budget: 450, conso: 240 },
    { titre: 'Catalogue de données et qualité', axe: 0, pays: 1, entite: 1, responsable: 'M. Diop', statut: 'EN_COURS', avancement: 35, priorite: 'MOYENNE', fin: 150, budget: 180, conso: 60 },
    { titre: 'Migration vers cloud souverain', axe: 1, pays: 0, entite: 0, responsable: 'Y. Tazi', statut: 'BLOQUE', avancement: 25, priorite: 'HAUTE', fin: -10, budget: 900, conso: 300, commentaire: 'En attente de validation réglementaire locale.' },
    { titre: 'Refonte du réseau inter-filiales', axe: 1, pays: 2, entite: 2, responsable: 'K. Koffi', statut: 'EN_COURS', avancement: 55, priorite: 'MOYENNE', fin: 120, budget: 620, conso: 350 },
    { titre: 'Dématérialisation des process crédit', axe: 2, pays: 0, entite: 0, responsable: 'S. Idrissi', statut: 'EN_COURS', avancement: 70, priorite: 'HAUTE', fin: 60, budget: 300, conso: 210 },
    { titre: 'Plateforme e-souscription assurance', axe: 2, pays: 1, entite: 1, responsable: 'F. Sarr', statut: 'EN_COURS', avancement: 45, priorite: 'MOYENNE', fin: 200, budget: 260, conso: 110 },
    { titre: 'Automatisation back-office', axe: 2, pays: 4, entite: 3, responsable: 'N. Gharbi', statut: 'A_LANCER', avancement: 0, priorite: 'BASSE', fin: 300, budget: 140, conso: 0 },
    { titre: 'Application mobile client unifiée', axe: 3, pays: 2, entite: 2, responsable: 'K. Koffi', statut: 'EN_COURS', avancement: 50, priorite: 'HAUTE', fin: 110, budget: 400, conso: 220 },
    { titre: 'Programme NPS et voix du client', axe: 3, pays: 3, entite: 3, responsable: 'P. Ngo', statut: 'EN_COURS', avancement: 40, priorite: 'MOYENNE', fin: 160, budget: 90, conso: 30 },
    { titre: 'Refonte des parcours agence', axe: 3, pays: 1, entite: 1, responsable: 'F. Sarr', statut: 'BLOQUE', avancement: 20, priorite: 'MOYENNE', fin: 40, budget: 150, conso: 60, commentaire: 'Dépendance au chantier SI core en retard.' },
    { titre: 'SOC régional et supervision', axe: 4, pays: 0, entite: 3, responsable: 'Y. Tazi', statut: 'EN_COURS', avancement: 48, priorite: 'HAUTE', fin: 130, budget: 520, conso: 250 },
    { titre: 'Mise en conformité ISO 27001', axe: 4, pays: 4, entite: 3, responsable: 'N. Gharbi', statut: 'EN_COURS', avancement: 38, priorite: 'HAUTE', fin: -5, budget: 200, conso: 90, commentaire: 'Audit de certification glissé au trimestre suivant.' },
    { titre: 'Sensibilisation cybersécurité', axe: 4, pays: 2, entite: 2, responsable: 'K. Koffi', statut: 'TERMINE', avancement: 100, priorite: 'BASSE', fin: -30, budget: 50, conso: 48 },
    { titre: 'Académie digitale interne', axe: 5, pays: 0, entite: 3, responsable: 'A. Benali', statut: 'EN_COURS', avancement: 65, priorite: 'MOYENNE', fin: 180, budget: 160, conso: 95 },
    { titre: 'Recrutement Data Scientists', axe: 5, pays: 1, entite: 1, responsable: 'M. Diop', statut: 'A_LANCER', avancement: 0, priorite: 'MOYENNE', fin: 240, budget: 120, conso: 0 },
    { titre: 'Plan de conduite du changement', axe: 5, pays: 3, entite: 3, responsable: 'P. Ngo', statut: 'TERMINE', avancement: 100, priorite: 'BASSE', fin: -60, budget: 80, conso: 75 },
  ];

  for (const d of actionsData) {
    const action = await prisma.action.create({
      data: {
        titre: d.titre,
        planId: plan.id,
        axeId: a(d.axe),
        paysId: p(d.pays),
        entiteId: e(d.entite),
        responsable: d.responsable,
        statut: d.statut,
        avancement: d.avancement,
        priorite: d.priorite,
        dateDebut: daysFromNow(d.fin - 180),
        dateFin: daysFromNow(d.fin),
        budget: d.budget,
        budgetConso: d.conso,
        commentaire: d.commentaire ?? null,
      },
    });

    // Historique d'avancement : 4 snapshots mensuels pour la courbe de tendance
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const valeur = Math.round((d.avancement * s) / steps);
      await prisma.avancement.create({
        data: {
          actionId: action.id,
          date: daysFromNow(-30 * (steps - s)),
          valeur,
          statut: valeur >= 100 ? 'TERMINE' : valeur > 0 ? 'EN_COURS' : 'A_LANCER',
        },
      });
    }
  }

  // Utilisateurs de démonstration (un par rôle)
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

  // eslint-disable-next-line no-console
  console.log(
    `Seed terminé : plan « ${plan.nom} », ${axes.length} axes, ${pays.length} pays, ${entites.length} entités, ${actionsData.length} actions, ${usersData.length} utilisateurs.`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
