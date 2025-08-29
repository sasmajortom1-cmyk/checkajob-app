import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'CheckaJob – Amateur DIY Assessment',
  description:
    'Help amateur DIYers decide whether to tackle a project themselves or hire a pro. Get a difficulty score, rationale, steps, tools, materials and safety notes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
