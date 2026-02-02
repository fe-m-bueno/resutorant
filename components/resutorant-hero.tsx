import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Star, BookOpen } from "lucide-react";

export function ResutorantHero() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 pt-32 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10" />

      {/* Decorative blobs - more subtle */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/8 rounded-full blur-3xl -z-10" />

      {/* Logo */}
      <div className="mb-10 p-5 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-xl shadow-primary/20 animate-scale-in">
        <UtensilsCrossed
          className="w-10 h-10 text-primary-foreground"
          strokeWidth={1.5}
        />
      </div>

      {/* Main content */}
      <div className="text-center max-w-2xl animate-enter">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-foreground">
          Resutorant
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-3 font-medium">
          Seu Diário Gastronômico
        </p>

        <p className="text-base text-muted-foreground/80 mb-10 max-w-md mx-auto leading-relaxed">
          Registre experiências, avalie restaurantes e construa seu histórico de
          descobertas culinárias.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-col gap-3 justify-center mb-16">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02]"
          >
            <Link href="/auth/sign-up">
              Começar Agora ou Faça Login com Google
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-medium transition-all hover:scale-[1.02]"
          >
            <Link href="/auth/login">Já tenho conta</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <FeatureCard
          icon={<BookOpen className="w-5 h-5" />}
          title="Registre"
          description="Anote experiências com detalhes"
        />
        <FeatureCard
          icon={<Star className="w-5 h-5" />}
          title="Avalie"
          description="Crie seu ranking pessoal"
        />
        <FeatureCard
          icon={<UtensilsCrossed className="w-5 h-5" />}
          title="Descubra"
          description="Relembre seus favoritos"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-lg hover:border-border">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground text-center">{description}</p>
    </div>
  );
}
