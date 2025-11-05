'use client';

import { notFound, useParams } from 'next/navigation';
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
} from 'lucide-react';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Platform, Video } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { videos as initialVideos } from '@/lib/data';

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
            // Add '/embed' to the path, e.g. /reels/Cxyz/ -> /reels/Cxyz/embed
            if (urlObject.pathname.includes('/reel/') || urlObject.pathname.includes('/p/')) {
                urlObject.pathname = urlObject.pathname.replace(/\/$/, '') + '/embed';
                return urlObject.toString();
            }
        }
    } catch(e) {
        console.error("Invalid URL for embedding:", url);
        return null;
    }
    // TikTok oEmbed is more complex and often requires server-side fetching or a library.
    // A simple link might be the most reliable option for now.
    return null;
}

const NEW_VIDEOS_STORAGE_KEY = 'newVideos';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  
  const [allVideos, setAllVideos] = useState<Video[]>(initialVideos);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const storedNewVideos = localStorage.getItem(NEW_VIDEOS_STORAGE_KEY);
    if (storedNewVideos) {
        try {
            const newVideos: Video[] = JSON.parse(storedNewVideos);
            // Combine initial videos and new videos, removing duplicates
            setAllVideos(prevVideos => [...newVideos, ...prevVideos.filter(v => !newVideos.some(nv => nv.id === v.id))]);
        } catch (e) {
            console.error("Failed to parse new videos from localStorage", e);
        }
    }
  }, []);
  
  const currentVideo = useMemo(() => allVideos.find((v) => v.id === videoId), [allVideos, videoId]);

  useEffect(() => {
    setIsPlaying(false); // Reset playing state on video change
  }, [videoId]);


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

  const videoIndex = allVideos.findIndex(v => v.id === videoId);
  const prevVideo = videoIndex > 0 ? allVideos[videoIndex - 1] : null;
  const nextVideo = videoIndex < allVideos.length - 1 ? allVideos[videoIndex + 1] : null;

  const PlatformIcon = platformIcons[currentVideo.platform];
  const embedUrl = getEmbedUrl(currentVideo.originalUrl, currentVideo.platform);


  const navigateToVideo = (targetVideoId: string | undefined) => {
      if (targetVideoId) {
          window.location.href = `/videos/${targetVideoId}`;
      }
  }

  const handlePlayClick = () => {
    if (embedUrl) {
      setIsPlaying(true);
    } else {
      // Fallback for platforms that can't be embedded easily (like TikTok)
      window.open(currentVideo.originalUrl, '_blank');
    }
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
                <p className="text-xs text-neutral-400">📅 Kaydedildi: {currentVideo.dateAdded}</p>
              </div>

              <div className="flex justify-around items-center pt-2">
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Heart className={cn(currentVideo.isFavorite && "fill-red-500 text-red-500")} /> Favori</Button>
                <Button asChild variant="ghost" className="flex-col h-auto text-white gap-1">
                    <Link href={currentVideo.originalUrl} target="_blank">
                        <ExternalLink/> Orijinali Aç
                    </Link>
                </Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Share2/> Paylaş</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Edit/> Düzenle</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Trash2/> Sil</Button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
