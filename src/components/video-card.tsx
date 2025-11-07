'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Video, Platform, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramIcon, YoutubeIcon, TiktokIcon, FacebookIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import { MoreVertical, Share2, Eye, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  facebook: FacebookIcon,
};

const platformColors: Record<Platform, string> = {
  instagram: 'bg-[#E1306C]',
  youtube: 'bg-[#FF0000]',
  tiktok: 'bg-[#00F2EA] text-black',
  facebook: 'bg-[#1877F2]',
};

interface VideoCardProps {
  video: Video;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onVideoSelect?: () => void;
}

export function VideoCard({ video, isSelectionMode = false, isSelected = false, onVideoSelect }: VideoCardProps) {
  const PlatformIcon = platformIcons[video.platform];
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const categoryDocRef = useMemoFirebase(() => 
    user && video.categoryId ? doc(firestore, 'users', user.uid, 'categories', video.categoryId) : null,
    [user, firestore, video.categoryId]
  );
  const { data: category } = useDoc<Category>(categoryDocRef);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/videos/${video.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: `Şu videoya göz at: ${video.title}`,
          url: shareUrl,
        });
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.message.includes('Web Share API not supported') || error.message.includes('Permission denied')) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: "Paylaşım menüsü desteklenmiyor. Link panoya kopyalandı!" });
        } catch (err) {
            toast({ variant: 'destructive', title: "Paylaşılamadı", description: "Link paylaşılamadı veya panoya kopyalanamadı." });
        }
      } else {
         console.error('Share failed:', error);
         toast({ variant: 'destructive', title: "Paylaşılamadı", description: "Beklenmedik bir hata oluştu." });
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onVideoSelect?.();
    } else {
      router.push(`/videos/${video.id}`);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onVideoSelect?.();
  }


  return (
      <Card 
        className={cn(
          "group overflow-hidden transition-all duration-300 ease-in-out cursor-pointer",
          isSelectionMode ? "hover:shadow-md" : "hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1",
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[9/16] w-full">
            {isSelectionMode && (
                 <div 
                    className="absolute inset-0 bg-black/30 z-20 flex items-start justify-start p-2"
                    onClick={handleCheckboxClick}
                  >
                    <Checkbox
                        checked={isSelected}
                        className='h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                        aria-label="Select video"
                    />
                 </div>
            )}
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className={cn(
                "object-cover transition-transform duration-300",
                !isSelectionMode && "group-hover:scale-105"
                )}
              data-ai-hint={video.imageHint}
            />
             <div 
              className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            />

              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Badge
                  className={cn("border-none", platformColors[video.platform])}
                >
                  <PlatformIcon className="mr-1 h-3 w-3" />
                </Badge>
                {!isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-black/40 text-white border-none hover:bg-black/60 opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/videos/${video.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detayları Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Paylaş
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            
            <div 
              className="absolute bottom-2 left-2 right-2"
            >
              <div className="flex items-end justify-between">
                <Badge variant="secondary" className="bg-black/20 text-white backdrop-blur-sm">
                  {video.duration}
                </Badge>
                {category && (
                  <Badge className={cn(category.color, "border-none text-white")}>
                    {category.emoji} {category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
