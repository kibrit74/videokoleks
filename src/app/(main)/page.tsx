'use client';

import { useState, useMemo } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { AddVideoDialog } from '@/components/add-video-dialog';
import type { Video, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  
  const isLoading = isUserLoading || categoriesLoading;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline mb-2 text-center md:text-left">📦 VideoKoleks</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Video, kategori ara..." 
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
            <Badge 
              variant={'secondary'}
              className="py-2 px-4 text-sm cursor-pointer"
            >
              Tümü
            </Badge>
            {categories && categories.map((cat) => (
                <Badge 
                  key={cat.id} 
                  variant={'secondary'}
                  className="py-2 px-4 text-sm cursor-pointer hover:bg-muted-foreground/50"
                >
                  {cat.name}
                </Badge>
            ))}
            {categoriesLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="w-24 h-8 rounded-full" />)}
            <Button variant="ghost" size="sm"><SlidersHorizontal className="h-4 w-4 mr-2"/>Filtreler</Button>
        </div>
        <div className="flex gap-2 items-center justify-center md:justify-start">
            <Button variant="outline" size="sm" className="border-primary text-primary"><InstagramIcon className="h-4 w-4 mr-2" /> Instagram</Button>
            <Button variant="outline" size="sm"><YoutubeIcon className="h-4 w-4 mr-2" /> YouTube</Button>
            <Button variant="outline" size="sm"><TiktokIcon className="h-4 w-4 mr-2" /> TikTok</Button>
        </div>
      </div>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Önemli Bilgilendirme</AlertTitle>
          <AlertDescription>
            Firebase projenizdeki çözülemeyen bir izin sorunu nedeniyle videolar şu anda bu ekranda listelenememektedir. Ancak video ekleyebilir, silebilir ve kategorilerinizi yönetebilirsiniz.
          </AlertDescription>
        </Alert>

         <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">Henüz video eklemediniz.</h2>
            <p className="text-muted-foreground">
              Başlamak için "Video Ekle" butonuna tıklayın. Eklediğiniz videolar detay sayfalarında görüntülenebilir.
            </p>
          </div>

      <AddVideoDialog 
        isOpen={isAddVideoOpen} 
        onOpenChange={setAddVideoOpen}
      />
    </div>
  );
}
