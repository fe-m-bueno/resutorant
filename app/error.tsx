'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-full max-h-[500px] w-full max-w-md flex-col items-center justify-center space-y-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
            Algo deu errado
          </h1>
          <p className="text-muted-foreground">
            Encontramos um erro inesperado ao processar sua solicitação. Tente novamente em alguns instantes.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
