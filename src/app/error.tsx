'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-title text-3xl font-extrabold text-statut-rouge">Une erreur est survenue</div>
      <p className="mt-2 max-w-md text-sm text-slate-500">{error.message || 'Erreur inattendue.'}</p>
      <button onClick={reset} className="btn-primary mt-5">Réessayer</button>
    </div>
  );
}
