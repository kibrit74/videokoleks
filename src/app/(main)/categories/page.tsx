'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreVertical, Loader2 } from 'lucide-react';
import { NewCategoryDialog } from '@/components/new-category-dialog';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesPage() {
  const [isNewCategoryOpen, setNewCategoryOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    // Only run if we have the user, categories, and firestore instance
    if (!user || !categories || !firestore) return;
    
    // This flag prevents fetching if a fetch is already in progress
    let isFetching = false;

    const fetchCounts = async () => {
        if(isFetching) return;
        isFetching = true;
        setCountsLoading(true);
        const counts: Record<string, number> = {};
        // Use Promise.all to fetch counts in parallel for better performance
        await Promise.all(categories.map(async (cat) => {
             const videosInCatQuery = query(
                collection(firestore, 'users', user.uid, 'videos'),
                where('categoryId', '==', cat.id)
            );
            const snapshot = await getDocs(videosInCatQuery);
            counts[cat.id] = snapshot.size;
        }));
        setVideoCounts(counts);
        setCountsLoading(false);
        isFetching = false;
    }

    fetchCounts();
    // This effect should only re-run if the user, categories array, or firestore instance changes.
  }, [categories, user, firestore]);

  const isLoading = categoriesLoading;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold font-headline">Kategorilerim</h1>
        <Button onClick={() => setNewCategoryOpen(true)} disabled={!user}>
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
                <li key={cat.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                    <span className={cn("text-2xl p-2 rounded-lg", cat.color)}>{cat.emoji}</span>
                    <div>
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {countsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${videoCounts[cat.id] || 0} video`}
                        </p>
                    </div>
                    </div>
                    <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    </Button>
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
