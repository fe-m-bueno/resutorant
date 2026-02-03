'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-full max-h-[500px] w-full max-w-md flex-col items-center justify-center space-y-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido removida ou o link pode estar incorreto.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              Voltar ao Início
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar para página anterior
          </Button>
        </div>
      </div>
    </div>
  );
}
