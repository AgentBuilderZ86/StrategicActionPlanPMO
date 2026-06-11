'use client';

import { useState } from 'react';
import { ImportDialog } from './ImportDialog';

export function ImportExportBar({ planId }: { planId: string }) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/api/export?format=csv&planId=${planId}`} className="btn-ghost">Export CSV</a>
      <a href={`/api/export?format=xlsx&planId=${planId}`} className="btn-ghost">Export Excel</a>
      <button onClick={() => setImportOpen(true)} className="btn-ghost">Importer</button>
      <ImportDialog planId={planId} open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
