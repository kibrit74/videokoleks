'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Loader2, Download, Upload, AlertTriangle } from 'lucide-react';
import type { Category, Video } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';

interface BackupRestoreDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface BackupData {
  categories: Omit<Category, 'id' | 'userId'>[];
  videos: Omit<Video, 'id' | 'userId' | 'dateAdded'>[];
}

export function BackupRestoreDialog({ isOpen, onOpenChange }: BackupRestoreDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const categoriesRef = collection(firestore, 'users', user.uid, 'categories');
      const videosRef = collection(firestore, 'users', user.uid, 'videos');

      const [categoriesSnapshot, videosSnapshot] = await Promise.all([
        getDocs(categoriesRef),
        getDocs(videosRef),
      ]);

      const categories = categoriesSnapshot.docs.map(doc => {
        const { id, userId, ...data } = doc.data() as Category;
        return data;
      });

      const videos = videosSnapshot.docs.map(doc => {
        const { id, userId, dateAdded, ...data } = doc.data() as Video;
        return data;
      });

      const backupData = { categories, videos };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `videokoleks_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Yedekleme Başarılı!',
        description: 'Tüm verileriniz başarıyla indirildi.',
      });

    } catch (err) {
      console.error('Export error:', err);
      setError('Veriler dışa aktarılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
        'Emin misiniz? Bu işlem mevcut tüm kategorilerinizi ve videolarınızı silecek ve yedekleme dosyasındaki verilerle değiştirecektir. Bu işlem geri alınamaz.'
    );

    if (!confirmed) {
        event.target.value = ''; // Reset file input
        return;
    }

    setIsRestoring(true);
    setError(null);
    setRestoreProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Dosya okunamadı.');
        }
        const data = JSON.parse(text) as BackupData;
        
        // Validate data structure
        if (!data.categories || !data.videos || !Array.isArray(data.categories) || !Array.isArray(data.videos)) {
            throw new Error('Geçersiz yedekleme dosyası formatı. `categories` ve `videos` dizileri bulunmalı.');
        }

        const batch = writeBatch(firestore);
        
        // 1. Delete existing data
        const existingCategoriesRef = collection(firestore, 'users', user.uid, 'categories');
        const existingVideosRef = collection(firestore, 'users', user.uid, 'videos');
        const [existingCategoriesSnap, existingVideosSnap] = await Promise.all([
            getDocs(existingCategoriesRef),
            getDocs(existingVideosRef)
        ]);

        existingCategoriesSnap.forEach(doc => batch.delete(doc.ref));
        existingVideosSnap.forEach(doc => batch.delete(doc.ref));


        // 2. Add new data from backup
        const totalOperations = data.categories.length + data.videos.length;
        let completedOperations = 0;
        
        const newCategoryRefs: { [oldName: string]: string } = {};

        // Add categories and map their old IDs to new IDs
        data.categories.forEach(category => {
            const newDocRef = doc(collection(firestore, 'users', user.uid, 'categories'));
            batch.set(newDocRef, { ...category, userId: user.uid });
            // This mapping is imperfect if names are not unique, but it's the best we can do without original IDs.
            if(category.name) {
              newCategoryRefs[category.name] = newDocRef.id;
            }
            completedOperations++;
            setRestoreProgress((completedOperations / totalOperations) * 50); // 0-50 for additions
        });

        // Add videos, updating categoryId to the new one
        data.videos.forEach(video => {
            const newDocRef = doc(collection(firestore, 'users', user.uid, 'videos'));
             // Find the original category to get its name
            const originalCategory = data.categories.find(c => c.name && video.categoryId && c.name === video.categoryId);
            const newCategoryId = originalCategory ? newCategoryRefs[originalCategory.name] : '';

            const videoData = { 
                ...video, 
                userId: user.uid, 
                dateAdded: new Date(), // Use current date for restored items
                categoryId: newCategoryId || video.categoryId // fallback to old ID if not found
            };
            batch.set(newDocRef, videoData);
            completedOperations++;
            setRestoreProgress(50 + (completedOperations / totalOperations) * 50); // 50-100 for additions
        });
        
        await batch.commit();

        toast({
            title: 'Geri Yükleme Başarılı!',
            description: `${totalOperations} öğe koleksiyonunuza geri yüklendi.`,
        });
        
        onOpenChange(false);
        // Force a page reload to see the new data correctly
        window.location.reload();


      } catch (err: any) {
        console.error('Import error:', err);
        setError(`Geri yükleme başarısız: ${err.message || 'Lütfen dosyanızı kontrol edin.'}`);
      } finally {
        setIsRestoring(false);
        setRestoreProgress(0);
        // Reset file input
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Yedekleme & Senkronizasyon</DialogTitle>
          <DialogDescription>
            Tüm video ve kategori verilerinizi bir dosya olarak indirin veya daha önce indirdiğiniz bir dosyadan geri yükleyin.
          </DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-4 py-4">
            <div className='p-4 border rounded-lg'>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Download className='w-5 h-5'/> Verileri Dışa Aktar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Koleksiyonunuzun tamamını (`.json` dosyası) bilgisayarınıza yedekleyin.
                </p>
                <Button onClick={handleExport} disabled={isLoading || isRestoring} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Yedeği İndir'}
                </Button>
            </div>
            
             <div className='p-4 border rounded-lg'>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Upload className='w-5 h-5'/> Verileri İçe Aktar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                   Bir yedekleme dosyasını geri yükleyin. 
                   <span className="font-bold text-destructive"> Bu işlem mevcut tüm verilerinizi siler ve yedeklemedeki verilerle değiştirir.</span>
                </p>
                <Button asChild variant="outline" className="w-full" disabled={isLoading || isRestoring}>
                    <label htmlFor="import-file">
                        {isRestoring ? <Loader2 className="animate-spin" /> : 'Yedekten Geri Yükle'}
                        <input type="file" id="import-file" accept=".json" onChange={handleImport} className="hidden" disabled={isLoading || isRestoring} />
                    </label>
                </Button>
                {isRestoring && (
                    <div className="mt-4 space-y-2">
                        <Progress value={restoreProgress} />
                        <p className="text-sm text-center text-muted-foreground">
                            Geri yükleniyor... ({Math.round(restoreProgress)}%)
                        </p>
                    </div>
                )}
            </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading || isRestoring}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
