'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
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

  // This is not efficient for large datasets. A better approach for production would be
  // to store a video count on the category document itself and update it with a cloud function.
  // For this prototype, we'll fetch it on the client.
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useState(() => {
    if (!user || !categories) return;
    
    const fetchCounts = async () => {
        setCountsLoading(true);
        const counts: Record<string, number> = {};
        for (const cat of categories) {
            const videosInCatQuery = query(
                collection(firestore, 'users', user.uid, 'videos'),
                where('categoryId', '==', cat.id)
            );
            const snapshot = await getDocs(videosInCatQuery);
            counts[cat.id] = snapshot.size;
        }
        setVideoCounts(counts);
        setCountsLoading(false);
    }
    fetchCounts();
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
