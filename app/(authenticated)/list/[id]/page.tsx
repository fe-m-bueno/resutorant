'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Lock,
  Globe,
  GripVertical,
  Plus,
  Trash2,
  Settings,
  Save,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';

import {
  getListDetails,
  reorderListItems,
  removeListItem,
  deleteList,
} from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { DraggableList } from '@/components/lists/draggable-list';
import { ListSettingsDialog } from '@/components/lists/list-settings-dialog';
import { AddToListModal } from '@/components/lists/add-to-list-modal';
import { AddLogModal } from '@/components/add-log-modal';
import { VenueCard } from '@/components/venue-card';
import { ReviewCard } from '@/components/review-card';
import type { ListWithItems, ListItemWithDetails, Profile } from '@/lib/types';
import { useLayout } from '@/components/layout/layout-context';

export default function ListDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [list, setList] = useState<ListWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('places');
  const [isReordering, setIsReordering] = useState(false);
  const [originalItems, setOriginalItems] = useState<ListItemWithDetails[]>([]);
  const { setTitle } = useLayout();

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }

      // Get viewer ID for privacy filtering
      const viewerId = user?.id;
      const data = await getListDetails(id as string, viewerId);
      setList(data);
      if (data) {
        setTitle(data.name);
        if (!data.show_places && data.show_reviews) setActiveTab('reviews');
        else setActiveTab('places');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar lista');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReorder = (items: ListItemWithDetails[]) => {
    if (!list) return;
    // Recalculate positions based on new index
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));
    // Update local state immediately for responsiveness
    setList({ ...list, items: updatedItems });
  };

  const startReordering = () => {
    if (!list) return;
    setOriginalItems(list.items);
    setIsReordering(true);
  };

  const cancelReorder = () => {
    if (!list) return;
    setList({ ...list, items: originalItems });
    setIsReordering(false);
    setOriginalItems([]);
  };

  const saveOrder = async () => {
    if (!list) return;

    // Prepare update payload
    const updates = list.items.map((item, index) => ({
      id: item.id,
      list_id: list.id,
      position: index,
      venue_id: item.venue_id,
      review_id: item.review_id,
    }));

    try {
      await reorderListItems(updates);
      toast.success('Ordem salva com sucesso');
      setIsReordering(false);
      setOriginalItems([]);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar ordem');
      // Revert needs manual reload or passing original items back?
      // Actually if save fails, user might want to try again or cancel.
      // Let's keep them in reorder mode.
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remover item da lista?')) return;
    try {
      await removeListItem(itemId);
      toast.success('Item removido');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover item');
    }
  };

  const handleDeleteList = async () => {
    if (!list || !currentUser) return;
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

    try {
      await deleteList(list.id, currentUser.id, currentUser.is_admin);
      toast.success('Lista excluída');
      router.push('/lists');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir lista');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 glass border-b border-border/30 h-14 flex items-center px-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </header>
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold">Lista não encontrada</h2>
        <Button variant="link" onClick={() => router.push('/lists')}>
          Voltar para listas
        </Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === list.user_id;

  // Filter items based on settings and type
  const placeItems = list.items.filter((i) => i.venue_id && !i.review_id);
  const reviewItems = list.items.filter((i) => i.review_id);

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-3xl px-4 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* List Header Info */}
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl md:text-4xl shrink-0">
            {list.icon || <span className="opacity-50">📋</span>}
          </div>
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Link
                href={`/@${(list as any).author?.username}`}
                className="hover:underline"
              >
                @{(list as any).author?.username}
              </Link>
              <span>•</span>
              {list.is_public ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Pública
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Privada
                </span>
              )}
              <span>•</span>
              <span>{list.items.length} itens</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <>
              {isReordering ? (
                <>
                  <Button
                    variant="outline"
                    onClick={cancelReorder}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button onClick={saveOrder} className="gap-2">
                    <Save className="h-4 w-4" /> Salvar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={startReordering}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" /> Reordenar
                  </Button>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Adicionar item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsSettingsOpen(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" /> Configurações
                  </Button>
                </>
              )}

              <ListSettingsDialog
                list={list}
                onUpdate={loadData}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
              />
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {list.show_places && (
              <TabsTrigger value="places">
                Lugares{' '}
                <Badge variant="secondary" className="ml-2 text-[10px] h-4">
                  {placeItems.length}
                </Badge>
              </TabsTrigger>
            )}
            {list.show_reviews && (
              <TabsTrigger value="reviews">
                Reviews{' '}
                <Badge variant="secondary" className="ml-2 text-[10px] h-4">
                  {reviewItems.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="places" className="mt-6 space-y-4">
            {list.show_places && placeItems.length > 0 ? (
              isReordering && isOwner ? (
                <DraggableList
                  items={placeItems}
                  className="space-y-4"
                  onReorder={(items) =>
                    handleReorder([...items, ...reviewItems])
                  }
                  // If items are mixed in one order, splitting them into tabs breaks the "absolute" order visualization.
                  // Unless "lugares" tab only shows the venues in their relative order.
                  // Let's assume order is maintained globally but viewed filtered.
                  // dragging in a filtered view is complex (gap filling).
                  // For simplicity: If "ordered list" is on, maybe we should show "All Items" or just handle reordering within the tab updates the global order relative to each other?
                  // Or maybe the user meant dragging within the specific tab.
                  // I'll assume sorting within the tab updates the position.
                  // I'll pass only placeItems to DraggableList.
                  // onReorder will receive reordered placeItems. I need to merge back with reviewItems.
                  // Actually, simpler: just update the positions of the moved items.
                  renderItem={(item, isDragging) => (
                    <div className="group relative">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {/* Number Badge */}
                      {list.is_ordered && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-sm border border-background">
                          {item.position + 1}
                        </div>
                      )}
                      {/* Remove button */}
                      {isOwner && !isDragging && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 z-10 scale-75 shadow-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="pointer-events-none">
                        {/* Venue Card Content Wrapper? VenueCard might have interactive elements. 
                                                 Draggable item children usually shouldn't capture pointer events if using handle?
                                                 If using whole item drag, interactive elements inside need to stop propagation.
                                                 VenueCard is complex. Maybe just render it.
                                                 The DraggableList implementation wraps in `touch-none`.
                                              */}
                        <VenueCard venue={item.venue!} />
                      </div>
                    </div>
                  )}
                />
              ) : (
                // Static list
                <div className="space-y-4">
                  {placeItems.map((item, idx) => (
                    <div key={item.id} className="relative group">
                      {list.is_ordered && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-sm border border-background">
                          {item.position + 1}
                        </div>
                      )}
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 z-10 scale-75 shadow-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <VenueCard venue={item.venue!} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {list.show_places
                  ? 'Nenhum lugar nesta lista'
                  : 'A visualização de lugares está desativada'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {/* Similar logic for reviews */}
            {list.show_reviews && reviewItems.length > 0 ? (
              isReordering && isOwner ? (
                <DraggableList
                  items={reviewItems}
                  className="space-y-4"
                  onReorder={(items) =>
                    handleReorder([...placeItems, ...items])
                  }
                  renderItem={(item, isDragging) => (
                    <div className="group relative">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {/* Number Badge */}
                      {list.is_ordered && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-sm border border-background">
                          {item.position + 1} // Logic for global numbering? If
                          tabs are split, numbering might be confusing if
                          global.
                          {/* If global: item.position + 1. If relative: index + 1. 
                                                    User requirement: "tem um icone ... com o número selecionado da ordem".
                                                    Usually implies the global order. So item.position + 1 is correct.
                                                */}
                        </div>
                      )}
                      {isOwner && !isDragging && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 z-10 scale-75 shadow-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <div className="pointer-events-none">
                        <ReviewCard review={item.review!} />
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  {reviewItems.map((item) => (
                    <div key={item.id} className="relative group">
                      {list.is_ordered && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-sm border border-background">
                          {item.position + 1}
                        </div>
                      )}
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 z-10 scale-75 shadow-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <ReviewCard review={item.review!} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {list.show_reviews
                  ? 'Nenhum review nesta lista'
                  : 'A visualização de reviews está desativada'}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {list && (
        <AddToListModal
          listId={list.id}
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={loadData}
        />
      )}

      <AddLogModal
        open={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
