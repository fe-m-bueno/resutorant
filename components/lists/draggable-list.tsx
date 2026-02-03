"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface DraggableItemProps {
  id: string
  children: React.ReactNode
  className?: string
  dragHandle?: boolean
}

function DraggableItem({ id, children, className, dragHandle = false }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  }

  // If dragHandle is true, we pass attributes and listeners to a handle element
  // But here we might want the whole item to be draggable or just a handle.
  // Implementation: We'll pass `dragHandleProps` to the children or wrap them.
  // For now, let's assume the whole item is draggable if dragHandle is false, or specific parts if usage differs.
  // To keep it simple, we wrap everything.

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn("touch-none", className)}>
      {children}
    </div>
  )
}

interface DraggableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, isDragging?: boolean) => React.ReactNode
  className?: string
}

export function DraggableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: DraggableListProps<T>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
          distance: 10 // Require movement of 10px before drag starts (prevents accidental clicks)
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      onReorder(arrayMove(items, oldIndex, newIndex))
    }

    setActiveId(null)
  }

  const activeItem = React.useMemo(() => items.find((item) => item.id === activeId), [activeId, items])

  const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.4",
        },
      },
    }),
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <DraggableItem key={item.id} id={item.id}>
              {renderItem(item)}
            </DraggableItem>
          ))}
        </div>
      </SortableContext>
       <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeItem ? renderItem(activeItem, true) : null}
      </DragOverlay>
    </DndContext>
  )
}
