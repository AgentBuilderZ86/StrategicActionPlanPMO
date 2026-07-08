/**
 * Le titre de page vit désormais dans la barre supérieure (voir Breadcrumb).
 * Ce composant conserve : le bloc titre à l'impression (la topbar est
 * masquée en print, ex. vue COPIL) et la rangée d'actions de page à l'écran.
 */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className={action ? 'mb-4 flex flex-wrap items-end justify-between gap-3' : 'hidden print:block print:mb-4'}>
      <div className="hidden print:block">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="no-print ml-auto flex items-center gap-2.5">{action}</div>}
    </div>
  );
}
