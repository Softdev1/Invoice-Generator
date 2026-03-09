import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NavLogo } from '@/components/NavLogo';

export const metadata: Metadata = {
  title: 'Invoice Generator - Create Invoices Easily',
  description: 'Simple invoice generator for small businesses. Create professional invoices in seconds.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Invoice Generator - Create Invoices Easily',
    description: 'Simple invoice generator for small businesses. Create professional invoices in seconds.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoice Generator - Create Invoices Easily',
    description: 'Simple invoice generator for small businesses. Create professional invoices in seconds.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="sticky top-0 z-50 border-b border-slate-200/60" style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
            <NavLogo />
          </div>
        </nav>
        <main className="max-w-lg mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
