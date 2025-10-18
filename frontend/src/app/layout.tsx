import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seismic Monitoring System',
  description: 'Global earthquake evaluation and impact assessment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
