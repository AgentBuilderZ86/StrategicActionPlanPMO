'use client';

/** Impression de la revue de portefeuille (les éléments no-print sont masqués). */
export function ImprimerBouton() {
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      🖨 Imprimer / PDF
    </button>
  );
}
