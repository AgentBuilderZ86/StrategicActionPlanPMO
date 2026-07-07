/**
 * Set d'icônes vectorielles inline (trait 2px, currentColor), sans dépendance
 * externe. Remplace les emojis de la navigation : rendu net à toute taille,
 * cohérent entre OS, et stylable (couleur héritée du texte).
 */

export type IconeNom =
  | 'journee'
  | 'dashboard'
  | 'alertes'
  | 'populations'
  | 'actions'
  | 'planning'
  | 'agile'
  | 'analyses'
  | 'rapports'
  | 'copil'
  | 'parametres'
  | 'pipeline'
  | 'delivery'
  | 'recherche'
  | 'menu';

const TRACES: Record<IconeNom, React.ReactNode> = {
  journee: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
    </>
  ),
  dashboard: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
  alertes: (
    <>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4m0 3h.01" />
    </>
  ),
  populations: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.6a5 5 0 0 1 6 4.9" />
    </>
  ),
  actions: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  planning: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4m8-4v4" />
    </>
  ),
  agile: (
    <>
      <rect x="4" y="4" width="6" height="12" rx="1.5" />
      <rect x="14" y="4" width="6" height="8" rx="1.5" />
    </>
  ),
  analyses: <path d="m4 17 5-6 4 3 7-8m0 0h-5m5 0v5" />,
  rapports: (
    <>
      <path d="M7 3h7l5 5v13H7V3Z" />
      <path d="M14 3v5h5M10 13h6m-6 4h6" />
    </>
  ),
  copil: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  parametres: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8 13.5 5a7.6 7.6 0 0 1 2.9 1.2l2.6-.7 1.5 2.6-1.8 2a7.7 7.7 0 0 1 0 3.3l1.8 2-1.5 2.6-2.6-.7a7.6 7.6 0 0 1-2.9 1.2L12 21.2 10.5 19a7.6 7.6 0 0 1-2.9-1.2l-2.6.7-1.5-2.6 1.8-2a7.7 7.7 0 0 1 0-3.3l-1.8-2L5 6.4l2.6.7A7.6 7.6 0 0 1 10.5 5L12 2.8Z" />
    </>
  ),
  pipeline: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="10" rx="1.5" />
      <rect x="16" y="4" width="5" height="13" rx="1.5" />
    </>
  ),
  delivery: <path d="m4 17 5-6 4 3 7-8m0 0h-5m5 0v5" />,
  recherche: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

export function Icone({
  nom,
  className = 'h-[17px] w-[17px]',
}: {
  nom: string;
  className?: string;
}) {
  const trace = TRACES[nom as IconeNom];
  if (!trace) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {trace}
    </svg>
  );
}
