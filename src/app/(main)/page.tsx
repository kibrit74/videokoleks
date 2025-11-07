'use client';

import { useState, useMemo } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc } from 'firebase/firestore';

import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, AlertTriangle, X, Trash2, FolderSymlink, Star } from 'lucide-react';
import { AddVideoDialog } from '@/components/add-video-dialog';
import type { Video, Category, Platform } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { InstagramIcon, YoutubeIcon, TiktokIcon, FacebookIcon } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const platformFilters: { platform: Platform; icon: React.ComponentType<{ className?: string }> }[] = [
    { platform: 'youtube', icon: YoutubeIcon },
    { platform: 'tiktok', icon: TiktokIcon },
    { platform: 'instagram', icon: InstagramIcon },
    { platform: 'facebook', icon: FacebookIcon },
];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAddVideoOpen, setAddVideoOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Bulk Actions State ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  // Fetch categories for the current user
  const categoriesQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  // ALWAYS fetch all videos for the user, ordered by date.
  // Filtering will be done on the client-side.
  const videosQuery = useMemoFirebase(() => {
    if (!user) return null;
    const videosCollection = collection(firestore, 'users', user.uid, 'videos');
    return query(videosCollection, orderBy('dateAdded', 'desc'));
  }, [firestore, user]);

  const { data: videos, isLoading: videosLoading, error: videosError } = useCollection<Video>(videosQuery);

  // Client-side filtering logic
  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    
    return videos.filter(video => {
      const matchesCategory = selectedCategoryId ? video.categoryId === selectedCategoryId : true;
      const matchesPlatform = selectedPlatform ? video.platform === selectedPlatform : true;
      const matchesSearch = searchTerm ? video.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchesCategory && matchesPlatform && matchesSearch;
    });

  }, [videos, selectedCategoryId, selectedPlatform, searchTerm]);
  
  const isLoading = isUserLoading || categoriesLoading || videosLoading;

  // --- Bulk Actions Handlers ---
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedVideos([]); // Reset selection when toggling mode
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedVideos([]);
  };

  const handleBulkDelete = async () => {
    if (!user || !firestore || selectedVideos.length === 0) return;
    
    const batch = writeBatch(firestore);
    selectedVideos.forEach(videoId => {
      const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
      batch.delete(videoRef);
    });

    try {
      await batch.commit();
      toast({ title: `${selectedVideos.length} video başarıyla silindi.` });
      cancelSelectionMode();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast({ variant: "destructive", title: "Toplu silme başarısız oldu." });
    }
  };

   const handleBulkMove = async (newCategoryId: string) => {
    if (!user || !firestore || selectedVideos.length === 0) return;

    const batch = writeBatch(firestore);
    selectedVideos.forEach(videoId => {
      const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
      batch.update(videoRef, { categoryId: newCategoryId });
    });

    try {
      await batch.commit();
      const categoryName = categories?.find(c => c.id === newCategoryId)?.name || '';
      toast({ title: `${selectedVideos.length} video "${categoryName}" kategorisine taşındı.` });
      cancelSelectionMode();
    } catch (error) {
      console.error("Bulk move failed:", error);
      toast({ variant: "destructive", title: "Toplu taşıma başarısız oldu." });
    }
  };

  const handleBulkFavorite = async () => {
    if (!user || !firestore || selectedVideos.length === 0) return;

    const batch = writeBatch(firestore);
    selectedVideos.forEach(videoId => {
      const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
      batch.update(videoRef, { isFavorite: true });
    });

    try {
      await batch.commit();
      toast({ title: `${selectedVideos.length} video favorilere eklendi.` });
      cancelSelectionMode();
    } catch (error) {
      console.error("Bulk favorite failed:", error);
      toast({ variant: "destructive", title: "Toplu favorilere ekleme başarısız oldu." });
    }
  };

  return (
    <div className={cn("container mx-auto max-w-5xl px-4 py-8", (isSelectionMode && selectedVideos.length > 0) && "pb-24")}>
      <header className="mb-8">
        <div className='flex justify-between items-center mb-2'>
         <h1 className="text-4xl font-bold font-headline text-center md:text-left">📦 VideoKoleks</h1>
         <Button variant={isSelectionMode ? "destructive" : "outline"} onClick={toggleSelectionMode} disabled={isLoading}>
            {isSelectionMode ? "İptal" : "Seç"}
          </Button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Koleksiyonunda ara..." 
              className="pl-10 h-12 text-lg" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSelectionMode}
            />
          </div>
          <Button size="lg" className="w-full md:w-auto" onClick={() => setAddVideoOpen(true)} disabled={!user || isSelectionMode}>
            <Plus className="mr-2 h-5 w-5" /> Video Ekle
          </Button>
        </div>
      </header>

      <Tabs defaultValue="categories" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" disabled={isSelectionMode}>Kategoriler</TabsTrigger>
          <TabsTrigger value="platforms" disabled={isSelectionMode}>Platformlar</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
           <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4 mt-2">
              <Button 
                variant={selectedCategoryId === null ? 'secondary' : 'ghost'}
                onClick={() => setSelectedCategoryId(null)}
                size="sm"
                className="shrink-0"
              >
                Tüm Kategoriler
              </Button>
              {categories && categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <Button
                    key={cat.id} 
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    size="sm"
                    className={cn(
                      'shrink-0',
                      isSelected && `${cat.color} text-white hover:opacity-90`
                    )}
                  >
                    <span className="mr-2">{cat.emoji}</span>
                    {cat.name}
                  </Button>
                )
              })}
              {categoriesLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="w-24 h-9 rounded-md" />)}
          </div>
        </TabsContent>
        <TabsContent value="platforms">
          <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4 mt-2">
              <Button 
                variant={selectedPlatform === null ? 'secondary' : 'ghost'}
                onClick={() => setSelectedPlatform(null)}
                size="sm"
                className="shrink-0"
              >
                Tüm Platformlar
              </Button>
              {platformFilters.map((p) => {
                const isSelected = selectedPlatform === p.platform;
                const PlatformIcon = p.icon;
                return (
                  <Button
                    key={p.platform} 
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => setSelectedPlatform(p.platform)}
                    size="sm"
                    className={cn('shrink-0')}
                  >
                    <PlatformIcon className="mr-2 h-4 w-4" />
                    {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)}
                  </Button>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="aspect-[9/16] w-full">
                        <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                ))}
            </div>
        ) : videosError ? (
             <Alert variant="destructive" className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Hata!</AlertTitle>
              <AlertDescription>
                Videolar yüklenirken bir hata oluştu: {videosError.message}
              </AlertDescription>
            </Alert>
        ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredVideos.map((video) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedVideos.includes(video.id)}
                      onSelect={handleVideoSelect}
                    />
                ))}
            </div>
        ) : (
         <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">
              {searchTerm || selectedCategoryId || selectedPlatform ? `Sonuç bulunamadı` : "Henüz video eklemediniz"}
            </h2>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategoryId || selectedPlatform ? "Farklı bir arama veya filtre deneyin." : 'Başlamak için "Video Ekle" butonuna tıklayın.'}
            </p>
          </div>
        )}

      <AddVideoDialog 
        isOpen={isAddVideoOpen} 
        onOpenChange={setAddVideoOpen}
      />

       {isSelectionMode && selectedVideos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t p-2 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:rounded-lg md:w-auto md:shadow-lg">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className='flex items-center gap-2'>
              <Button variant="ghost" size="icon" onClick={cancelSelectionMode}><X className="h-5 w-5" /></Button>
              <span className='font-semibold'>{selectedVideos.length} video seçildi</span>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant="ghost" size="icon" onClick={handleBulkFavorite} aria-label="Seçilenleri favorilere ekle">
                <Star className='text-yellow-400 fill-yellow-400'/>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Seçilenleri taşı">
                    <FolderSymlink />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Kategoriye Taşı</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {categories && categories.map(cat => (
                          <DropdownMenuItem key={cat.id} onClick={() => handleBulkMove(cat.id)}>
                            <span className="mr-2">{cat.emoji}</span> {cat.name}
                          </DropdownMenuItem>
                        ))}
                        {(!categories || categories.length === 0) && <DropdownMenuItem disabled>Kategori yok</DropdownMenuItem>}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Seçilenleri sil">
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{selectedVideos.length} Videoyu Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem geri alınamaz. Seçilen videolar kalıcı olarak koleksiyonunuzdan silinecektir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
