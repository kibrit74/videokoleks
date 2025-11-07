'use client';

import { useState, useMemo } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { AddVideoDialog } from '@/components/add-video-dialog';
import type { Video, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isAddVideoOpen, setAddVideoOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      const matchesSearch = searchTerm ? video.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchesCategory && matchesSearch;
    });

  }, [videos, selectedCategoryId, searchTerm]);
  
  const isLoading = isUserLoading || categoriesLoading || videosLoading;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline mb-2 text-center md:text-left">📦 VideoKoleks</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Koleksiyonunda ara..." 
              className="pl-10 h-12 text-lg" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="lg" className="w-full md:w-auto" onClick={() => setAddVideoOpen(true)} disabled={!user}>
            <Plus className="mr-2 h-5 w-5" /> Video Ekle
          </Button>
        </div>
      </header>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <Button 
              variant={selectedCategoryId === null ? 'secondary' : 'ghost'}
              onClick={() => setSelectedCategoryId(null)}
              size="sm"
            >
              Tümü
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
      </div>

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
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        ) : (
         <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">
              {searchTerm || selectedCategoryId ? `Sonuç bulunamadı` : "Henüz video eklemediniz"}
            </h2>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategoryId ? "Farklı bir arama veya filtre deneyin." : 'Başlamak için "Video Ekle" butonuna tıklayın.'}
            </p>
          </div>
        )}

      <AddVideoDialog 
        isOpen={isAddVideoOpen} 
        onOpenChange={setAddVideoOpen}
      />
    </div>
  );
}
