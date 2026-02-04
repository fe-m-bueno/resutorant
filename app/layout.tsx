import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/components/providers/query-provider';
import { ColorThemeProvider } from '@/components/providers/color-theme-provider';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Resutorant - Seu Diário Gastronômico',
  description:
    'Registre suas experiências em restaurantes, cafés e bares. Avalie, organize e compartilhe suas descobertas gastronômicas.',
  openGraph: {
    title: 'Resutorant - Seu Diário Gastronômico',
    description:
      'Registre suas experiências em restaurantes, cafés e bares. Avalie, organize e compartilhe suas descobertas gastronômicas.',
    url: defaultUrl,
    siteName: 'Resutorant',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resutorant - Seu Diário Gastronômico',
    description:
      'Registre suas experiências em restaurantes, cafés e bares. Avalie, organize e compartilhe suas descobertas gastronômicas.',
  },
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            <QueryProvider>
              {children}
              <Toaster position="top-center" richColors closeButton />
            </QueryProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
