"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { ChefHat, Loader2, Ticket } from "lucide-react";

interface InviteCodeFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSuccess: (inviteCode: string) => void;
}

export function InviteCodeForm({
  className,
  onSuccess,
  ...props
}: InviteCodeFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invite/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || "Código de convite inválido");
      }

      // Success - proceed to sign-up
      onSuccess(inviteCode.trim());
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao validar código");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ChefHat className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Acesso por convite</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seu código de convite para criar uma conta
          </p>
        </div>
      </div>

      {/* Invite Code Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="invite-code" className="text-sm font-medium">
            Código de convite
          </Label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="invite-code"
              type="text"
              placeholder="Digite seu código"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="h-12 pl-10"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive animate-enter">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Continuar"
          )}
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
