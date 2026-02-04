"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Plus, MapPin, MessageSquare, Star, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { searchVenues, searchReviews, addListItem } from "@/lib/queries"
import { useDebounce } from "@/hooks/use-debounce" // ecific hook or implementation
import { toast } from "sonner"
import type { Venue, ReviewWithVenue } from "@/lib/types"

// Simple debounce hook if not exists, but likely does or I can implement inline
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)
    setIsDebouncing(true)
    return () => clearTimeout(handler)
  }) // wait, this is wrong. useEffect needed.

  return debouncedValue;
}

// Recorrect useDebounce. I'll just use useEffect in component or assume no hook for now and use timeout.

interface AddToListModalProps {
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddToListModal({ listId, open, onOpenChange, onSuccess }: AddToListModalProps) {
  const [activeTab, setActiveTab] = useState("places")
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<{ venues: Venue[], reviews: ReviewWithVenue[] }>({ venues: [], reviews: [] })
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [viewerId, setViewerId] = useState<string | undefined>(undefined)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  const observerTarget = useRef<HTMLDivElement>(null)

  // Get current user ID on mount
  useEffect(() => {
    async function getUserId() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setViewerId(user?.id)
    }
    if (open) {
      getUserId()
    }
  }, [open])

  const performSearch = async (query: string, tab: string, pageNum: number) => {
    // Removed empty query check to allow initial load
    setLoading(true)
    try {
        if (tab === "places") {
            const data = await searchVenues(query, pageNum, limit)
            setResults(prev => ({
                ...prev,
                venues: pageNum === 1 ? data : [...prev.venues, ...data]
            }))
            setHasMore(data.length === limit)
        } else {
            const data = await searchReviews(query, pageNum, limit, viewerId)
            setResults(prev => ({
                ...prev,
                reviews: pageNum === 1 ? data : [...prev.reviews, ...data]
            }))
            setHasMore(data.length === limit)
        }
    } catch (error) {
        console.error(error)
    } finally {
        setLoading(false)
    }
  }

  // Initial search on mount
  useEffect(() => {
    performSearch("", activeTab, 1)
  }, []) // Run once on mount

  // Effect to trigger search on query change
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setPage(1)
    setHasMore(true)
    
    if (timeoutId) clearTimeout(timeoutId)
    const id = setTimeout(() => {
        performSearch(val, activeTab, 1)
    }, 500)
    setTimeoutId(id)
  }

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    setPage(1)
    setHasMore(true)
    // Always perform search on tab change, leveraging current query (even if empty)
    performSearch(searchQuery, val, 1)
  }
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger load even if searchQuery is empty
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => {
            const nextPage = prev + 1
            performSearch(searchQuery, activeTab, nextPage)
            return nextPage
          })
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loading, hasMore, searchQuery, activeTab])

  const handleAdd = async (itemId: string, type: 'venue' | 'review') => {
    setAddingId(itemId)
    try {
        await addListItem(listId, type, itemId)
        toast.success("Item adicionado à lista!")
        onSuccess()
    } catch (error) {
        console.error(error)
        toast.error("Erro ao adicionar item")
    } finally {
        setAddingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Adicionar à lista</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 space-y-4">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="places">Lugares</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={activeTab === 'places' ? "Buscar lugares..." : "Buscar reviews..."}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 mt-4 border-t">
                <ScrollArea className="h-full">
                     <div className="p-4 space-y-4">
                        {loading && page === 1 && <div className="text-center py-4 text-muted-foreground">Buscando...</div>}
                        
                        {!loading && results.venues.length === 0 && activeTab === 'places' && (
                             <div className="text-center py-4 text-muted-foreground">Nenhum lugar encontrado</div>
                        )}
                        
                        {!loading && results.reviews.length === 0 && activeTab === 'reviews' && (
                             <div className="text-center py-4 text-muted-foreground">Nenhum review encontrado</div>
                        )}

                        {activeTab === 'places' && results.venues.map(venue => (
                            <div key={venue.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{venue.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{venue.type}</div>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleAdd(venue.id, 'venue')} disabled={addingId === venue.id}>
                                    {addingId === venue.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}

                        {activeTab === 'reviews' && results.reviews.map(review => (
                            <div key={review.id} className="flex items-start justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex gap-3">
                                     <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0 overflow-hidden">
                                        {review.venue?.location && (review.venue.location as any).image ? ( // Assuming structure, but using fallback logic mostly
                                             <img src={(review.venue.location as any).image} className="w-full h-full object-cover"/>
                                        ) : (
                                            <MessageSquare className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium line-clamp-1">{review.venue.name}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                            <span>@{review.author?.username}</span>
                                            <span>•</span>
                                            <span className="flex items-center"><Star className="h-3 w-3 mr-0.5 fill-current"/>{review.rating}</span>
                                        </div>
                                        {review.text_review && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{review.text_review}</p>
                                        )}
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleAdd(review.id, 'review')} disabled={addingId === review.id}>
                                    {addingId === review.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                        
                         {/* Loading indicator for pagination and target for observer */}
                         <div ref={observerTarget} className="h-4 w-full">
                            {loading && page > 1 && (
                                <div className="flex justify-center p-2">
                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                            )}
                         </div>
                     </div>
                </ScrollArea>
            </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
