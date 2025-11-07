'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, collectionGroup } from 'firebase/firestore';
import { VideoCard } from '@/components/video-card';
import { Star } from 'lucide-react';
import type { Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const favoritesQuery = useMemoFirebase(() =>
    user
      ? query(
          collectionGroup(firestore, 'videos'),
          where('userId', '==', user.uid),
          where('isFavorite', '==', true),
          orderBy('dateAdded', 'desc')
        )
      : null
  , [firestore, user]);

  const { data: favoriteVideos, isLoading } = useCollection<Video>(favoritesQuery);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
          <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
          Favorilerim
        </h1>
        <p className="text-muted-foreground">En önemli videolarınız bir arada.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({length: 5}).map((_, i) => (
             <div key={i} className="aspect-[9/16] w-full">
               <Skeleton className="w-full h-full rounded-lg" />
             </div>
          ))}
        </div>
      ) : favoriteVideos && favoriteVideos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {favoriteVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-2">Henüz favori videonuz yok.</h2>
          <p className="text-muted-foreground">
            Videoları favorilerinize eklemek için ⭐ ikonuna dokunun.
          </p>
        </div>
      )}
    </div>
  );
}
