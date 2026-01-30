import { ResutorantHero } from "@/components/resutorant-hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <ChefHat className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">Resutorant</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <ResutorantHero />
      
      {/* Minimal Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t">
        <p>© 2026 Resutorant. Seu diário gastronômico.</p>
      </footer>
    </main>
  );
}
