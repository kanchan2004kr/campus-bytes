import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const siteUrl = 'https://campusbytes.college';
const siteDescription =
  'CampusBytes is a campus-exclusive food ordering platform. Order from your favourite campus outlets and get it delivered by university carts.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CampusBytes — Skip the queue. Eat from your room.',
    template: '%s · CampusBytes',
  },
  description: siteDescription,
  applicationName: 'CampusBytes',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'CampusBytes',
    title: 'CampusBytes — Skip the queue. Eat from your room.',
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusBytes — Skip the queue. Eat from your room.',
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#f0562d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
