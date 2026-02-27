import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuraGrid Sentinel | Intelligent Grid Monitoring',
  description: 'Proactive grid stability and Virtual Power Plant management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground grid-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
