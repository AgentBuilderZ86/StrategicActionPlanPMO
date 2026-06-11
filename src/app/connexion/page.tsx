'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const DEMO = [
  { label: 'Administrateur', email: 'admin@pmo.demo' },
  { label: 'PMO', email: 'pmo@pmo.demo' },
  { label: 'Contributeur', email: 'contrib@pmo.demo' },
  { label: 'Lecteur', email: 'lecteur@pmo.demo' },
];

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('admin@pmo.demo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError('Identifiants invalides.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-sm p-6">
        <h1 className="font-title text-xl font-extrabold text-ink">Connexion</h1>
        <p className="mt-1 text-sm text-slate-500">Accédez au pilotage du plan d’action.</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-statut-rouge">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1 font-semibold text-ink">Comptes de démonstration (mot de passe : demo1234)</p>
          <ul className="space-y-0.5">
            {DEMO.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  className="text-accent hover:underline"
                  onClick={() => { setEmail(d.email); setPassword('demo1234'); }}
                >
                  {d.label} — {d.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Chargement…</div>}>
      <ConnexionForm />
    </Suspense>
  );
}
