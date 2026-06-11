import { PrismaClient } from '@prisma/client';
import { seedDemo } from '../src/lib/seed';

const prisma = new PrismaClient();

seedDemo(prisma)
  .then((r) => {
    // eslint-disable-next-line no-console
    console.log(
      `Seed terminé : plan « ${r.plan.nom} », ${r.axes} axes, ${r.pays} pays, ${r.entites} entités, ${r.actions} actions.`,
    );
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
