'use client';

import * as React from 'react';
import {
  Search,
  MapPin,
  Calendar,
  UtensilsCrossed,
  Tag,
  X,
  Store,
  Eye,
  Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
// import { DateRange } from "react-day-picker" // We don't have this yet, skipping complex date picker
import { RatingInput } from '@/components/rating-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  onSearchChange: (value: string) => void;
  onFilterChange: (filters: FilterState) => void;
  availableCuisines: { id: string; name: string; icon?: string | null }[];
  availableTags: { id: string; name: string; color?: string | null }[];
  availableCities: string[];
  availableTypes: string[];
}

export interface FilterState {
  city: string | null;
  types: string[];
  cuisines: string[];
  tags: string[];
  visibility: 'all' | 'public' | 'private';
  ratings: number[];
  dateRange: { from: string | null; to: string | null };
}

// Helper component for consistent filter buttons
interface FilterButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  count?: number;
  value?: string | null;
  color?: string;
}

const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(
  (
    { icon: Icon, label, active, count, value, color, className, ...props },
    ref,
  ) => {
    // Determine what to display based on state and screen size (via CSS)
    const hasValue = active && ((count !== undefined && count > 0) || value);

    // Fallback for label if active but no specific value text (like Visibility which has its own labels)
    let displayText = label;
    if (active) {
      if (count !== undefined && count > 1) {
        displayText = `${count} sel.`;
      } else if (value) {
        displayText = value;
      }
    }

    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        className={cn(
          'h-8 border-dashed shrink-0 transition-all duration-200 relative',
          active && 'bg-secondary border-secondary border-solid font-medium',
          // Stable widths on desktop to minimize shifts
          !active && 'min-w-[70px] sm:min-w-[90px]',
          'px-2 sm:px-3',
          className,
        )}
        title={active && value ? value : label}
        {...props}
      >
        <div className="flex items-center justify-center shrink-0 w-4 h-4 mr-0.5 sm:mr-0">
          <Icon
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              (active || count) && 'text-primary',
            )}
          />
        </div>

        {/* On mobile: only show text if active. Otherwise hide it. */}
        {/* On extra small screens (hidden max-w-[80px]): hide even active text if it's too long. */}
        <span
          className={cn(
            'text-xs truncate ml-1.5 sm:ml-2',
            // Desktop: always show label (with min-w on button)
            // Mobile: Hide label if inactive.
            !active && 'hidden sm:inline',
            // Aggressive mobile truncation: hide text on very small screens if it's long
            'max-w-[70px] xs:max-w-none',
          )}
        >
          {displayText}
        </span>

        {/* Small indicator dot for mobile when text is hidden but filter is active */}
        {active && (
          <span
            className={cn(
              'sm:hidden absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary border-2 border-background',
              hasValue && 'hidden xs:block', // if it has value text, we don't need the dot unless it's hidden
            )}
          />
        )}
      </Button>
    );
  },
);
FilterButton.displayName = 'FilterButton';

export function FilterBar({
  onSearchChange,
  onFilterChange,
  availableCuisines,
  availableTags,
  availableCities,
  availableTypes,
}: FilterBarProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    city: null,
    types: [],
    cuisines: [],
    tags: [],
    visibility: 'all',
    ratings: [],
    dateRange: { from: null, to: null },
  });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);

  // ... (unchanged helpers)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared = {
      city: null,
      types: [],
      cuisines: [],
      tags: [],
      visibility: 'all' as const,
      ratings: [],
      dateRange: { from: null, to: null },
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    filters.city !== null ||
    filters.types.length > 0 ||
    filters.cuisines.length > 0 ||
    filters.tags.length > 0 ||
    filters.visibility !== 'all' ||
    filters.ratings.length > 0 ||
    filters.dateRange.from !== null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center h-11">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Buscar..."
            className="h-10 sm:h-11 pl-10 bg-accent/30 border-accent focus-visible:bg-background focus-visible:border-input transition-all duration-300 rounded-xl text-sm"
            onChange={handleSearch}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-10 w-10 sm:hidden shrink-0 rounded-xl transition-colors',
            hasActiveFilters && 'bg-secondary border-secondary text-primary',
          )}
          onClick={() => setIsMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>

        <div className="w-10 shrink-0 justify-center hidden sm:flex">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Limpar filtros"
              className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide items-center h-12">
          {/* Mobile Filter Button (Visible only on mobile) */}
          {/* Mobile Filter Dialog (Controlled) */}
          <Dialog
            open={isMobileFiltersOpen}
            onOpenChange={setIsMobileFiltersOpen}
          >
            <DialogContent className="sm:hidden fixed inset-0 !translate-x-0 !translate-y-0 w-full h-full max-w-none rounded-none border-none bg-background p-6 overflow-y-auto z-[9999] duration-300 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom [&>button]:hidden">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-left flex items-center justify-between">
                  <span className="text-xl font-semibold">Filtros</span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Limpar tudo
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {/* City Filter */}
                <AccordionItem value="city" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Local</span>
                      {filters.city && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {filters.city}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 px-1">
                      {availableCities.map((city) => (
                        <div key={city} className="flex items-center space-x-3">
                          <Checkbox
                            id={`mobile-city-${city}`}
                            checked={filters.city === city}
                            onCheckedChange={(checked) => {
                              updateFilters({ city: checked ? city : null });
                            }}
                          />
                          <label
                            htmlFor={`mobile-city-${city}`}
                            className="text-sm cursor-pointer w-full py-1"
                          >
                            {city}
                          </label>
                        </div>
                      ))}
                      {availableCities.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma cidade encontrada.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Type Filter */}
                <AccordionItem value="type" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Tipo</span>
                      {filters.types.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {filters.types.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2 px-1">
                      {availableTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-3">
                          <Checkbox
                            id={`mobile-type-${type}`}
                            checked={filters.types.includes(type)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked
                                ? [...filters.types, type]
                                : filters.types.filter((t) => t !== type);
                              updateFilters({ types: newTypes });
                            }}
                          />
                          <label
                            htmlFor={`mobile-type-${type}`}
                            className="text-sm cursor-pointer w-full py-1 capitalize"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                      {availableTypes.length === 0 && (
                        <div className="py-3 text-sm text-muted-foreground text-center bg-accent/20 rounded-lg border border-dashed">
                          Nenhum tipo encontrado
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Cuisine Filter */}
                <AccordionItem value="cuisine" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Culinária</span>
                      {filters.cuisines.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {filters.cuisines.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2 px-1">
                      {availableCuisines.map((cuisine) => {
                        const isSelected = filters.cuisines.includes(
                          cuisine.name,
                        );
                        return (
                          <Badge
                            key={cuisine.name}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer py-1.5 px-3"
                            onClick={() => {
                              const newCuisines = isSelected
                                ? filters.cuisines.filter(
                                    (c) => c !== cuisine.name,
                                  )
                                : [...filters.cuisines, cuisine.name];
                              updateFilters({ cuisines: newCuisines });
                            }}
                          >
                            {cuisine.icon && (
                              <span className="mr-1.5">{cuisine.icon}</span>
                            )}
                            {cuisine.name}
                          </Badge>
                        );
                      })}
                      {availableCuisines.length === 0 && (
                        <div className="w-full py-3 text-sm text-muted-foreground text-center bg-accent/20 rounded-lg border border-dashed">
                          Nenhuma culinária encontrada
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Visibility Filter */}
                <AccordionItem value="visibility" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">
                        Visibilidade
                      </span>
                      {filters.visibility !== 'all' && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {filters.visibility === 'public'
                            ? 'Público'
                            : 'Privado'}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 px-1">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'public', label: 'Público' },
                        { id: 'private', label: 'Privado' },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={`mobile-vis-${item.id}`}
                            checked={filters.visibility === item.id}
                            onCheckedChange={() =>
                              updateFilters({ visibility: item.id as any })
                            }
                          />
                          <label
                            htmlFor={`mobile-vis-${item.id}`}
                            className="text-sm cursor-pointer w-full py-1"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Rating Filter */}
                <AccordionItem value="rating" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Notas</span>
                      {filters.ratings.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {Math.min(...filters.ratings)}+
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 pb-2 px-1">
                      <div className="flex justify-center py-4 bg-accent/20 rounded-xl">
                        <RatingInput
                          value={
                            filters.ratings.length > 0
                              ? Math.min(...filters.ratings)
                              : 0
                          }
                          onChange={(value: number) => {
                            const newRatings = [];
                            for (let i = value; i <= 5; i += 0.5) {
                              newRatings.push(i);
                            }
                            updateFilters({ ratings: newRatings });
                          }}
                          size="lg"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
                        <span>
                          {filters.ratings.length > 0
                            ? `${Math.min(...filters.ratings)} ou mais`
                            : 'Qualquer nota'}
                        </span>
                        {filters.ratings.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() => updateFilters({ ratings: [] })}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Date Filter */}
                <AccordionItem value="date" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Data</span>
                      {(filters.dateRange.from || filters.dateRange.to) && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          Filtrado
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-2 px-1">
                      <div className="space-y-2">
                        <Label htmlFor="mobile-date-from" className="text-xs">
                          De
                        </Label>
                        <Input
                          type="date"
                          id="mobile-date-from"
                          className="h-10 text-sm"
                          value={filters.dateRange.from || ''}
                          onChange={(e) =>
                            updateFilters({
                              dateRange: {
                                ...filters.dateRange,
                                from: e.target.value || null,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile-date-to" className="text-xs">
                          Até
                        </Label>
                        <Input
                          type="date"
                          id="mobile-date-to"
                          className="h-10 text-sm"
                          value={filters.dateRange.to || ''}
                          onChange={(e) =>
                            updateFilters({
                              dateRange: {
                                ...filters.dateRange,
                                to: e.target.value || null,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tags Filter */}
                <AccordionItem value="tags" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 px-3 bg-muted/30 rounded-xl data-[state=open]:bg-muted/50 data-[state=open]:rounded-b-none transition-all">
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base font-medium">Tags</span>
                      {filters.tags.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 text-[10px]"
                        >
                          {filters.tags.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2 px-1">
                      {availableTags.map((tag) => {
                        const isSelected = filters.tags.includes(tag.name);
                        return (
                          <Badge
                            key={tag.name}
                            variant="outline"
                            className={cn(
                              'cursor-pointer border-transparent transition-all py-1.5 px-3',
                              isSelected
                                ? 'ring-2 ring-primary ring-offset-2 scale-105'
                                : 'opacity-80',
                            )}
                            style={{
                              backgroundColor: tag.color || '#6366f1',
                              color: 'white',
                            }}
                            onClick={() => {
                              const newTags = isSelected
                                ? filters.tags.filter((t) => t !== tag.name)
                                : [...filters.tags, tag.name];
                              updateFilters({ tags: newTags });
                            }}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                      {availableTags.length === 0 && (
                        <div className="w-full py-3 text-sm text-muted-foreground text-center bg-accent/20 rounded-lg border border-dashed">
                          Nenhuma tag encontrada
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </DialogContent>
          </Dialog>

          {/* Desktop Filter Buttons (Always visible on desktop, hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* City Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={MapPin}
                  label="Local"
                  active={!!filters.city}
                  value={filters.city}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">
                    Filtrar por cidade
                  </h4>
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={`city-${city}`}
                        checked={filters.city === city}
                        onCheckedChange={(checked) => {
                          updateFilters({ city: checked ? city : null });
                        }}
                      />
                      <label
                        htmlFor={`city-${city}`}
                        className="text-sm cursor-pointer w-full"
                      >
                        {city}
                      </label>
                    </div>
                  ))}
                  {availableCities.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma cidade encontrada.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={Store}
                  label="Tipo"
                  active={filters.types.length > 0}
                  count={filters.types.length}
                  value={filters.types[0]}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">
                    Tipo de local
                  </h4>
                  {availableTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.types.includes(type)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...filters.types, type]
                            : filters.types.filter((t) => t !== type);
                          updateFilters({ types: newTypes });
                        }}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm cursor-pointer w-full capitalize"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                  {availableTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum tipo encontrado.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Cuisine Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={UtensilsCrossed}
                  label="Culinária"
                  active={filters.cuisines.length > 0}
                  count={filters.cuisines.length}
                  value={filters.cuisines[0]}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">
                    Tipo de cozinha
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableCuisines.map((cuisine) => {
                      const isSelected = filters.cuisines.includes(
                        cuisine.name,
                      );
                      return (
                        <Badge
                          key={cuisine.name}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-primary/90"
                          onClick={() => {
                            const newCuisines = isSelected
                              ? filters.cuisines.filter(
                                  (c) => c !== cuisine.name,
                                )
                              : [...filters.cuisines, cuisine.name];
                            updateFilters({ cuisines: newCuisines });
                          }}
                        >
                          {cuisine.icon && (
                            <span className="mr-1">{cuisine.icon}</span>
                          )}
                          {cuisine.name}
                        </Badge>
                      );
                    })}
                  </div>
                  {availableCuisines.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma culinária encontrada.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Visibility Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={Eye}
                  label="Visibilidade"
                  active={filters.visibility !== 'all'}
                  value={
                    filters.visibility === 'all'
                      ? null
                      : filters.visibility === 'public'
                        ? 'Público'
                        : 'Privado'
                  }
                />
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-2" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">
                    Visibilidade
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vis-all"
                      checked={filters.visibility === 'all'}
                      onCheckedChange={() =>
                        updateFilters({ visibility: 'all' })
                      }
                    />
                    <label
                      htmlFor="vis-all"
                      className="text-sm cursor-pointer w-full"
                    >
                      Todos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vis-public"
                      checked={filters.visibility === 'public'}
                      onCheckedChange={() =>
                        updateFilters({ visibility: 'public' })
                      }
                    />
                    <label
                      htmlFor="vis-public"
                      className="text-sm cursor-pointer w-full"
                    >
                      Público
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vis-private"
                      checked={filters.visibility === 'private'}
                      onCheckedChange={() =>
                        updateFilters({ visibility: 'private' })
                      }
                    />
                    <label
                      htmlFor="vis-private"
                      className="text-sm cursor-pointer w-full"
                    >
                      Privado
                    </label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Rating Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={Star}
                  label="Notas"
                  active={filters.ratings.length > 0}
                  value={
                    filters.ratings.length > 0
                      ? `${Math.min(...filters.ratings)}+`
                      : null
                  }
                />
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs text-muted-foreground">
                      Mínimo de estrelas
                    </h4>
                    <div className="flex justify-center py-2">
                      <RatingInput
                        value={
                          filters.ratings.length > 0
                            ? Math.min(...filters.ratings)
                            : 0
                        }
                        onChange={(value: number) => {
                          // Generate array from value to 5 with 0.5 step
                          const newRatings = [];
                          for (let i = value; i <= 5; i += 0.5) {
                            newRatings.push(i);
                          }
                          updateFilters({ ratings: newRatings });
                        }}
                        size="md"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {filters.ratings.length > 0
                          ? `${Math.min(...filters.ratings)} ou mais`
                          : 'Qualquer nota'}
                      </span>
                      {filters.ratings.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => updateFilters({ ratings: [] })}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Filter (Simple) */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={Calendar}
                  label="Data"
                  active={!!(filters.dateRange.from || filters.dateRange.to)}
                  value={
                    filters.dateRange.from || filters.dateRange.to
                      ? 'Filtrado'
                      : null
                  }
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date-from">De</Label>
                    <Input
                      type="date"
                      id="date-from"
                      value={filters.dateRange.from || ''}
                      onChange={(e) =>
                        updateFilters({
                          dateRange: {
                            ...filters.dateRange,
                            from: e.target.value || null,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date-to">Até</Label>
                    <Input
                      type="date"
                      id="date-to"
                      value={filters.dateRange.to || ''}
                      onChange={(e) =>
                        updateFilters({
                          dateRange: {
                            ...filters.dateRange,
                            to: e.target.value || null,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tags Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <FilterButton
                  icon={Tag}
                  label="Tags"
                  active={filters.tags.length > 0}
                  count={filters.tags.length}
                  value={filters.tags[0]}
                />
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = filters.tags.includes(tag.name);
                      return (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          className={cn(
                            'cursor-pointer border-transparent transition-colors text-white', // removed hover:opacity-80 to avoid flicker, handled by logic
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-1'
                              : 'opacity-70 hover:opacity-100',
                          )}
                          style={{
                            backgroundColor: tag.color || '#6366f1',
                          }}
                          onClick={() => {
                            const newTags = isSelected
                              ? filters.tags.filter((t) => t !== tag.name)
                              : [...filters.tags, tag.name];
                            updateFilters({ tags: newTags });
                          }}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                  {availableTags.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma tag encontrada.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
