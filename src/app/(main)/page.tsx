'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, writeBatch, doc, getDocs } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';

import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, AlertTriangle, X, Trash2, FolderSymlink, Smartphone } from 'lucide-react';
import { AddVideoDialog } from '@/components/add-video-dialog';
import type { Video, Category, Platform } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { InstagramIcon, YoutubeIcon, TiktokIcon, FacebookIcon, TwitterIcon } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import QRCode from 'react-qr-code';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


const platformFilters: { platform: Platform; icon: React.ComponentType<{ className?: string }> }[] = [
  { platform: 'youtube', icon: YoutubeIcon },
  { platform: 'tiktok', icon: TiktokIcon },
  { platform: 'instagram', icon: InstagramIcon },
  { platform: 'facebook', icon: FacebookIcon },
  { platform: 'twitter', icon: TwitterIcon },
];

function HomeContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isAddVideoOpen, setAddVideoOpen] = useState(false);
  const [isMobileAppOpen, setMobileAppOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync state with URL params
  useEffect(() => {
    const categoryIdFromParams = searchParams.get('categoryId');
    setSelectedCategoryId(categoryIdFromParams);

  }, [searchParams]);

  // --- Bulk Actions State ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch categories for the current user
  const categoriesQuery = useMemoFirebase(() =>
    (user?.uid && firestore) ? query(collection(firestore, 'users', user.uid, 'categories')) : null
    , [firestore, user?.uid]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const selectedCategory = useMemo(() => {
    return categories?.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (categoriesLoading || !selectedCategoryId || !selectedCategory) return;
    if (selectedCategory?.isLocked) {
      router.replace(`/locked?categoryId=${selectedCategoryId}`);
    }
  }, [selectedCategory, selectedCategoryId, categoriesLoading, router]);

  // Fetch videos for the user
  const videosQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;

    let q = query(
      collection(firestore, 'users', user.uid, 'videos'),
      orderBy('dateAdded', 'desc')
    );

    return q;
  }, [firestore, user?.uid]);

  const { data: videos, isLoading: videosLoading, error: videosError } = useCollection<Video>(videosQuery);

  // Client-side filtering logic
  const filteredVideos = useMemo(() => {
    if (!videos) return [];

    if (selectedCategory?.isLocked) {
      return [];
    }

    return videos.filter(video => {
      const matchesCategory = selectedCategoryId ? video.categoryId === selectedCategoryId : true;
      const matchesPlatform = selectedPlatform ? video.platform === selectedPlatform : true;
      const matchesSearch = searchTerm ? video.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;

      // Do not show videos from locked categories in the main "all" feed
      if (!selectedCategoryId) {
        const videoCategory = categories?.find(c => c.id === video.categoryId);
        if (videoCategory?.isLocked) {
          return false;
        }
      }

      return matchesCategory && matchesPlatform && matchesSearch;
    });

  }, [videos, selectedCategoryId, selectedPlatform, searchTerm, selectedCategory, categories]);

  const isLoading = isUserLoading || categoriesLoading || videosLoading;

  // --- Bulk Actions Logic ---
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedVideos(new Set()); // Clear selections on exiting mode
    } else {
      setIsSelectionMode(true);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    if (!isSelectionMode) return;
    setSelectedVideos(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(videoId)) {
        newSelected.delete(videoId);
      } else {
        newSelected.add(videoId);
      }
      return newSelected;
    });
  };

  const handleBulkDelete = async () => {
    if (!user || !firestore || selectedVideos.size === 0) return;
    try {
      const batch = writeBatch(firestore);
      selectedVideos.forEach(videoId => {
        const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
        batch.delete(videoRef);
      });
      await batch.commit();
      toast({ title: `${selectedVideos.size} video silindi.` });
      setSelectedVideos(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({ variant: "destructive", title: "Hata", description: "Videolar silinirken bir sorun oluştu." });
    }
  };

  const handleBulkMove = async (newCategoryId: string) => {
    if (!user || !firestore || selectedVideos.size === 0) return;
    try {
      const batch = writeBatch(firestore);
      selectedVideos.forEach(videoId => {
        const videoRef = doc(firestore, 'users', user.uid, 'videos', videoId);
        batch.update(videoRef, { categoryId: newCategoryId });
      });
      await batch.commit();
      toast({ title: `${selectedVideos.size} video yeni kategoriye taşındı.` });
      setSelectedVideos(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Bulk move error:", error);
      toast({ variant: "destructive", title: "Hata", description: "Videolar taşınırken bir sorun oluştu." });
    }
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    const category = categories?.find(c => c.id === categoryId);

    if (category?.isLocked) {
      router.push(`/locked?categoryId=${categoryId}`);
      return;
    }

    const newPath = categoryId ? `/?categoryId=${categoryId}` : '/';
    router.push(newPath, { scroll: false });
  }

  // --- End Bulk Actions Logic ---


  return (
    <>
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-safe">
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Logo className="h-24" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMobileAppOpen(true)}>
                <Smartphone className="mr-2 h-4 w-4" /> Mobil Uygulama
              </Button>
              <Button size="sm" onClick={() => setAddVideoOpen(true)} disabled={!user}>
                <Plus className="mr-2 h-4 w-4" /> Video Ekle
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Koleksiyonunda ara..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="flex justify-end mb-2">
          <Button variant={isSelectionMode ? 'destructive' : 'secondary'} size="sm" onClick={toggleSelectionMode} disabled={isLoading || !videos || videos.length === 0}>
            {isSelectionMode ? 'İptal' : 'Seç'}
          </Button>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">Kategoriler</TabsTrigger>
              <TabsTrigger value="platforms">Platformlar</TabsTrigger>
            </TabsList>
            <TabsContent value="categories">
              <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4 mt-2">
                <Button
                  variant={selectedCategoryId === null ? 'secondary' : 'ghost'}
                  onClick={() => handleCategorySelect(null)}
                  size="sm"
                  className="shrink-0"
                >
                  Tüm Kategoriler
                </Button>
                {categories && categories.filter(c => !c.isLocked).map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      variant={isSelected ? 'default' : 'ghost'}
                      onClick={() => handleCategorySelect(cat.id)}
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
                {categoriesLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-24 h-9 rounded-md" />)}
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] w-full">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ))
          ) : videosError ? (
            <Alert variant="destructive" className="col-span-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Hata!</AlertTitle>
              <AlertDescription>
                Videolar yüklenirken bir hata oluştu. Lütfen güvenlik kurallarınızı ve veritabanı dizinlerinizi kontrol edin.
              </AlertDescription>
            </Alert>
          ) : filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isSelectionMode={isSelectionMode}
                isSelected={selectedVideos.has(video.id)}
                onVideoSelect={() => handleVideoSelect(video.id)}
              />
            ))
          ) : (
            <div className="text-center py-20 col-span-full">
              <h2 className="text-2xl font-semibold mb-2">
                {searchTerm || selectedCategoryId || selectedPlatform ? `Sonuç bulunamadı` : "Henüz video eklemediniz"}
              </h2>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategoryId || selectedPlatform ? "Farklı bir arama veya filtre deneyin." : 'Başlamak için "Video Ekle" butonuna tıklayın.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {isSelectionMode && selectedVideos.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
            <div className='flex items-center gap-4'>
              <Button variant="ghost" size="icon" onClick={toggleSelectionMode}>
                <X className="h-5 w-5" />
              </Button>
              <span className="font-semibold">{selectedVideos.size} video seçildi</span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Seçilenleri taşı">
                    <FolderSymlink />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderSymlink className="mr-2 h-4 w-4" />
                      <span>Kategoriye Taşı</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {categories && categories.filter(c => !c.isLocked).length > 0 ? (
                        categories.filter(c => !c.isLocked).map(cat => (
                          <DropdownMenuItem key={cat.id} onClick={() => handleBulkMove(cat.id)}>
                            <span className='mr-2'>{cat.emoji}</span>
                            {cat.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>Kategori yok</DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" aria-label="Seçilenleri sil">
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{selectedVideos.size} videoyu silmek istediğinizden emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz. Seçilen tüm videolar kalıcı olarak koleksiyonunuzdan silinecektir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}


      <AddVideoDialog
        isOpen={isAddVideoOpen}
        onOpenChange={setAddVideoOpen}
      />

      <Dialog open={isMobileAppOpen} onOpenChange={setMobileAppOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mobil Uygulamayı İndir</DialogTitle>
            <DialogDescription>
              Android uygulamasını indirmek için aşağıdaki QR kodu telefonunuzun kamerasıyla okutun. (Sürüm: v1.0.18)
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <QRCode
                value="https://github.com/kibrit74/videokoleks/releases/download/v1.0.18/app-debug.apk"
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Veya <a href="https://github.com/kibrit74/videokoleks/releases/download/v1.0.18/app-debug.apk" className="text-primary hover:underline font-medium">buraya tıklayarak</a> indirebilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-24 w-48 mb-8" /><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"><Skeleton className="aspect-[9/16] w-full" /><Skeleton className="aspect-[9/16] w-full" /><Skeleton className="aspect-[9/16] w-full" /></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
