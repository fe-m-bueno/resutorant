'use client';

import { Check, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useColorTheme } from '@/components/providers/color-theme-provider';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function AppearanceManager() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="space-y-8">
      {/* Theme Mode Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Tema do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Escolha sua preferência de claro ou escuro
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:bg-muted/50',
              theme === 'light'
                ? 'border-primary bg-primary/5'
                : 'border-muted bg-transparent',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm border">
                <Sun className="h-5 w-5" />
              </div>
              <span className="font-medium">Claro</span>
            </div>
            {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:bg-muted/50',
              theme === 'dark'
                ? 'border-primary bg-primary/5'
                : 'border-muted bg-transparent',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm border">
                <Moon className="h-5 w-5" />
              </div>
              <span className="font-medium">Escuro</span>
            </div>
            {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
          </button>

          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:bg-muted/50',
              theme === 'system'
                ? 'border-primary bg-primary/5'
                : 'border-muted bg-transparent',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm border">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="font-medium">Sistema</span>
            </div>
            {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
          </button>
        </div>
      </section>

      <Separator />

      {/* Accent Color Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Cor de Destaque</h2>
          <p className="text-sm text-muted-foreground">
            Escolha a cor principal da interface
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setColorTheme('orange')}
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:bg-muted/50',
              colorTheme === 'orange'
                ? 'border-primary bg-primary/5'
                : 'border-muted bg-transparent',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[hsl(28,85%,52%)] shadow-sm ring-2 ring-background" />
              <div className="text-left">
                <p className="font-medium">Laranja (Padrão)</p>
                <p className="text-xs text-muted-foreground">Warm Amber</p>
              </div>
            </div>
            {colorTheme === 'orange' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>

          <button
            onClick={() => setColorTheme('green')}
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:bg-muted/50',
              colorTheme === 'green'
                ? 'border-primary bg-primary/5'
                : 'border-muted bg-transparent',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#50C878] shadow-sm ring-2 ring-background" />
              <div className="text-left">
                <p className="font-medium">Esmeralda</p>
                <p className="text-xs text-muted-foreground">Emerald #50C878</p>
              </div>
            </div>
            {colorTheme === 'green' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
