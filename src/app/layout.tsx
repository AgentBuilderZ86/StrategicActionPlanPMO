import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { Sidebar } from '@/components/shell/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';
import { Providers } from '@/components/Providers';
import { getActivePlan } from '@/lib/data';
import type { PmoType } from '@/lib/constants';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PMO NARSA — Stratégie Nationale de la Sécurité Routière',
  description:
    "Plateforme PMO de la NARSA : pilotage de la Stratégie Nationale de la Sécurité Routière (SNSR 2026-2030) et du plan d'action de développement de l'Agence.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const plan = await getActivePlan().catch(() => null);

  return (
    <html lang="fr" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <AppShell
            sidebar={<Sidebar />}
            notificationBell={<NotificationBell />}
            userMenu={<UserMenu />}
            planId={plan?.id ?? null}
            typePmo={(plan?.typePmo as PmoType | undefined) ?? null}
          >
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
