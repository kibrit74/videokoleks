import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { videos } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Star,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
  Heart,
} from 'lucide-react';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Platform } from '@/lib/types';

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const video = videos.find((v) => v.id === params.id);

  if (!video) {
    notFound();
  }
  
  const videoIndex = videos.findIndex(v => v.id === params.id);
  const prevVideoId = videoIndex > 0 ? videos[videoIndex - 1].id : null;
  const nextVideoId = videoIndex < videos.length - 1 ? videos[videoIndex + 1].id : null;

  const PlatformIcon = platformIcons[video.platform];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-card overflow-hidden rounded-lg shadow-2xl shadow-primary/20">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          data-ai-hint={video.imageHint}
        />
        
        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black/30">
          <header className="flex justify-between items-center">
            <Button asChild variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
               {prevVideoId && (
                <Button asChild variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
                    <Link href={`/videos/${prevVideoId}`}><ChevronLeft /></Link>
                </Button>
                )}
                {nextVideoId && (
                <Button asChild variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white">
                    <Link href={`/videos/${nextVideoId}`}><ChevronRight /></Link>
                </Button>
                )}
            </div>
          </header>

          <div className="flex items-center justify-center gap-6">
            <Button variant="ghost" size="icon" className="text-white h-12 w-12"><RotateCcw /></Button>
            <Button variant="ghost" size="icon" className="text-white bg-white/20 hover:bg-white/30 rounded-full h-20 w-20"><Play className="h-10 w-10 fill-white" /></Button>
            <Button variant="ghost" size="icon" className="text-white h-12 w-12"><RotateCw /></Button>
          </div>
          
          <div className="text-white space-y-4">
              <div>
                <h1 className="text-2xl font-bold font-headline">{video.title}</h1>
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <PlatformIcon className="h-4 w-4" />
                    <span>{video.platform}</span>
                    <span>•</span>
                    <span>{video.duration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm"><span className={cn("inline-block w-6 text-center mr-1 p-1 rounded-md", video.category.color)}>{video.category.emoji}</span> Kategori: {video.category.name}</p>
                {video.notes && <p className="text-sm bg-white/10 p-2 rounded-md">📝 Notun: "{video.notes}"</p>}
                <p className="text-xs text-neutral-400">📅 Kaydedildi: {video.dateAdded}</p>
              </div>

              <div className="flex justify-around items-center pt-2">
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Heart className={cn(video.isFavorite && "fill-red-500 text-red-500")} /> Favori</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><ExternalLink/> Orijinali Aç</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Share2/> Paylaş</Button>
                <Button variant="ghost" className="flex-col h-auto text-white gap-1"><Edit/> Düzenle</Button>
                <Button variant="ghost" className="flex-col h-auto text-destructive gap-1"><Trash2/> Sil</Button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
