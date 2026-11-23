import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monitor sísmico global',
  description: 'Sismos del USGS en tiempo real con estimación de impacto',
};

// Pone el tema antes de pintar para que no haya un destello: usa lo guardado y, si no hay nada, la preferencia del sistema.
const TEMA_INICIAL = `try{var t=localStorage.getItem('tema');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
