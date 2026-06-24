'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { STATUTS, PRIORITES, STATUT_LABEL, PRIORITE_LABEL } from '@/lib/constants';
import type { ActionDTO, Referentiels } from '@/lib/types';
import { toDateInput } from '@/lib/utils';

const formSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  axeId: z.string().min(1, "L'axe est requis"),
  paysId: z.string().min(1, 'Le pays est requis'),
  entiteId: z.string().min(1, "L'entité est requise"),
  responsable: z.string().min(1, 'Le responsable est requis'),
  statut: z.enum(STATUTS),
  avancement: z.coerce.number().int().min(0).max(100),
  priorite: z.enum(PRIORITES),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  budget: z.string().optional(),
  budgetConso: z.string().optional(),
  commentaire: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ActionForm({
  planId,
  action,
  referentiels,
  onSaved,
  onCancel,
}: {
  planId: string;
  action: ActionDTO | null;
  referentiels: Referentiels;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titre: action?.titre ?? '',
      description: action?.description ?? '',
      axeId: action?.axeId ?? referentiels.axes[0]?.id ?? '',
      paysId: action?.paysId ?? referentiels.pays[0]?.id ?? '',
      entiteId: action?.entiteId ?? referentiels.entites[0]?.id ?? '',
      responsable: action?.responsable ?? '',
      statut: (action?.statut as FormValues['statut']) ?? 'A_LANCER',
      avancement: action?.avancement ?? 0,
      priorite: (action?.priorite as FormValues['priorite']) ?? 'MOYENNE',
      dateDebut: toDateInput(action?.dateDebut),
      dateFin: toDateInput(action?.dateFin),
      budget: action?.budget != null ? String(action.budget) : '',
      budgetConso: action?.budgetConso != null ? String(action.budgetConso) : '',
      commentaire: action?.commentaire ?? '',
    },
  });

  const avancement = watch('avancement');

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, planId };
    const url = action ? `/api/actions/${action.id}` : '/api/actions';
    const method = action ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError('root', { message: body?.error?.message ?? "Échec de l'enregistrement" });
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label" htmlFor="titre">Intitulé *</label>
        <input id="titre" className="input" {...register('titre')} />
        {errors.titre && <p className="mt-1 text-xs text-statut-rouge">{errors.titre.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" rows={2} className="input" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="axeId">Pilier stratégique *</label>
          <select id="axeId" className="input" {...register('axeId')}>
            {referentiels.axes.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
          {errors.axeId && <p className="mt-1 text-xs text-statut-rouge">{errors.axeId.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="responsable">Responsable *</label>
          <input id="responsable" className="input" {...register('responsable')} />
          {errors.responsable && <p className="mt-1 text-xs text-statut-rouge">{errors.responsable.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="paysId">Région *</label>
          <select id="paysId" className="input" {...register('paysId')}>
            {referentiels.pays.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="entiteId">Pôle / Partenaire *</label>
          <select id="entiteId" className="input" {...register('entiteId')}>
            {referentiels.entites.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="statut">Statut</label>
          <select id="statut" className="input" {...register('statut')}>
            {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="priorite">Priorité</label>
          <select id="priorite" className="input" {...register('priorite')}>
            {PRIORITES.map((p) => <option key={p} value={p}>{PRIORITE_LABEL[p]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dateDebut">Date de début</label>
          <input id="dateDebut" type="date" className="input" {...register('dateDebut')} />
        </div>
        <div>
          <label className="label" htmlFor="dateFin">Date de fin</label>
          <input id="dateFin" type="date" className="input" {...register('dateFin')} />
        </div>
        <div>
          <label className="label" htmlFor="budget">Budget (k MAD)</label>
          <input id="budget" type="number" step="any" className="input" {...register('budget')} />
        </div>
        <div>
          <label className="label" htmlFor="budgetConso">Budget consommé (k MAD)</label>
          <input id="budgetConso" type="number" step="any" className="input" {...register('budgetConso')} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="avancement">Avancement : <span className="font-bold text-accent">{avancement}%</span></label>
        <input id="avancement" type="range" min={0} max={100} step={5} className="w-full accent-accent" {...register('avancement')} />
      </div>

      <div>
        <label className="label" htmlFor="commentaire">Commentaire</label>
        <textarea id="commentaire" rows={2} className="input" {...register('commentaire')} />
      </div>

      {errors.root && <p className="text-sm text-statut-rouge">{errors.root.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Annuler</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {action ? 'Enregistrer' : "Créer l'action"}
        </button>
      </div>
    </form>
  );
}
