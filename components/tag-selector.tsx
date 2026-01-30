"use client"

import { useState } from "react"
import { X, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Tag } from "@/lib/types"

interface TagSelectorProps {
  tags: Tag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateTag?: (name: string) => Promise<Tag>
  placeholder?: string
}

export function TagSelector({
  tags,
  selectedIds,
  onChange,
  onCreateTag,
  placeholder = "Adicionar tags...",
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id))
  const availableTags = tags.filter(
    (t) =>
      !selectedIds.includes(t.id) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedIds, tagId])
    }
  }

  const handleRemove = (tagId: string) => {
    onChange(selectedIds.filter((id) => id !== tagId))
  }

  const handleCreate = async () => {
    if (!onCreateTag || !search.trim()) return
    setIsCreating(true)
    try {
      const newTag = await onCreateTag(search.trim())
      onChange([...selectedIds, newTag.id])
      setSearch("")
    } catch {
      // Handle error
    } finally {
      setIsCreating(false)
    }
  }

  const showCreateOption =
    onCreateTag &&
    search.trim() &&
    !tags.some((t) => t.name.toLowerCase() === search.toLowerCase())

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="pl-2.5 pr-1 py-1 gap-1 text-sm"
              style={{
                backgroundColor: `${tag.color ?? '#6366f1'}20`,
                borderColor: tag.color ?? '#6366f1',
                color: tag.color ?? '#6366f1',
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add tags popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <Input
            placeholder="Buscar ou criar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 mb-2"
          />
          <div 
            className="max-h-48 overflow-y-auto space-y-1"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color ?? '#6366f1' }}
                />
                <span className="flex-1 text-left">{tag.name}</span>
                {selectedIds.includes(tag.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors text-primary"
              >
                <Plus className="h-4 w-4" />
                <span>Criar &quot;{search}&quot;</span>
              </button>
            )}
            {availableTags.length === 0 && !showCreateOption && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma tag encontrada
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
