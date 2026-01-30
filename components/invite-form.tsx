"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChefHat, Loader2, KeyRound } from "lucide-react";
import { validateInviteKey } from "@/app/actions/auth";

export function InviteForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/auth/login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateInviteKey(code);
      
      if (!result.valid) {
        setError(result.error || "Código inválido");
        setIsLoading(false);
        return;
      }

      // Store validated code in sessionStorage for signup flow
      sessionStorage.setItem("invite_code", code.trim().toUpperCase());
      
      // Redirect to intended destination
      router.push(redirectTo);
    } catch {
      setError("Ocorreu um erro ao validar o código");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="h-7 w-7" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Acesso Privado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Esta aplicação é apenas para convidados
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="invite-code" className="text-sm font-medium">
            Código de Convite
          </Label>
          <Input
            id="invite-code"
            type="text"
            placeholder="DIGITE-SEU-CODIGO"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="h-12 text-center tracking-widest font-mono text-lg"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive animate-enter text-center">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            "Entrar com Convite"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Não tem um código?{" "}
        <span className="text-foreground">
          Solicite a um membro existente.
        </span>
      </p>

      {/* Brand */}
      <Link href="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ChefHat className="h-4 w-4" />
        <span className="text-sm font-medium">Resutorant</span>
      </Link>
    </div>
  );
}
