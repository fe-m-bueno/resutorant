"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENUE_TYPES } from "@/lib/schemas";
import { CuisineType } from "@/lib/types";

interface VenueFiltersProps {
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string | null) => void;
  onLocationChange: (value: string) => void;
  onCuisineChange: (ids: string[]) => void;
  availableCuisines: CuisineType[];
}

const venueTypeLabels: Record<string, string> = {
  restaurante: "Restaurante",
  café: "Café",
  bar: "Bar",
  lanchonete: "Lanchonete",
  delivery: "Delivery",
  mercado: "Mercado",
  bistrô: "Bistrô",
  izakaya: "Izakaya",
  rotisseria: "Rotisseria",
  padaria: "Padaria",
  pub: "Pub",
};

export function VenueFilters({
  onSearchChange,
  onTypeChange,
  onLocationChange,
  onCuisineChange,
  availableCuisines,
}: VenueFiltersProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [isCuisineOpen, setIsCuisineOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, onSearchChange]);

  // Debounce location
  useEffect(() => {
    const timer = setTimeout(() => {
      onLocationChange(location);
    }, 300);
    return () => clearTimeout(timer);
  }, [location, onLocationChange]);

  const handleCuisineToggle = (id: string) => {
    const newSelection = selectedCuisines.includes(id)
      ? selectedCuisines.filter((c) => c !== id)
      : [...selectedCuisines, id];
    
    setSelectedCuisines(newSelection);
    onCuisineChange(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Search Inputs */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        
        <div className="relative flex-1 md:max-w-xs">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por local..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
         {/* Type Filter */}
         <Select
            value={selectedType || "all"}
            onValueChange={(val) => {
               const value = val === "all" ? null : val;
               setSelectedType(value);
               onTypeChange(value);
            }}
         >
            <SelectTrigger className="h-8 w-[160px] text-xs">
               <SelectValue placeholder="Tipo de Local" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Todos os tipos</SelectItem>
               {VENUE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{venueTypeLabels[type]}</SelectItem>
               ))}
            </SelectContent>
         </Select>

         {/* Cuisine Filter Trigger */}
         <div className="relative">
             <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-dashed"
                onClick={() => setIsCuisineOpen(!isCuisineOpen)}
             >
                <Plus className="mr-1 h-3 w-3" />
                Culinária
             </Button>
             
             {isCuisineOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 p-2 bg-popover border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                   <div className="space-y-1 max-h-60 overflow-y-auto">
                      {availableCuisines.map(cuisine => (
                         <div 
                            key={cuisine.id} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm"
                            onClick={() => handleCuisineToggle(cuisine.id)}
                         >
                            <div className={cn(
                               "h-4 w-4 border rounded flex items-center justify-center",
                               selectedCuisines.includes(cuisine.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                            )}>
                               {selectedCuisines.includes(cuisine.id) && <Plus className="h-3 w-3" />}
                            </div>
                            <span>{cuisine.name}</span>
                         </div>
                      ))}
                      {availableCuisines.length === 0 && <div className="text-xs text-muted-foreground p-2">Nenhuma culinária disponível.</div>}
                   </div>
                   {/* Close overlay */}
                   <div className="fixed inset-0 z-[-1]" onClick={() => setIsCuisineOpen(false)} />
                </div>
             )}
         </div>

         {/* Active Filters Badges */}
         {selectedType && (
            <Badge variant="secondary" className="h-8 px-2 text-xs gap-1">
               {venueTypeLabels[selectedType]}
               <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => {
                  setSelectedType(null);
                  onTypeChange(null);
               }} />
            </Badge>
         )}

         {selectedCuisines.map(id => {
            const cuisine = availableCuisines.find(c => c.id === id);
            if (!cuisine) return null;
            return (
               <Badge key={id} variant="secondary" className="h-8 px-2 text-xs gap-1">
                  {cuisine.name}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleCuisineToggle(id)} />
               </Badge>
            );
         })}
         
         {(selectedType || selectedCuisines.length > 0 || location) && (
            <Button 
               variant="ghost" 
               size="sm" 
               className="h-8 text-xs text-muted-foreground hover:text-foreground"
               onClick={() => {
                  setSelectedType(null);
                  onTypeChange(null);
                  setSelectedCuisines([]);
                  onCuisineChange([]);
                  setLocation("");
                  setLocation(""); // Sync local state? Actually setting the state above triggers effect
                  // But the effect depends on search string changes.
                  // I should reset the local state too.
                  setLocation(""); 
                  setSearch("");
                  onSearchChange("");
               }}
            >
               Limpar filtros
            </Button>
         )}
      </div>
    </div>
  );
}

// Utility for cn if not imported (but standard in this codebase)
import { cn } from "@/lib/utils";
