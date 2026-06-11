import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-title text-5xl font-extrabold text-ink">404</div>
      <p className="mt-2 text-slate-500">La page demandée est introuvable.</p>
      <Link href="/" className="btn-primary mt-5">Retour au tableau de bord</Link>
    </div>
  );
}
