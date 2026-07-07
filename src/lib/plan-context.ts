import { cookies } from 'next/headers';

/** Cookie de sélection du plan actif (persistant, partagé par toute l'app). */
export const PLAN_COOKIE = 'narsa_plan_id';

/** Lit l'identifiant du plan sélectionné par l'utilisateur (cookie), si présent. */
export function getSelectedPlanId(): string | undefined {
  try {
    return cookies().get(PLAN_COOKIE)?.value || undefined;
  } catch {
    // cookies() hors contexte de requête (ex. scripts serveur) : pas de sélection.
    return undefined;
  }
}
