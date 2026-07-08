// Icônes SVG stroke de la navigation (issues de la maquette de référence).
// Rendues en `currentColor` pour hériter de la couleur du contexte.

export type NavIconId =
  | 'dashboard'
  | 'actions'
  | 'planning'
  | 'agile'
  | 'analyses'
  | 'rapports'
  | 'copil'
  | 'parametres'
  | 'portfolio';

const PATHS: Record<NavIconId, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  actions: (
    <>
      <path d="M4 6h11M4 12h11M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 5.5l1.6 1.6L22 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 11.5l1.6 1.6L22 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  planning: (
    <>
      <line x1="3" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="18" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="21" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" opacity="0.6" />
    </>
  ),
  agile: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="9.5" y="8" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="16" y="11" width="5" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  analyses: (
    <>
      <polyline points="3,17 9,10 13,14 21,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="15,5 21,5 21,11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  rapports: (
    <>
      <path d="M6 2.5h9l3 3V21a1 1 0 01-1 1H6a1 1 0 01-1-1V3.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  copil: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  parametres: (
    <>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.4 2.6" />
    </>
  ),
  portfolio: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
    </>
  ),
};

export function NavIcon({ id, size = 17, className }: { id: NavIconId; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {PATHS[id]}
    </svg>
  );
}
