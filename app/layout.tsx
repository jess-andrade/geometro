import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GeoMetrô Salvador',
  description: 'Plataforma de apoio à pesquisa sobre mobilidade e economia urbana em Salvador.',
  metadataBase: new URL('https://geometro-salvador.joniisgelato.chatgpt.site'),
  openGraph: {
    title: 'GeoMetrô Salvador',
    description: 'Mobilidade, território e economia urbana em uma plataforma de geointeligência.',
    images: [{ url:'/og.png', width:1200, height:630, alt:'GeoMetrô Salvador — Mobilidade, território e economia urbana' }],
  },
  twitter: {
    card:'summary_large_image',
    title:'GeoMetrô Salvador',
    description:'Mobilidade, território e economia urbana em uma plataforma de geointeligência.',
    images:['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
