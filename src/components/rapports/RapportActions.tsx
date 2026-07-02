'use client';

export function RapportActions({ planId }: { planId: string }) {
  return (
    <div className="no-print flex gap-2">
      <a href={`/api/reports?planId=${planId}&format=xlsx`} className="btn-ghost text-sm">Télécharger XLSX</a>
      <button onClick={() => window.print()} className="btn-primary text-sm">Imprimer / PDF</button>
    </div>
  );
}
