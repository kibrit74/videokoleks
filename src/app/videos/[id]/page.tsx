'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart,
  ExternalLink,
  Trash2,
} from 'lucide-react';
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
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Platform, Video, Category } from '@/lib/types';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

function getEmbedUrl(url: string, platform: Platform): string | null {
    try {
        const urlObject = new URL(url);
        if (platform === 'youtube') {
            const videoId = urlObject.searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
        }
        if (platform === 'instagram') {
            if (urlObject.pathname.includes('/reel/') || urlObject.pathname.includes('/p/')) {
                urlObject.pathname = urlObject.pathname.replace(/\/$/, '') + '/embed';
                return urlObject.toString();
            }
        }
        if (platform === 'tiktok') {
            const videoIdMatch = urlObject.pathname.match(/\/video\/(\d+)/);
            if (videoIdMatch && videoIdMatch[1]) {
                return `https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`;
            }
        }
    } catch(e) {
        console.error("Invalid URL for embedding:", url);
        return null;
    }
    return null;
}


export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);

  const videoDocRef = useMemoFirebase(() => 
    (user && videoId) ? doc(firestore, 'users', user.uid, 'videos', videoId) : null
  , [firestore, user, videoId]);

  const { data: currentVideo, isLoading: videoLoading } = useDoc<Video>(videoDocRef);
  
    // Fetch the category data based on categoryId
  const categoryDocRef = useMemoFirebase(() => 
    user && currentVideo?.categoryId ? doc(firestore, 'users', user.uid, 'categories', currentVideo.categoryId) : null,
    [user, firestore, currentVideo?.categoryId]
  );
  const { data: category } = useDoc<Category>(categoryDocRef);

  // For next/prev navigation
  const videosQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'videos'), orderBy('dateAdded', 'desc')) : null
  , [firestore, user]);
  const { data: allVideos, isLoading: allVideosLoading } = useCollection<Video>(videosQuery);
  
  const videoIndex = useMemo(() => allVideos?.findIndex(v => v.id === videoId) ?? -1, [allVideos, videoId]);
  const prevVideo = videoIndex > 0 ? allVideos?.[videoIndex - 1] : null;
  const nextVideo = (allVideos && videoIndex < allVideos.length - 1) ? allVideos[videoIndex + 1] : null;

  if (videoLoading || allVideosLoading) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
             <div className="relative w-full max-w-sm aspect-[9/16] bg-card overflow-hidden rounded-lg">
                <Skeleton className="w-full h-full" />
             </div>
        </div>
    )
  }

  if (!currentVideo) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <h1 className="text-2xl font-bold">Video bulunamadı.</h1>
            <p className="text-muted-foreground">Video yükleniyor ya da artık mevcut değil.</p>
            <Button asChild variant="ghost" size="lg" className="mt-4 text-white">
                <Link href="/">
                    <ArrowLeft className="mr-2" /> Ana Sayfaya Dön
                </Link>
            </Button>
        </div>
    )
  }

  const PlatformIcon = platformIcons[currentVideo.platform];
  const embedUrl = getEmbedUrl(currentVideo.originalUrl, currentVideo.platform);


  const navigateToVideo = (targetVideoId: string | undefined) => {
      if (targetVideoId) {
          setIsPlaying(false);
          router.push(`/videos/${targetVideoId}`);
      }
  }

  const handlePlayInApp = () => {
    if (embedUrl) {
      setIsPlaying(true);
    } else {
      toast({
          variant: "destructive",
          title: "Oynatılamıyor",
          description: "Bu video uygulama içinde oynatılamıyor. Lütfen 'Orijinali Aç' seçeneğini kullanın.",
      })
    }
  }

  const toggleFavorite = () => {
      if (!videoDocRef || !currentVideo) return;
      const newFavoriteStatus = !currentVideo.isFavorite;
      updateDoc(videoDocRef, { isFavorite: newFavoriteStatus })
        .then(() => {
            toast({ title: newFavoriteStatus ? 'Favorilere eklendi!' : 'Favorilerden kaldırıldı.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: videoDocRef.path,
                operation: 'update',
                requestResourceData: { isFavorite: newFavoriteStatus },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  }
  
  const deleteVideo = () => {
    if (!videoDocRef) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Video referansı bulunamadı.' });
      return;
    }
    deleteDoc(videoDocRef)
      .then(() => {
        toast({ title: 'Video silindi.'});
        router.push('/');
      })
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: videoDocRef.path,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return 'Az önce';
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-card overflow-hidden rounded-lg shadow-2xl shadow-primary/20">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="Embedded Video Player"
          ></iframe>
        ) : (
          <>
            <Image
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              fill
              className="object-cover"
              data-ai-hint={currentVideo.imageHint}
              priority
            />
          </>
        )}
        
        <div className={cn("absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity", isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100")}>
          <header className="flex justify-between items-center">
            <Button asChild variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
               {prevVideo && (
                <Button onClick={() => navigateToVideo(prevVideo?.id)} variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
                    <ChevronLeft />
                </Button>
                )}
                {nextVideo && (
                <Button onClick={() => navigateToVideo(nextVideo?.id)} variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
                    <ChevronRight />
                </Button>
                )}
            </div>
          </header>

          
          <div className="text-white space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-headline">{currentVideo.title}</h1>
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <PlatformIcon className="h-4 w-4" />
                    <span>{currentVideo.platform}</span>
                    <span>•</span>
                    <span>{currentVideo.duration}</span>
                </div>
              </div>
              
               <div className="flex gap-2">
                    <Button asChild className="flex-1" size="lg">
                        <Link href={currentVideo.originalUrl} target="_blank">
                            <ExternalLink/> Orijinali Aç
                        </Link>
                    </Button>
                    {embedUrl && 
                        <Button onClick={handlePlayInApp} variant="secondary" size="lg">
                            <Play /> Burada Oynat
                        </Button>
                    }
                </div>


              <div className="space-y-2">
                {category && <p className="text-sm"><span className={cn("inline-block w-6 text-center mr-1 p-1 rounded-md", category.color)}>{category.emoji}</span> Kategori: {category.name}</p>}
                {currentVideo.notes && <p className="text-sm bg-white/10 p-2 rounded-md">📝 Notun: "{currentVideo.notes}"</p>}
                <p className="text-xs text-neutral-400">📅 Kaydedildi: {formatDate(currentVideo.dateAdded)}</p>
              </div>

              <div className="flex justify-around items-center pt-2">
                <Button variant="ghost" className="flex-col h-auto text-white gap-1" onClick={toggleFavorite}><Heart className={cn(currentVideo.isFavorite && "fill-red-500 text-red-500")} /> Favori</Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button data-testid="delete-video-button" variant="ghost" className="flex-col h-auto text-red-500 hover:text-red-500/90 gap-1">
                        <Trash2/> Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu video kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteVideo} className="bg-destructive hover:bg-destructive/90">
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
