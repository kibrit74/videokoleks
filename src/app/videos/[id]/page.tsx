'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
  Heart,
  Loader2,
} from 'lucide-react';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Platform, Video } from '@/lib/types';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, updateDoc, deleteDoc, query, orderBy, getDocs, limit, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
          router.push(`/videos/${targetVideoId}`);
      }
  }

  const handlePlayClick = () => {
    if (embedUrl) {
      setIsPlaying(true);
    } else {
      window.open(currentVideo.originalUrl, '_blank');
    }
  }

  const toggleFavorite = async () => {
      if (!videoDocRef) return;
      await updateDoc(videoDocRef, { isFavorite: !currentVideo.isFavorite });
      toast({ title: currentVideo.isFavorite ? 'Favorilerden kaldırıldı.' : 'Favorilere eklendi!' });
  }
  
  const deleteVideo = async () => {
    if(!videoDocRef) return;
    await deleteDoc(videoDocRef);
    toast({ title: 'Video silindi.'});
    router.push('/');
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    // Firestore Timestamps can be null on the client before they are set by the server.
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
          <Image
            src={currentVideo.thumbnailUrl}
            alt={currentVideo.title}
            fill
            className="object-cover"
            data-ai-hint={currentVideo.imageHint}
            priority
          />
        )}
        
        <div className={cn("absolute inset-0 flex flex-col justify-between p-4 bg-black/30 transition-opacity", isPlaying ? "opacity-0 pointer-events-none" : "opacity-100")}>
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

          <div className="flex items-center justify-center">
            <Button variant="ghost" size="icon" className="text-white bg-white/20 hover:bg-white/30 rounded-full h-20 w-20" onClick={handlePlayClick}>
                <Play className="h-10 w-10 fill-white" />
            </Button>
          </div>
          
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

              <div className="space-y-2">
                <p className="text-sm"><span className={cn("inline-block w-6 text-center mr-1 p-1 rounded-md", currentVideo.category.color)}>{currentVideo.category.emoji}</span> Kategori: {currentVideo.category.name}</p>
                {currentVideo.notes && <p className="text-sm bg-white/10 p-2 rounded-md">📝 Notun: "{currentVideo.notes}"</p>}
                <p className="text-xs text-neutral-400">📅 Kaydedildi: {formatDate(currentVideo.dateAdded)}</p>
              </div>

              <div className="flex justify-around items-center pt-2">
                <Button variant="ghost" className="flex-col h-auto text-white gap-1" onClick={toggleFavorite}><Heart className={cn(currentVideo.isFavorite && "fill-red-500 text-red-500")} /> Favori</Button>
                <Button asChild variant="ghost" className="flex-col h-auto text-white gap-1">
                    <Link href={currentVideo.originalUrl} target="_blank">
                        <ExternalLink/> Orijinali Aç
                    </Link>
                </Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1" onClick={() => toast({title: 'Çok yakında!'})}><Share2/> Paylaş</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1" onClick={() => toast({title: 'Çok yakında!'})}><Edit/> Düzenle</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1 text-red-500 hover:text-red-500" onClick={deleteVideo}><Trash2/> Sil</Button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
