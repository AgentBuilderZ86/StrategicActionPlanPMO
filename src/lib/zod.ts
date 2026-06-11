import { z } from 'zod';
import { STATUTS, PRIORITES, ROLES } from './constants';

export const statutEnum = z.enum(STATUTS);
export const prioriteEnum = z.enum(PRIORITES);
export const roleEnum = z.enum(ROLES);

// Accepte une date ISO (string) ou null/undefined ; renvoie Date | null
const dateOpt = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const numOpt = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(n) ? null : n;
  });

export const actionCreateSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(2000).optional().nullable(),
  planId: z.string().min(1),
  axeId: z.string().min(1, "L'axe est requis"),
  paysId: z.string().min(1, 'Le pays est requis'),
  entiteId: z.string().min(1, "L'entité est requise"),
  responsable: z.string().min(1, 'Le responsable est requis').max(120),
  statut: statutEnum.default('A_LANCER'),
  avancement: z.coerce.number().int().min(0).max(100).default(0),
  priorite: prioriteEnum.default('MOYENNE'),
  dateDebut: dateOpt,
  dateFin: dateOpt,
  budget: numOpt,
  budgetConso: numOpt,
  commentaire: z.string().max(2000).optional().nullable(),
});

export const actionUpdateSchema = actionCreateSchema.partial().omit({ planId: true });

export type ActionCreateInput = z.input<typeof actionCreateSchema>;

export const axeSchema = z.object({
  nom: z.string().min(1).max(120),
  ordre: z.coerce.number().int().default(0),
  planId: z.string().min(1),
});

export const paysSchema = z.object({
  nom: z.string().min(1).max(120),
  code: z.string().max(8).optional().nullable(),
  planId: z.string().min(1),
});

export const entiteSchema = z.object({
  nom: z.string().min(1).max(120),
  paysId: z.string().optional().nullable(),
  planId: z.string().min(1),
});

export const planSchema = z.object({
  nom: z.string().min(1).max(160),
  dateDebut: dateOpt,
  dateFin: dateOpt,
});

export const snapshotSchema = z.object({
  planId: z.string().min(1),
  periode: z.string().min(1),
  faitsMarquants: z.string().max(4000).optional().nullable(),
});

export const importRowSchema = z.object({
  titre: z.string().min(1),
  axe: z.string().min(1),
  pays: z.string().min(1),
  entite: z.string().min(1),
  responsable: z.string().min(1),
  statut: z.string().optional(),
  avancement: z.union([z.string(), z.number()]).optional(),
  priorite: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  budget: z.union([z.string(), z.number()]).optional(),
  commentaire: z.string().optional(),
});
