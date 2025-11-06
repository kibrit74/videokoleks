'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Video, Platform, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

const platformColors: Record<Platform, string> = {
  instagram: 'bg-[#E1306C]',
  youtube: 'bg-[#FF0000]',
  tiktok: 'bg-[#00F2EA] text-black',
};

export function VideoCard({ video }: { video: Video }) {
  const PlatformIcon = platformIcons[video.platform];
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch the category data based on categoryId
  const categoryDocRef = useMemoFirebase(() => 
    user && video.categoryId ? doc(firestore, 'users', user.uid, 'categories', video.categoryId) : null,
    [user, firestore, video.categoryId]
  );
  const { data: category } = useDoc<Category>(categoryDocRef);

  return (
    <Link href={`/videos/${video.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative aspect-[9/16] w-full">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={video.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Badge
              className={cn("absolute right-2 top-2 border-none", platformColors[video.platform])}
            >
              <PlatformIcon className="mr-1 h-3 w-3" />
            </Badge>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-end justify-between">
                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
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
    </Link>
  );
}
