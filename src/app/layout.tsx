import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Providers } from '@/components/Providers';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'PMO NARSA — Stratégie Nationale de la Sécurité Routière',
  description:
    "Plateforme PMO de la NARSA : pilotage de la Stratégie Nationale de la Sécurité Routière (SNSR 2026-2030) et du plan d'action de développement de l'Agence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">{children}</main>
          <footer className="no-print mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 text-center text-xs text-slate-400 sm:px-6">
            NARSA · Agence Nationale de la Sécurité Routière · Pilotage SNSR 2026-2030 · Montants en k MAD
          </footer>
        </Providers>
      </body>
    </html>
  );
}
