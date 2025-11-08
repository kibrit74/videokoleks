'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreVertical, Loader2 } from 'lucide-react';
import { NewCategoryDialog } from '@/components/new-category-dialog';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function CategoriesPage() {
  const [isNewCategoryOpen, setNewCategoryOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const categoriesQuery = useMemoFirebase(() => 
    (user?.uid && firestore) ? query(collection(firestore, 'users', user.uid, 'categories')) : null
  , [firestore, user?.uid]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !categories || !firestore) return;
    
    let isFetching = true;

    const fetchCounts = async () => {
        if(!isFetching) return;
        setCountsLoading(true);
        const counts: Record<string, number> = {};
        
        const allVideosQuery = query(collection(firestore, 'users', user.uid, 'videos'));
        
        try {
            const videoSnapshot = await getDocs(allVideosQuery);
            const videos = videoSnapshot.docs.map(doc => doc.data());

            // Initialize all category counts to 0
            categories.forEach(cat => {
                counts[cat.id] = 0;
            });
            
            // Tally counts from the fetched videos
            videos.forEach(video => {
                if (video.categoryId && counts.hasOwnProperty(video.categoryId)) {
                    counts[video.categoryId]++;
                }
            });

            setVideoCounts(counts);
        } catch (error) {
            console.error("Error fetching video counts:", error);
        } finally {
            if(isFetching) {
              setCountsLoading(false);
            }
        }
    }

    fetchCounts();

    return () => {
        isFetching = false;
    }
  }, [categories, user?.uid, firestore]);

  const isLoading = categoriesLoading;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold font-headline mb-4">Kategorilerim</h1>
        <Button onClick={() => setNewCategoryOpen(true)} disabled={!user} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kategori
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <ul className="divide-y divide-border">
                {Array.from({length: 5}).map((_, i) => (
                    <li key={i} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                         <Skeleton className="h-8 w-8" />
                    </li>
                ))}
             </ul>
          ) : categories && categories.length > 0 ? (
            <ul className="divide-y divide-border">
                {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/?categoryId=${cat.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors w-full">
                    <div className="flex items-center gap-4">
                      <span className={cn("text-2xl p-2 rounded-lg", cat.color)}>{cat.emoji}</span>
                      <div>
                          <p className="font-semibold text-left">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">
                              {countsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${videoCounts[cat.id] || 0} video`}
                          </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: Implement edit category */ }}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </Link>
                </li>
                ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
                Henüz kategori oluşturmadınız.
            </div>
          )}
        </CardContent>
      </Card>
      
      <NewCategoryDialog isOpen={isNewCategoryOpen} onOpenChange={setNewCategoryOpen} />
    </div>
  );
}
