import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { Sidebar } from '@/components/shell/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';
import { Providers } from '@/components/Providers';
import { getActivePlan } from '@/lib/data';
import type { PmoType } from '@/lib/constants';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'PMO NARSA — Stratégie Nationale de la Sécurité Routière',
  description:
    "Plateforme PMO de la NARSA : pilotage de la Stratégie Nationale de la Sécurité Routière (SNSR 2026-2030) et du plan d'action de développement de l'Agence.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const plan = await getActivePlan().catch(() => null);

  return (
    <html lang="fr" className={`${archivo.variable} ${inter.variable}`}>
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
