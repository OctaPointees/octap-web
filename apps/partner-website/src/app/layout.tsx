import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Partner rewards · OctaP',
  description: 'Join your favorite store and make every visit count.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ground font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
