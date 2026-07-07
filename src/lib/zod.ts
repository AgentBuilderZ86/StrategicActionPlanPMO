import { z } from 'zod';
import { STATUTS, PRIORITES, ROLES, NIVEAUX, NIVEAU_MAX, PMO_TYPES, SENS_INDICATEUR, ATTRIBUT_TYPES, TYPES_UTILISATEUR, SPRINT_STATUTS, KANBAN_COLONNES } from './constants';
import { EXPOSITIONS, K_ANONYMAT, NIVEAUX_IMPACT, TRANCHES_AGE } from './populations';
import { MODES, TYPES_INITIATIVE } from './ppm';

export const statutEnum = z.enum(STATUTS);
export const prioriteEnum = z.enum(PRIORITES);
export const roleEnum = z.enum(ROLES);
export const niveauEnum = z.enum(NIVEAUX.map(String) as [string, ...string[]]).transform(Number).pipe(z.number().int().min(1).max(5));
export const pmoTypeEnum = z.enum(PMO_TYPES);

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
  // Dimensions optionnelles : un nœud de niveau haut n'a pas forcément
  // d'axe/région/entité. La chaîne vide est normalisée en null.
  axeId: z.string().optional().nullable().transform((v) => v || null),
  paysId: z.string().optional().nullable().transform((v) => v || null),
  entiteId: z.string().optional().nullable().transform((v) => v || null),
  // Arborescence
  parentId: z.string().optional().nullable().transform((v) => v || null),
  ordre: z.coerce.number().int().min(0).default(0),
  responsable: z.string().min(1, 'Le responsable est requis').max(120),
  statut: statutEnum.default('A_LANCER'),
  avancement: z.coerce.number().int().min(0).max(100).default(0),
  priorite: prioriteEnum.default('MOYENNE'),
  dateDebut: dateOpt,
  dateFin: dateOpt,
  budget: numOpt,
  budgetConso: numOpt,
  commentaire: z.string().max(2000).optional().nullable(),
  niveau: z.coerce.number().int().min(1).max(NIVEAU_MAX).default(4),
  indicateur: z.string().max(200).optional().nullable(),
  cibleIndicateur: numOpt,
  valeurIndicateur: numOpt,
  confiance: z.coerce.number().int().min(1).max(5).optional().nullable(),
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
  typePmo: pmoTypeEnum.optional(),
  objectif: z.string().max(500).optional().nullable(),
});

// Politique de mot de passe (T0.3, exig. 37) : 8+ caractères, au moins une
// majuscule, un chiffre et un caractère spécial ; rejet des mots de passe usuels.
const MOTS_DE_PASSE_INTERDITS = new Set([
  'password', 'motdepasse', 'azerty', 'qwerty', '12345678', 'admin123',
  'demo1234', 'narsa2026', 'password1', 'iloveyou',
]);

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128)
  .refine((v) => /[A-Z]/.test(v), 'Au moins une majuscule requise')
  .refine((v) => /[a-z]/.test(v), 'Au moins une minuscule requise')
  .refine((v) => /[0-9]/.test(v), 'Au moins un chiffre requis')
  .refine((v) => /[^A-Za-z0-9]/.test(v), 'Au moins un caractère spécial requis')
  .refine((v) => !MOTS_DE_PASSE_INTERDITS.has(v.toLowerCase()), 'Mot de passe trop courant');

export const userCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  password: passwordSchema,
  role: roleEnum.default('LECTEUR'),
  perimetrePays: z.string().nullable().optional(),
});

// Droits fins : map { lecture, saisie, validation, reporting } → booléens.
const droitsSchema = z
  .object({
    lecture: z.boolean(),
    saisie: z.boolean(),
    validation: z.boolean(),
    reporting: z.boolean(),
  })
  .nullable();

export const userUpdateSchema = z.object({
  role: roleEnum.optional(),
  perimetrePays: z.string().nullable().optional(),
  password: passwordSchema.optional(),
  // Déverrouillage manuel par un admin.
  unlock: z.boolean().optional(),
  // Habilitations fines (T1.6)
  typeUtilisateur: z.enum(TYPES_UTILISATEUR).optional(),
  droits: droitsSchema.optional(),
});

export const indicateurCreateSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis').max(160),
  unite: z.string().max(40).optional().nullable(),
  cible: numOpt,
  realise: numOpt,
  sens: z.enum(SENS_INDICATEUR).default('HAUSSE'),
  agregeable: z.coerce.boolean().default(true),
});

export const indicateurUpdateSchema = indicateurCreateSchema.partial();

export const attributDefCreateSchema = z.object({
  planId: z.string().optional().nullable().transform((v) => v || null),
  typePmo: pmoTypeEnum.optional().nullable(),
  niveau: z.coerce.number().int().min(1).max(NIVEAU_MAX).optional().nullable(),
  cle: z.string().min(1).max(60).regex(/^[a-zA-Z0-9_]+$/, 'Clé alphanumérique (a-z, 0-9, _)'),
  libelle: z.string().min(1).max(120),
  type: z.enum(ATTRIBUT_TYPES).default('TEXTE'),
  options: z.string().max(1000).optional().nullable(),
  obligatoire: z.coerce.boolean().default(false),
  ordre: z.coerce.number().int().default(0),
});

export const attributDefUpdateSchema = attributDefCreateSchema.partial();

// Valeurs d'attributs pour une action : map { attributDefId: valeur | null }.
export const attributValeursSchema = z.object({
  valeurs: z.record(z.string(), z.string().nullable()),
});

export const sprintCreateSchema = z.object({
  planId: z.string().min(1),
  nom: z.string().min(1).max(120),
  objectif: z.string().max(1000).optional().nullable(),
  dateDebut: dateOpt,
  dateFin: dateOpt,
  statut: z.enum(SPRINT_STATUTS).default('PLANIFIE'),
  ordre: z.coerce.number().int().default(0),
});
export const sprintUpdateSchema = sprintCreateSchema.partial().omit({ planId: true });

export const itemCreateSchema = z.object({
  planId: z.string().min(1),
  titre: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  statut: z.enum(KANBAN_COLONNES).default('BACKLOG'),
  points: z.coerce.number().int().min(0).max(999).optional().nullable(),
  assigne: z.string().max(120).optional().nullable(),
  sprintId: z.string().optional().nullable().transform((v) => v || null),
  actionId: z.string().optional().nullable().transform((v) => v || null),
  ordre: z.coerce.number().int().default(0),
});
export const itemUpdateSchema = itemCreateSchema.partial().omit({ planId: true });

export const soumettreValidationSchema = z.object({
  commentaire: z.string().max(2000).optional().nullable(),
});

export const deciderValidationSchema = z.object({
  decision: z.enum(['APPROUVE', 'REJETE']),
  commentaire: z.string().max(2000).optional().nullable(),
});

export const commentaireSchema = z.object({
  contenu: z.string().min(1, 'Le commentaire ne peut pas être vide').max(2000),
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

// --- Populations & adoption (V1.2) ---------------------------------------

export const populationSchema = z.object({
  planId: z.string().min(1),
  nom: z.string().min(1, 'Le nom est requis').max(120),
  description: z.string().max(1000).optional().nullable(),
  effectif: z.coerce.number().int().min(0).default(0),
  trancheAge: z.enum(TRANCHES_AGE).default('MIXTE'),
  ancienneteMoyenne: z.coerce.number().min(0).max(50).optional().nullable(),
  maturiteDigitale: z.coerce.number().int().min(1).max(5).default(3),
  expositionChangement: z.enum(EXPOSITIONS).default('MOYENNE'),
});

export const populationUpdateSchema = populationSchema.partial().omit({ planId: true });

export const pulseSchema = z.object({
  adhesion: z.coerce.number().int().min(0).max(100),
  comprehension: z.coerce.number().int().min(0).max(100),
  preparation: z.coerce.number().int().min(0).max(100),
  repondants: z.coerce
    .number()
    .int()
    .min(K_ANONYMAT, `k-anonymat : au moins ${K_ANONYMAT} répondants requis pour restituer un pulse`),
});

export const liensPopulationSchema = z.object({
  liens: z
    .array(
      z.object({
        actionId: z.string().min(1),
        niveauImpact: z.enum(NIVEAUX_IMPACT).default('INFORME'),
      }),
    )
    .max(200),
});

// --- PPM DSI (V1.3) --------------------------------------------------------
export const initiativeSchema = z.object({
  planId: z.string().min(1),
  titre: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(TYPES_INITIATIVE).default('INITIATIVE'),
  mode: z.enum(MODES).default('WATERFALL'),
  domaineId: z.string().optional().nullable().transform((v) => v || null),
  sousDomaineId: z.string().optional().nullable().transform((v) => v || null),
  valeurMetier: z.coerce.number().int().min(1).max(5).default(3),
  effortEstime: z.coerce.number().min(0).optional().nullable(),
  budget: z.coerce.number().min(0).optional().nullable(),
  chefProjet: z.string().max(120).optional().nullable(),
  chefProjetExterne: z.string().max(120).optional().nullable(),
  productOwner: z.string().max(120).optional().nullable(),
  proxyPo: z.string().max(120).optional().nullable(),
  keyUsers: z.string().max(400).optional().nullable(),
  equipeMep: z.string().max(120).optional().nullable(),
});

export const initiativeUpdateSchema = initiativeSchema.partial().omit({ planId: true, mode: true });

export const transitionSchema = z.object({
  vers: z.string().min(1),
  commentaire: z.string().max(1000).optional().nullable(),
  lot: z.string().max(60).optional().nullable(),
  motifGoNoGo: z.string().max(1000).optional().nullable(),
  reservesRecette: z.string().max(2000).optional().nullable(),
});
