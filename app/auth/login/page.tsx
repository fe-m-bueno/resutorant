import { LoginForm } from "@/components/login-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { ChefHat, ArrowLeft } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-svh flex flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <ThemeSwitcher />
      </header>
      
      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="p-4 text-center">
        <Link href="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChefHat className="h-4 w-4" />
          <span className="text-sm font-medium">Resutorant</span>
        </Link>
      </footer>
    </div>
  );
}
